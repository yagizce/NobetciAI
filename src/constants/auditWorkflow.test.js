import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { computeAuditStatus, isDifOverdue, getDueSoonOrOverdueDifs, computeDifClosureMetrics } from "./auditWorkflow.js";
import { isoDateNDaysAgo, isoDateNDaysFromNow, todayISO } from "../utils/dateUtils.js";

describe("computeAuditStatus", () => {
  test("completedAt varsa her zaman tamamlandı sayılır", () => {
    assert.equal(computeAuditStatus({ completedAt: "2024-01-01", plannedDate: isoDateNDaysFromNow(10) }), "completed");
  });

  test("planlanan tarih gelecekteyse planlandı sayılır", () => {
    assert.equal(computeAuditStatus({ plannedDate: isoDateNDaysFromNow(5) }), "planned");
  });

  test("planlanan tarih geçmiş/bugünse devam ediyor sayılır", () => {
    assert.equal(computeAuditStatus({ plannedDate: isoDateNDaysAgo(1) }), "ongoing");
  });
});

describe("isDifOverdue", () => {
  test("kapalı bir DİF asla gecikmiş sayılmaz", () => {
    assert.equal(isDifOverdue({ stage: "closed", dueDate: isoDateNDaysAgo(10) }), false);
  });

  test("termini geçmiş açık DİF gecikmiş sayılır", () => {
    assert.equal(isDifOverdue({ stage: "action", dueDate: isoDateNDaysAgo(1) }), true);
  });

  test("termini gelecekte olan açık DİF gecikmiş sayılmaz", () => {
    assert.equal(isDifOverdue({ stage: "action", dueDate: isoDateNDaysFromNow(5) }), false);
  });
});

describe("getDueSoonOrOverdueDifs", () => {
  test("kapalı DİF'ler asla listeye girmez", () => {
    assert.deepEqual(getDueSoonOrOverdueDifs([{ stage: "closed", dueDate: isoDateNDaysAgo(5) }]), []);
  });

  test("gecikmiş ve yakın termindeki açık DİF'ler listelenir", () => {
    const findings = [
      { id: 1, stage: "action", dueDate: isoDateNDaysAgo(1) },
      { id: 2, stage: "rootCause", dueDate: isoDateNDaysFromNow(2) },
      { id: 3, stage: "open", dueDate: isoDateNDaysFromNow(20) },
    ];
    const result = getDueSoonOrOverdueDifs(findings, 3);
    assert.deepEqual(result.map((f) => f.id), [1, 2]);
  });
});

describe("computeDifClosureMetrics", () => {
  test("hiç kapatılmış DİF yoksa null döner", () => {
    const result = computeDifClosureMetrics([{ stage: "open" }]);
    assert.equal(result.avgClosureDays, null);
    assert.equal(result.openCount, 1);
  });

  test("ortalama kapanma süresi doğru hesaplanır", () => {
    const findings = [
      { stage: "closed", openedAt: "2024-01-01", closedAt: "2024-01-11", dueDate: "2024-01-20" },
      { stage: "closed", openedAt: "2024-01-01", closedAt: "2024-01-21", dueDate: "2024-01-10" },
    ];
    const result = computeDifClosureMetrics(findings);
    assert.equal(result.avgClosureDays, 15);
    assert.equal(result.delayedRate, 50);
    assert.equal(result.closedCount, 2);
  });
});
