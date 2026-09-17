import { useState, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { validateImageFile } from "../utils/fileValidation.js";
import { analyzePhotoWithCosmos } from "../services/cosmosVisionService.js";
import Button from "../components/ui/Button.jsx";
import { Camera, ImageIcon, AlertTriangle } from "../components/icons/index.jsx";

/**
 * NVIDIA Cosmos3-Nano-Reasoner — SADECE TEST sayfası (bkz. api/cosmos-vision.js →
 * services/cosmosVisionService.js). Amaç: gerçek bir İSG fotoğrafını Cosmos3-Nano-
 * Reasoner'a analiz ettirebildiğimizi doğrulamak — başka hiçbir şey.
 *
 * BİLİNÇLİ SINIRLAMALAR (istek gereği):
 *   - Sonuç HİÇBİR yere kaydedilmez (Fine-Kinney'e bağlanmaz, risk kaydı oluşturmaz,
 *     mevzuat eşleştirmesi yapmaz) — yalnızca bu ekranda, bu oturumda görünür.
 *   - Navigasyon menüsüne (Sidebar/BottomTabBar) bilerek EKLENMEDİ — mevcut UI'a
 *     dokunulmadı, sayfa yalnızca doğrudan /cosmos-vision-test adresinden erişilir.
 *   - Mevcut visionAnalysisService.js (Risk Tespiti panelinin mock adaptörü) ile
 *     HİÇBİR ilişkisi yoktur, o dosyaya dokunulmadı.
 */
export default function CosmosVisionTest() {
  useDocumentTitle("Cosmos3 Test");
  const { theme } = useTheme();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null); // { base64, mediaType }
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const { valid, error: validationError } = await validateImageFile(file);
    if (!valid) {
      showToast(validationError, "error");
      return;
    }

    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPreviewUrl(dataUrl);
      setPendingFile({ base64: dataUrl.split(",")[1], mediaType: file.type || "image/jpeg" });
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!pendingFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const text = await analyzePhotoWithCosmos({ imageBase64: pendingFile.base64, mediaType: pendingFile.mediaType });
      setResult(text);
    } catch (err) {
      console.error("Cosmos3 analiz hatası:", err);
      setError(err.message || "Analiz başarısız oldu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="rounded-xl px-3.5 py-3 mb-4 flex items-start gap-2" style={{ background: theme.warnBg }}>
        <AlertTriangle style={{ fontSize: "16px", color: theme.warnText, flexShrink: 0, marginTop: "2px" }} />
        <p className="text-xs" style={{ color: theme.warnText }}>
          Bu bir <strong>test sayfasıdır</strong>. NVIDIA Cosmos3-Nano-Reasoner'ın gerçek bir İSG fotoğrafını
          analiz edebildiğini doğrulamak içindir. Sonuç hiçbir yere kaydedilmez, risk kaydı veya DİF oluşturmaz.
        </p>
      </div>

      <h1 className="text-lg font-bold mb-1" style={{ color: theme.textPrimary }}>Cosmos3 Vision — Fotoğraf Analizi</h1>
      <p className="text-xs mb-4" style={{ color: theme.textFaint }}>Fotoğraf seç → Analiz Et → AI sonucunu gör.</p>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />

      {!previewUrl ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-10"
          style={{ borderColor: theme.border, color: theme.textFaint }}
        >
          <ImageIcon style={{ fontSize: "28px" }} />
          <span className="text-sm font-semibold">Fotoğraf Seç</span>
        </button>
      ) : (
        <div className="mb-4">
          <img src={previewUrl} alt="Seçilen İSG fotoğrafı" className="w-full rounded-xl object-cover max-h-72" />
          <button onClick={() => fileInputRef.current?.click()} className="text-xs font-semibold mt-2" style={{ color: theme.accent }}>
            Farklı fotoğraf seç
          </button>
        </div>
      )}

      <Button onClick={handleAnalyze} disabled={!pendingFile || loading} className="w-full flex items-center justify-center gap-1.5 mt-2">
        <Camera style={{ fontSize: "14px" }} /> {loading ? "Analiz ediliyor..." : "Analiz Et"}
      </Button>

      {error && (
        <div className="rounded-xl px-3.5 py-3 mt-4" style={{ background: theme.highRiskBg }}>
          <p className="text-xs font-semibold" style={{ color: theme.highRiskText }}>Analiz başarısız</p>
          <p className="text-xs mt-0.5" style={{ color: theme.highRiskText }}>{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-xl border px-3.5 py-3 mt-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>Cosmos3-Nano-Reasoner Sonucu</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: theme.textPrimary }}>{result}</p>
        </div>
      )}
    </div>
  );
}
