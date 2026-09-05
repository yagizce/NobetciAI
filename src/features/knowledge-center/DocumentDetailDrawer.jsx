import { useEffect } from "react";
import { getDocumentTypeLabel, getCategoryMeta, findRelatedDocuments } from "../../constants/knowledgeCenter.js";
import { X, FileText, Star } from "../../components/icons/index.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";

/**
 * Sprint 6 #7: Doküman detay ekranı. Mock veri üzerinde çalışır — "İndir"/"Görüntüle"
 * eylemleri henüz gerçek bir dosyaya bağlı değildir (backend/depolama yok), bu yüzden
 * devre dışı ve "Yakında" etiketiyle gösterilir; ileride gerçek dosya deposu eklendiğinde
 * yalnızca bu buton davranışının değişmesi yeterli olacaktır.
 *
 * Sprint 7.3: favori toggle + İlgili Dokümanlar bölümü eklendi.
 *
 * @param {{ doc: object|null, theme: object, onClose: () => void, allDocuments: object[], onOpenDocument: (doc: object) => void, isFavorite: boolean, onToggleFavorite: (id: number) => void }} props
 */
export default function DocumentDetailDrawer({ doc, theme, onClose, allDocuments, onOpenDocument, isFavorite, onToggleFavorite }) {
  // A11Y FIX (bkz. Modal.jsx'teki aynı not): Escape ile kapatma eklendi. Hook, erken
  // `return null`'dan ÖNCE çağrılmalı (Rules of Hooks) — bu yüzden şart hook'un İÇİNE
  // alındı.
  useEffect(() => {
    if (!doc) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doc, onClose]);

  if (!doc) return null;
  const categoryMeta = getCategoryMeta(doc.category);
  const relatedDocs = findRelatedDocuments(doc, allDocuments, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={doc.title}
        className="relative w-full max-w-lg rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme.surfaceAlt }}>
              <FileText style={{ fontSize: "16px", color: theme.textMuted }} />
            </div>
            <div className="min-w-0">
              <p className="font-[Oswald] text-base uppercase tracking-wide" style={{ color: theme.textPrimary }}>{doc.title}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <Badge tone="neutral">{categoryMeta?.label || doc.category}</Badge>
                <Badge tone="neutral">{getDocumentTypeLabel(doc.type)}</Badge>
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Kapat" className="shrink-0 p-1.5 -m-1.5 rounded-lg">
            <X style={{ fontSize: "18px", color: theme.textMuted }} />
          </button>
        </div>

        <button
          onClick={() => onToggleFavorite(doc.id)}
          className="flex items-center gap-1.5 text-xs font-semibold mb-3"
          style={{ color: isFavorite ? theme.warnText : theme.textMuted }}
        >
          <Star style={{ fontSize: "13px", color: isFavorite ? theme.warnText : theme.textFaint, fill: isFavorite ? theme.warnText : "none" }} />
          {isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
        </button>

        <p className="text-xs mb-3" style={{ color: theme.textFaint }}>
          Son güncelleme: {doc.updatedAt} • {doc.sizeLabel}
        </p>

        <div className="rounded-lg px-3 py-3 mb-3" style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: theme.textPrimary }}>Özet</p>
          <p className="text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>{doc.content}</p>
        </div>

        {doc.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {doc.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: theme.surfaceAlt, color: theme.textFaint }}>#{tag}</span>
            ))}
          </div>
        )}

        {relatedDocs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-1.5" style={{ color: theme.textPrimary }}>İlgili Dokümanlar</p>
            <div className="flex flex-col gap-1.5">
              {relatedDocs.map((related) => (
                <button
                  key={related.id}
                  onClick={() => onOpenDocument(related)}
                  className="text-left text-xs px-3 py-2 rounded-lg border"
                  style={{ borderColor: theme.border, background: theme.surfaceAlt, color: theme.textPrimary }}
                >
                  {related.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" disabled className="flex-1 opacity-60 cursor-not-allowed">Görüntüle (Yakında)</Button>
          <Button disabled className="flex-1 opacity-60 cursor-not-allowed">İndir (Yakında)</Button>
        </div>
      </div>
    </div>
  );
}
