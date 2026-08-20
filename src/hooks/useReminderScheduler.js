import { useEffect } from "react";
import { useRole } from "../contexts/RoleContext.jsx";
import { MOCK_USERS } from "../constants/mockUsers.js";
import { getPeriodicChecks } from "../services/periodicCheckService.js";
import { getTrainingCompletions, getTrainingProgress } from "../services/trainingService.js";
import { getTrainingCourseSettings } from "../services/trainingCourseSettingsService.js";
import { TRAINING_COURSES } from "../constants/trainingCourses.js";
import { getOverdueOrDueSoonChecks } from "../constants/periodicCheck.js";
import { getUpcomingTrainingDueReminders } from "../constants/trainingStatus.js";
import { showLocalNotification } from "../services/notificationService.js";
import { pushSystemNotification } from "../services/systemNotificationService.js";
import { todayISO } from "../utils/dateUtils.js";

const LAST_SCAN_STORAGE_KEY = "nobetci-last-reminder-scan";

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
 */
export function useReminderScheduler() {
  const { role } = useRole();

  useEffect(() => {
    const todayIso = todayISO();
    const lastScan = localStorage.getItem(LAST_SCAN_STORAGE_KEY);
    if (lastScan === todayIso) return; // bugün zaten tarandı

    let cancelled = false;

    async function scan() {
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

      if (role === "employee") {
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

      if (!cancelled) localStorage.setItem(LAST_SCAN_STORAGE_KEY, todayIso);
    }

    scan();
    return () => { cancelled = true; };
  }, [role]);
}
