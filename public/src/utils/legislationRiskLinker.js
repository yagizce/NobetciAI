// legislationRiskLinker — Sprint: "mevzuat değişince, hangi Fine-Kinney kayıtları gözden
// geçirilmeli" uyarısı (ROADMAP.md → Phase 5, "Mevzuat Takibi" maddesi). Bilgi
// Kütüphanesi'ndeki `findRelevantDocuments`/RAG-lite ile AYNI felsefe: gerçek
// embedding/vektör arama DEĞİL, basit anahtar kelime örtüşmesi. Yeni bir arama
// motoru icat edilmedi, mevcut `turkishLower` ve doküman `tags` alanı kullanıldı.
//
// BİLİNÇLİ VARSAYIM (DEVELOPMENT_RULES.md → "emin olmadığın konularda varsayım
// yapma" ilkesine göre AÇIKÇA belirtiliyor): sistemde gerçek bir "mevzuat değişikliği
// olayı/diff'i" YOK. "Değişti" sinyali olarak dokümanın gerçek `updatedAt` alanının
// yakın tarihli olması (RECENT_UPDATE_DAYS gün içinde) kullanılıyor — bu, dokümanın
// GERÇEKTEN o tarihte güncellendiği (mock veride elle girilmiş) anlamına gelir, ama
// "içerik neyin değiştiği" bilgisi yoktur. UI metni bunu gizlemez, açıkça söyler.

import { turkishLower } from "./text.js";
import { isoDateNDaysAgo } from "./dateUtils.js";

const RECENT_UPDATE_DAYS = 90;
const STOPWORDS = new Set(["için", "veya", "ile", "gibi", "olan", "olarak", "bir", "bu", "da", "de", "ve"]);

function meaningfulWords(text) {
  return turkishLower(text)
    .split(/[^a-zçğıöşü0-9]+/i)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

/**
 * @param {import("../types/index.js").FineKinneyEntry[]} fineKinneyEntries
 * @param {object[]} documents - MOCK_KNOWLEDGE_DOCUMENTS (constants/knowledgeCenter.js)
 * @returns {Array<{ document: object, affectedEntries: Array<{ entry: object, matchedWords: string[] }> }>}
 *   Yalnızca son RECENT_UPDATE_DAYS gün içinde güncellenmiş "legislation" kategorisindeki,
 *   VE en az 1 eşleşen risk kaydı olan dokümanlar döner.
 */
export function computeLegislationImpact(fineKinneyEntries, documents) {
  const cutoff = isoDateNDaysAgo(RECENT_UPDATE_DAYS);

  const recentLegislation = (documents || []).filter(
    (d) => d.category === "legislation" && d.updatedAt && d.updatedAt >= cutoff
  );
  if (recentLegislation.length === 0) return [];

  const openEntries = (fineKinneyEntries || []).filter((e) => e.status !== "done");

  return recentLegislation
    .map((doc) => {
      const docWords = new Set([...meaningfulWords(doc.title), ...doc.tags.flatMap(meaningfulWords)]);

      const affectedEntries = openEntries
        .map((entry) => {
          const entryWords = new Set([...meaningfulWords(entry.hazard), ...meaningfulWords(entry.risk)]);
          const matchedWords = [...docWords].filter((w) => entryWords.has(w));
          return { entry, matchedWords };
        })
        .filter((r) => r.matchedWords.length > 0);

      return { document: doc, affectedEntries };
    })
    .filter((r) => r.affectedEntries.length > 0);
}
