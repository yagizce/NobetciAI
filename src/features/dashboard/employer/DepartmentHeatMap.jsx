import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import InfoTooltip from "../../../components/ui/InfoTooltip.jsx";
import DepartmentDetailPanel from "./DepartmentDetailPanel.jsx";
import { ChevronRight } from "../../../components/icons/index.jsx";

/**
 * Sprint: Risk Isı Haritası — "hangi bölümde en çok risk var" sorusunu
 * `DepartmentRiskBreakdown` zaten cevaplıyor (kayıt SAYISINA göre bar-liste).
 * Bu bileşen onun yerine geçmez, tamamlar: kayıt sayısı değil, **ortalama
 * şiddet** (Fine-Kinney skoru) baz alınır — çünkü 1 "Çok Yüksek Risk" kaydı
 * olan bir bölüm, 5 "Düşük Risk" kaydı olan bir bölümden daha tehlikelidir,
 * ama sadece sayıya bakan bir liste bunu ters gösterebilir.
 *
 * Renk paleti, uygulamanın geri kalanıyla tutarlı olması için doğrudan
 * `getFineKinneyRiskLevel`'dan (RiskLevelChip'in de kullandığı fonksiyon)
 * alınır — yeni bir renk sistemi icat edilmedi.
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
        <InfoTooltip theme={theme} text="Her departman için tüm Fine-Kinney kayıtlarının ortalama skoru hesaplanır ve aynı 5'li risk seviyesi renklendirmesi (Düşük → Çok Yüksek) uygulanır. Az sayıda ama ağır kayıdı olan bir departman, çok sayıda hafif kaydı olan bir departmandan daha üstte çıkabilir." />
      </div>
      {cells.map((c) => (
        <button key={c.label} onClick={() => setSelectedDepartment({ id: c.departmentId, name: c.label })}
          className="text-left rounded-lg px-3 py-2.5 flex items-center justify-between gap-2 w-full" style={{ background: c.level.bg }}>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: c.level.text }}>{c.label}</p>
            <p className="text-[10.5px]" style={{ color: c.level.text, opacity: 0.85 }}>
              {c.count} kayıt{c.criticalCount > 0 ? ` • ${c.criticalCount} yüksek/çok yüksek` : ""}
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
