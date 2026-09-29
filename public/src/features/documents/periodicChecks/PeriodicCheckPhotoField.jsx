import { useRef } from "react";
import { Camera, ImageIcon, X } from "../../../components/icons/index.jsx";

/**
 * QR Kod → Periyodik Kontrol entegrasyonu. `ClosureEvidenceFields.jsx` (Fine-Kinney)
 * ile AYNI kamera/galeri yakalama deseni, ama daha basit: burada fotoğraf HER ZAMAN
 * opsiyoneldir (kapanış kanıtındaki gibi zorunluluk kontrolü yok) ve not alanı yok —
 * yalnızca "kontrolü yaparken çekilen fotoğraf" (örn. basınç göstergesi okuması).
 *
 * @param {{
 *   theme: object, photoPreviewUrl: string|null, onPhotoFile: (file: File) => void,
 *   onRemovePhoto: () => void, compressing: boolean, photoError: string|null,
 * }} props
 */
export default function PeriodicCheckPhotoField({ theme, photoPreviewUrl, onPhotoFile, onRemovePhoto, compressing, photoError }) {
  const photoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPhotoFile(file);
  }

  return (
    <div className="mb-2">
      <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Kontrol Fotoğrafı (opsiyonel — örn. basınç göstergesi)</span>

      {photoPreviewUrl ? (
        <div className="flex items-center gap-2">
          <img src={photoPreviewUrl} alt="Kontrol fotoğrafı" className="rounded-lg border" style={{ width: 64, height: 64, objectFit: "cover", borderColor: theme.border }} />
          <button onClick={onRemovePhoto} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: theme.textFaint }}>
            <X style={{ fontSize: "12px" }} /> Kaldır
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={compressing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50"
            style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
          >
            <Camera style={{ fontSize: "13px" }} /> {compressing ? "İşleniyor..." : "Fotoğraf Çek"}
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={compressing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50"
            style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
          >
            <ImageIcon style={{ fontSize: "13px" }} /> Galeriden Seç
          </button>
        </div>
      )}
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
      {photoError && <p className="text-[10.5px] mt-1" style={{ color: theme.emergencyText }}>{photoError}</p>}
    </div>
  );
}
