import { useState } from "react";
import { ATTACHMENT_TYPES } from "../../../../../constants/fineKinney.js";
import Button from "../../../../../components/ui/Button.jsx";
import EmptyState from "../../../../../components/EmptyState.jsx";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog.jsx";
import { Paperclip, ImageIcon, FileText, Trash2 } from "../../../../../components/icons/index.jsx";

// Sprint 5A #3: şimdilik yalnızca mock meta veri (ad + tür) saklanır — gerçek dosya
// yükleme/depolama bu sürümün kapsamı dışında. Alan adları (name, type, note) ileride
// bir AI Vision servisi devreye girdiğinde aynı veri şekliyle kullanılabilecek şekilde
// tasarlandı: her attachment { id, name, type, note, addedAt, addedBy } tutar.
const TYPE_ICON = { photo: ImageIcon, pdf: FileText, word: FileText, excel: FileText };

/**
 * @param {{ entry: object, theme: object, onAdd: (a: object) => void, onRemove: (id: number) => void, readOnly?: boolean }} props
 */
export default function AttachmentsTab({ entry, theme, onAdd, onRemove, readOnly = false }) {
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("photo");
  // UX FIX (Risk Yönetimi cilası — silme güvenliği): önceden "Sil" tek tıkla, hiçbir
  // onay olmadan kalıcı olarak siliyordu — uygulamanın geri kalanındaki (risk kaydı,
  // departman, çalışan, şube, belge, periyodik kontrol) HER silme akışının aksine.
  // Aynı, zaten kurulu ConfirmDialog deseniyle tutarlı hale getirildi.
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const attachments = entry.attachments || [];

  function submit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type });
    setName("");
    setFormOpen(false);
  }

  return (
    <div>
      <div className="rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2" style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
        <Paperclip style={{ fontSize: "14px", color: theme.textFaint, marginTop: "2px" }} />
        <p className="text-[10.5px]" style={{ color: theme.textFaint }}>
          Şimdilik dosyalar mock (yalnızca ad/tür) olarak kaydedilir. Gerçek dosya yükleme ve
          AI Vision ile otomatik analiz altyapısı ileride bu sekmeye eklenecek.
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: theme.textFaint }}>Fotoğraf, PDF, Word, Excel</p>
        {!readOnly && (
          <Button size="sm" variant="secondary" onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1">
            <Paperclip style={{ fontSize: "12px" }} /> Dosya Ekle
          </Button>
        )}
      </div>

      {formOpen && !readOnly && (
        <div className="rounded-lg border px-3 py-3 mb-3" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dosya adı (örn. Merdiven_korkuluk.jpg)"
            className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <div className="flex gap-2 mb-3">
            {ATTACHMENT_TYPES.map((t) => (
              <button key={t.value} onClick={() => setType(t.value)} className="flex-1 text-[11px] py-1.5 rounded-lg font-semibold"
                style={type === t.value ? { background: theme.accent, color: theme.onAccent } : { background: theme.surface, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setFormOpen(false); setName(""); }} className="flex-1">Vazgeç</Button>
            <Button onClick={submit} disabled={!name.trim()} className="flex-1">Ekle</Button>
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <EmptyState icon={Paperclip} title="Henüz dosya yok" description="Bu riske fotoğraf veya belge ekleyin." />
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => {
            const Icon = TYPE_ICON[a.type] || FileText;
            return (
              <div key={a.id} className="rounded-lg border px-3 py-2.5 flex items-center gap-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                <Icon style={{ fontSize: "16px", color: theme.textMuted }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: theme.textPrimary }}>{a.name}</p>
                  <p className="text-[10.5px]" style={{ color: theme.textFaint }}>{a.addedBy} • {new Date(a.addedAt).toLocaleDateString("tr-TR")}</p>
                </div>
                {!readOnly && <button onClick={() => setConfirmRemoveId(a.id)} aria-label="Sil"><Trash2 style={{ fontSize: "13px", color: theme.emergencyText }} /></button>}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmRemoveId !== null}
        title="Dosyayı sil"
        message="Bu dosyayı riskten kaldırmak istediğine emin misin? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        onConfirm={() => { onRemove(confirmRemoveId); setConfirmRemoveId(null); }}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
}
