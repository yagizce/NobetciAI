// ISO 45001 Denetim Modülü — Faz 1
// Kriter verisi, denetim UI/servis mantığından BİLİNÇLİ OLARAK ayrı bir dosyada
// tutulur (istenen: "Kriterleri ayrı bir veri yapısında tut") — ileride 9001/14001/
// 27001 eklenirken her biri kendi `isoXXXXChecklist.js` dosyasında aynı şekle
// (CATEGORIES + CRITERIA + generateChecklist fonksiyonu) sahip olacak, bu dosyaya
// dokunmaya gerek kalmayacak. Skor/ilerleme hesaplama mantığı artık TÜM denetim
// türlerinin (bkz. mevzuatChecklist.js) paylaştığı constants/auditScoring.js'te —
// burada yalnızca ISO 45001'e özgü kategori/kriter verisi ve bunun ince bir
// sarmalayıcısı var; dışarıya aynı fonksiyon isimleriyle re-export edilir, mevcut
// kullanım noktaları (AuditDetailDrawer.jsx vb.) DEĞİŞMEDEN çalışmaya devam eder.
//
// TELİF NOTU: Aşağıdaki kriter başlıkları ISO 45001:2018'in resmi/telifli metninin
// alıntısı DEĞİLDİR — standardın yüksek seviye yapısına (HLS, madde 4-10) genel
// olarak karşılık gelen, kısa ve paraflandırılmış denetim kontrol başlıklarıdır.

import { CHECKLIST_RESULTS, getResultMeta, computeProgressPercent, computeOverallScore, computeCategoryScores as computeCategoryScoresGeneric } from "./auditScoring.js";

export { CHECKLIST_RESULTS, getResultMeta, computeProgressPercent, computeOverallScore };

export const AUDIT_CATEGORIES = [
  { code: "4", title: "Bağlam" },
  { code: "5", title: "Liderlik" },
  { code: "6", title: "Planlama" },
  { code: "7", title: "Destek" },
  { code: "8", title: "Operasyon" },
  { code: "9", title: "Performans Değerlendirme" },
  { code: "10", title: "İyileştirme" },
];

export function getCategoryTitle(code) {
  return AUDIT_CATEGORIES.find((c) => c.code === code)?.title || code;
}

export const AUDIT_CRITERIA = [
  { id: "4.1", categoryCode: "4", title: "İç ve dış hususların belirlenmesi" },
  { id: "4.2", categoryCode: "4", title: "Çalışan ve ilgili tarafların ihtiyaç/beklentileri" },
  { id: "4.3", categoryCode: "4", title: "İSG yönetim sistemi kapsamının tanımlanması" },

  { id: "5.1", categoryCode: "5", title: "Üst yönetim liderlik ve taahhüdü" },
  { id: "5.2", categoryCode: "5", title: "İSG politikasının oluşturulması ve duyurulması" },
  { id: "5.3", categoryCode: "5", title: "Rol, sorumluluk ve yetkilerin atanması" },
  { id: "5.4", categoryCode: "5", title: "Çalışan danışma ve katılım mekanizması" },

  { id: "6.1", categoryCode: "6", title: "Tehlike tanımlama ve risk değerlendirme süreci" },
  { id: "6.2", categoryCode: "6", title: "Yasal ve diğer yükümlülüklerin belirlenmesi" },
  { id: "6.3", categoryCode: "6", title: "İSG hedeflerinin planlanması" },

  { id: "7.1", categoryCode: "7", title: "Kaynakların sağlanması" },
  { id: "7.2", categoryCode: "7", title: "Yetkinlik ve eğitim yönetimi" },
  { id: "7.3", categoryCode: "7", title: "Farkındalık çalışmaları" },
  { id: "7.4", categoryCode: "7", title: "İç/dış iletişim süreçleri" },
  { id: "7.5", categoryCode: "7", title: "Dokümante bilginin kontrolü" },

  { id: "8.1", categoryCode: "8", title: "Operasyonel planlama ve kontrol" },
  { id: "8.2", categoryCode: "8", title: "Acil duruma hazırlık ve müdahale" },

  { id: "9.1", categoryCode: "9", title: "İzleme, ölçme, analiz ve performans değerlendirme" },
  { id: "9.2", categoryCode: "9", title: "İç tetkik programının uygulanması" },
  { id: "9.3", categoryCode: "9", title: "Yönetimin gözden geçirmesi" },

  { id: "10.1", categoryCode: "10", title: "Olay ve uygunsuzluk yönetimi" },
  { id: "10.2", categoryCode: "10", title: "Sürekli iyileştirme" },
];

/**
 * Yeni bir denetim için tüm kriterlerden boş bir checklist üretir.
 * @returns {Array<{ id: string, categoryCode: string, title: string, result: "degerlendirilmedi", note: string, departmentId: string|number|null }>}
 */
export function generateChecklist() {
  return AUDIT_CRITERIA.map((c) => ({
    id: c.id,
    categoryCode: c.categoryCode,
    title: c.title,
    result: "degerlendirilmedi",
    note: "",
    departmentId: null,
  }));
}

/**
 * Sprint isteği: "Kategori bazlı skor". Her HLS maddesi (4-10) için ayrı skor ve
 * ilerleme yüzdesi döner. İnce bir sarmalayıcı: gerçek hesaplama
 * constants/auditScoring.js'teki jenerik fonksiyonda.
 * @param {Array<{ categoryCode: string, result: string }>} checklist
 * @returns {Array<{ code: string, title: string, score: number|null, progress: number, total: number, evaluatedCount: number }>}
 */
export function computeCategoryScores(checklist) {
  return computeCategoryScoresGeneric(checklist, AUDIT_CATEGORIES);
}
