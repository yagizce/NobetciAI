import { useState } from "react";
import Badge from "../../components/ui/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { Users, FileText } from "../../components/icons/index.jsx";
import { resolveTrainingStatus, computeProgressPercent } from "../../constants/trainingStatus.js";
import { printTrainingCompletionCertificate } from "./printTrainingCompletionCertificate.js";
import { getPrimaryCompany } from "../../services/companyService.js";

/**
 * Kurs bazlı katılımcı listesi. Bu bileşen yalnızca `role === "expert" || "employer"`
 * iken TrainingModule.jsx tarafından render edilir — çağrı yeri sorumludur, burada
 * ayrıca bir rol kontrolü YAPILMAZ (tek noktadan kontrol için, bkz. TrainingModule.jsx).
 *
 * Sprint 7.2.1: yalnızca sınavı tamamlayanlar değil, henüz izlemekte olan (In Progress)
 * katılımcılar da listelenir — ilerleme yüzdesi ve (varsa) son sınav puanıyla birlikte.
 *
 * Tamamlanan kayıtlar için Uzman/İşveren, çalışan adına bir "Tamamlama Belgesi"
 * yazdırabilir (bkz. printTrainingCompletionCertificate.js — "sertifika" değil).
 *
 * @param {{ theme: object, course: object, progress: object[], completions: object[] }} props
 */
export default function ParticipantListPanel({ theme, course, progress, completions }) {
  const [popupBlockedFor, setPopupBlockedFor] = useState(null);

  const courseProgress = progress.filter((p) => p.courseId === course.id);
  const courseCompletions = completions.filter((c) => c.courseId === course.id);

  const employeeNames = new Set([...courseProgress.map((p) => p.employeeName), ...courseCompletions.map((c) => c.employeeName)]);

  const rows = [...employeeNames].map((employeeName) => {
    const myProgress = courseProgress.find((p) => p.employeeName === employeeName) || null;
    const myCompletions = courseCompletions.filter((c) => c.employeeName === employeeName);
    const latestCompletion = myCompletions.length > 0
      ? [...myCompletions].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
      : null;
    return {
      employeeName,
      status: resolveTrainingStatus({ progress: myProgress, completions: myCompletions }),
      progressPercent: computeProgressPercent(myProgress),
      quizScore: latestCompletion?.quizScore ?? null,
      lastActivityAt: latestCompletion?.completedAt || myProgress?.updatedAt || null,
      completedAt: latestCompletion?.completedAt || null,
    };
  }).sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0));

  async function handlePrintCertificate(row) {
    const company = await getPrimaryCompany();
    const opened = printTrainingCompletionCertificate({
      employeeName: row.employeeName,
      courseTitle: course.title,
      completedAt: row.completedAt,
      quizScore: row.quizScore,
      companyName: company?.name,
    });
    setPopupBlockedFor(opened ? null : row.employeeName);
  }

  if (rows.length === 0) {
    return <EmptyState icon={Users} title="Henüz katılımcı yok" description="Bu eğitime başlayan/tamamlayan olduğunda burada listelenecek." />;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div key={r.employeeName} className="rounded-lg border px-3 py-2" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ color: theme.textPrimary }}>{r.employeeName}</p>
              <p className="text-[10.5px]" style={{ color: theme.textFaint }}>
                {r.lastActivityAt ? new Date(r.lastActivityAt).toLocaleString("tr-TR") : "—"}
                {r.status.id === "inProgress" && ` • İzleme: %${r.progressPercent}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {r.quizScore !== null && <span className="text-xs font-semibold" style={{ color: theme.textMuted }}>%{r.quizScore}</span>}
              <Badge tone={r.status.tone}>{r.status.label}</Badge>
            </div>
          </div>
          {r.status.id === "completed" && (
            <button onClick={() => handlePrintCertificate(r)} className="flex items-center gap-1 text-[10.5px] font-semibold mt-1.5" style={{ color: theme.accent }}>
              <FileText style={{ fontSize: "11px" }} /> Tamamlama Belgesini İndir
            </button>
          )}
          {popupBlockedFor === r.employeeName && (
            <p className="text-[10px] mt-1" style={{ color: theme.warnText }}>Pop-up engellendi, tarayıcı ayarlarından izin verip tekrar deneyin.</p>
          )}
        </div>
      ))}
    </div>
  );
}
