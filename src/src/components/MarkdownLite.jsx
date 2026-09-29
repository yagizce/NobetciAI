import { Fragment } from "react";

/**
 * Sprint 10 — AI Deneyimi Cilası. Bağımlılıksız, hafif bir "markdown-lite" render'ı.
 *
 * NEDEN YENİ BİR KÜTÜPHANE DEĞİL: DEVELOPMENT_RULES.md gereği gereksiz yeni bağımlılık
 * eklenmiyor (bkz. proje ilkeleri) — ayrıca bu ortamda `npm install` çalıştırılamıyor,
 * yeni bir paket eklemek doğrulanamaz bir riskti. Kapsanan alt küme, projedeki AI
 * prompt'larının GERÇEKTEN ürettiği biçimlendirmeyle sınırlı tutuldu (tam bir
 * CommonMark ayrıştırıcısı DEĞİL):
 *  - `**kalın**`
 *  - `` `satır içi kod` ``
 *  - ``` ```kod bloğu``` ```
 *  - Madde işaretli liste satırları (`- `, `• `, `* ` ile başlayan)
 *  - Numaralı liste satırları (`1. ` ile başlayan)
 *  - `#`/`##`/`###` başlıklar
 *  - Boş satırla ayrılmış paragraflar
 *
 * BULUNAN KÖK SORUN: `FINE_KINNEY_AI_PROMPT` (constants/systemPrompt.js) modele
 * `**Kontrol Tedbirleri:**` gibi kalın başlıklar kullanmasını söylüyordu, ama
 * FineKinneyForm.jsx bu cevabı `whitespace-pre-wrap` ile DÜZ METİN olarak basıyordu —
 * kullanıcı ekranda gerçek yıldız işaretlerini görüyordu. Bu bileşen hem oradaki hem
 * ChatPanel.jsx'teki AI cevaplarını okunabilir hale getirir.
 *
 * @param {{ text: string, theme: object }} props
 */
export default function MarkdownLite({ text, theme }) {
  if (!text) return null;
  const blocks = parseBlocks(text);
  return (
    <div className="flex flex-col gap-1.5">
      {blocks.map((block, i) => renderBlock(block, i, theme))}
    </div>
  );
}

function parseBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  let paragraphBuf = [];

  function flushParagraph() {
    if (paragraphBuf.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphBuf.join(" ").trim() });
      paragraphBuf = [];
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", text: codeLines.join("\n") });
      i++; // kapanış ```'i atla
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    if (/^[-•*]\s+/.test(trimmed)) {
      flushParagraph();
      const items = [];
      while (i < lines.length && /^[-•*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "bulletList", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "numberedList", items });
      continue;
    }

    if (trimmed === "") {
      flushParagraph();
      i++;
      continue;
    }

    paragraphBuf.push(trimmed);
    i++;
  }
  flushParagraph();
  return blocks;
}

/** `**kalın**` ve `` `kod` `` içeren tek bir satırı inline parçalara ayırır. */
function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((p) => p !== "");
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return <code key={key} className="px-1 py-0.5 rounded text-[0.9em]" style={{ background: "rgba(127,127,127,0.15)", fontFamily: "monospace" }}>{part.slice(1, -1)}</code>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function renderBlock(block, i, theme) {
  switch (block.type) {
    case "heading": {
      const sizeClass = block.level === 1 ? "text-[14px]" : block.level === 2 ? "text-[13px]" : "text-[12px]";
      return <p key={i} className={`${sizeClass} font-bold mt-1`} style={{ color: theme.textPrimary }}>{renderInline(block.text, i)}</p>;
    }
    case "bulletList":
      return (
        <ul key={i} className="list-disc pl-4 flex flex-col gap-0.5">
          {block.items.map((item, j) => <li key={j}>{renderInline(item, `${i}-${j}`)}</li>)}
        </ul>
      );
    case "numberedList":
      return (
        <ol key={i} className="list-decimal pl-4 flex flex-col gap-0.5">
          {block.items.map((item, j) => <li key={j}>{renderInline(item, `${i}-${j}`)}</li>)}
        </ol>
      );
    case "code":
      return (
        <pre key={i} className="rounded-lg px-3 py-2 text-[12px] overflow-x-auto" style={{ background: "rgba(127,127,127,0.15)", fontFamily: "monospace" }}>
          <code>{block.text}</code>
        </pre>
      );
    case "paragraph":
    default:
      return <p key={i}>{renderInline(block.text, i)}</p>;
  }
}
