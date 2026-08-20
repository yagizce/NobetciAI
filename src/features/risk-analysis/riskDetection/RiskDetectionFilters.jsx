import { RISK_DETECTION_CATEGORIES } from "../../../constants/riskDetection.js";
import { Search } from "../../../components/icons/index.jsx";

const STATUS_FILTERS = [
  { key: "all", label: "Tümü" },
  { key: "new", label: "Yeni" },
  { key: "reviewing", label: "İncelemede" },
  { key: "converted", label: "Dönüştürüldü" },
  { key: "dismissed", label: "Reddedildi" },
];

/**
 * @param {{
 *   theme: object, search: string, onSearchChange: (v: string) => void,
 *   statusFilter: string, onStatusFilterChange: (v: string) => void,
 *   categoryFilter: string, onCategoryFilterChange: (v: string) => void,
 * }} props
 */
export default function RiskDetectionFilters({ theme, search, onSearchChange, statusFilter, onStatusFilterChange, categoryFilter, onCategoryFilterChange }) {
  return (
    <div className="mb-3">
      <div className="relative mb-2 max-w-sm">
        <Search style={{ fontSize: "14px", color: theme.textFaint, position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Konum ara..."
          className="w-full text-sm rounded-lg pl-8 pr-3 py-2 outline-none border"
          style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
        />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
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
          <option value="all">Tüm Kategoriler</option>
          {RISK_DETECTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
    </div>
  );
}
