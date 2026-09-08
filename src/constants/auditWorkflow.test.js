import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { computeAuditStatus, isDifOverdue, getDueSoonOrOverdueDifs, computeDifClosureMetrics, canTransitionDifStage, applyDifTransition } from "./auditWorkflow.js";
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

// ─── Faz 3: Merkezi DİF durum geçişi doğrulaması ───────────────────────────
const EXPERT = "expert";
const EMPLOYER_NO_FLAG = "employer";
const EMPLOYER_WITH_FLAG_COMPANY = { expertIsEmployer: true };
const EMPLOYEE = "employee";

function baseDif(stage, extra = {}) {
  return { id: "d1", stage, correctiveAction: "", actionCompleted: false, actionEvidence: "", closureNote: "", history: [], ...extra };
}

describe("canTransitionDifStage — tüm geçerli geçişler", () => {
  test("Açık → Aksiyon Bekliyor (düzeltici faaliyet doluyken)", () => {
    const dif = baseDif("open", { correctiveAction: "Bariyer kur" });
    const result = canTransitionDifStage({ fromStage: "open", toStage: "awaitingAction", dif, actorRole: EXPERT });
    assert.equal(result.allowed, true);
    assert.equal(result.reason, null);
  });

  test("Aksiyon Bekliyor → İnceleme Bekliyor (aksiyon tamamlandı + kanıt doluyken)", () => {
    const dif = baseDif("awaitingAction", { actionCompleted: true, actionEvidence: "Fotoğraflandı" });
    const result = canTransitionDifStage({ fromStage: "awaitingAction", toStage: "pendingReview", dif, actorRole: EXPERT });
    assert.equal(result.allowed, true);
  });

  test("İnceleme Bekliyor → Kapatıldı (kapanış açıklaması doluyken)", () => {
    const dif = baseDif("pendingReview", { closureNote: "Doğrulandı, uygun." });
    const result = canTransitionDifStage({ fromStage: "pendingReview", toStage: "closed", dif, actorRole: EXPERT });
    assert.equal(result.allowed, true);
  });

  test("İnceleme Bekliyor → Aksiyon Bekliyor (geri gönderme, ek koşulsuz)", () => {
    const dif = baseDif("pendingReview");
    const result = canTransitionDifStage({ fromStage: "pendingReview", toStage: "awaitingAction", dif, actorRole: EXPERT });
    assert.equal(result.allowed, true);
  });

  test("Kapatıldı → Aksiyon Bekliyor (yalnızca Yeniden Aç eylemiyle + neden doluyken)", () => {
    const dif = baseDif("closed", { reopenReason: "Sorun tekrar etti." });
    const result = canTransitionDifStage({ fromStage: "closed", toStage: "awaitingAction", dif, actorRole: EXPERT, isReopenAction: true });
    assert.equal(result.allowed, true);
  });
});

describe("canTransitionDifStage — tüm geçersiz (grafik dışı) geçişler", () => {
  const invalidPairs = [
    ["open", "pendingReview"], ["open", "closed"], ["open", "open"],
    ["awaitingAction", "open"], ["awaitingAction", "closed"],
    ["pendingReview", "open"],
    ["closed", "open"], ["closed", "pendingReview"], ["closed", "closed"],
  ];
  invalidPairs.forEach(([from, to]) => {
    test(`${from} → ${to} reddedilir`, () => {
      const dif = baseDif(from, { correctiveAction: "x", actionCompleted: true, actionEvidence: "x", closureNote: "x", reopenReason: "x" });
      const result = canTransitionDifStage({ fromStage: from, toStage: to, dif, actorRole: EXPERT, isReopenAction: true });
      assert.equal(result.allowed, false);
      assert.ok(result.reason?.length > 0, "reddedilen her geçiş anlamlı bir neden döndürmeli");
    });
  });
});

describe("canTransitionDifStage — eksik zorunlu alanla geçiş reddedilir", () => {
  test("Açık → Aksiyon Bekliyor: düzeltici faaliyet boşsa reddedilir", () => {
    const dif = baseDif("open", { correctiveAction: "" });
    const result = canTransitionDifStage({ fromStage: "open", toStage: "awaitingAction", dif, actorRole: EXPERT });
    assert.equal(result.allowed, false);
    assert.match(result.reason, /düzeltici faaliyet/i);
  });

  test("Aksiyon Bekliyor → İnceleme Bekliyor: aksiyon tamamlandı işaretlenmemişse reddedilir", () => {
    const dif = baseDif("awaitingAction", { actionCompleted: false, actionEvidence: "Kanıt var" });
    const result = canTransitionDifStage({ fromStage: "awaitingAction", toStage: "pendingReview", dif, actorRole: EXPERT });
    assert.equal(result.allowed, false);
    assert.match(result.reason, /tamamlandı/i);
  });

  test("Aksiyon Bekliyor → İnceleme Bekliyor: kanıt/açıklama boşsa reddedilir", () => {
    const dif = baseDif("awaitingAction", { actionCompleted: true, actionEvidence: "" });
    const result = canTransitionDifStage({ fromStage: "awaitingAction", toStage: "pendingReview", dif, actorRole: EXPERT });
    assert.equal(result.allowed, false);
    assert.match(result.reason, /kanıt/i);
  });

  test("İnceleme Bekliyor → Kapatıldı: kapanış açıklaması boşsa reddedilir", () => {
    const dif = baseDif("pendingReview", { closureNote: "" });
    const result = canTransitionDifStage({ fromStage: "pendingReview", toStage: "closed", dif, actorRole: EXPERT });
    assert.equal(result.allowed, false);
    assert.match(result.reason, /kapanış açıklaması/i);
  });

  test("patch içinde gönderilen alan da geçerli sayılır (henüz kaydedilmemiş olsa bile)", () => {
    const dif = baseDif("open", { correctiveAction: "" });
    const result = canTransitionDifStage({ fromStage: "open", toStage: "awaitingAction", dif, patch: { correctiveAction: "Yeni giriş" }, actorRole: EXPERT });
    assert.equal(result.allowed, true);
  });
});

describe("canTransitionDifStage — yetkisiz kapatma", () => {
  test("Çalışan hiçbir DİF geçişini yapamaz", () => {
    const dif = baseDif("pendingReview", { closureNote: "Tamam" });
    const result = canTransitionDifStage({ fromStage: "pendingReview", toStage: "closed", dif, actorRole: EMPLOYEE });
    assert.equal(result.allowed, false);
    assert.match(result.reason, /yetkiniz yok/i);
  });

  test("İSG Uzmanı ile aynı kişi olmayan İşveren kapatamaz", () => {
    const dif = baseDif("pendingReview", { closureNote: "Tamam" });
    const result = canTransitionDifStage({ fromStage: "pendingReview", toStage: "closed", dif, actorRole: EMPLOYER_NO_FLAG, company: null });
    assert.equal(result.allowed, false);
  });

  test("İSG Uzmanı ile aynı kişi olan İşveren kapatabilir", () => {
    const dif = baseDif("pendingReview", { closureNote: "Tamam" });
    const result = canTransitionDifStage({ fromStage: "pendingReview", toStage: "closed", dif, actorRole: EMPLOYER_NO_FLAG, company: EMPLOYER_WITH_FLAG_COMPANY });
    assert.equal(result.allowed, true);
  });
});

describe("canTransitionDifStage — yeniden açma nedeninin zorunlu olması", () => {
  test("isReopenAction=true ama reopenReason boşsa reddedilir", () => {
    const dif = baseDif("closed", { reopenReason: "" });
    const result = canTransitionDifStage({ fromStage: "closed", toStage: "awaitingAction", dif, actorRole: EXPERT, isReopenAction: true });
    assert.equal(result.allowed, false);
    assert.match(result.reason, /yeniden açma nedeni/i);
  });

  test("isReopenAction bayrağı olmadan Kapatıldı'dan çıkış (neden dolu olsa bile) reddedilir", () => {
    const dif = baseDif("closed", { reopenReason: "Geçerli bir neden" });
    const result = canTransitionDifStage({ fromStage: "closed", toStage: "awaitingAction", dif, actorRole: EXPERT, isReopenAction: false });
    assert.equal(result.allowed, false);
    assert.match(result.reason, /Yeniden Aç/i);
  });

  test("isReopenAction=true ve reopenReason doluysa izin verilir", () => {
    const dif = baseDif("closed", { reopenReason: "Sorun tekrar etti" });
    const result = canTransitionDifStage({ fromStage: "closed", toStage: "awaitingAction", dif, actorRole: EXPERT, isReopenAction: true });
    assert.equal(result.allowed, true);
  });
});

describe("applyDifTransition — geçiş geçmişinin korunması", () => {
  test("ilk geçiş history dizisine tek kayıt ekler", () => {
    const dif = baseDif("open", { history: [] });
    const updated = applyDifTransition(dif, "awaitingAction", { actorLabel: "İSG Uzmanı", historyEntryId: "h1", now: "2024-01-01T10:00:00.000Z" });
    assert.equal(updated.history.length, 1);
    assert.deepEqual(updated.history[0], { id: "h1", from: "open", to: "awaitingAction", at: "2024-01-01T10:00:00.000Z", actor: "İSG Uzmanı", reason: null });
    assert.equal(updated.stage, "awaitingAction");
  });

  test("önceki geçmiş kayıtları KORUNUR, yenisi sonuna eklenir", () => {
    const dif = baseDif("awaitingAction", {
      history: [{ id: "h1", from: "open", to: "awaitingAction", at: "2024-01-01T00:00:00.000Z", actor: "İSG Uzmanı", reason: null }],
    });
    const updated = applyDifTransition(dif, "pendingReview", { actorLabel: "İSG Uzmanı", historyEntryId: "h2", now: "2024-01-05T00:00:00.000Z", reason: "Kanıt eklendi" });
    assert.equal(updated.history.length, 2);
    assert.equal(updated.history[0].id, "h1");
    assert.equal(updated.history[1].id, "h2");
    assert.equal(updated.history[1].reason, "Kanıt eklendi");
  });

  test("kapatıldığında closedAt damgalanır", () => {
    const dif = baseDif("pendingReview", { closedAt: null });
    const updated = applyDifTransition(dif, "closed", { actorLabel: "İSG Uzmanı", historyEntryId: "h3", now: "2024-02-01T00:00:00.000Z" });
    assert.equal(updated.closedAt, "2024-02-01T00:00:00.000Z");
  });

  test("yeniden açıldığında closedAt temizlenir", () => {
    const dif = baseDif("closed", { closedAt: "2024-02-01T00:00:00.000Z" });
    const updated = applyDifTransition(dif, "awaitingAction", { actorLabel: "İSG Uzmanı", historyEntryId: "h4", now: "2024-03-01T00:00:00.000Z", reason: "Tekrar etti" });
    assert.equal(updated.closedAt, null);
    assert.equal(updated.history[0].reason, "Tekrar etti");
  });

  test("patch alanları nesneye yazılır", () => {
    const dif = baseDif("pendingReview");
    const updated = applyDifTransition(dif, "closed", { patch: { closureNote: "Onaylandı" }, actorLabel: "İSG Uzmanı", historyEntryId: "h5", now: "2024-01-01T00:00:00.000Z" });
    assert.equal(updated.closureNote, "Onaylandı");
  });
});
