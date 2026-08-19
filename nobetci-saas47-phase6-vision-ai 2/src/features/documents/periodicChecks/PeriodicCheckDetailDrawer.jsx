import Modal from "../../../components/ui/Modal.jsx";
import Button from "../../../components/ui/Button.jsx";
import { getCategoryLabel, getCheckStatusStyle } from "../../../constants/periodicCheck.js";
import { Trash2, CheckCircle2 } from "../../../components/icons/index.jsx";

function InfoRow({ theme, label, value }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b last:border-b-0" style={{ borderColor: theme.border }}>
      <p className="text-[10.5px] mb-0.5" style={{ color: theme.textFaint }}>{label}</p>
      <p className="text-sm" style={{ color: theme.textPrimary }}>{value}</p>
    </div>
  );
}

/**
 * Sprint 7.2.3 — "Kontrol Detayı" ekranı. Önceden bu bilgiler yalnızca kartın küçük
 * yazı alanında sıkışık gösteriliyordu; artık tıklanınca ayrı, okunaklı bir detay
 * ekranı (mevcut `Modal.jsx` — projedeki tüm detay ekranlarıyla aynı bileşen) açılıyor.
 *
 * @param {{
 *   theme: object, check: object|null, departmentName?: string, onClose: () => void,
 *   onEdit: (check: object) => void, onDelete: (id: number) => void, onMarkChecked: (id: number) => void,
 * }} props
 */
export default function PeriodicCheckDetailDrawer({ theme, check, departmentName, onClose, onEdit, onDelete, onMarkChecked }) {
  if (!check) return null;
  const statusStyle = getCheckStatusStyle(check.status, theme);
  const needsAttention = check.status === "overdue" || check.status === "upcoming";

  return (
    <Modal open={Boolean(check)} onClose={onClose} title="Kontrol Detayı">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-base font-semibold leading-snug" style={{ color: theme.textPrimary }}>{check.itemName}</p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0" style={{ background: statusStyle.bg, color: statusStyle.text }}>
          {statusStyle.label}
        </span>
      </div>

      <div className="mb-3">
        <InfoRow theme={theme} label="Ekipman" value={check.itemName} />
        <InfoRow theme={theme} label="Kontrol Türü" value={getCategoryLabel(check.category)} />
        {departmentName && <InfoRow theme={theme} label="Departman" value={departmentName} />}
        <InfoRow theme={theme} label="Son Kontrol" value={check.lastCheckDate ? new Date(check.lastCheckDate).toLocaleDateString("tr-TR") : ""} />
        <InfoRow theme={theme} label="Sonraki Kontrol" value={check.nextDueDate ? new Date(check.nextDueDate).toLocaleDateString("tr-TR") : ""} />
        <InfoRow theme={theme} label="Sorumlu" value={check.responsible} />
        <InfoRow theme={theme} label="Açıklama" value={check.notes} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {needsAttention && (
          <Button size="sm" onClick={() => onMarkChecked(check.id)} className="flex items-center gap-1.5">
            <CheckCircle2 style={{ fontSize: "13px" }} /> Bugün Kontrol Edildi
          </Button>
        )}
        <button onClick={() => onEdit(check)} className="text-[11px] font-semibold px-2 py-1.5" style={{ color: theme.accent }}>Düzenle</button>
        <button onClick={() => onDelete(check.id)} className="text-[11px] font-semibold flex items-center gap-0.5 px-2 py-1.5 ml-auto" style={{ color: theme.emergencyText }}>
          <Trash2 style={{ fontSize: "11px" }} /> Sil
        </button>
      </div>
    </Modal>
  );
}
