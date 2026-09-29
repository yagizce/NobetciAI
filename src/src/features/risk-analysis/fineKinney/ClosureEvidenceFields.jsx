import { useRef } from "react";
import { Camera, ImageIcon, X } from "../../../components/icons/index.jsx";

/**
 * Düzeltici Faaliyet Kanıt Zorunluluğu sprinti — bir Fine-Kinney kaydı "Kapandı"
 * işaretlenirken gösterilir. Not ve/veya fotoğraftan en az biri girilmeden kayıt
 * kapatılamaz (zorunluluk kontrolü FineKinneyForm.jsx'te — burası yalnızca UI).
 *
 * Fotoğraf seçimi/sıkıştırması FineKinneyForm'da yapılır (compressImageToDataUrl,
 * aynı utils/imageCompression.js — bkz. RiskDetectionPanel.jsx'teki kullanım), bu
 * bileşen yalnızca zaten hazır bir data URL'i önizler.
 *
 * @param {{
 *   theme: object,
 *   note: string,
 *   onNoteChange: (v: string) => void,
 *   photoPreviewUrl: string|null,
 *   onPhotoFile: (file: File) => void,
 *   onRemovePhoto: () => void,
 *   compressing: boolean,
 *   photoError: string|null,
 *   showRequiredHint: boolean,
 * }} props
 */
export default function ClosureEvidenceFields({
  theme, note, onNoteChange, photoPreviewUrl, onPhotoFile, onRemovePhoto, compressing, photoError, showRequiredHint,
}) {
  const photoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPhotoFile(file);
  }

  return (
    <div className="rounded-lg px-3 py-3 mb-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
      <p className="text-xs font-semibold mb-1" style={{ color: theme.textPrimary }}>Kapanış Kanıtı</p>
      <p className="text-[10.5px] mb-2" style={{ color: theme.textFaint }}>
        Bu tehlike düzeltildi mi? Bir not ve/veya fotoğraf ekleyin — ikisinden en az biri gerekir. Bu kanıt Denetim Dosyası'nda gösterilir.
      </p>

      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Örn. Korkuluk monte edildi, KKD dağıtımı yapıldı..."
        rows={2}
        maxLength={500}
        className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border resize-none"
        style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
      />

      {photoPreviewUrl ? (
        <div className="flex items-center gap-2 mb-1">
          <img src={photoPreviewUrl} alt="Kapanış kanıtı" className="rounded-lg border" style={{ width: 64, height: 64, objectFit: "cover", borderColor: theme.border }} />
          <button onClick={onRemovePhoto} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: theme.textFaint }}>
            <X style={{ fontSize: "12px" }} /> Kaldır
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap mb-1">
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
      {showRequiredHint && !note.trim() && !photoPreviewUrl && (
        <p className="text-[10.5px] mt-1" style={{ color: theme.highRiskText }}>Kapatmak için not veya fotoğraftan en az biri gerekli.</p>
      )}
    </div>
  );
}
