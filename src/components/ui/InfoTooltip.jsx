import { Info } from "../icons/index.jsx";

/**
 * Sprint 7.2.4 — Dashboard kartlarında "bu sayı nasıl hesaplanıyor" gibi kısa açıklamalar
 * için. Bilinçli olarak native `<details>/<summary>` üzerine kuruldu: JS state'siz,
 * bağımlılıksız, hem dokunmatik (mobil) hem fare (masaüstü) ile aynı şekilde çalışır —
 * `title` özniteliğine dayalı bir "hover tooltip" mobilde hiç açılmazdı.
 *
 * @param {{ theme: object, text: string }} props
 */
export default function InfoTooltip({ theme, text }) {
  return (
    <details className="relative inline-block group">
      <summary
        className="list-none cursor-pointer w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: theme.surfaceAlt, color: theme.textFaint }}
        aria-label="Açıklama"
      >
        <Info style={{ fontSize: "10px" }} />
      </summary>
      <div
        className="absolute z-20 left-0 top-5 w-56 rounded-lg border px-2.5 py-2 text-[11px] leading-snug shadow-lg"
        style={{ background: theme.surface, borderColor: theme.border, color: theme.textMuted }}
      >
        {text}
      </div>
    </details>
  );
}
