import { turkishLower } from "../utils/text.js";
import { getDetectionCategoryLabel } from "./riskDetection.js";
import { getDocumentTypeLabel } from "./documentTypes.js";

// Uygulama Geneli Arama (bkz. hooks/useGlobalSearch.js, components/GlobalSearchBar.jsx).
// AI_ROADMAP.md'de değil — bu bir AI özelliği değil, saf anahtar kelime eşleştirmesi.
// Amaç: kullanıcı hangi modülde kayıt bıraktığını hatırlamadığında (örn. "forklift" ile
// ilgili bir şey kaydetmiştim ama Fine-Kinney'e mi Risk Tespiti'ne mi bilmiyorum) TEK bir
// arama kutusundan tüm modüllerde arayabilmesi. Her modülün KENDİ arama kutusunun yerini
// TUTMAZ, üzerine "hepsinde birden ara" kısayolu ekler.
//
// Yeni bir modül eklemek istendiğinde: aşağıdaki `groups` dizisine bir girdi eklemek
// yeterli — `target` alanı, sonuca tıklanınca nereye gidileceğini (route + o modülün
// kendi arama kutusunu ön dolduracak state/query param) tanımlar.

const MAX_RESULTS_PER_CATEGORY = 3;
const MIN_QUERY_LENGTH = 2;

/**
 * @param {string} query - kullanıcının yazdığı HAM arama metni (turkishLower burada uygulanır)
 * @param {{
 *   fineKinney?: object[], riskDetections?: object[], periodicChecks?: object[],
 *   documents?: object[], knowledgeDocs?: object[],
 * }} data - ilgili servislerden çekilmiş HAM veri (bu fonksiyon hiçbir veri ÇEKMEZ, yalnızca filtreler)
 * @returns {Array<{ key: string, label: string, items: Array<{id: number|string, title: string, subtitle: string}>, target: { path: string, state?: object, search?: string } }>}
 */
export function buildGlobalSearchResults(query, data) {
  const q = turkishLower((query || "").trim());
  if (q.length < MIN_QUERY_LENGTH) return [];

  const { fineKinney = [], riskDetections = [], periodicChecks = [], documents = [], knowledgeDocs = [] } = data;

  const fineKinneyItems = fineKinney
    .filter((e) => turkishLower(e.hazard || "").includes(q) || turkishLower(e.risk || "").includes(q))
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((e) => ({ id: e.id, title: e.hazard, subtitle: e.risk || "" }));

  const riskDetectionItems = riskDetections
    .filter((d) =>
      turkishLower(d.location || "").includes(q) ||
      turkishLower(d.hazardNote || "").includes(q) ||
      turkishLower(getDetectionCategoryLabel(d.category)).includes(q)
    )
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((d) => ({ id: d.id, title: getDetectionCategoryLabel(d.category), subtitle: d.location || "" }));

  const periodicCheckItems = periodicChecks
    .filter((c) => turkishLower(c.itemName || "").includes(q))
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((c) => ({ id: c.id, title: c.itemName, subtitle: c.nextDueDate || "" }));

  const documentItems = documents
    .filter((d) => turkishLower(d.title || "").includes(q))
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((d) => ({ id: d.id, title: d.title, subtitle: getDocumentTypeLabel(d.type) }));  const knowledgeItems = knowledgeDocs
    .filter((d) => turkishLower(d.title || "").includes(q) || turkishLower(d.summary || "").includes(q))
    .slice(0, MAX_RESULTS_PER_CATEGORY)
    .map((d) => ({ id: d.id, title: d.title, subtitle: d.summary || "" }));

  const groups = [
    { key: "fineKinney", label: "Fine-Kinney", items: fineKinneyItems, target: { path: "/risk-analysis", state: { targetTab: "fineKinney", prefillSearch: query } } },
    { key: "riskDetection", label: "Risk Tespiti", items: riskDetectionItems, target: { path: "/risk-analysis", state: { targetTab: "riskDetection", prefillSearch: query } } },
    { key: "periodicChecks", label: "Periyodik Kontrol", items: periodicCheckItems, target: { path: "/documents", search: `?tab=periodicChecks&q=${encodeURIComponent(query)}` } },
    { key: "documents", label: "Dokümanlar", items: documentItems, target: { path: "/documents", search: `?tab=generator&q=${encodeURIComponent(query)}` } },
    { key: "knowledge", label: "Bilgi Kütüphanesi", items: knowledgeItems, target: { path: "/knowledge-center", search: `?q=${encodeURIComponent(query)}` } },
  ];

  return groups.filter((g) => g.items.length > 0);
}
