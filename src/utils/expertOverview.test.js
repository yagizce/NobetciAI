import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExpertOverview } from "./expertOverview.js";

test("kapalı riskler ve tamamlanan işler özete girmez; tarihler ve eşik doğru hesaplanır", () => {
  const summary = buildExpertOverview({
    fineKinney: [
      { id: "r1", hazard: "Açık", probability: 10, frequency: 10, severity: 40, status: "open", dueDate: "2026-10-20" },
      { id: "r2", probability: 10, frequency: 10, severity: 100, status: "done", dueDate: "2026-10-20" },
      { id: "r3", probability: 1, frequency: 1, severity: 1, status: "open", dueDate: "2026-10-21", correctiveActions: [{ id: "a1", status: "done", dueDate: "2026-10-20" }, { id: "a2", status: "open", dueDate: "2026-10-28" }] },
    ],
    periodicChecks: [{ id: "c1", nextDueDate: "2026-10-21" }, { id: "c2", nextDueDate: "2026-10-29" }],
    audits: [{ id: "a1", plannedDate: "2026-10-20", completedAt: "2026-10-20" }],
    auditFindings: [{ id: "f1", stage: "closed", dueDate: "2026-10-20" }, { id: "f2", stage: "open", dueDate: "2026-10-19" }],
    riskDetections: [{ status: "new" }, { status: "reviewing" }, { status: "converted" }],
  }, "2026-10-21");
  assert.equal(summary.openRiskCount, 2);
  assert.equal(summary.priorityRisks.length, 1);
  assert.equal(summary.overdueCount, 2);
  assert.equal(summary.upcomingCount, 2);
  assert.equal(summary.pendingDetectionCount, 2);
  assert.equal(summary.tasks[0].id, "DİF-f2");
});

test("boş kayıtlar sahte başarı puanı veya görev üretmez", () => {
  const summary = buildExpertOverview({}, "2026-10-21");
  assert.deepEqual(summary.tasks, []);
  assert.equal(summary.openRiskCount, 0);
  assert.equal(summary.priorityRisks.length, 0);
});
