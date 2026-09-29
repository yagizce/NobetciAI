// Denetim Dosyası — Zorunlu Belge Durumu için temel (baseline) belge listesi.
//
// BİLİNÇLİ SINIRLAMA / UYARI: Bu liste, hemen hemen her işyerinde denetimde sorulan
// İKİ temel belgeyle sınırlı tutuldu — Risk Değerlendirme Raporu ve Acil Durum Planı.
// Bunlar 6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamında GENEL OLARAK beklenir,
// ama tehlike sınıfı, çalışan sayısı ve sektöre göre ek zorunlu belgeler (İSG Kurulu
// tutanağı, Yıllık Değerlendirme Raporu, KKD Risk Değerlendirmesi vb.) değişebilir.
// Bu liste bir HUKUKİ TAM LİSTE DEĞİLDİR — işverenin/İSG uzmanının kendi sektörüne
// özgü ek zorunlulukları ayrıca değerlendirmesi gerekir. Buradaki amaç, en sık
// unutulan/eksik kalan iki belgeyi otomatik hatırlatmaktır.
//
// `type` değerleri constants/documentTypes.js → DOCUMENT_TYPES ile birebir eşleşir.
export const MANDATORY_DOCUMENT_TYPES = [
  { type: "riskAnalizi", label: "Risk Değerlendirme Raporu" },
  { type: "acilDurumPlani", label: "Acil Durum Planı" },
];
