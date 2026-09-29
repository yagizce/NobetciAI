// Denetim Modülü — TÜM denetim türlerinin (ISO 45001, İSG Mevzuat, ileride
// ISO 9001/14001/27001) paylaştığı jenerik skor/ilerleme motoru. Kriter/kategori
// verisi burada YOKTUR (her tür kendi `constants/xxxChecklist.js` dosyasında tutar,
// bkz. iso45001Checklist.js ve mevzuatChecklist.js) — burada yalnızca bir checklist
// dizisinden (result/categoryCode alanları yeterli) skor hesaplayan, türden bağımsız
// saf fonksiyonlar var.

export const CHECKLIST_RESULTS = [
  { value: "uygun", label: "Uygun", tone: "success", weight: 1 },
  { value: "kismen_uygun", label: "Kısmen Uygun", tone: "warning", weight: 0.5 },
  { value: "uygun_degil", label: "Uygun Değil", tone: "danger", weight: 0 },
  { value: "kanit_yok", label: "Kanıt Yok", tone: "pending", weight: 0 },
  { value: "degerlendirilmedi", label: "Değerlendirilmedi", tone: "neutral", weight: null },
];

export function getResultMeta(value) {
  return CHECKLIST_RESULTS.find((r) => r.value === value) || CHECKLIST_RESULTS.at(-1);
}

/**
 * @param {Array<{ result: string }>} checklist
 * @returns {number} 0-100, boş checklist için 0
 */
export function computeProgressPercent(checklist) {
  if (!checklist?.length) return 0;
  const evaluated = checklist.filter((c) => c.result !== "degerlendirilmedi").length;
  return Math.round((evaluated / checklist.length) * 100);
}

/**
 * Toplam skor: değerlendirilen kriterlerin ağırlık ortalaması (Uygun=1, Kısmen
 * Uygun=0.5, Uygun Değil/Kanıt Yok=0). "Değerlendirilmedi" maddeler paydaya
 * girmez — yarım kalmış bir denetimde skor yanıltıcı biçimde düşük görünmesin diye.
 * @param {Array<{ result: string }>} checklist
 * @returns {number|null} 0-100, hiç değerlendirme yoksa null
 */
export function computeOverallScore(checklist) {
  const evaluated = (checklist || []).filter((c) => c.result !== "degerlendirilmedi");
  if (evaluated.length === 0) return null;
  const total = evaluated.reduce((sum, c) => sum + (getResultMeta(c.result).weight ?? 0), 0);
  return Math.round((total / evaluated.length) * 100);
}

/**
 * Verilen kategori listesine göre kategori bazlı skor/ilerleme döner — hangi
 * denetim türü olduğuna bakmaz, `categories` parametresiyle çalışır.
 * @param {Array<{ categoryCode: string, result: string }>} checklist
 * @param {Array<{ code: string, title: string }>} categories
 * @returns {Array<{ code: string, title: string, score: number|null, progress: number, total: number, evaluatedCount: number }>}
 */
export function computeCategoryScores(checklist, categories) {
  return (categories || []).map((cat) => {
    const items = (checklist || []).filter((c) => c.categoryCode === cat.code);
    return {
      code: cat.code,
      title: cat.title,
      total: items.length,
      evaluatedCount: items.filter((c) => c.result !== "degerlendirilmedi").length,
      progress: computeProgressPercent(items),
      score: computeOverallScore(items),
    };
  });
}
