// visionAnalysisService — Phase 6 / Vision AI v1. Bir fotoğraftan YAPISAL, ÇOKLU
// tehlike bulgusu üretir. Bu, eski (artık kaldırılmış) tek-tespit fotoğraf akışının
// tek-kategori+not önerisinden daha zengin bir çıktı — bu servis Risk Tespiti
// panelindeki "Fotoğrafla Tespit Et" akışını besler.
//
// ÖNEMLİ — ROADMAP.md Phase 6 kapsamı gereği bugün GERÇEK bir Vision AI API'sine
// BAĞLI DEĞİL. Bilinçli olarak mock/adapter yapısı kullanılıyor. Adapter arayüzü,
// ileride gerçek bir sağlayıcıya (Anthropic/OpenAI Vision) geçilebilecek şekilde
// tasarlandı: dışa açılan tek fonksiyon `analyzePhotoForHazards(file)`, hangi
// adapter'ın çalıştığını geri kalan uygulamaya SIZDIRMAZ.
//
// Gerçek bir adaptere geçiş için (bugün YAPILMADI, yalnızca referans):
//   1. Aynı imzaya sahip yeni bir fonksiyon yaz: (file: File) => Promise<VisionFinding[]>
//      — örn. services/chatService.js → sendPhotoAnalysis() + constants/systemPrompt.js
//      deseninde çoklu-tehlike JSON isteyen yeni bir prompt kullanılabilir.
//   2. Aşağıdaki `activeAdapter` değişkenini yeni fonksiyonla değiştir.
//   3. `VISION_ADAPTER_NAME` sabitini güncelle (UI'daki "mock" etiketi buna bağlı).

import { createId } from "../utils/id.js";

export const VISION_ADAPTER_NAME = "mock-v1";

/**
 * @typedef {Object} VisionFinding
 * @property {string} id
 * @property {string} hazard - Tespit edilen tehlike (kısa başlık)
 * @property {string} description - Açıklama
 * @property {string} category - constants/riskDetection.js → RISK_DETECTION_CATEGORIES key
 * @property {string} recommendedAction - Önerilen önlem
 * @property {string} affected - Etkilenen kişiler
 * @property {string} legislationRef - Mevzuat/kaynak referansı (serbest metin, RAG-lite değil — yalnızca referans alanı)
 * @property {number} confidenceScore - AI güven skoru, 0-100
 */

// Gerçekçi ama sabit bir bulgu havuzu — RISK_DETECTION_CATEGORIES ile birebir eşleşir,
// böylece üretilen bulgular mevcut Risk Tespiti kategori/filtre sistemiyle uyumlu kalır.
const MOCK_FINDING_POOL = [
  {
    hazard: "Kişisel Koruyucu Donanım Eksikliği",
    description: "Fotoğrafta alanda bulunan personelin gerekli KKD'yi (baret/eldiven/gözlük) eksiksiz kullanmadığı görülüyor.",
    category: "ppe",
    recommendedAction: "Alanda KKD kullanım zorunluluğu hatırlatılmalı, giriş noktasında KKD kontrolü sıklaştırılmalı.",
    affected: "Alanda çalışan personel",
    legislationRef: "6331 Sayılı İSG Kanunu — Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Yönetmeliği",
    confidenceRange: [55, 85],
  },
  {
    hazard: "Uygunsuz İstifleme / Depolama",
    description: "Malzemelerin dengesiz ve/veya güvenli yükseklik sınırının üzerinde istiflendiği görülüyor.",
    category: "improperStacking",
    recommendedAction: "İstifleme yüksekliği sınırlandırılmalı, raf/palet kullanımı ve istifleme talimatı gözden geçirilmeli.",
    affected: "Depo çalışanları ve yakın geçiş güzergahındaki personel",
    legislationRef: "İşyeri Bina ve Eklentileri Hakkında Yönetmelik",
    confidenceRange: [50, 80],
  },
  {
    hazard: "Forklift–Yaya Yakınlığı",
    description: "Forklift güzergahı ile yaya yolunun fiziksel olarak ayrılmadığı, aynı alanı paylaştığı görülüyor.",
    category: "forkliftProximity",
    recommendedAction: "Yaya/araç yolları fiziksel bariyerle ayrılmalı, zemin işaretlemesi ve uyarı levhası eklenmeli.",
    affected: "Sahada yürüyen personel",
    legislationRef: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
    confidenceRange: [45, 75],
  },
  {
    hazard: "Düşme / Yüksekte Çalışma Riski",
    description: "Yükseklikte çalışma alanında korkuluk veya güvenlik hattı bulunmadığı görülüyor.",
    category: "fallRisk",
    recommendedAction: "Korkuluk sistemi kurulmalı; korkuluk mümkün değilse çalışan tam vücut kemeri ile hayat hattına bağlanmalı.",
    affected: "Yüksekte çalışan personel",
    legislationRef: "Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği",
    confidenceRange: [60, 90],
  },
  {
    hazard: "Yangın / Duman Belirtisi",
    description: "Görüntüde duman veya olası bir isi kaynağı tespit edildi — sahada doğrulama gerekiyor.",
    category: "fireSmoke",
    recommendedAction: "Alan derhal fiziksel olarak kontrol edilmeli; en yakın yangın söndürme ekipmanının erişilebilirliği doğrulanmalı.",
    affected: "Tüm bina/saha çalışanları",
    legislationRef: "Binaların Yangından Korunması Hakkında Yönetmelik",
    confidenceRange: [40, 70],
  },
  {
    hazard: "Kapalı Alan Girişi",
    description: "Havalandırma veya giriş izni işareti görünmeden kapalı/dar bir alana girildiği görülüyor.",
    category: "confinedSpace",
    recommendedAction: "Kapalı alan çalışma izni prosedürü uygulanmalı, girişten önce gaz ölçümü yapılmalı, gözcü personel bulundurulmalı.",
    affected: "Kapalı alana giren personel",
    legislationRef: "6331 Sayılı İSG Kanunu — Kapalı Alanlarda Çalışmalar Rehberi",
    confidenceRange: [50, 80],
  },
];

// Bağımlılıksız, basit deterministik üretici: aynı dosya (isim+boyut) için her zaman
// aynı bulgu setini üretir — gerçek bir Vision API'nin "aynı fotoğrafa tutarlı analiz"
// davranışını mock ortamda da (rastgele/şaşırtıcı sonuçlar olmadan) taklit eder.
function seededPseudoRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return (h % 1000) / 1000;
  };
}

/**
 * MOCK adapter — gerçek bir görüntü analizi YAPMAZ. Dosya adı/boyutunu tohum olarak
 * kullanıp gerçekçi görünen 1-3 tehlike bulgusu üretir (bkz. dosya başındaki not).
 * @param {File} file
 * @returns {Promise<VisionFinding[]>}
 */
async function mockVisionAdapter(file) {
  await new Promise((resolve) => setTimeout(resolve, 700)); // gerçek bir API çağrısı hissi
  const seed = `${file.name}:${file.size}:${file.lastModified || 0}`;
  const rand = seededPseudoRandom(seed);
  const count = 1 + Math.floor(rand() * 3); // 1-3 arası bulgu
  const shuffled = [...MOCK_FINDING_POOL].sort(() => rand() - 0.5);
  return shuffled.slice(0, count).map((item) => {
    const [min, max] = item.confidenceRange;
    return {
      id: createId(),
      hazard: item.hazard,
      description: item.description,
      category: item.category,
      recommendedAction: item.recommendedAction,
      affected: item.affected,
      legislationRef: item.legislationRef,
      confidenceScore: Math.round(min + rand() * (max - min)),
    };
  });
}

// Aktif adapter — bugün her zaman mock. Bkz. dosya başındaki "gerçek adaptere geçiş" notu.
const activeAdapter = mockVisionAdapter;

/**
 * @param {File} file
 * @returns {Promise<VisionFinding[]>}
 */
export async function analyzePhotoForHazards(file) {
  return activeAdapter(file);
}
