import { RISK_WORKFLOW_STATES, resolveEntryWorkflowState } from "../../../constants/riskWorkflow.js";

/**
 * Sprint 7.1'de eklenen risk workflow modelini (bkz. constants/riskWorkflow.js) ilk kez
 * görselleştiren widget. Her risk kaydı, `resolveEntryWorkflowState` ile (kayıtlı
 * `workflowState` yoksa legacy `status`'tan anlık türetilerek) bir aşamaya yerleştirilir.
 * Salt-okunur bir özet — durum değiştirme burada yapılmaz (workflow'un kendisi henüz
 * hiçbir ekranda düzenlenebilir değil, bkz. Sprint 7.1 Development Report).
 *
 * @param {{ theme: object, fineKinneyEntries: object[] }} props
 */
export default function WorkflowPipelinePanel({ theme, fineKinneyEntries }) {
  const counts = RISK_WORKFLOW_STATES.map((state) => ({
    ...state,
    count: fineKinneyEntries.filter((e) => resolveEntryWorkflowState(e).id === state.id).length,
  }));

  const toneStyle = (tone) => ({
    neutral: { bg: theme.surfaceAlt, text: theme.textMuted },
    success: { bg: theme.successBg, text: theme.successText },
    warning: { bg: theme.warnBg, text: theme.warnText },
    danger: { bg: theme.highRiskBg, text: theme.highRiskText },
    pending: { bg: theme.pendingBg, text: theme.pendingText },
  }[tone]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {counts.map((s) => {
        const style = toneStyle(s.tone);
        return (
          <div
            key={s.id}
            className="rounded-lg px-3 py-2.5 shrink-0"
            style={{ background: style.bg, minWidth: "108px" }}
            title={s.description}
          >
            <p className="text-xl font-bold leading-none" style={{ color: style.text }}>{s.count}</p>
            <p className="text-[10.5px] mt-1 whitespace-nowrap" style={{ color: style.text }}>{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}
