import { Link } from "react-router-dom";
import EmptyState from "../../../components/EmptyState.jsx";
import { BookOpen, ChevronRight } from "../../../components/icons/index.jsx";

const SUMMARY_ITEMS = [
  { key: "inProgressCount", label: "Devam Ediyor", tone: "warning" },
  { key: "completedCount", label: "Tamamlandı", tone: "success" },
  { key: "assignedCount", label: "Atandı", tone: "neutral" },
];

/**
 * Karar destek dashboard'unun "Devam Eden Eğitimler" kartı. Önceki sürümdeki statik
 * `EDUCATION_MODULES` başlık listesinin (yalnızca "Zorunlu Eğitim" etiketi taşıyan)
 * yerini alır — artık gerçek `trainingStats`/`ongoingItems` verisinden besleniyor
 * (bkz. constants/trainingStatus.js → computeTrainingStats / getOngoingTrainingItems).
 *
 * @param {{
 *   theme: object,
 *   trainingStats: { participantCount: number, assignedCount: number, inProgressCount: number, completedCount: number, failedCount: number, completionRatePercent: number },
 *   ongoingItems: Array<{ employeeName: string, courseTitle: string, progressPercent: number }>,
 * }} props
 */
export default function OngoingTrainingsCard({ theme, trainingStats, ongoingItems }) {
  if (trainingStats.participantCount === 0) {
    return <EmptyState icon={BookOpen} title="Henüz eğitim aktivitesi yok" description="Çalışanlar eğitime başladığında burada görünecek." />;
  }

  const toneStyle = {
    warning: { bg: theme.warnBg, text: theme.warnText },
    success: { bg: theme.successBg, text: theme.successText },
    neutral: { bg: theme.surfaceAlt, text: theme.textMuted },
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-2">
        {SUMMARY_ITEMS.map((item) => (
          <div key={item.key} className="rounded-lg px-2.5 py-2" style={{ background: toneStyle[item.tone].bg }}>
            <p className="text-lg font-bold leading-none" style={{ color: toneStyle[item.tone].text }}>{trainingStats[item.key]}</p>
            <p className="text-[10px] mt-1" style={{ color: toneStyle[item.tone].text }}>{item.label}</p>
          </div>
        ))}
      </div>

      {ongoingItems.length === 0 ? (
        <p className="text-xs" style={{ color: theme.textFaint }}>Şu anda kimse video izliyor değil.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {ongoingItems.map((item, i) => (
            <div key={`${item.employeeName}-${i}`} className="rounded-lg border px-3 py-2" style={{ borderColor: theme.border, background: theme.surface }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm truncate" style={{ color: theme.textPrimary }}>{item.employeeName}</p>
                <span className="text-xs font-semibold shrink-0" style={{ color: theme.textMuted }}>%{item.progressPercent}</span>
              </div>
              <p className="text-[10.5px] truncate" style={{ color: theme.textFaint }}>{item.courseTitle}</p>
              <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: theme.surfaceAlt }}>
                <div className="h-full rounded-full" style={{ width: `${item.progressPercent}%`, background: theme.accent }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/documents?tab=education" className="flex items-center justify-center gap-1 text-[11px] font-semibold mt-0.5 py-1.5" style={{ color: theme.accent }}>
        Tüm Eğitimleri Gör <ChevronRight style={{ fontSize: "12px" }} />
      </Link>
    </div>
  );
}
