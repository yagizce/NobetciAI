import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import Badge from "../../components/ui/Badge.jsx";
import {
  EVIDENCE_TYPES, getEvidenceTypeLabel, computeEvidenceStatus, getEvidenceStatusMeta,
} from "../../utils/criterionEvidence.js";
import { Plus, Trash2 } from "../../components/icons/index.jsx";

/**
 * Kriter bazlı "Kanıtlar" bölümü — AuditDetailDrawer.jsx'in mevzuat-dayanağı
 * kutusu içinde, YALNIZCA `item.expectedEvidence` dolu kriterlerde (İSG Mevzuat)
 * render edilir. Her checklist maddesi için ayrı bir bileşen olmasının nedeni:
 * ekleme formunun kendi yerel state'i (seçili tür/açıklama) var, bunu
 * AuditDetailDrawer'ın map döngüsü içine koşullu hook olarak yazamayız.
 *
 * Kanıt ekleme/silme SADECE `evidence` alanını patch'ler — `result` alanına
 * KESİNLİKLE dokunmaz (bkz. utils/criterionEvidence.js dosya başı notu).
 *
 * @param {{ item: object, editable: boolean, onAdd: (type: string, description: string) => void,
 *   onRemove: (evidenceId: string) => void }} props
 */
export default function CriterionEvidenceSection({ item, editable, onAdd, onRemove }) {
  const { theme } = useTheme();
  const [type, setType] = useState(EVIDENCE_TYPES[0].value);
  const [description, setDescription] = useState("");

  const status = computeEvidenceStatus(item.evidence, item);
  const statusMeta = getEvidenceStatusMeta(status);

  function submit() {
    onAdd(type, description);
    setDescription("");
  }

  return (
    <div className="mt-2 pt-2" style={{ borderTop: `1px dashed ${theme.border}` }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10.5px] font-semibold" style={{ color: theme.textMuted }}>Kanıtlar</p>
        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
      </div>

      {(item.evidence || []).length === 0 ? (
        <p className="text-[10.5px] mb-1.5" style={{ color: theme.textFaint }}>Henüz kanıt eklenmedi.</p>
      ) : (
        <div className="flex flex-col gap-1 mb-1.5">
          {item.evidence.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 rounded px-2 py-1" style={{ background: theme.surface }}>
              <span className="text-[10.5px] truncate" style={{ color: theme.textPrimary }}>
                <strong>{getEvidenceTypeLabel(e.type)}</strong>{e.description ? `: ${e.description}` : ""}
              </span>
              {editable && (
                <button onClick={() => onRemove(e.id)} aria-label="Kanıtı sil" className="shrink-0">
                  <Trash2 style={{ fontSize: "11px", color: theme.emergencyText }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && (
        <div className="flex items-center gap-1.5">
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="text-[10.5px] rounded-md px-1.5 py-1 border outline-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
            {EVIDENCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Açıklama (opsiyonel)"
            className="flex-1 text-[10.5px] rounded-md px-2 py-1 border outline-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <button onClick={submit} className="shrink-0 flex items-center gap-0.5 text-[10.5px] font-semibold px-2 py-1 rounded-md" style={{ background: theme.accent, color: theme.onAccent }}>
            <Plus style={{ fontSize: "10px" }} /> Ekle
          </button>
        </div>
      )}
    </div>
  );
}
