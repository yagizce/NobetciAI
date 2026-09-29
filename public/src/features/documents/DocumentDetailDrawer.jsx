import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { getDocumentTypeLabel } from "../../constants/documentTypes.js";
import { CheckCircle2 } from "../../components/icons/index.jsx";

/**
 * Belge içeriğini (AI taslağı ya da elle girilmiş) görüntüleyip düzenlemek ve
 * "Tamamlandı" olarak işaretlemek için kullanılan detay ekranı. `PeriodicCheckDetailDrawer.jsx`
 * ile aynı desen: mevcut `Modal.jsx` bileşeni üzerine kurulu.
 *
 * @param {{
 *   theme: object, document: object|null, onClose: () => void,
 *   onSaveContent: (id: number, content: string) => void,
 *   onMarkCompleted: (id: number) => void,
 * }} props
 */
export default function DocumentDetailDrawer({ theme, document, onClose, onSaveContent, onMarkCompleted }) {
  const [draft, setDraft] = useState("");

  // document değiştiğinde (farklı bir belge açıldığında) taslak metnini sıfırla —
  // aksi halde önceki belgenin düzenlenmiş metni yanlışlıkla yenisine taşınır.
  useEffect(() => {
    setDraft(document?.content || "");
  }, [document?.id]);

  if (!document) return null;
  const isDirty = draft !== (document.content || "");

  function handleSave() {
    onSaveContent(document.id, draft);
  }

  return (
    <Modal open={Boolean(document)} onClose={onClose} title="Belge Detayı">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-base font-semibold leading-snug min-w-0 break-words" style={{ color: theme.textPrimary }}>{document.title}</p>
        <span className="shrink-0">
          <Badge tone={document.status === "completed" ? "success" : "pending"}>{document.status === "completed" ? "Tamamlandı" : "Taslak"}</Badge>
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: theme.textFaint }}>
        {getDocumentTypeLabel(document.type)} • {document.createdBy} • {document.createdAt}
      </p>

      <label className="block mb-3">
        <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>
          İçerik {document.content ? "(AI taslağı — düzenleyebilirsin)" : ""}
        </span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          placeholder="Belge içeriği boş — AI taslağı üretilemediyse buraya elle yazabilirsin."
          className="w-full text-sm rounded-lg px-3 py-2 outline-none border resize-y"
          style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
        />
      </label>

      <div className="flex items-center gap-2 flex-wrap">
        {isDirty && (
          <Button size="sm" onClick={handleSave} className="flex items-center gap-1.5">
            Kaydet
          </Button>
        )}
        {document.status !== "completed" && (
          <button
            onClick={() => onMarkCompleted(document.id)}
            className="text-[11px] font-semibold flex items-center gap-1 px-2 py-1.5"
            style={{ color: theme.successText }}
          >
            <CheckCircle2 style={{ fontSize: "13px" }} /> Tamamlandı Olarak İşaretle
          </button>
        )}
      </div>
    </Modal>
  );
}
