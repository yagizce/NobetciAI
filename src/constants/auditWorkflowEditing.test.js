import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  DIF_EDITABLE_FIELDS, pickDifEditableFields, mergeDifEditableFields,
  canTransitionDifStage, applyDifTransition, computeAuditStatus,
} from "./auditWorkflow.js";

// Çekmecenin açıldığı andaki (bayat) kopya ile aşama geçişinden sonraki TAZE kayıt.
const staleFields = {
  id: "d1", stage: "open", history: [], closedAt: null, evidence: [],
  responsible: "Ali", dueDate: "2026-12-01", rootCause: "kök", correctiveAction: "önlem",
  actionCompleted: true, actionEvidence: "yapıldı", closureNote: "",
};
const freshDif = {
  ...staleFields, stage: "pendingReview",
  history: [{ id: 1, from: "open", to: "awaitingAction" }, { id: 2, from: "awaitingAction", to: "pendingReview" }],
  evidence: [{ id: "e1", name: "foto.jpg" }],
};

describe("DİF düzenleme — bayat kopya aşamayı/geçmişi ezmez", () => {
  test("yalnızca düzenlenebilir alanlar seçilir", () => {
    const picked = pickDifEditableFields(staleFields);
    assert.deepEqual(Object.keys(picked).sort(), [...DIF_EDITABLE_FIELDS].sort());
    assert.equal("stage" in picked, false);
    assert.equal("history" in picked, false);
  });

  test("bayat fields taze kaydın aşama, geçmiş ve kanıtlarını korur", () => {
    const merged = mergeDifEditableFields(freshDif, { ...staleFields, closureNote: "kapanış metni" });
    assert.equal(merged.stage, "pendingReview");
    assert.equal(merged.history.length, 2);
    assert.equal(merged.evidence.length, 1);
    assert.equal(merged.closureNote, "kapanış metni"); // kullanıcının düzenlemesi uygulanır
  });

  test("eksik alanlar (undefined olmayan anahtar yok) taze değeri silmez", () => {
    const merged = mergeDifEditableFields(freshDif, { rootCause: "yeni kök" });
    assert.equal(merged.rootCause, "yeni kök");
    assert.equal(merged.responsible, "Ali");
  });

  test("geçiş yaması düzenlenebilir alanları içerse de geçiş kuralları aynı çalışır", () => {
    const awaiting = { ...staleFields, stage: "awaitingAction", actionCompleted: false, actionEvidence: "" };
    const patch = { ...pickDifEditableFields({ ...awaiting, actionCompleted: true, actionEvidence: "kanıt" }) };
    const check = canTransitionDifStage({ fromStage: "awaitingAction", toStage: "pendingReview", dif: awaiting, patch, actorRole: "expert" });
    assert.equal(check.allowed, true);
    const next = applyDifTransition(awaiting, "pendingReview", { patch, actorLabel: "Uzman", historyEntryId: 9, now: "2026-01-01T00:00:00.000Z" });
    assert.equal(next.stage, "pendingReview");
    assert.equal(next.actionEvidence, "kanıt");
    assert.equal(next.history.length, 1);
  });
});

describe("Denetim durumu — tamamlandı kilidi", () => {
  test("completedAt yazılınca durum 'completed' hesaplanır", () => {
    assert.equal(computeAuditStatus({ plannedDate: "2020-01-01", completedAt: "2026-01-01T00:00:00.000Z" }), "completed");
    assert.equal(computeAuditStatus({ plannedDate: "2020-01-01", completedAt: null }), "ongoing");
  });
});
