import Badge from "../../components/ui/Badge.jsx";
import { CheckCircle2 } from "../../components/icons/index.jsx";
import { resolveTrainingStatus, computeProgressPercent } from "../../constants/trainingStatus.js";

/**
 * @param {{ theme: object, course: object, dueDate?: string, myProgress: object|null, myCompletions: object[], onStart: () => void }} props
 */
export default function CourseCard({ theme, course, dueDate, myProgress, myCompletions, onStart }) {
  const status = resolveTrainingStatus({ progress: myProgress, completions: myCompletions });
  const progressPercent = computeProgressPercent(myProgress);
  const latestCompletion = myCompletions.length > 0
    ? [...myCompletions].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
    : null;
  const dueDateOverdue = Boolean(dueDate && status.id !== "completed" && new Date(dueDate) < new Date(new Date().toDateString()));

  return (
    <div className="rounded-lg border px-3.5 py-3" style={{ borderColor: theme.border, background: theme.surface }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold min-w-0 break-words" style={{ color: theme.textPrimary }}>{course.title}</p>
        {course.mandatory && <span className="shrink-0"><Badge tone="warning">Zorunlu</Badge></span>}
      </div>
      <p className="text-xs mb-2.5 break-words" style={{ color: theme.textMuted }}>{course.description}</p>

      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
        <Badge tone={status.tone}>{status.label}</Badge>
        {latestCompletion && <span className="text-[10.5px]" style={{ color: theme.textFaint }}>Son sınav: %{latestCompletion.quizScore}</span>}
        {dueDate && status.id !== "completed" && (
          <span className="text-[10.5px] font-semibold" style={{ color: dueDateOverdue ? theme.emergencyText : theme.warnText }}>
            {dueDateOverdue ? "Son tarih geçti: " : "Son tarih: "}{new Date(dueDate).toLocaleDateString("tr-TR")}
          </span>
        )}
      </div>

      {status.id === "inProgress" && (
        <div className="mb-2.5">
          <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: theme.surfaceAlt }}>
            <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: theme.accent }} />
          </div>
          <span className="text-[10.5px]" style={{ color: theme.textFaint }}>Video izleme: %{progressPercent}</span>
        </div>
      )}

      {status.id === "completed" ? (
        <div className="flex items-center gap-1.5">
          <CheckCircle2 style={{ fontSize: "14px", color: theme.successText }} />
          <span className="text-xs font-semibold" style={{ color: theme.successText }}>Tamamlandı — %{latestCompletion.quizScore}</span>
        </div>
      ) : (
        <button onClick={onStart} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: theme.accent, color: theme.onAccent }}>
          {status.id === "assigned" ? "Eğitimi İzle" : status.id === "inProgress" ? "Devam Et" : "Tekrar Dene"}
        </button>
      )}
    </div>
  );
}
