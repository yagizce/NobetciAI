import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown, Minus } from "../../../components/icons/index.jsx";
import InfoTooltip from "../../../components/ui/InfoTooltip.jsx";

const ROWS = [
  { key: "newRisks", label: "Yeni Risk", to: "/risk-analysis" },
  { key: "closedRisks", label: "Kapatılan Risk", to: "/risk-analysis" },
  { key: "completedTrainings", label: "Tamamlanan Eğitim", to: "/documents?tab=education" },
  { key: "checksPerformed", label: "Yapılan Periyodik Kontrol", to: "/documents?tab=periodicChecks" },
];

/**
 * Karar destek dashboard'unun "Son 30 Gün Değişim" kartı. Her satır gerçek verinin son
 * 30 gün / önceki 30 gün karşılaştırmasıdır (bkz. utils/dashboardTrends.js) — temsili
 * bir seyir DEĞİLDİR. `goodDirection`'a göre artış/azalış yeşil ya da kırmızı renklenir
 * (örn. "Yeni Risk" için düşüş iyidir, "Kapatılan Risk" için artış iyidir).
 * Sprint 7.2.4: her satır artık ilgili modüle tıklanabilir (Link).
 *
 * @param {{ theme: object, change: ReturnType<typeof import("../../../utils/dashboardTrends.js").computeLast30DayChange> }} props
 */
export default function Last30DaysChangeCard({ theme, change }) {
  // Sprint 7.2.4: Sprint 7.4 raporunda not edilen riski gideriyor — hiç veri yoksa
  // (tüm satırlarda current=0 VE previous=0) "değişim yok" yerine "henüz karşılaştırılacak
  // veri yok" göstermek daha doğru; aksi halde kart "bozuk" gibi algılanabiliyordu.
  const hasAnyData = ROWS.some((row) => change[row.key].current > 0 || change[row.key].previous > 0);

  if (!hasAnyData) {
    return (
      <div className="rounded-xl border px-4 py-3.5" style={{ borderColor: theme.border, background: theme.surface }}>
        <p className="text-sm font-semibold mb-1" style={{ color: theme.textPrimary }}>Son 30 Gün Değişim</p>
        <p className="text-xs" style={{ color: theme.textFaint }}>Henüz karşılaştırılacak yeterli geçmiş veri yok. Risk, eğitim ve kontrol kayıtları biriktikçe burada gerçek bir karşılaştırma görünecek.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border px-4 py-3.5" style={{ borderColor: theme.border, background: theme.surface }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Son 30 Gün Değişim</p>
          <InfoTooltip theme={theme} text="Son 30 gün ile ondan önceki 30 gün karşılaştırılır. Gerçek kayıtlardan hesaplanır; temsili bir seyir değildir." />
        </div>
        <p className="text-[10.5px]" style={{ color: theme.textFaint }}>Önceki 30 güne göre</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {ROWS.map((row) => {
          const stat = change[row.key];
          const delta = stat.delta;
          const isFlat = delta === 0;
          const isIncrease = delta > 0;
          const isGood = isFlat ? true : (isIncrease ? stat.goodDirection === "up" : stat.goodDirection === "down");
          const color = isFlat ? theme.textFaint : isGood ? theme.successText : theme.highRiskText;
          const Icon = isFlat ? Minus : isIncrease ? ArrowUp : ArrowDown;

          return (
            <Link key={row.key} to={row.to} className="rounded-lg px-3 py-2.5 block" style={{ background: theme.surfaceAlt }}>
              <p className="text-[10.5px] mb-1" style={{ color: theme.textFaint }}>{row.label}</p>
              <div className="flex items-end justify-between gap-1">
                <span className="text-lg font-bold leading-none" style={{ color: theme.textPrimary }}>{stat.current}</span>
                <span className="flex items-center gap-0.5 text-[11px] font-semibold" style={{ color }}>
                  <Icon style={{ fontSize: "11px" }} />
                  {isFlat ? "0" : Math.abs(delta)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
