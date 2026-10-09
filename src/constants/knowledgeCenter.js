// Sprint 6: Knowledge Center — kurumsal Bilgi Kütüphanesi modülü.
// Bu dosya YALNIZCA mock veri içerir; backend/gerçek dosya depolama yoktur (Sprint 6 kuralı).
// Kategori anahtarları (key) hem CategoryCard filtrelemesinde hem mock dokümanların
// `category` alanında referans olarak kullanılır.
import { turkishLower } from "../utils/text.js";

export const KNOWLEDGE_CATEGORIES = [
  { key: "legislation", label: "Mevzuat", icon: "Scale", description: "İSG kanun, yönetmelik ve tebliğler" },
  { key: "fineKinney", label: "Fine Kinney", icon: "BarChart3", description: "Risk skorlama yöntemi kılavuzları" },
  { key: "riskAnalysis", label: "Risk Analizleri", icon: "ShieldAlert", description: "Onaylı risk değerlendirme raporları" },
  { key: "periodicChecks", label: "Periyodik Kontroller", icon: "ListChecks", description: "Ekipman/tesisat periyodik kontrol formları" },
  { key: "ppe", label: "KKD", icon: "HardHat", description: "Kişisel koruyucu donanım rehberleri" },
  { key: "emergency", label: "Acil Durum", icon: "AlertTriangle", description: "Acil durum eylem planları ve talimatlar" },
  { key: "training", label: "Eğitim", icon: "BookOpen", description: "Eğitim materyalleri ve sertifikalar" },
  { key: "companyDocs", label: "Firma Dokümanları", icon: "Building2", description: "Firmaya özel politika ve prosedürler" },
];

export const DOCUMENT_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word" },
  { value: "xlsx", label: "Excel" },
  { value: "policy", label: "Politika" },
];

export function getCategoryMeta(key) {
  return KNOWLEDGE_CATEGORIES.find((c) => c.key === key) || null;
}

export function getDocumentTypeLabel(value) {
  return DOCUMENT_TYPES.find((t) => t.value === value)?.label || value;
}

// --- Sprint 7.3: Bilgi Kütüphanesi AI Asistanı + İlgili Dokümanlar ---

// RAG-lite iyileştirmesi (gerçek embedding olmadan): İSG'de sık kullanılan kısaltma/eş
// anlamlı terim grupları. Sorguda bu gruplardan biri geçiyorsa, grubun TÜM üyeleri arama
// terimlerine eklenir — böylece "KKD" arayan biri "kişisel koruyucu donanım" başlıklı
// dokümanı da bulur. Yeni bir terim eklemek istendiğinde buraya bir grup eklemek yeterli;
// findRelevantDocuments başka hiçbir değişiklik gerektirmez.
const SYNONYM_GROUPS = [
  ["kkd", "kişisel koruyucu donanım", "koruyucu ekipman", "koruyucu donanım"],
  ["baret", "kask"],
  ["yangın tüpü", "yangın söndürücü", "söndürücü"],
  ["forklift", "istif makinesi"],
  ["ramak kala", "neredeyse kaza", "atlatılan kaza"],
  ["kimyasal", "tehlikeli madde", "msds"],
  ["gürültü", "işitme kaybı"],
  ["risk analizi", "fine-kinney", "fine kinney", "risk değerlendirmesi"],
  ["elektrik çarpması", "elektrik kaçağı"],
  ["yüksekte çalışma", "düşme riski"],
];

/**
 * @param {string} lowerQuery - turkishLower ile küçültülmüş TAM sorgu metni
 * @param {string[]} queryWords - sorgudan ayrıştırılmış (2 harften uzun) kelimeler
 * @returns {string[]} arama terimleri (kelimeler + eşleşen eş anlamlı grupların üyeleri)
 */
function expandWithSynonyms(lowerQuery, queryWords) {
  const terms = new Set(queryWords);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((term) => lowerQuery.includes(term))) {
      group.forEach((term) => terms.add(term));
    }
  }
  return [...terms];
}

/**
 * Basit anahtar kelime eşleştirmeli erişim (retrieval) — GERÇEK bir vektör/embedding
 * tabanlı arama DEĞİLDİR. Sorudaki her kelimenin (+ eş anlamlı genişletmesinin)
 * başlık/özet/içerik/etikette geçip geçmediğine bakarak puanlar; yeni bağımlılık/backend
 * gerektirmez. AI'ye bağlam olarak verilecek dokümanları seçmek için `useKnowledgeAI.js`
 * tarafından kullanılır.
 *
 * Alan ağırlıklandırması: başlık eşleşmesi > etiket eşleşmesi > özet eşleşmesi > içerik
 * eşleşmesi — bir terimin başlıkta geçmesi, yalnızca uzun içerik metninde bir kez geçmesinden
 * çok daha güçlü bir alaka sinyalidir.
 * @param {string} query
 * @param {object[]} documents
 * @param {number} [maxResults]
 * @returns {object[]}
 */
export function findRelevantDocuments(query, documents, maxResults = 3) {
  const lowerQuery = turkishLower(query);
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
  if (queryWords.length === 0) return [];

  const terms = expandWithSynonyms(lowerQuery, queryWords);

  const scored = documents.map((doc) => {
    const title = turkishLower(doc.title);
    const tags = turkishLower(doc.tags.join(" "));
    const summary = turkishLower(doc.summary);
    const content = turkishLower(doc.content);

    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 3;
      if (tags.includes(term)) score += 2;
      if (summary.includes(term)) score += 1.5;
      if (content.includes(term)) score += 1;
    }
    // Birden fazla kelimeli sorgunun TAMAMI başlıkta birebir geçiyorsa ekstra bonus
    // (örn. "yangın söndürme eğitimi" araması, tam bu başlıklı dokümanı zirveye taşır).
    if (queryWords.length > 1 && title.includes(lowerQuery)) score += 5;

    return { doc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.doc);
}

/**
 * Sayfadaki arama kutusunun eşleştirmesi (başlık + özet + etiket). Sorgu kelimelere bölünür ve
 * HER kelimenin bu üç alanın birleşiminde bir yerde geçmesi yeterlidir — eskiden tüm sorgu tek
 * bir ifade olarak tek bir alanda aranıyordu, bu yüzden "kkd rehber" ya da "eğitim sertifika"
 * gibi çok kelimeli aramalar, kelimelerin ayrı alanlarda (başlık + etiket) geçtiği açıkça ilgili
 * dokümanları bulamıyordu. Boş sorgu her şeyi eşleştirir.
 * @param {object} doc
 * @param {string} query
 * @returns {boolean}
 */
export function matchesDocumentSearch(doc, query) {
  const words = turkishLower(query || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = turkishLower(`${doc.title} ${doc.summary} ${(doc.tags || []).join(" ")}`);
  return words.every((w) => haystack.includes(w));
}

/**
 * Bir dokümanla aynı kategoriyi veya en az bir etiketi paylaşan diğer dokümanları bulur
 * (kendisi hariç). Doküman Detay ekranındaki "İlgili Dokümanlar" bölümü için.
 * @param {object} doc
 * @param {object[]} allDocuments
 * @param {number} [maxResults]
 * @returns {object[]}
 */
export function findRelatedDocuments(doc, allDocuments, maxResults = 3) {
  const scored = allDocuments
    .filter((d) => d.id !== doc.id)
    .map((d) => {
      const sharedTags = d.tags.filter((t) => doc.tags.includes(t)).length;
      const sameCategory = d.category === doc.category ? 1 : 0;
      return { doc: d, score: sharedTags * 2 + sameCategory };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map((s) => s.doc);
}

// Mock doküman kütüphanesi. Gerçek dosya yükleme/indirme bu sürümün kapsamı dışında;
// `content` alanı detay ekranında gösterilecek özet metindir (gerçek belge içeriği değil).
export const MOCK_KNOWLEDGE_DOCUMENTS = [
  {
    id: 1, category: "legislation", type: "pdf", title: "6331 Sayılı İş Sağlığı ve Güvenliği Kanunu",
    summary: "İşyerlerinde İSG yükümlülüklerinin dayanağı olan temel kanun metni.",
    content: "6331 sayılı Kanun, işverenlerin risk değerlendirmesi yapma, önleyici tedbirler alma ve çalışanları eğitme yükümlülüğünü düzenler. Bu belge kanunun işyeri uygulamalarına dair temel maddelerinin özetini içerir.",
    tags: ["kanun", "6331", "yükümlülük"], updatedAt: "2026-01-15", sizeLabel: "1.2 MB",
  },
  {
    id: 2, category: "legislation", type: "pdf", title: "İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği",
    summary: "Risk değerlendirmesi süreç ve sorumluluklarını tanımlayan yönetmelik.",
    content: "Yönetmelik; risk değerlendirmesi ekibinin oluşturulması, tehlike tanımlama, risk analizi ve kontrol tedbirlerinin belirlenmesi süreçlerini adım adım açıklar.",
    tags: ["yönetmelik", "risk değerlendirmesi"], updatedAt: "2025-11-02", sizeLabel: "860 KB",
  },
  {
    id: 3, category: "fineKinney", type: "pdf", title: "Fine-Kinney Yöntemi Uygulama Kılavuzu",
    summary: "Olasılık, Maruziyet ve Şiddet skorlarının nasıl belirleneceğini anlatan kılavuz.",
    content: "Bu kılavuz Fine-Kinney puanlama tablolarını, örnek senaryolarla birlikte açıklar ve risk skoru = Olasılık × Maruziyet × Şiddet formülünün doğru uygulanmasına yardımcı olur.",
    tags: ["fine-kinney", "risk skoru", "kılavuz"], updatedAt: "2026-02-10", sizeLabel: "540 KB",
  },
  {
    id: 4, category: "fineKinney", type: "xlsx", title: "Fine-Kinney Referans Puanlama Tablosu",
    summary: "Olasılık/Maruziyet/Şiddet skalalarının tam referans tablosu.",
    content: "Excel formatında; her skala değeri için standart açıklama ve örnek işyeri senaryoları içerir. Risk Analizi modülündeki puanlama açıklamalarıyla birebir uyumludur.",
    tags: ["tablo", "referans", "excel"], updatedAt: "2026-02-10", sizeLabel: "45 KB",
  },
  {
    id: 5, category: "riskAnalysis", type: "pdf", title: "2025 Yıllık Risk Değerlendirme Özet Raporu",
    summary: "Tüm departmanlardaki onaylı risk analizlerinin yıllık özeti.",
    content: "Rapor; yüksek riskli alanların dağılımını, kapatılan risklerin oranını ve düzeltici faaliyet tamamlanma istatistiklerini içerir.",
    tags: ["rapor", "yıllık", "özet"], updatedAt: "2026-01-05", sizeLabel: "2.1 MB",
  },
  {
    id: 6, category: "riskAnalysis", type: "docx", title: "Risk Analizi Onay Formu Şablonu",
    summary: "Uzman ve işveren onayı için kullanılan standart form şablonu.",
    content: "Şablon; tehlike tanımı, risk skoru, alınacak önlemler ve onay imza alanlarını içeren standart bir yapı sunar.",
    tags: ["şablon", "onay", "form"], updatedAt: "2025-09-20", sizeLabel: "180 KB",
  },
  {
    id: 7, category: "periodicChecks", type: "xlsx", title: "Kaldırma Ekipmanları Periyodik Kontrol Formu",
    summary: "Vinç, forklift gibi kaldırma ekipmanları için periyodik kontrol çizelgesi.",
    content: "Form; kontrol periyodu, sorumlu teknik personel ve bir sonraki kontrol tarihini takip eder.",
    tags: ["periyodik kontrol", "ekipman"], updatedAt: "2026-03-01", sizeLabel: "95 KB",
  },
  {
    id: 8, category: "periodicChecks", type: "pdf", title: "Elektrik Tesisatı Periyodik Kontrol Talimatı",
    summary: "Topraklama ve pano kontrollerinin nasıl yapılacağını anlatan talimat.",
    content: "Talimat, yıllık periyodik kontrol zorunluluğu olan elektrik tesisatı bileşenlerini ve kontrol adımlarını listeler.",
    tags: ["elektrik", "talimat"], updatedAt: "2025-12-18", sizeLabel: "610 KB",
  },
  {
    id: 9, category: "ppe", type: "pdf", title: "KKD Seçim ve Kullanım Rehberi",
    summary: "Baret, eldiven, koruyucu gözlük gibi KKD'lerin doğru seçimi.",
    content: "Rehber; iş türüne göre uygun KKD seçimini, kullanım ömrünü ve bakım koşullarını açıklar.",
    tags: ["kkd", "rehber"], updatedAt: "2025-10-11", sizeLabel: "1.4 MB",
  },
  {
    id: 10, category: "ppe", type: "policy", title: "KKD Zimmet ve Teslim Tutanağı Politikası",
    summary: "Çalışana KKD teslim sürecinin kurumsal politikası.",
    content: "Politika; teslim tutanağının imzalanması, değişim periyodu ve kayıp/hasar durumunda izlenecek süreci tanımlar.",
    tags: ["zimmet", "politika"], updatedAt: "2025-08-30", sizeLabel: "210 KB",
  },
  {
    id: 11, category: "emergency", type: "pdf", title: "Acil Durum Eylem Planı",
    summary: "Yangın, deprem ve tahliye senaryoları için işyeri eylem planı.",
    content: "Plan; toplanma noktalarını, tahliye sorumlularını ve acil durum ekiplerinin görev tanımlarını içerir.",
    tags: ["acil durum", "tahliye", "eylem planı"], updatedAt: "2026-01-22", sizeLabel: "1.8 MB",
  },
  {
    id: 12, category: "emergency", type: "docx", title: "Yangın Tatbikatı Değerlendirme Formu",
    summary: "Tatbikat sonrası performans değerlendirmesi için kullanılan form.",
    content: "Form; tahliye süresini, katılım oranını ve tespit edilen aksaklıkları kayıt altına alır.",
    tags: ["tatbikat", "form", "yangın"], updatedAt: "2025-11-29", sizeLabel: "150 KB",
  },
  {
    id: 13, category: "training", type: "pdf", title: "Temel İSG Eğitimi Sunum Notları",
    summary: "Yeni işe başlayan çalışanlar için zorunlu temel eğitim materyali.",
    content: "Sunum; işyeri tehlikeleri, çalışan hak ve sorumlulukları ile acil durum prosedürlerine giriş niteliğindedir.",
    tags: ["eğitim", "oryantasyon"], updatedAt: "2026-02-01", sizeLabel: "3.4 MB",
  },
  {
    id: 14, category: "training", type: "policy", title: "Yıllık Eğitim Planı ve Sertifika Takip Politikası",
    summary: "Zorunlu eğitimlerin periyodik tekrarı ve sertifika geçerlilik takibi.",
    content: "Politika; hangi eğitimin kaç yılda bir tekrarlanacağını ve sertifika geçerlilik sürelerinin nasıl izleneceğini tanımlar.",
    tags: ["eğitim planı", "sertifika"], updatedAt: "2025-07-14", sizeLabel: "320 KB",
  },
  {
    id: 15, category: "companyDocs", type: "policy", title: "İSG Politikası",
    summary: "Firmanın iş sağlığı ve güvenliği taahhüdünü tanımlayan üst düzey politika belgesi.",
    content: "Politika; üst yönetimin İSG'ye bağlılığını, sürekli iyileştirme taahhüdünü ve çalışan katılımı ilkelerini içerir.",
    tags: ["politika", "taahhüt"], updatedAt: "2025-06-01", sizeLabel: "140 KB",
  },
  {
    id: 16, category: "companyDocs", type: "docx", title: "Organizasyon Şeması ve İSG Sorumlulukları",
    summary: "Firma organizasyon yapısında İSG rol ve sorumluluklarının dağılımı.",
    content: "Belge; işveren, İSG uzmanı, işyeri hekimi ve çalışan temsilcisinin görev tanımlarını ve raporlama hattını gösterir.",
    tags: ["organizasyon", "sorumluluk"], updatedAt: "2025-12-05", sizeLabel: "260 KB",
  },
];
