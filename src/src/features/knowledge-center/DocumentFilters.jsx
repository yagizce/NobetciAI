import { DOCUMENT_TYPES, getCategoryMeta } from "../../constants/knowledgeCenter.js";
import { Search, X } from "../../components/icons/index.jsx";

/**
 * @param {{
 *   theme: object, search: string, onSearchChange: (v: string) => void,
 *   typeFilter: string, onTypeFilterChange: (v: string) => void,
 *   categoryFilter: string, onClearCategory: () => void,
 * }} props
 */
export default function DocumentFilters({ theme, search, onSearchChange, typeFilter, onTypeFilterChange, categoryFilter, onClearCategory }) {
  const activeCategoryMeta = categoryFilter !== "all" ? getCategoryMeta(categoryFilter) : null;

  return (
    <div className="mb-3">
      <div className="relative mb-2">
        <Search style={{ fontSize: "14px", color: theme.textFaint, position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Doküman ara (başlık, özet, etiket)..."
          className="w-full text-sm rounded-lg pl-8 pr-3 py-2 outline-none border"
          style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
        />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => onTypeFilterChange("all")}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
            style={typeFilter === "all" ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
          >
            Tüm Türler
          </button>
          {DOCUMENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTypeFilterChange(t.value)}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
              style={typeFilter === t.value ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeCategoryMeta && (
          <button
            onClick={onClearCategory}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
            style={{ background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
          >
            {activeCategoryMeta.label} <X style={{ fontSize: "11px" }} />
          </button>
        )}
      </div>
    </div>
  );
}
