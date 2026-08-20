import { getDocumentTypeLabel, getCategoryMeta } from "../../constants/knowledgeCenter.js";
import { FileText, Star } from "../../components/icons/index.jsx";
import Badge from "../../components/ui/Badge.jsx";

/**
 * @param {{ doc: object, theme: object, onClick: () => void, isFavorite: boolean, onToggleFavorite: (id: number) => void }} props
 */
export default function DocumentCard({ doc, theme, onClick, isFavorite, onToggleFavorite }) {
  const categoryMeta = getCategoryMeta(doc.category);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      className="text-left rounded-xl border px-3.5 py-3 w-full cursor-pointer"
      style={{ borderColor: theme.border, background: theme.surface }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme.surfaceAlt }}>
          <FileText style={{ fontSize: "15px", color: theme.textMuted }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-sm font-semibold mb-0.5" style={{ color: theme.textPrimary }}>{doc.title}</p>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(doc.id); }}
              aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
              className="shrink-0"
            >
              <Star style={{ fontSize: "15px", color: isFavorite ? theme.warnText : theme.textFaint, fill: isFavorite ? theme.warnText : "none" }} />
            </button>
          </div>
          <p className="text-[11.5px] mb-2 line-clamp-2" style={{ color: theme.textMuted }}>{doc.summary}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge tone="neutral">{categoryMeta?.label || doc.category}</Badge>
            <Badge tone="neutral">{getDocumentTypeLabel(doc.type)}</Badge>
            <span className="text-[10px]" style={{ color: theme.textFaint }}>{doc.sizeLabel} • {doc.updatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
