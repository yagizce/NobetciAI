import { memo } from "react";

/**
 * Fine-Kinney formundaki Olasılık / Maruziyet / Şiddet (ve Artık Risk karşılıkları) için
 * ortak select + açıklama alanı. Önceden FineKinneyForm.jsx içinde 6 kez neredeyse birebir
 * tekrar eden bloktu — Sprint 5A ile tek bileşene indirildi (Kod Kalitesi maddesi).
 *
 * @param {{
 *   theme: object,
 *   label: string,
 *   value: number|string,
 *   onChange: (value: string) => void,
 *   scale: Array<{ value: number, label: string, description?: string }>,
 *   background?: string,
 * }} props
 */
function ScaleSelectField({ theme, label, value, onChange, scale, background }) {
  const selected = scale.find((o) => String(o.value) === String(value));
  return (
    <label className="block">
      <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs rounded-lg px-2 py-2 outline-none border"
        style={{ background: background || theme.surface, borderColor: theme.border, color: theme.textPrimary }}
      >
        {scale.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {selected?.description && (
        <span className="block text-[10px] mt-1 leading-snug" style={{ color: theme.textFaint }}>{selected.description}</span>
      )}
    </label>
  );
}

export default memo(ScaleSelectField);
