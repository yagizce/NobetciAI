import { useState } from "react";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, getPriorityMeta } from "../../../../../constants/fineKinney.js";
import Button from "../../../../../components/ui/Button.jsx";
import Badge from "../../../../../components/ui/Badge.jsx";
import EmptyState from "../../../../../components/EmptyState.jsx";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog.jsx";
import AIRegulationSuggestionsPanel from "./AIRegulationSuggestionsPanel.jsx";
import { ListChecks, Trash2, Plus } from "../../../../../components/icons/index.jsx";
import { clampPercent } from "../../../../../utils/numberGuards.js";

const EMPTY_ACTION = { title: "", description: "", responsible: "", dueDate: "", priority: "medium", status: "open", completionPercent: 0 };

/**
 * @param {{ entry: object, theme: object, onAdd: (a: object) => void, onUpdate: (id: number, patch: object) => void, onRemove: (id: number) => void, readOnly?: boolean }} props
 */
export default function CorrectiveActionsTab({ entry, theme, onAdd, onUpdate, onRemove, readOnly = false }) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ACTION);
  // UX FIX (Risk Yönetimi cilası — silme güvenliği): bkz. AttachmentsTab.jsx'teki aynı not
  // — önceden onaysız tek tıkla siliniyordu, uygulamanın diğer tüm silme akışlarıyla
  // tutarlı hale getirildi.
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const actions = entry.correctiveActions || [];

  function submit() {
    if (!form.title.trim()) return;
    onAdd(form);
    setForm(EMPTY_ACTION);
    setFormOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: theme.textFaint }}>Bu riskle ilişkili düzeltici faaliyetler</p>
        {!readOnly && (
          <Button size="sm" variant="secondary" onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1">
            <Plus style={{ fontSize: "12px" }} sw={2.5} /> Faaliyet Ekle
          </Button>
        )}
      </div>

      {!readOnly && <AIRegulationSuggestionsPanel theme={theme} entry={entry} onAdd={onAdd} />}

      {formOpen && !readOnly && (
        <div className="rounded-lg border px-3 py-3 mb-3" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Faaliyet (örn. Korkuluk montajı)"
            className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Açıklama" rows={2}
            className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border resize-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <div className="grid gap-2 mb-2 sm:grid-cols-2">
            <input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Sorumlu"
              className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          </div>
          <div className="grid gap-2 mb-3 sm:grid-cols-2">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
              {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label} Öncelik</option>)}
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setFormOpen(false); setForm(EMPTY_ACTION); }} className="flex-1">Vazgeç</Button>
            <Button onClick={submit} disabled={!form.title.trim()} className="flex-1">Ekle</Button>
          </div>
        </div>
      )}

      {actions.length === 0 ? (
        <EmptyState icon={ListChecks} title="Henüz faaliyet yok" description="Bu risk için bir düzeltici faaliyet ekleyin." />
      ) : (
        <div className="space-y-2">
          {actions.map((a) => {
            const priorityMeta = getPriorityMeta(a.priority);
            const statusLabel = STATUS_OPTIONS.find((s) => s.value === a.status)?.label || a.status;
            return (
              <div key={a.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{a.title}</p>
                  {!readOnly && <button onClick={() => setConfirmRemoveId(a.id)} aria-label="Sil"><Trash2 style={{ fontSize: "13px", color: theme.emergencyText }} /></button>}
                </div>
                {a.description && <p className="text-[11.5px] mb-1.5" style={{ color: theme.textMuted }}>{a.description}</p>}
                <p className="text-[11px] mb-1.5" style={{ color: theme.textFaint }}>
                  {a.responsible || "Sorumlu atanmadı"} {a.dueDate && `• Termin: ${a.dueDate}`}
                </p>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <Badge tone={priorityMeta.tone}>{priorityMeta.label}</Badge>
                  {readOnly ? (
                    <Badge tone="neutral">{statusLabel}</Badge>
                  ) : (
                    <select value={a.status} onChange={(e) => onUpdate(a.id, { status: e.target.value, completionPercent: e.target.value === "done" ? 100 : a.completionPercent })}
                      className="text-[10.5px] rounded-full px-2 py-0.5 outline-none border" style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textMuted }}>
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  )}
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10.5px]" style={{ color: theme.textFaint }}>Tamamlanma</span>
                  {/* HARDENING: bkz. utils/numberGuards.js — bozuk veriyle 0-100 dışına çıkmış
                      bir değer burada yalnızca GÖSTERİM amaçlı sıkıştırılır. */}
                  <span className="text-[10.5px] font-semibold" style={{ color: theme.textPrimary }}>%{clampPercent(a.completionPercent)}</span>
                </div>
                {readOnly ? (
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: theme.surfaceAlt }}>
                    <div className="h-full rounded-full" style={{ width: `${clampPercent(a.completionPercent)}%`, background: theme.accent }} />
                  </div>
                ) : (
                  <input type="range" min="0" max="100" step="5" value={clampPercent(a.completionPercent)}
                    onChange={(e) => onUpdate(a.id, { completionPercent: Number(e.target.value), status: Number(e.target.value) === 100 ? "done" : a.status === "done" ? "in_progress" : a.status })}
                    className="w-full" style={{ accentColor: theme.accent }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmRemoveId !== null}
        title="Faaliyeti sil"
        message="Bu düzeltici faaliyeti silmek istediğine emin misin? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        onConfirm={() => { onRemove(confirmRemoveId); setConfirmRemoveId(null); }}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
}
