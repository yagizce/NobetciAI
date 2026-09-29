import { memo } from "react";
import { getCategoryLabel, getCheckStatusStyle } from "../../../constants/periodicCheck.js";
import { Trash2, CheckCircle2, QrCode } from "../../../components/icons/index.jsx";

/**
 * @param {{ check: object, theme: object, departmentName?: string, onOpenDetail: (check: object) => void, onEdit: (check: object) => void, onDelete: (id: number) => void, onMarkChecked: (id: number) => void, selected?: boolean, onToggleSelect?: (id: number) => void }} props
 */
function PeriodicCheckCard({ check, theme, departmentName, onOpenDetail, onEdit, onDelete, onMarkChecked, selected = false, onToggleSelect }) {
  const statusStyle = getCheckStatusStyle(check.status, theme);
  const needsAttention = check.status === "overdue" || check.status === "upcoming";

  // Sprint 7.2.3: kart artık tıklanabilir (Kontrol Detayı ekranını açar) — kart içindeki
  // aksiyon butonları stopPropagation ile bu davranışı ezmiyor.
  function stop(e, fn) {
    e.stopPropagation();
    fn();
  }

  return (
    <div
      onClick={() => onOpenDetail(check)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpenDetail(check); }}
      className="rounded-xl border px-3.5 py-3 cursor-pointer"
      style={selected ? { borderColor: theme.accent, background: theme.surfaceAlt } : { borderColor: theme.border, background: theme.surface }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-2 min-w-0">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={selected}
              onClick={(e) => stop(e, () => onToggleSelect(check.id))}
              onChange={() => {}} // onClick zaten değişimi yönetiyor; React'in "controlled input needs onChange" uyarısını susturur
              className="mt-0.5 shrink-0"
              aria-label={`${check.itemName} seç`}
            />
          )}
          <p className="text-sm font-semibold leading-snug min-w-0 break-words" style={{ color: theme.textPrimary }}>{check.itemName}</p>
          {/* QR Kod → Periyodik Kontrol: bu ekipman bir QR etiketine bağlıysa küçük bir
              rozetle işaretlenir — "üstünde QR olan şeyleri kolayca takip edebilme" isteği. */}
          {check.qrCode && <QrCode style={{ fontSize: "12px", color: theme.textFaint }} className="shrink-0 mt-0.5" />}
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0" style={{ background: statusStyle.bg, color: statusStyle.text }}>
          {statusStyle.label}
        </span>
      </div>
      <p className="text-xs mb-1.5" style={{ color: theme.textMuted }}>
        {getCategoryLabel(check.category)}{departmentName ? ` • ${departmentName}` : ""}
      </p>
      <div className="text-[11px] flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: theme.textFaint }}>
        <span>Son kontrol: {check.lastCheckDate}</span>
        <span>Sonraki: {check.nextDueDate}</span>
        {check.responsible && <span>Sorumlu: {check.responsible}</span>}
      </div>
      {check.notes && <p className="text-[11px] mt-1.5" style={{ color: theme.textMuted }}>{check.notes}</p>}
      <div className="flex items-center gap-2 mt-2 flex-wrap -mx-2 -mb-1">
        <button onClick={(e) => stop(e, () => onEdit(check))} className="text-[11px] font-semibold px-2 py-1.5" style={{ color: theme.accent }}>Düzenle</button>
        <button onClick={(e) => stop(e, () => onDelete(check.id))} className="text-[11px] font-semibold flex items-center gap-0.5 px-2 py-1.5" style={{ color: theme.emergencyText }}>
          <Trash2 style={{ fontSize: "11px" }} /> Sil
        </button>
        {needsAttention && (
          <button onClick={(e) => stop(e, () => onMarkChecked(check.id))} className="text-[11px] font-semibold flex items-center gap-0.5 ml-auto px-2 py-1.5" style={{ color: theme.successText }}>
            <CheckCircle2 style={{ fontSize: "12px" }} /> Bugün Kontrol Edildi
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(PeriodicCheckCard);
