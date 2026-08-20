import { useState } from "react";
import { analyzePhotoForHazards } from "../../../services/visionAnalysisService.js";
import { compressImageToDataUrl } from "../../../utils/imageCompression.js";

const MAX_FIELD_LENGTH = 500; // HARDENING: FineKinneyForm.jsx'teki aynı gerekçe — bu alanlar da Fine-Kinney'e köprüleniyor.

/**
 * Phase 6 / Vision AI v1 — bir fotoğraftan çoklu, yapılandırılmış tehlike bulgusu üretir
 * ve kullanıcının onayına sunar. AI SONUCUNU ASLA doğrudan kaydetmez: her bulgu
 * `approved` bayrağıyla başlar (varsayılan true — "seçili" anlamında, ama kaydetme yine
 * de ayrı bir kullanıcı eylemiyle, RiskDetectionPanel.jsx'teki "Seçilenleri Ekle"
 * butonuyla tetiklenir), kullanıcı her alanı düzenleyebilir ve istediğini işaretini
 * kaldırıp dışarıda bırakabilir.
 *
 * @returns {{
 *   analyzing: boolean, error: string|null,
 *   photoDataUrl: string|null, findings: Array<import("../../../services/visionAnalysisService.js").VisionFinding & {approved: boolean}>,
 *   analyze: (file: File) => Promise<void>,
 *   updateFinding: (id: string, patch: object) => void,
 *   toggleFinding: (id: string) => void,
 *   reset: () => void,
 * }}
 */
export function useVisionFindings() {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [findings, setFindings] = useState([]);

  async function analyze(file) {
    setAnalyzing(true);
    setError(null);
    setFindings([]);
    try {
      // DEPOLAMA OPTİMİZASYONU: ham dosya (telefon kamerası tipik olarak 3-5MB) yerine
      // küçültülmüş/sıkıştırılmış bir data URL kullanılıyor — bu hem önizlemede hem de
      // onaylandığında IndexedDB'ye TEK SEFER yazılacak fotoğrafta kullanılır (bkz.
      // RiskDetectionPanel.jsx → handleConfirmFindings, riskDetectionPhotoService.js).
      // Sıkıştırma başarısız olursa (ör. eski bir tarayıcı) ham dosyaya geri dönülür —
      // analiz akışı bu yüzden tamamen durmaz.
      let dataUrl;
      try {
        dataUrl = await compressImageToDataUrl(file);
      } catch (compressionErr) {
        console.warn("Fotoğraf sıkıştırılamadı, ham dosya kullanılıyor:", compressionErr);
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Dosya okunamadı"));
          reader.readAsDataURL(file);
        });
      }
      setPhotoDataUrl(dataUrl);

      const results = await analyzePhotoForHazards(file);
      setFindings(
        results.map((f) => ({
          ...f,
          description: (f.description || "").slice(0, MAX_FIELD_LENGTH),
          recommendedAction: (f.recommendedAction || "").slice(0, MAX_FIELD_LENGTH),
          affected: (f.affected || "").slice(0, MAX_FIELD_LENGTH),
          legislationRef: (f.legislationRef || "").slice(0, MAX_FIELD_LENGTH),
          approved: true,
        }))
      );
    } catch (err) {
      console.error("Vision analizi başarısız:", err);
      setError("Detaylı fotoğraf analizi oluşturulamadı. Tekrar deneyebilir veya tespiti manuel ekleyebilirsin.");
    } finally {
      setAnalyzing(false);
    }
  }

  function updateFinding(id, patch) {
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function toggleFinding(id) {
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, approved: !f.approved } : f)));
  }

  function reset() {
    setPhotoDataUrl(null);
    setFindings([]);
    setError(null);
  }

  return { analyzing, error, photoDataUrl, findings, analyze, updateFinding, toggleFinding, reset };
}
