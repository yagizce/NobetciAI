import { CheckCircle2, AlertTriangle } from "../../components/icons/index.jsx";

/**
 * "Kazasız Gün Sayacı" — fiziksel işyerlerindeki panoların dijital karşılığı. Hem
 * İşveren hem Çalışan dashboard'unda kullanılan paylaşılan bir bileşen (bkz.
 * utils/accidentFreeStreak.js).
 *
 * @param {{ theme: object, streak: { hasRecord: boolean, days: number|null, lastAccidentDate: string|null } }} props
 */
export default function StreakCounterCard({ theme, streak }) {
  const positive = !streak.hasRecord || streak.days >= 30;
  const accentColor = positive ? theme.successText : theme.warnText;
  const accentBg = positive ? theme.successBg : theme.warnBg;
  const Icon = positive ? CheckCircle2 : AlertTriangle;

  return (
    <div className="rounded-xl border px-4 py-4 flex items-center gap-4" style={{ borderColor: theme.border, background: theme.surface }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: accentBg }}>
        <Icon style={{ fontSize: "20px", color: accentColor }} />
      </div>
      <div className="min-w-0">
        {streak.hasRecord ? (
          <>
            <p className="text-2xl font-bold leading-none" style={{ color: theme.textPrimary }}>
              {streak.days} <span className="text-sm font-semibold" style={{ color: theme.textFaint }}>gün</span>
            </p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Son iş kazası bildiriminden bu yana kazasız
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Kayıtlı iş kazası yok</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Takip başladığından bu yana hiç "İş Kazası" bildirimi girilmedi
            </p>
          </>
        )}
      </div>
    </div>
  );
}
