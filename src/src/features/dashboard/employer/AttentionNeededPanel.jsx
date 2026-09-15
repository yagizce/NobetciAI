import { collectAttentionItems } from "../../../utils/attentionItems.js";
import { getPriorityMeta } from "../../../constants/fineKinney.js";
import { getCheckStatusStyle } from "../../../constants/periodicCheck.js";
import EmptyState from "../../../components/EmptyState.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { CheckCircle2 } from "../../../components/icons/index.jsx";

const CHECK_STATUS_ORDER = [
  { id: "overdue", label: "Süresi Geçti" },
  { id: "upcoming", label: "Yaklaşıyor" },
  { id: "ok", label: "Güncel" },
];

/**
 * "Bugün neye bakmalıyım" widget'ı — İşveren Dashboard'ındaki TEK "dikkat
 * gerektirenler" adresi. Önceden ayrı ayrı var olan üç widget burada birleşti:
 *   - `CorrectiveActionsPanel` (aktif risk kayıtlarının öncelik sırası) → artık her
 *     kalemin yanında aynı öncelik rozeti (`getPriorityMeta`) gösteriliyor.
 *   - `UpcomingChecksCard` (hangi periyodik kontrol yaklaşıyor/gecikti) → zaten bu
 *     listenin bir parçasıydı, ayrı kart olarak KALDIRILDI.
 *   - `PeriodicCheckOverviewPanel` (periyodik kontrol makro sayaçları) → üstteki
 *     kısa sayaç şeridi olarak buraya taşındı.
 * Üçü ayrı ayrı dururken aynı "ne yapmam lazım?" sorusuna farklı sıralama/kapsamla
 * cevap veriyor, kalabalık ve zaman zaman çelişkili görünüyordu — bkz.
 * utils/attentionItems.js.
 *
 * @param {{ theme: object, fineKinneyEntries: object[], periodicChecks: object[] }} props
 */
export default function AttentionNeededPanel({ theme, fineKinneyEntries, periodicChecks }) {
  const items = collectAttentionItems(fineKinneyEntries, periodicChecks);

  const checkCounts = CHECK_STATUS_ORDER.map((s) => ({
    ...s,
    count: (periodicChecks || []).filter((c) => c.status === s.id).length,
    style: getCheckStatusStyle(s.id, theme),
  }));

  return (
    <div>
      {periodicChecks?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
          {checkCounts.map((s) => (
            <div key={s.id} className="rounded-lg px-3 py-2 shrink-0" style={{ background: s.style.bg, minWidth: "90px" }}>
              <p className="text-lg font-bold leading-none" style={{ color: s.style.text }}>{s.count}</p>
              <p className="text-[10px] mt-1 whitespace-nowrap" style={{ color: s.style.text }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Şu an dikkat gerektiren bir şey yok" description="Yaklaşan/geciken faaliyet veya kontrol bulunmuyor." />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const priorityMeta = item.priority ? getPriorityMeta(item.priority) : null;
            return (
              <div key={item.id} className="rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2" style={{ borderColor: theme.border, background: theme.surface }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: theme.textPrimary }}>{item.title}</p>
                  <p className="text-[11px] truncate" style={{ color: theme.textFaint }}>
                    {item.kind === "action" ? "Düzeltici Faaliyet" : "Periyodik Kontrol"}
                    {item.context && ` • ${item.context}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1">
                    {priorityMeta && <Badge tone={priorityMeta.tone}>{priorityMeta.label}</Badge>}
                    <Badge tone={item.overdue ? "danger" : "warning"}>{item.overdue ? "Gecikti" : "Yaklaşıyor"}</Badge>
                  </div>
                  <span className="text-[10.5px]" style={{ color: theme.textFaint }}>{item.dueDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
