import { useState } from "react";
import { analyzePhotoWithCosmos } from "../services/cosmosVisionService.js";
import { compressImageToDataUrl } from "../utils/imageCompression.js";
import { useTheme } from "../contexts/ThemeContext.jsx";
import Button from "../components/ui/Button.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

/**
 * SADECE TEST — NVIDIA Cosmos3-Nano-Reasoner ile fotoğraf analizi deneme sayfası
 * (bkz. api/cosmos-vision.js, services/cosmosVisionService.js). Sonuç HİÇBİR YERE
 * kaydedilmez; ne Fine-Kinney'e ne Risk Tespiti'ne yazılır, yalnızca ekranda gösterilir.
 * AI karar vermez, öneri sunar — çıktıyı değerlendirmek kullanıcıya aittir.
 */
export default function CosmosVisionTest() {
  useDocumentTitle("Cosmos Vision Testi");
  const { theme } = useTheme();
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      // Yükleme boyutunu (api tarafı ~8MB sınırı) aşmamak için sıkıştırılarak gönderilir.
      const dataUrl = await compressImageToDataUrl(file);
      setPhotoDataUrl(dataUrl);
      const reply = await analyzePhotoWithCosmos({
        imageBase64: dataUrl.split(",")[1],
        mediaType: "image/jpeg",
      });
      setResult(reply);
    } catch (err) {
      console.error("Cosmos Vision testi başarısız:", err);
      setError(err?.message || "Fotoğraf analiz edilemedi.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPhotoDataUrl(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-lg font-bold" style={{ color: theme.textPrimary }}>Cosmos Vision Testi</h1>
        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
          Test amaçlıdır. Sonuç hiçbir kayda dönüştürülmez, yalnızca burada gösterilir.
        </p>
      </div>

      <label
        className="block rounded-lg px-4 py-3 text-sm font-semibold text-center cursor-pointer"
        style={{ background: theme.accent, color: theme.onAccent, opacity: loading ? 0.5 : 1 }}
      >
        {loading ? "Analiz ediliyor…" : "Fotoğraf Seç"}
        <input type="file" accept="image/*" className="hidden" disabled={loading} onChange={handleFileChange} />
      </label>

      {photoDataUrl && (
        <img
          src={photoDataUrl}
          alt="Analiz edilen fotoğraf"
          className="w-full max-h-64 object-contain rounded-lg"
          style={{ border: `1px solid ${theme.border}`, background: theme.surfaceAlt }}
        />
      )}

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: theme.highRiskBg, color: theme.highRiskText }} role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg p-3 text-sm whitespace-pre-wrap" style={{ background: theme.surface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>
          {result}
        </div>
      )}

      {(photoDataUrl || result || error) && !loading && (
        <Button variant="secondary" onClick={handleReset}>Temizle</Button>
      )}
    </div>
  );
}
