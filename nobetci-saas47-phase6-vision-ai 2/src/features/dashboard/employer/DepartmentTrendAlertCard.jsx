import { Link } from "react-router-dom";
import { computeDepartmentRiskTrends } from "../../../utils/departmentRiskTrend.js";
import { ArrowUp, CheckCircle2, ChevronRight } from "../../../components/icons/index.jsx";

/**
 * Sprint: Ramak Kala/Risk Trend Uyarısı. Erken müdahale amaçlı — bir departmanda
 * son 30 günde risk kaydı önceki 30 güne göre artıyorsa (ve gürültü olmasın diye
 * en az 3 kayıt varsa) burada listelenir. Bir kazanın maliyeti bu uyarının
 * göz ardı edilmesinin maliyetinden kat kat fazladır; bu yüzden kart bilinçli
 * olarak "warn" tonunda, göz ardı edilmesi zor bir yerde.
 *
 * @param {{ theme: object, fineKinneyEntries: object[], departments: Array<{id: string|number, name: string}> }} props
 */
export default function DepartmentTrendAlertCard({ theme, fineKinneyEntries, departments }) {
  const trends = computeDepartmentRiskTrends(fineKinneyEntries, departments);

  if (trends.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-3" style={{ background: theme.successBg }}>
        <CheckCircle2 style={{ fontSize: "16px", color: theme.successText }} />
        <p className="text-xs font-medium" style={{ color: theme.successText }}>Hiçbir departmanda belirgin bir risk artışı yok (son 30 gün, önceki 30 güne göre).</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {trends.map((t) => (
        <div key={t.departmentId} className="rounded-lg px-3 py-2.5 flex items-center justify-between gap-2" style={{ background: theme.warnBg }}>
          <div className="flex items-center gap-2 min-w-0">
            <ArrowUp style={{ fontSize: "15px", color: theme.warnText }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: theme.warnText }}>{t.label}</p>
              <p className="text-[10.5px]" style={{ color: theme.warnText, opacity: 0.85 }}>
                Son 30 günde {t.current} kayıt (önceki 30 günde {t.previous}) — +{t.delta}
              </p>
            </div>
          </div>
          <Link to="/risk-analysis" className="flex items-center gap-0.5 text-[11px] font-semibold shrink-0" style={{ color: theme.warnText }}>
            İncele <ChevronRight style={{ fontSize: "12px" }} />
          </Link>
        </div>
      ))}
    </div>
  );
}
