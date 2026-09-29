// ISO Denetim Modülü — desteklenen standartlar, madde bazlı kontrol listesi şablonu
// ve adam-gün/denetçi ataması için basit bir öneri tablosu.
//
// NOT: Aşağıdaki madde başlıkları ISO 9001/14001/45001/27001'in yüksek seviye
// yapısını (HLS — Annex SL) yansıtır; her maddenin altındaki "soru" alanı resmi
// standart metninin birebir alıntısı DEĞİLDİR — denetçinin sahada sorması gereken
// genel/paraflandırılmış bir kontrol sorusudur. Gerçek bir denetimde firma, kendi
// prosedürlerine göre bu listeyi özelleştirmelidir; bu yalnızca başlangıç şablonudur.

export const AUDIT_STANDARDS = [
  { value: "9001", label: "ISO 9001", title: "Kalite Yönetim Sistemi" },
  { value: "14001", label: "ISO 14001", title: "Çevre Yönetim Sistemi" },
  { value: "45001", label: "ISO 45001", title: "İSG Yönetim Sistemi" },
  { value: "27001", label: "ISO 27001", title: "Bilgi Güvenliği Yönetim Sistemi" },
];

export function getStandardLabel(value) {
  return AUDIT_STANDARDS.find((s) => s.value === value)?.label || value;
}

// Her standart için HLS'in 4-10 maddelerine karşılık gelen, standarda özgü
// birkaç örnek soruyla zenginleştirilmiş kontrol listesi şablonu.
const CLAUSE_TEMPLATES = {
  "9001": [
    { code: "4", title: "Kuruluşun Bağlamı", question: "Kuruluş, iç/dış hususları ve ilgili tarafların şart larını belirlemiş mi?" },
    { code: "5", title: "Liderlik", question: "Üst yönetim kalite politikasını benimsemiş ve sorumlulukları atamış mı?" },
    { code: "6", title: "Planlama", question: "Risk ve fırsatlara yönelik faaliyetler ve kalite hedefleri planlanmış mı?" },
    { code: "7", title: "Destek", question: "Kaynak, yetkinlik, farkındalık ve dokümante bilgi yönetimi yeterli mi?" },
    { code: "8", title: "Operasyon", question: "Ürün/hizmet planlaması, tasarım, tedarik ve süreç kontrolleri uygulanıyor mu?" },
    { code: "9", title: "Performans Değerlendirme", question: "İzleme, ölçme, iç tetkik ve yönetimin gözden geçirmesi düzenli yapılıyor mu?" },
    { code: "10", title: "İyileştirme", question: "Uygunsuzluklara düzeltici faaliyet açılıyor ve sürekli iyileştirme sağlanıyor mu?" },
  ],
  "14001": [
    { code: "4", title: "Kuruluşun Bağlamı", question: "Çevre boyutları ve ilgili taraf beklentileri belirlenmiş mi?" },
    { code: "5", title: "Liderlik", question: "Çevre politikası ilan edilmiş ve roller atanmış mı?" },
    { code: "6", title: "Planlama", question: "Çevre boyutları/etkileri değerlendirilip uygunluk yükümlülükleri izleniyor mu?" },
    { code: "7", title: "Destek", question: "Çevre yönetimi için kaynak, yetkinlik ve iletişim sağlanıyor mu?" },
    { code: "8", title: "Operasyon", question: "Acil duruma hazırlık dahil operasyonel kontroller uygulanıyor mu?" },
    { code: "9", title: "Performans Değerlendirme", question: "Çevresel performans izleniyor, iç tetkik ve YGG yapılıyor mu?" },
    { code: "10", title: "İyileştirme", question: "Uygunsuzluk/düzeltici faaliyet ve sürekli iyileştirme mekanizması var mı?" },
  ],
  "45001": [
    { code: "4", title: "Kuruluşun Bağlamı", question: "Çalışan ve diğer ilgili tarafların İSG beklentileri belirlenmiş mi?" },
    { code: "5", title: "Liderlik ve Çalışan Katılımı", question: "Üst yönetim taahhüdü ve çalışan katılım/danışma mekanizması var mı?" },
    { code: "6", title: "Planlama", question: "Tehlike tanımlama, risk değerlendirme (Fine-Kinney vb.) ve yasal yükümlülük takibi yapılıyor mu?" },
    { code: "7", title: "Destek", question: "Kaynak, yetkinlik/eğitim, farkındalık ve dokümantasyon yeterli mi?" },
    { code: "8", title: "Operasyon", question: "Operasyonel kontroller, değişim yönetimi ve acil durum hazırlığı uygulanıyor mu?" },
    { code: "9", title: "Performans Değerlendirme", question: "Olay/kaza kayıtları, iç tetkik ve YGG düzenli yapılıyor mu?" },
    { code: "10", title: "İyileştirme", question: "Olay araştırması sonrası düzeltici faaliyet ve sürekli iyileştirme var mı?" },
  ],
  "27001": [
    { code: "4", title: "Kuruluşun Bağlamı", question: "BGYS kapsamı ve ilgili taraf bilgi güvenliği şartları tanımlanmış mı?" },
    { code: "5", title: "Liderlik", question: "Bilgi güvenliği politikası ve rol/sorumluluklar tanımlı mı?" },
    { code: "6", title: "Planlama", question: "Risk değerlendirme/işleme planı ve Ek A kontrolleri (SoA) güncel mi?" },
    { code: "7", title: "Destek", question: "Farkındalık eğitimi, iletişim ve dokümante bilgi kontrolü sağlanıyor mu?" },
    { code: "8", title: "Operasyon", question: "Risk işleme planı uygulanıyor ve değişiklikler kontrollü mü?" },
    { code: "9", title: "Performans Değerlendirme", question: "İzleme, iç tetkik ve YGG bilgi güvenliği performansını kapsıyor mu?" },
    { code: "10", title: "İyileştirme", question: "Güvenlik olaylarına düzeltici faaliyet açılıp izleniyor mu?" },
  ],
};

/**
 * Seçilen standart(lar) için madde bazlı kontrol listesini üretir. Entegre denetimde
 * (birden fazla standart) aynı HLS maddesi (ör. "7 Destek") her standart için AYRI
 * bir satır olarak listelenir — çünkü şartlar standarda göre farklılaşabilir; denetçi
 * gerektiğinde bunları sahada birleştirip tek soruda değerlendirebilir.
 *
 * @param {string[]} standards
 * @returns {Array<{ id: string, standard: string, clauseCode: string, clauseTitle: string, question: string, result: null, note: string, departmentId: string|null }>}
 */
export function generateAuditChecklist(standards) {
  const items = [];
  (standards || []).forEach((standard) => {
    (CLAUSE_TEMPLATES[standard] || []).forEach((clause) => {
      items.push({
        id: `${standard}-${clause.code}`,
        standard,
        clauseCode: clause.code,
        clauseTitle: clause.title,
        question: clause.question,
        result: null,
        note: "",
        departmentId: null,
      });
    });
  });
  return items;
}

export const FINDING_TYPES = [
  { value: "major", label: "Majör Uygunsuzluk", tone: "danger" },
  { value: "minor", label: "Minör Uygunsuzluk", tone: "warning" },
  { value: "observation", label: "Gözlem", tone: "pending" },
  { value: "good_practice", label: "İyi Uygulama", tone: "success" },
];

export function getFindingTypeMeta(value) {
  return FINDING_TYPES.find((f) => f.value === value) || { value, label: value, tone: "neutral" };
}

export const CHECKLIST_RESULTS = [
  { value: "uygun", label: "Uygun", tone: "success" },
  ...FINDING_TYPES,
];

export function getChecklistResultMeta(value) {
  return CHECKLIST_RESULTS.find((r) => r.value === value) || null;
}

/**
 * Yalnızca "uygunsuzluk" sayılan sonuçlar (majör/minör) — gözlem ve iyi uygulama
 * bir eksiklik olmadığı için uygunluk skoruna negatif etki ETMEZ.
 */
const NONCONFORMITY_RESULTS = ["major", "minor"];

/**
 * Denetim bazında uygunluk skorunu hesaplar: değerlendirilmiş maddeler arasında
 * (gözlem/iyi uygulama hariç, çünkü onlar bir "uygunluk" sorusu değil) kaç tanesi
 * "uygun" çıkmış. Henüz değerlendirilmemiş (result: null) maddeler paydaya girmez —
 * yarım kalmış bir denetimde skor yanıltıcı biçimde düşük görünmesin diye.
 *
 * @param {Array<{ result: string|null }>} checklist
 * @returns {number|null} 0-100 arası, hiç değerlendirme yoksa null
 */
export function computeComplianceScore(checklist) {
  const evaluated = (checklist || []).filter((c) => c.result === "uygun" || NONCONFORMITY_RESULTS.includes(c.result));
  if (evaluated.length === 0) return null;
  const compliant = evaluated.filter((c) => c.result === "uygun").length;
  return Math.round((compliant / evaluated.length) * 100);
}

// Adam-gün önerisi: ISO 19011/IAF MD 5 mantığından esinlenen, KABA bir başlangıç
// tahmini — çalışan sayısı arttıkça denetim süresi kademeli artar, entegre
// denetimde (2+ standart) tek başına toplanmaz (aynı sahada birlikte yürütüldüğü
// için) ama ek standart başına yarım gün eklenir. Gerçek süre risk/karmaşıklığa
// göre denetçi tarafından ayarlanmalıdır — bu yalnızca bir başlangıç noktasıdır.
const EMPLOYEE_COUNT_BRACKETS = [
  { max: 10, baseDays: 1 },
  { max: 25, baseDays: 1.5 },
  { max: 50, baseDays: 2 },
  { max: 100, baseDays: 2.5 },
  { max: 250, baseDays: 3.5 },
  { max: 500, baseDays: 4.5 },
  { max: Infinity, baseDays: 6 },
];
const EXTRA_STANDARD_DAYS = 0.5;

/**
 * @param {number} employeeCount
 * @param {number} standardCount
 * @returns {number} önerilen toplam adam-gün (0.5'e yuvarlanır)
 */
export function computeSuggestedAuditDays(employeeCount, standardCount) {
  const bracket = EMPLOYEE_COUNT_BRACKETS.find((b) => (employeeCount || 0) <= b.max) || EMPLOYEE_COUNT_BRACKETS.at(-1);
  const extra = Math.max(0, (standardCount || 1) - 1) * EXTRA_STANDARD_DAYS;
  return Math.round((bracket.baseDays + extra) * 2) / 2;
}

/**
 * Toplam adam-günü, girilen denetçi sayısına payına düşecek şekilde eşit dağıtır
 * (son denetçiye küsurat kalan gün eklenir). Sihirbazda "otomatik öneri" olarak
 * kullanılır, denetçi elle de değiştirebilir.
 *
 * @param {number} totalDays
 * @param {string[]} auditorNames
 * @returns {Array<{ name: string, days: number }>}
 */
export function distributeAuditDays(totalDays, auditorNames) {
  const names = (auditorNames || []).filter((n) => n?.trim());
  if (names.length === 0) return [];
  const perAuditor = Math.floor((totalDays / names.length) * 2) / 2;
  const distributed = names.map(() => perAuditor);
  const remainder = Math.round((totalDays - perAuditor * names.length) * 2) / 2;
  distributed[distributed.length - 1] = Math.round((distributed[distributed.length - 1] + remainder) * 2) / 2;
  return names.map((name, i) => ({ name, days: distributed[i] }));
}
