import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { computeDepartmentRiskTrends } from "../../../utils/departmentRiskTrend.js";
import InfoTooltip from "../../../components/ui/InfoTooltip.jsx";
import DepartmentDetailPanel from "./DepartmentDetailPanel.jsx";
import { ChevronRight, ArrowUp } from "../../../components/icons/index.jsx";

/**
 * Risk Isı Haritası — İşveren Dashboard'daki TEK departman/risk widget'ı. Önceden
 * ayrı ayrı var olan `DepartmentRiskBreakdown` (kayıt sayısına göre bar-liste),
 * `CriticalRisksCard` (açık kritik risklerin düz listesi) ve
 * `DepartmentTrendAlertCard` (son 30 günde artan departmanlar) burada birleştirildi —
 * üçü de aynı soruyu ("hangi bölüm daha riskli?") çelişen yöntemlerle cevaplıyordu
 * (biri sayıya, biri şiddete göre sıralıyordu). Artık TEK sıralama ölçütü var:
 * **ortalama şiddet** (Fine-Kinney skoru) — çünkü 1 "Çok Yüksek Risk" kaydı olan bir
 * bölüm, 5 "Düşük Risk" kaydı olan bir bölümden daha tehlikelidir. Kayıt sayısı,
 * kritik kayıt sayısı ve "son 30 günde artıyor" uyarısı artık aynı satırda, tek
 * bakışta görünüyor; departmana tıklayınca açılan detay panelinde açık risklerin
 * TAMAMI zaten listeleniyor (bkz. DepartmentDetailPanel.jsx) — bu yüzden ayrıca bir
 * "ilk 5 kritik risk" listesine gerek yoktu.
 *
 * @param {{ fineKinneyEntries: object[], departments: Array<{id: string|number, name: string}>,
 *   periodicChecks: object[], notifications: object[], employees: object[],
 *   trainingProgressRecords: object[], trainingCompletionRecords: object[] }} props
 */
export default function DepartmentHeatMap({ fineKinneyEntries, departments, periodicChecks, notifications, employees, trainingProgressRecords, trainingCompletionRecords }) {
  const { theme, mode } = useTheme();
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const grouped = {};
  let unassigned = [];
  fineKinneyEntries.forEach((e) => {
    if (e.departmentId) {
      (grouped[e.departmentId] ||= []).push(e);
    } else {
      unassigned.push(e);
    }
  });

  const trendByDepartmentId = Object.fromEntries(
    computeDepartmentRiskTrends(fineKinneyEntries, departments).map((t) => [String(t.departmentId), t])
  );

  const cells = Object.entries(grouped)
    .map(([departmentId, entries]) => {
      const avgScore = Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length);
      const criticalCount = entries.filter((e) => {
        const key = getFineKinneyRiskLevel(e.score).key;
        return key === "high" || key === "veryHigh";
      }).length;
      return {
        departmentId,
        label: departments.find((d) => String(d.id) === String(departmentId))?.name || "Bilinmeyen departman",
        count: entries.length,
        avgScore,
        criticalCount,
        level: getFineKinneyRiskLevel(avgScore, mode),
        trend: trendByDepartmentId[String(departmentId)] || null,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

  if (cells.length === 0) {
    return <p className="text-xs" style={{ color: theme.textFaint }}>Henüz departmana bağlı risk kaydı yok.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <p className="text-[11px]" style={{ color: theme.textFaint }}>Ortalama risk şiddetine göre sıralandı — kayıt sayısı değil.</p>
        <InfoTooltip theme={theme} text="Her departman için tüm Fine-Kinney kayıtlarının ortalama skoru hesaplanır ve aynı 5'li risk seviyesi renklendirmesi (Düşük → Çok Yüksek) uygulanır. Az sayıda ama ağır kayıdı olan bir departman, çok sayıda hafif kaydı olan bir departmandan daha üstte çıkabilir. 'Artıyor' uyarısı, son 30 günün bir önceki 30 güne göre karşılaştırmasıdır." />
      </div>
      {cells.map((c) => (
        <button key={c.label} onClick={() => setSelectedDepartment({ id: c.departmentId, name: c.label })}
          className="text-left rounded-lg px-3 py-2.5 flex items-center justify-between gap-2 w-full" style={{ background: c.level.bg }}>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: c.level.text }}>
              {c.label}
              {c.trend && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: theme.surface, color: theme.highRiskText }}>
                  <ArrowUp style={{ fontSize: "10px" }} /> Artıyor
                </span>
              )}
            </p>
            <p className="text-[10.5px]" style={{ color: c.level.text, opacity: 0.85 }}>
              {c.count} kayıt{c.criticalCount > 0 ? ` • ${c.criticalCount} yüksek/çok yüksek` : ""}
              {c.trend ? ` • son 30 günde ${c.trend.previous} → ${c.trend.current}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: theme.surface, color: c.level.text }}>
              {c.avgScore}
            </span>
            <ChevronRight style={{ fontSize: "14px", color: c.level.text }} />
          </div>
        </button>
      ))}
      {unassigned.length > 0 && (
        <p className="text-[10.5px]" style={{ color: theme.textFaint }}>
          + {unassigned.length} kayıt henüz bir departmana bağlanmamış.
        </p>
      )}

      <DepartmentDetailPanel
        department={selectedDepartment}
        onClose={() => setSelectedDepartment(null)}
        fineKinneyEntries={fineKinneyEntries}
        periodicChecks={periodicChecks}
        notifications={notifications}
        employees={employees}
        trainingProgressRecords={trainingProgressRecords}
        trainingCompletionRecords={trainingCompletionRecords}
      />
    </div>
  );
}
