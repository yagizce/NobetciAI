import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TRAINING_COURSES } from "../../constants/trainingCourses.js";
import { resolveTrainingStatus, computeProgressPercent, computeRemainingSeconds, formatRemainingDuration } from "../../constants/trainingStatus.js";
import { MOCK_USERS } from "../../constants/mockUsers.js";
import { useTrainingCompletions } from "../training/useTrainingCompletions.js";
import EmptyState from "../../components/EmptyState.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { BookOpen, Clock, CheckCircle2 } from "../../components/icons/index.jsx";

// BUG FIX (demo veri temizliği): önceden literal "Ahmet Yıldız" hardcoded'du —
// RiskAnalysisPage.jsx ve DocumentGenerator.jsx'te de bağımsız olarak
// tekrarlanmıştı. Artık tek kaynak MOCK_USERS.employee.name (bkz. o dosyalardaki
// aynı düzeltme notu).
const CURRENT_EMPLOYEE_NAME = MOCK_USERS.employee?.name || "Çalışan";

/**
 * Çalışan Paneli — BİLİNÇLİ OLARAK yalnızca eğitim durumuna odaklanır. Bildirim
 * Merkezi (Ramak Kala/Tehlike/İş Kazası bildirimleri) ve firma geneli kazasız gün
 * sayacı gibi bilgiler kasıtlı olarak burada GÖSTERİLMEZ — bunlar çalışanın kendi
 * aksiyon alanı değil (bildirimlerini zaten Risk Analizi sayfasından takip edebilir).
 * Panel üç net gruba ayrılır: yarım kalmış eğitim(ler)in kalan süresi, henüz
 * başlanmamış zorunlu eğitimler, ve tamamlanan eğitimler.
 *
 * @param {{ theme: object }} props
 */
export default function EmployeeDashboard({ theme }) {
  const { completions, progress, loaded, error } = useTrainingCompletions();

  const courseRows = useMemo(() => {
    return TRAINING_COURSES.map((course) => {
      const myProgress = progress.find((p) => p.courseId === course.id && p.employeeName === CURRENT_EMPLOYEE_NAME) || null;
      const myCompletions = completions.filter((c) => c.courseId === course.id && c.employeeName === CURRENT_EMPLOYEE_NAME);
      const status = resolveTrainingStatus({ progress: myProgress, completions: myCompletions });
      const latestCompletion = myCompletions.length > 0
        ? [...myCompletions].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
        : null;
      return { course, status, myProgress, latestCompletion };
    });
  }, [progress, completions]);

  const notStarted = courseRows.filter((r) => r.status.id === "assigned");
  const inProgress = courseRows.filter((r) => r.status.id === "inProgress" || r.status.id === "failed");
  const completed = courseRows.filter((r) => r.status.id === "completed");

  if (!loaded) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        <Loading label="Eğitimler yükleniyor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        <ErrorState title="Eğitimler yüklenemedi" description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <p className="font-[Oswald] text-xl uppercase tracking-wide mb-1" style={{ color: theme.textPrimary }}>Çalışan Paneli</p>
      <p className="text-xs mb-4" style={{ color: theme.textFaint }}>Almanız gereken eğitimler ve eğitim durumunuz</p>

      <section className="mb-5">
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
          <Clock style={{ fontSize: "14px", color: theme.warnText }} /> Devam Eden Eğitim
        </p>
        {inProgress.length === 0 ? (
          <p className="text-xs" style={{ color: theme.textFaint }}>Şu anda yarım kalmış bir eğitiminiz yok.</p>
        ) : (
          <div className="grid gap-2">
            {inProgress.map(({ course, status, myProgress }) => {
              const percent = computeProgressPercent(myProgress);
              const remaining = formatRemainingDuration(computeRemainingSeconds(myProgress));
              return (
                <Link key={course.id} to="/documents?tab=education" className="rounded-lg border px-3.5 py-3 block" style={{ borderColor: theme.border, background: theme.surface }}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{course.title}</p>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: theme.surfaceAlt }}>
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, background: theme.accent }} />
                  </div>
                  <p className="text-[11px]" style={{ color: theme.textFaint }}>%{percent} tamamlandı • Kalan süre: yaklaşık {remaining}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-5">
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
          <BookOpen style={{ fontSize: "14px" }} /> Almanız Gereken Eğitimler
        </p>
        {notStarted.length === 0 ? (
          <EmptyState icon={BookOpen} title="Bekleyen eğitim yok" description="Şu an başlamanız gereken bir eğitim bulunmuyor." />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {notStarted.map(({ course }) => (
              <Link key={course.id} to="/documents?tab=education" className="rounded-lg border px-3 py-2.5 block" style={{ borderColor: theme.border, background: theme.surface }}>
                <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{course.title}</p>
                <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{course.mandatory ? "Zorunlu Eğitim" : "Eğitim"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
          <CheckCircle2 style={{ fontSize: "14px", color: theme.successText }} /> Tamamladıklarınız
        </p>
        {completed.length === 0 ? (
          <p className="text-xs" style={{ color: theme.textFaint }}>Henüz tamamlanmış bir eğitiminiz yok.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {completed.map(({ course, latestCompletion }) => (
              <div key={course.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{course.title}</p>
                  <Badge tone="success">Tamamlandı</Badge>
                </div>
                <p className="text-[11px] mt-1" style={{ color: theme.textFaint }}>
                  {latestCompletion?.completedAt ? new Date(latestCompletion.completedAt).toLocaleDateString("tr-TR") : "—"}
                  {typeof latestCompletion?.quizScore === "number" ? ` • Sınav notu: %${latestCompletion.quizScore}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
