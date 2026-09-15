import { useState } from "react";
import { CHECK_CATEGORIES } from "../../../constants/periodicCheck.js";
import { useCompanyOrgLists } from "../../risk-analysis/fineKinney/useCompanyOrgLists.js";
import { Search, ChevronDown } from "../../../components/icons/index.jsx";

const STATUS_FILTERS = [
  { key: "all", label: "Tümü" },
  { key: "overdue", label: "Süresi Geçti" },
  { key: "upcoming", label: "Yaklaşıyor" },
  { key: "ok", label: "Güncel" },
];

/**
 * FineKinneyFilters.jsx ile AYNI desen (arama + durum chip'leri + kategori seçimi +
 * gelişmiş filtreler açılır paneli). Sprint 7.2.3: Departman ve Tarih Aralığı, Fine-Kinney
 * ile birebir aynı yaklaşımla ("Gelişmiş Filtreler" collapsible + `useCompanyOrgLists`
 * paylaşımlı hook'u) eklendi — yeniden icat edilmedi.
 *
 * @param {{
 *   theme: object, search: string, onSearchChange: (v: string) => void,
 *   statusFilter: string, onStatusFilterChange: (v: string) => void,
 *   categoryFilter: string, onCategoryFilterChange: (v: string) => void,
 *   departmentFilter: string, onDepartmentFilterChange: (v: string) => void,
 *   dateFrom: string, onDateFromChange: (v: string) => void,
 *   dateTo: string, onDateToChange: (v: string) => void,
 * }} props
 */
export default function PeriodicCheckFilters({
  theme, search, onSearchChange, statusFilter, onStatusFilterChange, categoryFilter, onCategoryFilterChange,
  departmentFilter, onDepartmentFilterChange, dateFrom, onDateFromChange, dateTo, onDateToChange,
}) {
  const { departments } = useCompanyOrgLists();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activeAdvancedCount = (departmentFilter && departmentFilter !== "all" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const selectStyle = { background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary };

  return (
    <div className="mb-3">
      <div className="relative mb-2 max-w-sm">
        <Search style={{ fontSize: "14px", color: theme.textFaint, position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Kalem veya sorumlu ara..."
          className="w-full text-sm rounded-lg pl-8 pr-3 py-2 outline-none border"
          style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
        />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => onStatusFilterChange(f.key)}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
              style={statusFilter === f.key ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="text-[11px] font-semibold rounded-full px-2.5 py-1.5 outline-none border shrink-0"
          style={{ background: theme.surfaceAlt, color: theme.textMuted, borderColor: theme.border }}
        >
          <option value="all">Tüm Kontrol Türleri</option>
          {CHECK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <button
        onClick={() => setAdvancedOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-semibold mb-2 -m-1 p-1"
        style={{ color: theme.textMuted }}
      >
        <ChevronDown style={{ fontSize: "12px", transform: advancedOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        Gelişmiş Filtreler{activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ""}
      </button>

      {advancedOpen && (
        <div className="rounded-lg border px-3 py-3 mb-1" style={{ borderColor: theme.border, background: theme.surface }}>
          <label className="block mb-2">
            <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Departman</span>
            <select value={departmentFilter} onChange={(e) => onDepartmentFilterChange(e.target.value)}
              className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle}>
              <option value="all">Tümü</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Sonraki Kontrol — Başlangıç</span>
              <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)}
                className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle} />
            </label>
            <label className="block">
              <span className="block text-[10px] mb-1" style={{ color: theme.textFaint }}>Sonraki Kontrol — Bitiş</span>
              <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)}
                className="w-full text-xs rounded-lg px-2 py-2 outline-none border" style={selectStyle} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
