import { CHECK_CATEGORIES, INTERVAL_PRESETS } from "../../../constants/periodicCheck.js";
import { useCompanyOrgLists } from "../../risk-analysis/fineKinney/useCompanyOrgLists.js";
import Button from "../../../components/ui/Button.jsx";

export const EMPTY_PERIODIC_CHECK_FORM = { itemName: "", category: "fireExtinguisher", departmentId: "", lastCheckDate: "", intervalDays: 365, responsible: "", notes: "" };

/**
 * @param {{ theme: object, form: object, setForm: (f: object) => void, editingId: number|null, onSubmit: () => void, onCancel: () => void }} props
 */
export default function PeriodicCheckForm({ theme, form, setForm, editingId, onSubmit, onCancel }) {
  const { departments } = useCompanyOrgLists();

  return (
    <div className="rounded-xl border px-3.5 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      <div className="grid gap-2 mb-2 sm:grid-cols-2">
        <input
          value={form.itemName}
          onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          placeholder="Kontrol edilecek kalem (örn. Yangın Tüpü — Depo B)"
          className="text-sm rounded-lg px-3 py-2 outline-none border"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
          {CHECK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid gap-2 mb-2 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Son Kontrol Tarihi</span>
          <input type="date" value={form.lastCheckDate} onChange={(e) => setForm({ ...form, lastCheckDate: e.target.value })}
            className="w-full text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
        </label>
        <label className="block">
          <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Kontrol Aralığı</span>
          <select value={form.intervalDays} onChange={(e) => setForm({ ...form, intervalDays: e.target.value })}
            className="w-full text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
            {INTERVAL_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-2 mb-2 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Departman (opsiyonel)</span>
          <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            className="w-full text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
            <option value="">Belirtilmedi</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Sorumlu</span>
          <input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Sorumlu kişi"
            className="w-full text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
        </label>
      </div>

      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Açıklama / not (opsiyonel)" rows={2}
        className="w-full text-sm rounded-lg px-3 py-2 mb-3 outline-none border resize-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Vazgeç</Button>
        <Button onClick={onSubmit} disabled={!form.itemName.trim() || !form.lastCheckDate} className="flex-1">
          {editingId ? "Güncelle" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
