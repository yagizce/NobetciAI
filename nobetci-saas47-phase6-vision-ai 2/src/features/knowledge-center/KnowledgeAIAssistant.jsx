import { useState } from "react";
import { useKnowledgeAI } from "./useKnowledgeAI.js";
import Button from "../../components/ui/Button.jsx";
import { Sparkles, X, ChevronDown } from "../../components/icons/index.jsx";

/**
 * Sprint 7.3 — "AI'ya Sor" paneli. Varsayılan kapalı (sayfa kalabalıklaşmasın diye),
 * tıklanınca açılır. Kaynak dokümanlar her zaman cevapla birlikte gösterilir —
 * hangi dokümana dayandığı belirsiz bir AI cevabı güven sorunu yaratır.
 *
 * @param {{ theme: object, documents: object[], onOpenDocument: (doc: object) => void }} props
 */
export default function KnowledgeAIAssistant({ theme, documents, onOpenDocument }) {
  const [expanded, setExpanded] = useState(false);
  const { question, setQuestion, loading, answer, sourceDocs, error, ask, reset } = useKnowledgeAI(documents);

  function handleClose() {
    setExpanded(false);
    reset();
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2 rounded-xl border px-3.5 py-3 mb-4 text-left"
        style={{ borderColor: theme.accent, background: theme.surfaceAlt }}
      >
        <Sparkles style={{ fontSize: "16px", color: theme.accent }} />
        <span className="text-sm font-semibold flex-1" style={{ color: theme.textPrimary }}>
          Dokümanlara AI'ya sor
        </span>
        <ChevronDown style={{ fontSize: "14px", color: theme.textFaint }} />
      </button>
    );
  }

  return (
    <div className="rounded-xl border px-3.5 py-3.5 mb-4" style={{ borderColor: theme.accent, background: theme.surfaceAlt }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles style={{ fontSize: "15px", color: theme.accent }} />
          <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Dokümanlara AI'ya Sor</span>
        </div>
        <button onClick={handleClose} aria-label="Kapat" className="p-1.5 -m-1.5 rounded-lg shrink-0"><X style={{ fontSize: "16px", color: theme.textMuted }} /></button>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          placeholder="Örn: Yüksekte çalışırken hangi KKD gerekli?"
          className="flex-1 text-sm rounded-lg px-3 py-2 outline-none border"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        />
        <Button size="sm" onClick={ask} disabled={loading || !question.trim()}>
          {loading ? "..." : "Sor"}
        </Button>
      </div>

      <p className="text-[10px] mb-2" style={{ color: theme.textFaint }}>
        Yanıt yalnızca Bilgi Kütüphanesi'ndeki dokümanlara dayanır; sonuç bir AI önerisidir, yerini tutmaz.
      </p>

      {error && <p className="text-xs" style={{ color: theme.highRiskText }}>{error}</p>}

      {answer && (
        <div className="rounded-lg px-3 py-2.5 mb-2" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: theme.textPrimary }}>{answer}</p>
        </div>
      )}

      {sourceDocs.length > 0 && (
        <div>
          <p className="text-[10.5px] font-semibold mb-1.5" style={{ color: theme.textFaint }}>Kaynak dokümanlar</p>
          <div className="flex flex-wrap gap-1.5">
            {sourceDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onOpenDocument(doc)}
                className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: theme.surface, color: theme.accent, border: `1px solid ${theme.border}` }}
              >
                {doc.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
