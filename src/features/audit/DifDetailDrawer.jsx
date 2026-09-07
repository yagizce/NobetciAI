import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { DIF_STAGES, getDifStageIndex, isDifOverdue } from "../../constants/auditWorkflow.js";
import { getFindingTypeMeta, getStandardLabel } from "../../constants/isoStandards.js";
import { X, Paperclip, ImageIcon, FileText, Trash2, CheckCircle2 } from "../../components/icons/index.jsx";

const EVIDENCE_TYPES = [
  { value: "photo", label: "Fotoğraf" },
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Word" },
];
const TYPE_ICON = { photo: ImageIcon, pdf: FileText, word: FileText };

/**
 * DİF yaşam döngüsü: Açık → Kök Neden → Aksiyon → Doğrulama → Kapalı. Stepper'a
 * tıklayarak HERHANGİ bir aşamaya geçilebilir (geri de) — sahada bazen bir aşama
 * atlanıp geri dönülmesi gerekebilir (örn. doğrulamada başarısız olup Aksiyon'a
 * geri dönmek). Kapalı'ya geçişte `closedAt` otomatik damgalanır (bkz. auditManagementService.js).
 *
 * @param {{ dif: object|null, onClose: () => void, canManage: boolean,
 *   onStageChange: (dif, stage, patch?) => Promise<void>, onSaveFields: (dif) => Promise<void>,
 *   onAddEvidence: (dif, file) => Promise<void>, onRemoveEvidence: (dif, id) => Promise<void> }} props
 */
export default function DifDetailDrawer({ dif, onClose, canManage, onStageChange, onSaveFields, onAddEvidence, onRemoveEvidence }) {
  const { theme } = useTheme();
  const [fields, setFields] = useState(dif);
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceType, setEvidenceType] = useState("photo");
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // dif prop her açılışta değişir — controlled input state'ini yeniden senkronlar.
  if (dif && fields?.id !== dif.id) setFields(dif);

  if (!dif) return null;
  const typeMeta = getFindingTypeMeta(dif.type);
  const overdue = isDifOverdue(dif);
  const currentIndex = getDifStageIndex(dif.stage);

  function commitFields() {
    onSaveFields(fields);
  }

  function addEvidence() {
    if (!evidenceName.trim()) return;
    onAddEvidence(dif, { name: evidenceName.trim(), type: evidenceType });
    setEvidenceName("");
  }

  const inputStyle = { background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg h-full overflow-y-auto p-4" style={{ background: theme.surface }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
              <Badge tone="neutral">{getStandardLabel(dif.standard)} — {dif.clauseCode}</Badge>
              {overdue && <Badge tone="danger">Gecikti</Badge>}
            </div>
            <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{dif.description}</p>
          </div>
          <button onClick={onClose} aria-label="Kapat"><X style={{ fontSize: "18px", color: theme.textMuted }} /></button>
        </div>

        <div className="flex items-center justify-between mb-4 mt-3">
          {DIF_STAGES.map((s, i) => (
            <button key={s.value} onClick={() => canManage && onStageChange(dif, s.value)} disabled={!canManage}
              className="flex-1 flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={i <= currentIndex ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textFaint }}>
                {i + 1}
              </div>
              <span className="text-[9px] text-center" style={{ color: i === currentIndex ? theme.textPrimary : theme.textFaint }}>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Sorumlu</label>
            <input disabled={!canManage} value={fields.responsible} onChange={(e) => setFields({ ...fields, responsible: e.target.value })}
              onBlur={commitFields} className="w-full text-sm rounded-lg px-3 py-2 border outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Termin</label>
            <input disabled={!canManage} type="date" value={fields.dueDate || ""} onChange={(e) => setFields({ ...fields, dueDate: e.target.value })}
              onBlur={commitFields} className="w-full text-sm rounded-lg px-3 py-2 border outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Kök Neden</label>
            <textarea disabled={!canManage} value={fields.rootCause} onChange={(e) => setFields({ ...fields, rootCause: e.target.value })}
              onBlur={commitFields} rows={2} className="w-full text-sm rounded-lg px-3 py-2 border outline-none resize-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Düzeltici Faaliyet</label>
            <textarea disabled={!canManage} value={fields.correctiveAction} onChange={(e) => setFields({ ...fields, correctiveAction: e.target.value })}
              onBlur={commitFields} rows={2} className="w-full text-sm rounded-lg px-3 py-2 border outline-none resize-none" style={inputStyle} />
          </div>
        </div>

        <p className="text-xs font-semibold mb-2" style={{ color: theme.textPrimary }}>Kanıt Dosyaları</p>
        {canManage && (
          <div className="flex gap-2 mb-2">
            <input value={evidenceName} onChange={(e) => setEvidenceName(e.target.value)} placeholder="Dosya adı"
              className="flex-1 text-sm rounded-lg px-3 py-2 border outline-none" style={inputStyle} />
            <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} className="text-sm rounded-lg px-2 py-2 border outline-none" style={inputStyle}>
              {EVIDENCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button size="sm" onClick={addEvidence} disabled={!evidenceName.trim()}>Ekle</Button>
          </div>
        )}
        {(dif.evidence || []).length === 0 ? (
          <EmptyState icon={Paperclip} title="Henüz kanıt dosyası yok" />
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {dif.evidence.map((e) => {
              const Icon = TYPE_ICON[e.type] || FileText;
              return (
                <div key={e.id} className="rounded-lg border px-3 py-2 flex items-center gap-2" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
                  <Icon style={{ fontSize: "14px", color: theme.textMuted }} />
                  <span className="text-sm flex-1 truncate" style={{ color: theme.textPrimary }}>{e.name}</span>
                  {canManage && <button onClick={() => setConfirmRemoveId(e.id)} aria-label="Sil"><Trash2 style={{ fontSize: "13px", color: theme.emergencyText }} /></button>}
                </div>
              );
            })}
          </div>
        )}

        {canManage && dif.stage !== "closed" && (
          <Button onClick={() => onStageChange(dif, "closed")} className="w-full flex items-center justify-center gap-1.5">
            <CheckCircle2 style={{ fontSize: "14px" }} /> DİF'i Kapat
          </Button>
        )}

        <ConfirmDialog
          open={confirmRemoveId !== null}
          title="Kanıt dosyasını sil"
          message="Bu kanıt dosyasını kaldırmak istediğine emin misin?"
          confirmLabel="Sil"
          danger
          onConfirm={() => { onRemoveEvidence(dif, confirmRemoveId); setConfirmRemoveId(null); }}
          onCancel={() => setConfirmRemoveId(null)}
        />
      </div>
    </div>
  );
}
