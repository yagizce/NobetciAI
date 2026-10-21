import { computeFineKinneyScore } from "../constants/fineKinney.js";
import { todayISO } from "./dateUtils.js";

export function buildExpertOverview({ fineKinney = [], periodicChecks = [], audits = [], auditFindings = [], riskDetections = [] }, today = todayISO()) {
  const end = new Date(`${today}T12:00:00`);
  end.setDate(end.getDate() + 7);
  const until = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  const openRisks = fineKinney.filter((r) => r.status !== "done");
  const priorityRisks = openRisks.map((r) => ({ ...r, score: computeFineKinneyScore(r.probability, r.frequency, r.severity) }))
    .filter((r) => r.score >= 200).sort((a, b) => b.score - a.score);
  const tasks = [];
  function add(kind, id, title, dueDate, context, to, state) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate || "") || dueDate > until) return;
    tasks.push({ id: `${kind}-${id}`, kind, title, dueDate, context, to, state, overdue: dueDate < today });
  }
  for (const risk of openRisks) {
    const state = { targetTab: "fineKinney", prefillSearch: risk.hazard };
    if (risk.correctiveActions?.length) {
      for (const action of risk.correctiveActions) if (action.status !== "done") {
        add("Faaliyet", `${risk.id}-${action.id}`, action.title || "Düzeltici faaliyet", action.dueDate, risk.hazard, "/risk-analysis", state);
      }
    } else add("Faaliyet", risk.id, risk.action || risk.hazard, risk.dueDate, risk.hazard, "/risk-analysis", state);
  }
  for (const check of periodicChecks) add("Kontrol", check.id, check.itemName, check.nextDueDate, "Periyodik kontrol", `/documents?tab=periodicChecks&q=${encodeURIComponent(check.itemName || "")}`);
  for (const audit of audits) if (!audit.completedAt) add("Denetim", audit.id, audit.scopeDescription || "Planlanan denetim", audit.plannedDate, "Saha denetimi", "/audit");
  for (const finding of auditFindings) if (finding.stage !== "closed") add("DİF", finding.id, finding.description || "Düzeltici faaliyet", finding.dueDate, finding.responsible || "Denetim bulgusu", "/audit");
  tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  return {
    openRiskCount: openRisks.length,
    priorityRisks,
    overdueCount: tasks.filter((t) => t.overdue).length,
    upcomingCount: tasks.filter((t) => !t.overdue).length,
    pendingDetectionCount: riskDetections.filter((r) => ["new", "reviewing"].includes(r.status)).length,
    tasks,
  };
}
