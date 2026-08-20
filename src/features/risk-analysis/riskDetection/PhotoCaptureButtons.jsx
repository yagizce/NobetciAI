import { useRef } from "react";
import Button from "../../../components/ui/Button.jsx";
import { Plus, Camera, ImageIcon } from "../../../components/icons/index.jsx";

/**
 * Risk Tespiti panelinin üst eylem satırı: fotoğraf yakalama/seçme + "Yeni Tespit
 * Ekle". RiskDetectionPanel.jsx'ten ayrıştırıldı (temizlik turu) — panel dosyasını
 * küçültmek dışında bir davranış değişikliği YOK.
 *
 * Mobil iyileştirme (Phase 6): iki ayrı buton — "Fotoğraf Çek" doğrudan kamerayı açar
 * (capture="environment"), "Galeriden Seç" ise dosya seçiciyi capture olmadan açarak
 * bazı mobil tarayıcılarda kamera zorlaması yerine doğrudan galeriye erişim sağlar.
 * Yeni bir kamera SİSTEMİ değil, iki standart <input type="file"> varyantı.
 *
 * @param {{
 *   theme: object,
 *   analyzing: boolean,
 *   formOpen: boolean,
 *   onPhotoFile: (file: File) => void,
 *   onToggleForm: () => void,
 * }} props
 */
export default function PhotoCaptureButtons({ theme, analyzing, formOpen, onPhotoFile, onToggleForm }) {
  const photoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosyanın tekrar seçilebilmesi için input'u sıfırla
    if (file) onPhotoFile(file);
  }

  return (
    <div className="flex items-center justify-end gap-2 mb-3 flex-wrap">
      <button
        onClick={() => photoInputRef.current?.click()}
        disabled={analyzing}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50"
        style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
      >
        <Camera style={{ fontSize: "13px" }} /> Fotoğraf Çek
      </button>
      <button
        onClick={() => galleryInputRef.current?.click()}
        disabled={analyzing}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50"
        style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
      >
        <ImageIcon style={{ fontSize: "13px" }} /> Galeriden Seç
      </button>
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
      <Button size="sm" onClick={onToggleForm} className="flex items-center gap-1.5">
        <Plus style={{ fontSize: "13px" }} sw={2.5} /> Yeni Tespit Ekle
      </Button>
    </div>
  );
}
