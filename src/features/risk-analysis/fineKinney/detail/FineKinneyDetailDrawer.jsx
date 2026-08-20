import { useState } from "react";
import { X, ShieldAlert, BarChart3, ListChecks, Paperclip, History, StickyNote } from "../../../../components/icons/index.jsx";
import { useFineKinneyDetail } from "./useFineKinneyDetail.js";
import RiskInfoTab from "./tabs/RiskInfoTab.jsx";
import FineKinneyTab from "./tabs/FineKinneyTab.jsx";
import CorrectiveActionsTab from "./tabs/CorrectiveActionsTab.jsx";
import AttachmentsTab from "./tabs/AttachmentsTab.jsx";
import HistoryTab from "./tabs/HistoryTab.jsx";
import NotesTab from "./tabs/NotesTab.jsx";

const TABS = [
  { key: "info", label: "Risk Bilgileri", icon: ShieldAlert },
  { key: "fineKinney", label: "Fine-Kinney", icon: BarChart3 },
  { key: "actions", label: "Düzeltici Faaliyetler", icon: ListChecks },
  { key: "attachments", label: "Ek Dosyalar", icon: Paperclip },
  { key: "history", label: "Risk Geçmişi", icon: History },
  { key: "notes", label: "Notlar", icon: StickyNote },
];

/**
 * Risk kartına tıklandığında açılan sekmeli detay görünümü (Sprint 5A #2).
 * Mevcut Modal.jsx bilinçli olarak KULLANILMADI: o max-w-md ile dar bir onay
 * diyaloğu için tasarlanmış; bu görünüm 6 sekmeli daha geniş bir yüzey gerektiriyor.
 * Modal.jsx'in kendisi hiç değiştirilmedi, başka hiçbir ekranı etkilemez.
 *
 * @param {{ entry: object|null, theme: object, mode: "light"|"dark", onClose: () => void, onEntryUpdated: (updated: object) => void }} props
 */
export default function FineKinneyDetailDrawer({ entry, theme, mode, onClose, onEntryUpdated }) {
  const [tab, setTab] = useState("info");
  const detail = useFineKinneyDetail(entry, onEntryUpdated);

  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="font-[Oswald] text-base uppercase tracking-wide truncate" style={{ color: theme.textPrimary }}>{entry.hazard}</p>
            <p className="text-[11px] truncate" style={{ color: theme.textFaint }}>{entry.risk}</p>
          </div>
          <button onClick={onClose} aria-label="Kapat" className="shrink-0 p-1.5 -m-1.5 rounded-lg">
            <X style={{ fontSize: "18px", color: theme.textMuted }} />
          </button>
        </div>

        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
              style={tab === t.key ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
            >
              <t.icon style={{ fontSize: "12px" }} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "info" && <RiskInfoTab entry={entry} theme={theme} />}
        {tab === "fineKinney" && <FineKinneyTab entry={entry} theme={theme} mode={mode} />}
        {tab === "actions" && (
          <CorrectiveActionsTab
            entry={entry}
            theme={theme}
            onAdd={detail.addCorrectiveAction}
            onUpdate={detail.updateCorrectiveAction}
            onRemove={detail.removeCorrectiveAction}
          />
        )}
        {tab === "attachments" && (
          <AttachmentsTab entry={entry} theme={theme} onAdd={detail.addAttachment} onRemove={detail.removeAttachment} />
        )}
        {tab === "history" && <HistoryTab entry={entry} theme={theme} />}
        {tab === "notes" && <NotesTab entry={entry} theme={theme} onAdd={detail.addNote} />}
      </div>
    </div>
  );
}
