// Fine-Kinney risk assessment method: Risk = Olasılık (Probability) × Maruziyet (Exposure) × Şiddet (Severity)
// Bu dosyadaki ölçek değerleri ve eşikler İSG uzmanlarının kullandığı standart Fine-Kinney referans değerleridir.

// Her seçeneğin `description` alanı, kullanıcının "neden bu puanı seçtiğini" anlaması için
// standart Fine-Kinney referans tablolarındaki tanıma dayanır. Sadece açıklayıcı metindir,
// puanlama mantığını (computeFineKinneyScore) etkilemez.
export const PROBABILITY_SCALE = [
  { value: 0.1, label: "0.1 — Neredeyse imkansız", description: "Teorik olarak mümkün ama pratikte hiç yaşanmamış; gerçekleşme ihtimali sıfıra çok yakın." },
  { value: 0.2, label: "0.2 — Çok düşük", description: "Yalnızca çok istisnai / talihsiz bir kaza zinciriyle gerçekleşebilir." },
  { value: 0.5, label: "0.5 — Düşük", description: "Mümkün ama beklenmedik; benzer ortamlarda nadiren rastlanır." },
  { value: 1, label: "1 — Düşük fakat mümkün", description: "Zaman zaman gerçekleştiği bilinir; sürpriz sayılmaz." },
  { value: 3, label: "3 — Mümkün", description: "Şaşırtıcı olmaz; benzer koşullarda daha önce yaşanmıştır." },
  { value: 6, label: "6 — Yüksek", description: "Beklenen bir sonuç; koşullar bu riski sıkça tetikler." },
  { value: 10, label: "10 — Çok yüksek", description: "Kaçınılmaz kabul edilir; tehlikeli durum sürekli ve doğrudan karşı karşıya kalınır." },
];

export const FREQUENCY_SCALE = [
  { value: 0.5, label: "0.5 — Yılda birkaç kez", description: "Kişi tehlikeye yılda birkaç kez, çok kısa süreliğine maruz kalır." },
  { value: 1, label: "1 — Ayda birkaç kez", description: "Maruziyet ayda birkaç kez, sınırlı sürelerle gerçekleşir." },
  { value: 2, label: "2 — Haftada birkaç kez", description: "Tehlikeli alan/işlemle haftanın birkaç gününde temas vardır." },
  { value: 3, label: "3 — Haftada sürekli", description: "Çalışma haftası boyunca düzenli ve tekrarlı maruziyet söz konusudur." },
  { value: 6, label: "6 — Her gün", description: "Her iş gününde, vardiyanın önemli bir bölümünde maruziyet vardır." },
  { value: 10, label: "10 — Sürekli", description: "Tehlikeye kesintisiz, iş boyunca sürekli maruz kalınır." },
];

export const SEVERITY_SCALE = [
  { value: 1, label: "1 — Önemsiz", description: "İlkyardımla giderilebilecek, iş günü kaybı yaratmayan küçük etki." },
  { value: 3, label: "3 — Hafif yaralanma", description: "Tedavi gerektiren ama kalıcı etkisi olmayan yaralanma." },
  { value: 7, label: "7 — İş günü kaybı", description: "Çalışanın bir veya daha fazla iş günü kaybetmesine yol açan yaralanma." },
  { value: 15, label: "15 — Kalıcı yaralanma", description: "Uzuv kaybı, kalıcı sakatlık veya meslek hastalığı gibi geri dönüşü olmayan hasar." },
  { value: 40, label: "40 — Tek ölüm", description: "Bir çalışanın hayatını kaybetmesiyle sonuçlanabilecek şiddette tehlike." },
  { value: 100, label: "100 — Birden fazla ölüm / Felaket", description: "Birden fazla can kaybı veya tesis çapında felaketle sonuçlanabilecek en üst düzey şiddet." },
];

export const STATUS_OPTIONS = [
  { value: "open", label: "Açık" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "done", label: "Tamamlandı" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Düşük", tone: "success" },
  { value: "medium", label: "Orta", tone: "pending" },
  { value: "high", label: "Yüksek", tone: "warning" },
  { value: "urgent", label: "Acil", tone: "danger" },
];

export function getPriorityMeta(value) {
  return PRIORITY_OPTIONS.find((p) => p.value === value) || PRIORITY_OPTIONS[1];
}

// Risk seviyesi renk paleti — mevcut paylaşılan Badge bileşenine yeni ton eklemeden
// (diğer modülleri etkilememek için) Fine-Kinney'e özel, tema-duyarlı renkler.
// Renk sırası müşteri talebiyle standart Fine-Kinney referans tablosuna (Euronorm.net)
// göre ayarlandı: Risk<20 yeşil, 20-70 mavi, 70-200 sarı, 200-400 turuncu, ≥400 kırmızı.
const RISK_LEVEL_PALETTE = {
  light: {
    low: { bg: "#E1F0E4", text: "#1E7A3D" },       // yeşil
    possible: { bg: "#DCEBFA", text: "#1D5FA8" },  // mavi
    important: { bg: "#FBF2CC", text: "#8A6D00" }, // sarı
    high: { bg: "#FDE4CC", text: "#B85C00" },      // turuncu
    veryHigh: { bg: "#FCE0E0", text: "#B3261E" },  // kırmızı
  },
  dark: {
    low: { bg: "#153322", text: "#6FCB8E" },
    possible: { bg: "#122A40", text: "#7FB6EF" },
    important: { bg: "#332C10", text: "#F2CF4D" },
    high: { bg: "#3A2410", text: "#FFA94D" },
    veryHigh: { bg: "#3C1F1F", text: "#FF6B6B" },
  },
};

/**
 * @param {number} probability
 * @param {number} frequency
 * @param {number} severity
 * @returns {number}
 */
export function computeFineKinneyScore(probability, frequency, severity) {
  return probability * frequency * severity;
}

/**
 * @param {number} score
 * @param {"light"|"dark"} [mode]
 * @returns {{ label: string, description: string, bg: string, text: string, key: string }}
 */
export function getFineKinneyRiskLevel(score, mode = "light") {
  const palette = RISK_LEVEL_PALETTE[mode] || RISK_LEVEL_PALETTE.light;
  if (score < 20) return { key: "low", label: "Düşük Risk", description: "Risk kabul edilebilir düzeyde, rutin takip yeterli.", ...palette.low };
  if (score < 70) return { key: "possible", label: "Olası Risk", description: "Dikkat gerektirir, kontrol tedbirleri gözden geçirilmeli.", ...palette.possible };
  if (score < 200) return { key: "important", label: "Önemli Risk", description: "Düzeltici önlem gerekli, planlı iyileştirme yapılmalı.", ...palette.important };
  if (score < 400) return { key: "high", label: "Yüksek Risk", description: "Acil düzeltme gerekli, kısa sürede önlem alınmalı.", ...palette.high };
  return { key: "veryHigh", label: "Çok Yüksek Risk", description: "İş derhal durdurulmalı, acil müdahale gerekli.", ...palette.veryHigh };
}

// Filtreleme arayüzünde kullanılacak sabit liste (Tümü seçeneğiyle birlikte).
export const RISK_LEVEL_FILTERS = [
  { key: "all", label: "Tümü" },
  { key: "low", label: "Düşük Risk" },
  { key: "possible", label: "Olası Risk" },
  { key: "important", label: "Önemli Risk" },
  { key: "high", label: "Yüksek Risk" },
  { key: "veryHigh", label: "Çok Yüksek Risk" },
];

// --- Sprint 5A: Risk Detay Sayfası eklemeleri -----------------------------------------
// Not: Bu sabitler yalnızca YENİ alt-yapıyı (düzeltici faaliyet listesi, ek dosyalar) besler;
// mevcut tekil action/priority/completionPercent alanları (kart ve dashboard'da kullanılan)
// hiçbir şekilde değiştirilmedi/silinmedi.

export const ATTACHMENT_TYPES = [
  { value: "photo", label: "Fotoğraf", accept: "image/*" },
  { value: "pdf", label: "PDF", accept: "application/pdf" },
  { value: "word", label: "Word", accept: ".doc,.docx" },
  { value: "excel", label: "Excel", accept: ".xls,.xlsx" },
];

export function getAttachmentTypeMeta(value) {
  return ATTACHMENT_TYPES.find((t) => t.value === value) || ATTACHMENT_TYPES[0];
}

// Risk Geçmişi (timeline) akışında kullanılan olay türleri — HistoryTab bunları render eder.
export const HISTORY_EVENT_LABELS = {
  created: "Risk oluşturuldu",
  fineKinneyUpdated: "Fine-Kinney güncellendi",
  statusChanged: "Durum güncellendi",
  attachmentAdded: "Dosya eklendi",
  attachmentRemoved: "Dosya kaldırıldı",
  correctiveActionAdded: "Faaliyet eklendi",
  correctiveActionUpdated: "Faaliyet güncellendi",
  correctiveActionCompleted: "Faaliyet tamamlandı",
  noteAdded: "Not eklendi",
  closed: "Risk kapatıldı",
};
