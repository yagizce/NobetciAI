import { useRef, useState } from "react";
import { useToast } from "../../../../../contexts/ToastContext.jsx";
import { useAiSuggestion } from "../../../../../hooks/useAiSuggestion.js";
import { validatePdfFile } from "../../../../../utils/fileValidation.js";
import { sendDocumentAnalysis } from "../../../../../services/chatService.js";
import { FINE_KINNEY_REGULATION_ACTIONS_PROMPT, parseActionSuggestions } from "../../../../../constants/systemPrompt.js";
import { Upload, Sparkles, Plus, AlertTriangle } from "../../../../../components/icons/index.jsx";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]); // data: URL prefix'ini at
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

/**
 * Sprint: "Yönetmelik yükle, AI çoklu önlem önersin, İSG uzmanı tek tıkla eklesin."
 * `CorrectiveActionsTab.jsx`'teki manuel "Faaliyet Ekle" formunu DEĞİŞTİRMEZ, tamamlar —
 * AI önerisi de sonuçta aynı `onAdd()` callback'ini çağırır, yani eklenen faaliyet
 * manuel eklenenle birebir aynı veri şeklinde (`correctiveActions` dizisine girer).
 *
 * BİLİNÇLİ İLKE (AI_ROADMAP.md → "AI önerir, insan onaylar"): AI hiçbir faaliyeti
 * otomatik eklemez. Her öneri ayrı bir kart olarak gösterilir, İSG uzmanı hangisini
 * isterse onu, istediği zaman ekler — istemezse hiçbirini eklemeyebilir.
 *
 * @param {{ theme: object, entry: object, onAdd: (a: object) => void }} props
 */
export default function AIRegulationSuggestionsPanel({ theme, entry, onAdd }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [addedIndexes, setAddedIndexes] = useState(new Set());
  const [fileName, setFileName] = useState(null);

  const { loading, error, run } = useAiSuggestion(async (pdfBase64) => {
    const instruction = `Tehlike: ${entry.hazard}\nRisk: ${entry.risk || "belirtilmedi"}\n\nYukarıdaki tehlike/riskle ilgili, ekteki dokümana dayanan düzeltici faaliyet önerilerini iste.`;
    const reply = await sendDocumentAnalysis({
      system: FINE_KINNEY_REGULATION_ACTIONS_PROMPT,
      pdfBase64,
      instruction,
    });
    const parsed = parseActionSuggestions(reply);
    setSuggestions(parsed);
    setAddedIndexes(new Set());
    return parsed;
  }, { errorMessage: "Dokümandan öneri alınamadı. Dosyanın okunabilir bir PDF olduğundan emin olup tekrar deneyin." });

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const { valid, error: validationError } = await validatePdfFile(file);
    if (!valid) {
      showToast(validationError, "error");
      return;
    }

    setFileName(file.name);
    setSuggestions([]);
    const base64 = await fileToBase64(file);
    await run(base64);
  }

  function handleAdd(suggestion, index) {
    const title = suggestion.length > 70 ? suggestion.slice(0, 67) + "..." : suggestion;
    onAdd({ title, description: suggestion, responsible: "", dueDate: "", priority: "medium", status: "open", completionPercent: 0 });
    setAddedIndexes((prev) => new Set(prev).add(index));
  }

  return (
    <div className="rounded-lg border px-3 py-3 mb-3" style={{ borderColor: theme.accent, background: theme.surfaceAlt }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles style={{ fontSize: "14px", color: theme.accent }} />
        <p className="text-xs font-semibold" style={{ color: theme.textPrimary }}>AI Önerisi — Mevzuat Yükle</p>
      </div>
      <p className="text-[10.5px] mb-2" style={{ color: theme.textFaint }}>
        İlgili yönetmelik/mevzuat PDF'ini yükle, AI bu tehlikeyle ilgili birden fazla düzeltici faaliyet önerisin — istediğini tek tıkla ekle. Öneriler otomatik eklenmez, sen seçersin.
      </p>

      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFile} style={{ display: "none" }} />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50"
        style={{ background: theme.accent, color: theme.onAccent }}
      >
        <Upload style={{ fontSize: "12px" }} /> {loading ? "Analiz ediliyor..." : fileName ? "Farklı PDF Yükle" : "Yönetmelik PDF Yükle"}
      </button>
      {fileName && !loading && <p className="text-[10px] mt-1" style={{ color: theme.textFaint }}>{fileName}</p>}

      {error && (
        <div className="flex items-center gap-1.5 text-[10.5px] mt-2" style={{ color: theme.warnText }}>
          <AlertTriangle style={{ fontSize: "11px" }} /> {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2.5">
          {suggestions.map((s, i) => {
            const added = addedIndexes.has(i);
            return (
              <div key={i} className="rounded-lg border px-2.5 py-2 flex items-start gap-2" style={{ borderColor: theme.border, background: theme.surface }}>
                <p className="text-[11.5px] flex-1" style={{ color: theme.textPrimary }}>{s}</p>
                <button
                  onClick={() => handleAdd(s, i)}
                  disabled={added}
                  className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-full shrink-0 disabled:opacity-50"
                  style={{ background: added ? theme.successBg : theme.accent, color: added ? theme.successText : theme.onAccent }}
                >
                  {added ? "Eklendi ✓" : <><Plus style={{ fontSize: "11px" }} /> Ekle</>}
                </button>
              </div>
            );
          })}
          {/* HARDENING (AI uyarı konumlandırması): bu, yüklenen PDF metninden AI'nin
              çıkardığı bir yorumdur, resmi yönetmeliğin kendisi değil — Mevzuat
              sayfasındaki/LegislationImpactCard'daki dille tutarlı bir uyarı eklendi. */}
          <p className="text-[10.5px] mt-1" style={{ color: theme.textFaint }}>
            AI'nin dokümandan çıkardığı bir yorumdur, gerçek hukuki analiz değildir — eklemeden önce İSG uzmanınızla teyit edin.
          </p>
        </div>
      )}

      {!loading && !error && fileName && suggestions.length === 0 && (
        <p className="text-[10.5px] mt-2" style={{ color: theme.textFaint }}>Dokümanda bu tehlikeyle doğrudan ilgili bir hüküm bulunamadı.</p>
      )}
    </div>
  );
}
