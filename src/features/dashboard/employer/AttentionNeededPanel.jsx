import { collectAttentionItems } from "../../../utils/attentionItems.js";
import EmptyState from "../../../components/EmptyState.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { CheckCircle2 } from "../../../components/icons/index.jsx";

/**
 * "Bugün neye bakmalıyım" widget'ı. Risk Detay Sayfası'ndaki (Sprint 5A) alt-faaliyet
 * termin tarihlerini ve yaklaşan/geciken periyodik kontrolleri TEK bir aciliyet
 * sıralı listede birleştirir — bkz. utils/attentionItems.js.
 *
 * @param {{ theme: object, fineKinneyEntries: object[], periodicChecks: object[] }} props
 */
export default function AttentionNeededPanel({ theme, fineKinneyEntries, periodicChecks }) {
  const items = collectAttentionItems(fineKinneyEntries, periodicChecks).slice(0, 6);

  if (items.length === 0) {
    return <EmptyState icon={CheckCircle2} title="Şu an dikkat gerektiren bir şey yok" description="Yaklaşan/geciken faaliyet veya kontrol bulunmuyor." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: theme.textPrimary }}>{item.title}</p>
            <p className="text-[11px] truncate" style={{ color: theme.textFaint }}>
              {item.kind === "action" ? "Düzeltici Faaliyet" : "Periyodik Kontrol"}
              {item.context && ` • ${item.context}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge tone={item.overdue ? "danger" : "warning"}>{item.overdue ? "Gecikti" : "Yaklaşıyor"}</Badge>
            <span className="text-[10.5px]" style={{ color: theme.textFaint }}>{item.dueDate}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
