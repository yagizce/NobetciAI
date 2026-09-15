import { useState } from "react";
import { RISK_LEVEL_FILTERS, STATUS_OPTIONS, PRIORITY_OPTIONS } from "../../../constants/fineKinney.js";
import { Search, ChevronDown } from "../../../components/icons/index.jsx";
import { useCompanyOrgLists } from "./useCompanyOrgLists.js";

/**
 * @param {{
 *   theme: object, search: string, onSearchChange: (v: string) => void,
 *   levelFilter: string, onLevelFilterChange: (v: string) => void,
 *   departmentFilter: string, onDepartmentFilterChange: (v: string) => void,
 *   branchFilter: string, onBranchFilterChange: (v: string) => void,
 *   statusFilter: string, onStatusFilterChange: (v: string) => void,
 *   priorityFilter: string, onPriorityFilterChange: (v: string) => void,
 *   dateFrom: string, onDateFromChange: (v: string) => void,
 *   dateTo: string, onDateToChange: (v: string) => void,
 * }} props
 */
export default function FineKinneyFilters({
  theme, search, onSearchChange, levelFilter, onLevelFilterChange,
  departmentFilter, onDepartmentFilterChange, branchFilter, onBranchFilterChange,
  statusFilter, onStatusFilterChange, priorityFilter, onPriorityFilterChange,
  dateFrom, onDateFromChange, dateTo, onDateToChange,
}) {
  const { departments, branches, hasMultipleBranches } = useCompanyOrgLists();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activeAdvancedCount = [departmentFilter, hasMultipleBranches ? branchFilter : null, statusFilter, priorityFilter].filter((v) => v && v !== "all").length
    + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const selectStyle = { background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary };

  return (
    <div className="mb-3">
      <div className="relative mb-2 max-w-sm">
        <Search style={{ fontSize: "14px", color: theme.textFaint, position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tehlike veya risk ara..."
          className="w-full text-sm rounded-lg pl-8 pr-3 py-2 outline-none border"
          style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2">
        {RISK_LEVEL_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onLevelFilterChange(f.key)}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
            style={
              levelFilter === f.key
                ? { background: theme.accent, color: theme.onAccent }
                : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setAdvancedOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-semibold mb-2"
        style={{ color: theme.textMuted }}
      >
        <ChevronDown style={{ fontSize: "12px", transform: advancedOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        Gelişmiş Filtreler{activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ""}
      </button>

      {advancedOpen && (
        <div className="rounded-lg border px-3 py-3 mb-1" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className={`grid gap-2 mb-2 ${hasMultipleBranches ? "sm:grid-cols-2" : ""}`}>
            <label className="block">
              <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Departman</span>
              <select value={departmentFilter} onChange={(e) => onDepartmentFilterChange(e.target.value)}
                className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle}>
                <option value="all">Tümü</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            {hasMultipleBranches && (
              <label className="block">
                <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Şube</span>
                <select value={branchFilter} onChange={(e) => onBranchFilterChange(e.target.value)}
                  className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle}>
                  <option value="all">Tümü</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 mb-2">
            <label className="block">
              <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Durum</span>
              <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}
                className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle}>
                <option value="all">Tümü</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Öncelik</span>
              <select value={priorityFilter} onChange={(e) => onPriorityFilterChange(e.target.value)}
                className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle}>
                <option value="all">Tümü</option>
                {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Başlangıç Tarihi</span>
              <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)}
                className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle} />
            </label>
            <label className="block">
              <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Bitiş Tarihi</span>
              <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)}
                className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
