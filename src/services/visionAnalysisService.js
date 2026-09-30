// visionAnalysisService — Phase 6 / Vision AI. Bir fotoğraftan YAPISAL, ÇOKLU tehlike
// bulgusu üretir; Risk Tespiti panelindeki "Fotoğrafla Tespit Et" akışını besler.
//
// GERÇEK MODELE BAĞLI: fotoğraf sıkıştırılıp /api/cosmos-vision proxy'sine (mode "findings",
// bkz. api/cosmos-vision.js — NVIDIA_API_KEY sunucuda kalır) gönderilir; model yalnızca
// RISK_DETECTION_CATEGORIES kategorilerine uyan, görüntüde görülen tehlikeleri JSON olarak
// döndürür. Dışa açılan tek fonksiyon `analyzePhotoForHazards(file)` — imzası önceki mock
// adapter ile aynı, bu yüzden çağıran taraf (useVisionFindings.js) değişmedi.
//
// AI SONUCU ASLA doğrudan kaydedilmez: bulgular kullanıcı onayına sunulur (bkz.
// useVisionFindings.js / VisionFindingsPanel.jsx). Model çıktısına GÜVENİLMEZ: burada
// ayrıştırılır, geçersiz kategoriler/alanlar elenir, güven skoru 0-100'e sıkıştırılır.

import { createId } from "../utils/id.js";
import { compressImageToDataUrl } from "../utils/imageCompression.js";
import { analyzePhotoWithCosmos } from "./cosmosVisionService.js";
import { RISK_DETECTION_CATEGORIES } from "../constants/riskDetection.js";

export const VISION_ADAPTER_NAME = "nvidia-vision-v1";

const MAX_FINDINGS = 4;
const VALID_CATEGORIES = new Set(RISK_DETECTION_CATEGORIES.map((c) => c.value));

/**
 * @typedef {Object} VisionFinding
 * @property {string} id
 * @property {string} hazard - Tespit edilen tehlike (kısa başlık)
 * @property {string} description - Açıklama
 * @property {string} category - constants/riskDetection.js → RISK_DETECTION_CATEGORIES key
 * @property {string} recommendedAction - Önerilen önlem
 * @property {string} affected - Etkilenen kişiler
 * @property {string} legislationRef - Mevzuat/kaynak referansı (serbest metin; model emin değilse BOŞ olabilir)
 * @property {number} confidenceScore - AI güven skoru, 0-100
 */

function str(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeFinding(item) {
  if (!item || typeof item !== "object") return null;
  const category = str(item.category);
  if (!VALID_CATEGORIES.has(category)) return null; // bilinmeyen kategori → bulguyu ele
  const description = str(item.description);
  const hazard = str(item.hazard) || description;
  if (!hazard || !description) return null;
  const rawScore = Number(item.confidenceScore);
  // Güven skoru sağlanmamışsa/sayı değilse "belirsiz/orta" (50) varsayılır.
  const confidenceScore = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, Math.round(rawScore))) : 50;
  return {
    id: createId(),
    hazard,
    description,
    category,
    recommendedAction: str(item.recommendedAction),
    affected: str(item.affected),
    legislationRef: str(item.legislationRef),
    confidenceScore,
  };
}

/**
 * Modelin ham metin yanıtından bulgu listesini çıkarır. `<think>` blokları ve markdown
 * çitleri temizlenir, ilk `[` ile son `]` arası JSON olarak okunur. Geçerli bir dizi
 * bulunamazsa hata fırlatır (boş dizi geçerlidir: "tehlike görülmedi").
 * @param {string} text
 * @returns {VisionFinding[]}
 */
export function parseVisionFindings(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("AI boş yanıt döndürdü.");
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("AI yanıtı bulgu listesi içermiyor.");
  let parsed;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("AI yanıtı ayrıştırılamadı.");
  }
  if (!Array.isArray(parsed)) throw new Error("AI yanıtı beklenen formatta değil.");
  return parsed.slice(0, MAX_FINDINGS).map(normalizeFinding).filter(Boolean);
}

async function nvidiaVisionAdapter(file) {
  const dataUrl = await compressImageToDataUrl(file);
  const text = await analyzePhotoWithCosmos({
    imageBase64: dataUrl.split(",")[1],
    mediaType: "image/jpeg",
    mode: "findings",
  });
  return parseVisionFindings(text);
}

/**
 * @param {File} file
 * @returns {Promise<VisionFinding[]>}
 */
export async function analyzePhotoForHazards(file) {
  return nvidiaVisionAdapter(file);
}
