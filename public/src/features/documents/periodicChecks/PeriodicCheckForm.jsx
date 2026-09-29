import { useState, useEffect } from "react";
import { CHECK_CATEGORIES, INTERVAL_PRESETS } from "../../../constants/periodicCheck.js";
import { useCompanyOrgLists } from "../../risk-analysis/fineKinney/useCompanyOrgLists.js";
import { todayISO } from "../../../utils/dateUtils.js";
import { validateImageFile } from "../../../utils/fileValidation.js";
import { compressImageToDataUrl } from "../../../utils/imageCompression.js";
import { getPeriodicCheckPhoto } from "../../../services/periodicCheckPhotoService.js";
import PeriodicCheckPhotoField from "./PeriodicCheckPhotoField.jsx";
import Button from "../../../components/ui/Button.jsx";
import { QrCode } from "../../../components/icons/index.jsx";

export const EMPTY_PERIODIC_CHECK_FORM = {
  itemName: "", category: "fireExtinguisher", departmentId: "", lastCheckDate: "", intervalDays: 365, responsible: "", notes: "",
  // QR Kod → Periyodik Kontrol entegrasyonu: qrCode/photoId kalıcı alanlardır (bkz.
  // types/index.js). pendingPhotoDataUrl GEÇİCİDİR — henüz periodicCheckPhotoService'e
  // yazılmamış seçili fotoğrafı tutar, submit anında Panel bunu photoId'ye çevirir
  // (aynı desen: FineKinneyForm.jsx → closurePhotoId).
  qrCode: null, photoId: null, pendingPhotoDataUrl: null,
};

/**
 * @param {{ theme: object, form: object, setForm: (f: object) => void, editingId: number|null, onSubmit: () => void, onCancel: () => void }} props
 */
export default function PeriodicCheckForm({ theme, form, setForm, editingId, onSubmit, onCancel }) {
  const { departments } = useCompanyOrgLists();
  const [existingPhotoPreview, setExistingPhotoPreview] = useState(null);
  const [photoCompressing, setPhotoCompressing] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  // Kayıtta zaten bir fotoğraf varsa (editingId ile açılan formda) önizleme için çözümle.
  useEffect(() => {
    let cancelled = false;
    if (form.photoId && !form.pendingPhotoDataUrl) {
      getPeriodicCheckPhoto(form.photoId).then((p) => {
        if (!cancelled) setExistingPhotoPreview(p?.dataUrl || null);
      });
    } else {
      setExistingPhotoPreview(null);
    }
    return () => { cancelled = true; };
  }, [form.photoId, form.pendingPhotoDataUrl]);

  async function handlePhotoFile(file) {
    setPhotoError(null);
    const { valid, error } = await validateImageFile(file);
    if (!valid) { setPhotoError(error); return; }
    setPhotoCompressing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setForm({ ...form, pendingPhotoDataUrl: dataUrl, photoId: null });
    } catch {
      setPhotoError("Fotoğraf işlenemedi, tekrar deneyin.");
    } finally {
      setPhotoCompressing(false);
    }
  }

  function handleRemovePhoto() {
    setForm({ ...form, pendingPhotoDataUrl: null, photoId: null });
  }

  return (
    <div className="rounded-xl border px-3.5 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      {form.qrCode && (
        <p className="flex items-center gap-1.5 text-[10.5px] font-semibold mb-2" style={{ color: theme.accent }}>
          <QrCode style={{ fontSize: "12px" }} /> QR ile eşleştirildi
        </p>
      )}
      <div className="grid gap-2 mb-2 sm:grid-cols-2">
        <input
          value={form.itemName}
          onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          placeholder="Kontrol edilecek kalem * (örn. Yangın Tüpü — Depo B)"
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
          <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Son Kontrol Tarihi *</span>
          {/* BUG FIX (Sprint 13 QA): max eklendi — "son kontrol tarihi" mantık gereği
              bugünden ileri olamaz; önceden buraya gelecekte bir tarih girilebiliyordu,
              bu da nextDueDate hesaplamasının (bkz. usePeriodicChecks.js) yanıltıcı
              görünmesine yol açardı ("son kontrol: yarın" gibi anlamsız bir durum). */}
          <input type="date" value={form.lastCheckDate} max={todayISO()} onChange={(e) => setForm({ ...form, lastCheckDate: e.target.value })}
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

      <PeriodicCheckPhotoField
        theme={theme}
        photoPreviewUrl={form.pendingPhotoDataUrl || existingPhotoPreview}
        onPhotoFile={handlePhotoFile}
        onRemovePhoto={handleRemovePhoto}
        compressing={photoCompressing}
        photoError={photoError}
      />

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
