import { useMemo } from "react";
import { useIsgData } from "../../contexts/IsgDataContext.jsx";
import { EDUCATION_MODULES } from "../../constants/education.js";
import { computeAccidentFreeStreak } from "../../utils/accidentFreeStreak.js";
import { MOCK_USERS } from "../../constants/mockUsers.js";
import EmptyState from "../../components/EmptyState.jsx";
import Loading from "../../components/Loading.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { Bell, ListChecks, BookOpen } from "../../components/icons/index.jsx";
import StreakCounterCard from "./StreakCounterCard.jsx";

// BUG FIX (demo veri temizliği): önceden literal "Ahmet Yıldız" hardcoded'du —
// RiskAnalysisPage.jsx ve DocumentGenerator.jsx'te de bağımsız olarak
// tekrarlanmıştı. Artık tek kaynak MOCK_USERS.employee.name (bkz. o dosyalardaki
// aynı düzeltme notu).
const CURRENT_EMPLOYEE_NAME = MOCK_USERS.employee?.name || "Çalışan";

/**
 * @param {{ theme: object }} props
 */
export default function EmployeeDashboard({ theme }) {
  const { notifications, loaded: notificationsLoaded } = useIsgData();

  const myNotifications = useMemo(() => notifications.filter((n) => n.worker === CURRENT_EMPLOYEE_NAME), [notifications]);
  const myTasks = useMemo(() => myNotifications.filter((n) => n.status === "approved"), [myNotifications]);
  // Kazasız gün sayacı firma genelini yansıtır — yalnızca bu çalışanın bildirimleriyle
  // sınırlı DEĞİLDİR, bkz. StreakCounterCard/accidentFreeStreak.js.
  const accidentFreeStreak = useMemo(() => computeAccidentFreeStreak(notifications), [notifications]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <p className="font-[Oswald] text-xl uppercase tracking-wide mb-4" style={{ color: theme.textPrimary }}>Çalışan Paneli</p>

      <div className="mb-4">
        <StreakCounterCard theme={theme} streak={accidentFreeStreak} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
            <BookOpen style={{ fontSize: "14px" }} /> Eğitimler
          </p>
          <div className="grid gap-2">
            {EDUCATION_MODULES.map((title) => (
              <div key={title} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Zorunlu Eğitim</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
            <Bell style={{ fontSize: "14px" }} /> Bildirimlerim
          </p>
          {/* UX FIX (loading/empty state cilası): bildirimler context'te ayrı yükleniyor —
              `loaded` kontrol edilmeden ilk render'da "Henüz bildirimin yok" kısa süreliğine
              yanlışlıkla gösterilebiliyordu. */}
          {!notificationsLoaded ? (
            <Loading label="Bildirimler yükleniyor..." />
          ) : myNotifications.length === 0 ? (
            <EmptyState icon={Bell} title="Henüz bildirimin yok" description="Risk Analizi sayfasından yeni bildirim oluşturabilirsin." />
          ) : (
            <div className="grid gap-2">
              {myNotifications.map((n) => (
                <div key={n.id} className="rounded-lg border px-3 py-2.5 flex items-start justify-between gap-2" style={{ borderColor: theme.border, background: theme.surface }}>
                  <div>
                    <p className="text-sm" style={{ color: theme.textPrimary }}>{n.desc}</p>
                    <p className="text-xs" style={{ color: theme.textFaint }}>{n.date}</p>
                  </div>
                  <Badge tone={n.status === "approved" ? "success" : n.status === "ai_analyzed" ? "warning" : "pending"}>
                    {n.status === "approved" ? "Onaylandı" : n.status === "ai_analyzed" ? "İncelemede" : "Analiz Ediliyor"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-4">
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
          <ListChecks style={{ fontSize: "14px" }} /> Kendisine Atanmış Görevler
        </p>
        {!notificationsLoaded ? (
          <Loading label="Görevler yükleniyor..." />
        ) : myTasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Atanmış görev yok" description="Bir bildirimin onaylanıp göreve dönüştüğünde burada görünecek." />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {myTasks.map((n) => (
              <div key={n.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{n.desc}</p>
                <p className="text-xs mt-1" style={{ color: theme.successText }}>✓ {n.expertNote}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
