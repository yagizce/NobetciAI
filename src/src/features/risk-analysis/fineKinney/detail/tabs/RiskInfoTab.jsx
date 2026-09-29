import { STATUS_OPTIONS } from "../../../../../constants/fineKinney.js";
import Badge from "../../../../../components/ui/Badge.jsx";
import { useCompanyOrgLists } from "../../useCompanyOrgLists.js";

/**
 * @param {{ entry: object, theme: object }} props
 */
export default function RiskInfoTab({ entry, theme }) {
  const { departments, branches, hasMultipleBranches } = useCompanyOrgLists();
  const departmentName = departments.find((d) => String(d.id) === String(entry.departmentId))?.name;
  const branchName = branches.find((b) => String(b.id) === String(entry.branchId))?.name;
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === entry.status)?.label || entry.status;

  const rows = [
    ["Tehlike", entry.hazard],
    ["Risk", entry.risk],
    ["Etkilenenler", entry.affected || "—"],
    ["Sorumlu", entry.responsible || "—"],
    ["Termin Tarihi", entry.dueDate || "—"],
    ["Oluşturulma Tarihi", entry.date || "—"],
    ["Departman", departmentName || "Belirtilmedi"],
    ...(hasMultipleBranches ? [["Şube", branchName || "Belirtilmedi"]] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Badge tone="neutral">{statusLabel}</Badge>
        {entry.closedAt && <span className="text-[10.5px]" style={{ color: theme.textFaint }}>Kapanma: {new Date(entry.closedAt).toLocaleDateString("tr-TR")}</span>}
      </div>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 text-xs py-1.5 border-b" style={{ borderColor: theme.border }}>
            <span style={{ color: theme.textFaint }}>{label}</span>
            <span className="text-right font-medium" style={{ color: theme.textPrimary }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
