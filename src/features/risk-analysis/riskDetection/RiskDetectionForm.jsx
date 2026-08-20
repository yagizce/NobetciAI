import { useState } from "react";
import { RISK_DETECTION_CATEGORIES, MOCK_DETECTION_LOCATIONS } from "../../../constants/riskDetection.js";
import { useCompanyOrgLists } from "../fineKinney/useCompanyOrgLists.js";
import Button from "../../../components/ui/Button.jsx";

// HARDENING: FineKinneyForm.jsx'teki aynı gerekçeyle (bkz. o dosyadaki not).
const MAX_LOCATION_LENGTH = 300;
const MAX_NOTE_LENGTH = 1000;

/**
 * "Yeni Tespit Ekle" — kamera henüz olmadığı için Uzman/İşveren'in sahada gördüğü bir
 * tehlikeyi manuel olarak, gerçek kamera tespiti ile AYNI veri modeline (kategori +
 * konum) girebilmesi içindir. Bilinçli olarak Fine-Kinney formu kadar detaylı DEĞİL —
 * bu yalnızca bir triage kaydı, ayrıntı Fine-Kinney'e dönüştürülünce girilir.
 *
 * Fotoğraf tabanlı tespit artık ayrı bir akış (bkz. VisionFindingsPanel.jsx — Phase 6
 * Vision AI v1); bu form yalnızca saf manuel girişten sorumlu.
 *
 * @param {{
 *   theme: object,
 *   onSubmit: (category: string, location: string, departmentId: string|null, extra?: {hazardNote?: string, source?: string}) => void,
 *   onCancel: () => void,
 *   isSubmitting?: boolean,
 * }} props
 */
export default function RiskDetectionForm({ theme, onSubmit, onCancel, isSubmitting = false }) {
  const { departments } = useCompanyOrgLists();
  const [category, setCategory] = useState(RISK_DETECTION_CATEGORIES[0].value);
  const [location, setLocation] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [hazardNote, setHazardNote] = useState("");

  function handleSubmit() {
    if (!location.trim()) return;
    onSubmit(category, location.trim(), departmentId || null, {
      hazardNote: hazardNote.trim(),
      source: "manual",
    });
  }

  return (
    <div className="rounded-xl border px-3.5 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      <div className="grid gap-2 mb-2 sm:grid-cols-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
          {RISK_DETECTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          list="risk-detection-locations"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Konum (örn. Depo B — Giriş)"
          maxLength={MAX_LOCATION_LENGTH}
          className="text-sm rounded-lg px-3 py-2 outline-none border"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        />
        <datalist id="risk-detection-locations">
          {MOCK_DETECTION_LOCATIONS.map((loc) => <option key={loc} value={loc} />)}
        </datalist>
      </div>

      <label className="block mb-2">
        <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Not (opsiyonel)</span>
        <textarea value={hazardNote} onChange={(e) => setHazardNote(e.target.value)} rows={2} maxLength={MAX_NOTE_LENGTH}
          placeholder="Tespitle ilgili kısa bir not..."
          className="w-full text-sm rounded-lg px-3 py-2 outline-none border resize-y" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
      </label>

      <label className="block mb-3">
        <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Departman (opsiyonel)</span>
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
          className="w-full text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
          <option value="">Belirtilmedi</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </label>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">Vazgeç</Button>
        <Button onClick={handleSubmit} disabled={!location.trim() || isSubmitting} className="flex-1">{isSubmitting ? "Ekleniyor..." : "Ekle"}</Button>
      </div>
    </div>
  );
}
