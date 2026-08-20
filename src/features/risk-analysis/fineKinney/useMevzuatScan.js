import { useState } from "react";
import { MEVZUAT_SCAN_PROMPT, parseMevzuatScan } from "../../../constants/systemPrompt.js";
import { sendChatMessage } from "../../../services/chatService.js";
import { MOCK_KNOWLEDGE_DOCUMENTS } from "../../../constants/knowledgeCenter.js";
import { turkishLower } from "../../../utils/text.js";

const MAX_ENTRIES_IN_CONTEXT = 30; // istem boyutunu sınırlamak için — bkz. aşağıdaki not

/**
 * Phase 5 kapanışı — "AI Mevzuat Takibi & Proaktif Fine-Kinney Önerisi" (Sprint 7.5).
 * Bilgi Kütüphanesi'ndeki mevzuat dokümanları + firmanın mevcut Fine-Kinney kayıtlarını
 * AI'ye bağlam olarak verip iki liste üretir: (1) mevzuat ışığında gözden geçirilmesi
 * önerilen MEVCUT kayıtlar, (2) henüz girilmemiş olası YENİ tehlikeler için taslak
 * önerileri. Hiçbir öneri otomatik kayda dönüşmez — kullanıcı "Taslak Oluştur" ile
 * formu AI'nin önerisiyle önceden doldurulmuş halde açar ve kendisi kaydeder.
 *
 * Not: `fineKinneyEntries` çok büyükse (30+) yalnızca ilk 30 kayıt bağlam olarak
 * gönderilir — istem/token boyutu sınırsız büyümesin diye. Bu bir veri kaybı değildir,
 * tarama kapsamının bir sınırıdır (arayüzde belirtilir).
 *
 * @param {import("../../../types/index.js").FineKinneyEntry[]} fineKinneyEntries
 * @returns {{
 *   scanning: boolean, scanError: string|null, flagged: object[], suggestions: object[],
 *   lastRunAt: string|null, truncated: boolean, runScan: () => Promise<void>,
 * }}
 */
export function useMevzuatScan(fineKinneyEntries) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [lastRunAt, setLastRunAt] = useState(null);

  const legislationDocs = MOCK_KNOWLEDGE_DOCUMENTS.filter((d) => d.category === "legislation");
  const truncated = fineKinneyEntries.length > MAX_ENTRIES_IN_CONTEXT;

  async function runScan() {
    setScanning(true);
    setScanError(null);
    try {
      const legislationContext = legislationDocs.map((d) => `- ${d.title}: ${d.content}`).join("\n");
      const entriesContext = fineKinneyEntries
        .slice(0, MAX_ENTRIES_IN_CONTEXT)
        .map((e) => `- Tehlike: "${e.hazard}" | Risk: "${e.risk || "belirtilmedi"}" | Durum: ${e.status}`)
        .join("\n");

      const reply = await sendChatMessage({
        system: MEVZUAT_SCAN_PROMPT,
        max_tokens: 700,
        messages: [{
          role: "user",
          content: `MEVZUAT DOKÜMANLARI:\n${legislationContext || "(Bilgi Kütüphanesi'nde mevzuat dokümanı yok)"}\n\nMEVCUT FINE-KINNEY KAYITLARI (${fineKinneyEntries.length} kayıttan ${Math.min(fineKinneyEntries.length, MAX_ENTRIES_IN_CONTEXT)} tanesi):\n${entriesContext || "(Henüz hiç kayıt yok)"}`,
        }],
      });

      const parsed = parseMevzuatScan(reply || "");

      // "GÖZDEN GEÇİR" maddelerini gerçek kayıtlarla eşleştir — tam eşleşme yoksa (AI
      // tehlike adını hafifçe farklı yazmış olabilir) alt-dize eşleşmesine düşülür;
      // hiçbiri bulunamazsa madde serbest metin olarak kalır (kayda bağlanamaz).
      const resolvedFlagged = parsed.flagged.map((item) => {
        const match = fineKinneyEntries.find((e) => e.hazard === item.hazardRef)
          || fineKinneyEntries.find((e) => turkishLower(e.hazard).includes(turkishLower(item.hazardRef)) || turkishLower(item.hazardRef).includes(turkishLower(e.hazard)));
        return { ...item, matchedEntryId: match ? match.id : null };
      });

      setFlagged(resolvedFlagged);
      setSuggestions(parsed.suggestions);
      setLastRunAt(new Date().toISOString());
    } catch {
      setScanError("Mevzuat taraması yapılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setScanning(false);
    }
  }

  return { scanning, scanError, flagged, suggestions, lastRunAt, truncated, runScan };
}
