import { useEffect } from "react";
import { useRole } from "../contexts/RoleContext.jsx";
import { MOCK_USERS } from "../constants/mockUsers.js";
import { getPeriodicChecks } from "../services/periodicCheckService.js";
import { getActiveCompanyId } from "../services/companyService.js";
import { getTrainingCompletions, getTrainingProgress } from "../services/trainingService.js";
import { getTrainingCourseSettings } from "../services/trainingCourseSettingsService.js";
import { TRAINING_COURSES } from "../constants/trainingCourses.js";
import { getOverdueOrDueSoonChecks } from "../constants/periodicCheck.js";
import { getUpcomingTrainingDueReminders } from "../constants/trainingStatus.js";
import { showLocalNotification } from "../services/notificationService.js";
import { pushSystemNotification } from "../services/systemNotificationService.js";
import { readLastBackupAt, isBackupStale, daysSinceLastBackup } from "../constants/backup.js";
import { todayISO } from "../utils/dateUtils.js";
import { isFeatureEnabled, RELEASE_PROFILE } from "../constants/releaseProfile.js";

const LAST_SCAN_STORAGE_KEY = `nobetci-last-reminder-scan:${RELEASE_PROFILE}`;

/**
 * AI_ROADMAP.md → Bildirim/Hatırlatma. Uygulama açıldığında (Layout.jsx içinden,
 * yani her authenticated route'ta) çalışır, ama günde YALNIZCA BİR KEZ gerçek bir
 * tarama yapar (localStorage'da bugünün tarihi kayıtlıysa atlar) — kullanıcı sekmeyi
 * her açtığında yeniden bildirim yağmasını önlemek için.
 *
 * ÖNEMLİ SINIR: bu bir push-when-closed altyapısı DEĞİLDİR (bkz. notificationService.js
 * dosya başı yorumu) — yalnızca kullanıcı uygulamayı AÇTIĞINDA/açıkken tetiklenir.
 * Gerçek "site tamamen kapalıyken de bildir" için Push API + backend gerekir.
 *
 * Role göre farklı taramalar yapılır:
 * - expert/employer: gecikmiş/yaklaşan periyodik kontroller.
 * - employee: kendi eğitim son tarihi hatırlatmaları.
 * (Not: expert/employer de teknik olarak "employeeName" olarak eğitim alabilir ama
 * bu MVP'de yalnızca employee rolü için eğitim hatırlatması tetiklenir — periyodik
 * kontrol hatırlatmasıyla karışmaması için roller net ayrıldı.)
 *
 * Yedekleme hatırlatması (`backupStale`) role BAĞIMSIZ çalışır — Ayarlar sayfasındaki
 * `BackupSection.jsx` hiçbir role kısıtlı değil (bkz. Settings.jsx), dolayısıyla bu
 * tarama da rolden bağımsız. HARDENING: önceden bu uyarı yalnızca kullanıcı Ayarlar
 * sayfasını ZİYARET EDERSE görünen pasif bir metindi (bkz. BackupSection.jsx) — hiç
 * ziyaret etmeyen bir kullanıcıya asla ulaşmıyordu. Artık diğer hatırlatmalarla aynı
 * mekanizmayla (günlük tarama + gerçek bildirim) çalışıyor.
 */
export function useReminderScheduler() {
  const { role } = useRole();

  useEffect(() => {
    const todayIso = todayISO();
    let cancelled = false;

    async function scan() {
      const companyId = await getActiveCompanyId();
      if (cancelled || companyId == null) return;
      const scanKey = `${LAST_SCAN_STORAGE_KEY}:${companyId}:${role}`;
      try {
        if (localStorage.getItem(scanKey) === todayIso) return;
      } catch { /* Depolama tercihi kapalı olsa da uygulama açılabilir. */ }
      if (role === "expert" || role === "employer") {
        const checks = await getPeriodicChecks();
        const reminders = getOverdueOrDueSoonChecks(checks);
        for (const r of reminders) {
          if (cancelled) return;
          const title = r.status === "overdue" ? "Periyodik kontrol süresi geçti" : "Periyodik kontrol süresi yaklaşıyor";
          const message = `${r.itemName} — son tarih: ${r.nextDueDate}`;
          await showLocalNotification("periodicCheckDue", title, message);
          await pushSystemNotification({ type: "periodicCheckDue", title, message });
        }
      }

      if (isFeatureEnabled("training") && role === "employee") {
        const employeeName = MOCK_USERS.employee.name;
        const [progress, completions, courseSettings] = await Promise.all([
          getTrainingProgress(), getTrainingCompletions(), getTrainingCourseSettings(),
        ]);
        const reminders = getUpcomingTrainingDueReminders(TRAINING_COURSES, courseSettings, progress, completions, employeeName);
        for (const r of reminders) {
          if (cancelled) return;
          const title = r.status === "overdue" ? "Eğitim son tarihi geçti" : "Eğitim son tarihi yaklaşıyor";
          const message = `${r.courseTitle} — son tarih: ${r.dueDate}`;
          await showLocalNotification("trainingDue", title, message);
          await pushSystemNotification({ type: "trainingDue", title, message });
        }
      }

      // Rolden bağımsız: bkz. dosya başındaki not.
      if (!cancelled) {
        const lastBackupAt = readLastBackupAt();
        if (isBackupStale(lastBackupAt)) {
          const days = daysSinceLastBackup(lastBackupAt);
          const title = lastBackupAt ? "Yedek alma zamanı geldi" : "Hiç yedek alınmamış";
          const message = lastBackupAt
            ? `Son yedek ${days} gün önce alındı. Ayarlar > Yedekleme'den yeni bir yedek indirmeniz önerilir.`
            : "Bu cihazda henüz hiç yedek alınmamış. Ayarlar > Yedekleme'den bir yedek indirin.";
          await showLocalNotification("backupStale", title, message);
          await pushSystemNotification({ type: "backupStale", title, message });
        }
      }

      if (!cancelled) {
        try { localStorage.setItem(scanKey, todayIso); } catch { /* Kalıcı tarama zamanı isteğe bağlı. */ }
      }
    }

    scan().catch((error) => console.error("Hatırlatmalar taranamadı:", error));
    return () => { cancelled = true; };
  }, [role]);
}
