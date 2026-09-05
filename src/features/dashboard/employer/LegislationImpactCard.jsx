import { Link } from "react-router-dom";
import { computeLegislationImpact } from "../../../utils/legislationRiskLinker.js";
import { MOCK_KNOWLEDGE_DOCUMENTS } from "../../../constants/knowledgeCenter.js";
import { Scale, CheckCircle2, ChevronRight } from "../../../components/icons/index.jsx";

/**
 * Sprint: Mevzuat Değişikliği → Etkilenen Risk Kaydı Uyarısı (ROADMAP.md Phase 5).
 * RAG-lite anahtar kelime örtüşmesiyle çalışır — gerçek semantik/AI analiz değildir,
 * bu UI'da açıkça belirtilir (bkz. `legislationRiskLinker.js` başındaki not).
 *
 * @param {{ theme: object, fineKinneyEntries: object[] }} props
 */
export default function LegislationImpactCard({ theme, fineKinneyEntries }) {
  const impacts = computeLegislationImpact(fineKinneyEntries, MOCK_KNOWLEDGE_DOCUMENTS);

  if (impacts.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-3" style={{ background: theme.successBg }}>
        <CheckCircle2 style={{ fontSize: "16px", color: theme.successText }} />
        <p className="text-xs font-medium" style={{ color: theme.successText }}>Son 90 günde güncellenen mevzuatla eşleşen açık risk kaydı yok.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10.5px]" style={{ color: theme.textFaint }}>
        Anahtar kelime eşleştirmesiyle bulundu (gerçek hukuki analiz değildir) — mutlaka İSG uzmanınızla teyit edin.
      </p>
      {impacts.map(({ document, affectedEntries }) => (
        <div key={document.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.warnText, background: theme.warnBg }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Scale style={{ fontSize: "14px", color: theme.warnText }} />
            <p className="text-xs font-semibold" style={{ color: theme.warnText }}>{document.title}</p>
          </div>
          <p className="text-[10.5px] mb-1.5" style={{ color: theme.warnText, opacity: 0.85 }}>
            Güncellenme: {new Date(document.updatedAt).toLocaleDateString("tr-TR")} • {affectedEntries.length} risk kaydı gözden geçirilmeli
          </p>
          <div className="flex flex-col gap-1">
            {affectedEntries.slice(0, 4).map(({ entry }) => (
              <Link key={entry.id} to="/risk-analysis" className="flex items-center justify-between gap-2 text-[11px] rounded px-2 py-1" style={{ background: theme.surface, color: theme.textPrimary }}>
                <span className="truncate min-w-0 flex-1">{entry.hazard}</span>
                <ChevronRight style={{ fontSize: "11px", color: theme.textFaint }} className="shrink-0" />
              </Link>
            ))}
            {affectedEntries.length > 4 && (
              <span className="text-[10.5px]" style={{ color: theme.warnText }}>+ {affectedEntries.length - 4} kayıt daha</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
