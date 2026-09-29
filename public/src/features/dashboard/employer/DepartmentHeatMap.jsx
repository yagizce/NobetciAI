import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { computeDepartmentRiskTrends } from "../../../utils/departmentRiskTrend.js";
import DepartmentDetailPanel from "./DepartmentDetailPanel.jsx";
import { ChevronRight, ArrowUp } from "../../../components/icons/index.jsx";

/**
 * Risk Isı Haritası — İşveren Dashboard'daki TEK departman/risk widget'ı. Önceden
 * ayrı ayrı var olan `DepartmentRiskBreakdown` (kayıt sayısına göre bar-liste),
 * `CriticalRisksCard` (açık kritik risklerin düz listesi) ve
 * `DepartmentTrendAlertCard` (son 30 günde artan departmanlar) burada birleştirildi.
 *
 * SIRALAMA NOTU (güncelleme): önceden departmanlar "ortalama risk şiddeti" (Fine-Kinney
 * ortalama skoru) ile sıralanıyor ve renklendiriliyordu — İşveren için soyut/teknik bir
 * sayıydı (istek üzerine kaldırıldı). Artık sıralama KRİTİK (yüksek/çok yüksek) açık kayıt
 * SAYISINA göre yapılıyor — bir İşverenin doğrudan anlayabileceği, doğrudan aksiyon
 * alınabilir bir sinyal ("bu bölümde 3 kritik risk var"). Departmana tıklayınca açılan
 * detay panelinde açık risklerin TAMAMI zaten listeleniyor (bkz. DepartmentDetailPanel.jsx).
 *
 * @param {{ fineKinneyEntries: object[], departments: Array<{id: string|number, name: string}>,
 *   periodicChecks: object[], notifications: object[], employees: object[],
 *   trainingProgressRecords: object[], trainingCompletionRecords: object[] }} props
 */
export default function DepartmentHeatMap({ fineKinneyEntries, departments, periodicChecks, notifications, employees, trainingProgressRecords, trainingCompletionRecords }) {
  const { theme } = useTheme();
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
      const criticalCount = entries.filter((e) => {
        const level = getRiskLevelKey(e.score);
        return level === "high" || level === "veryHigh";
      }).length;
      return {
        departmentId,
        label: departments.find((d) => String(d.id) === String(departmentId))?.name || "Bilinmeyen departman",
        count: entries.length,
        criticalCount,
        trend: trendByDepartmentId[String(departmentId)] || null,
      };
    })
    .sort((a, b) => b.criticalCount - a.criticalCount || b.count - a.count);

  if (cells.length === 0) {
    return <p className="text-xs" style={{ color: theme.textFaint }}>Henüz departmana bağlı risk kaydı yok.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px]" style={{ color: theme.textFaint }}>Kritik (yüksek/çok yüksek) açık risk sayısına göre sıralandı.</p>
      {cells.map((c) => {
        const hasCritical = c.criticalCount > 0;
        const bg = hasCritical ? theme.highRiskBg : theme.surfaceAlt;
        const text = hasCritical ? theme.highRiskText : theme.textPrimary;
        return (
          <button key={c.label} onClick={() => setSelectedDepartment({ id: c.departmentId, name: c.label })}
            className="text-left rounded-lg px-3 py-2.5 flex items-center justify-between gap-2 w-full" style={{ background: bg }}>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: text }}>
                {c.label}
                {c.trend && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: theme.surface, color: theme.highRiskText }}>
                    <ArrowUp style={{ fontSize: "10px" }} /> Artıyor
                  </span>
                )}
              </p>
              <p className="text-[10.5px]" style={{ color: text, opacity: 0.85 }}>
                {c.count} kayıt{c.criticalCount > 0 ? ` • ${c.criticalCount} yüksek/çok yüksek` : ""}
                {c.trend ? ` • son 30 günde ${c.trend.previous} → ${c.trend.current}` : ""}
              </p>
            </div>
            <ChevronRight style={{ fontSize: "14px", color: text, flexShrink: 0 }} />
          </button>
        );
      })}
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

// getFineKinneyRiskLevel(score) zaten bir renklendirme nesnesi (bg/text) döndürüyordu —
// burada artık renklendirme için kullanılmıyor (kritik/kritik-değil ikili ayrımı theme'den
// geliyor), ama "yüksek/çok yüksek" eşiği hâlâ TEK kaynaktan (fineKinney.js) okunur; eşik
// değeri burada YENİDEN TANIMLANMAZ.
function getRiskLevelKey(score) {
  return getFineKinneyRiskLevel(score).key;
}

