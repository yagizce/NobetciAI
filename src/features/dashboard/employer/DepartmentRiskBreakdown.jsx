/**
 * Hangi departmanın en riskli olduğunu gösteren basit, bağımlılıksız bar-liste.
 * Sprint 5A'da risk kayıtlarına eklenen `departmentId` alanını ilk kez dashboard'da
 * kullanır — bugüne kadar yalnızca filtreleme için vardı, hiçbir yerde özetlenmiyordu.
 *
 * @param {{ theme: object, fineKinneyEntries: object[], departments: Array<{id: string|number, name: string}> }} props
 */
export default function DepartmentRiskBreakdown({ theme, fineKinneyEntries, departments }) {
  const counts = {};
  let unassigned = 0;
  fineKinneyEntries.forEach((e) => {
    if (e.departmentId) {
      counts[e.departmentId] = (counts[e.departmentId] || 0) + 1;
    } else {
      unassigned += 1;
    }
  });

  const rows = Object.entries(counts)
    .map(([departmentId, count]) => ({
      label: departments.find((d) => String(d.id) === String(departmentId))?.name || "Bilinmeyen departman",
      count,
    }))
    .sort((a, b) => b.count - a.count);

  if (unassigned > 0) rows.push({ label: "Belirtilmedi", count: unassigned, muted: true });

  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  if (rows.length === 0) {
    return <p className="text-xs" style={{ color: theme.textFaint }}>Henüz risk kaydı yok.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2.5">
          <span className="text-xs w-28 shrink-0 truncate" style={{ color: r.muted ? theme.textFaint : theme.textMuted }}>{r.label}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: theme.surfaceAlt }}>
            <div className="h-full rounded-full" style={{ width: `${(r.count / maxCount) * 100}%`, background: r.muted ? theme.textFaint : theme.accent }} />
          </div>
          <span className="text-xs font-semibold w-6 text-right shrink-0" style={{ color: theme.textPrimary }}>{r.count}</span>
        </div>
      ))}
    </div>
  );
}
