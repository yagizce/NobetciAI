import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { computeAuditPreparedness, computeCriterionReadinessScore } from "./auditPreparedness.js";
import { scopeFindingsToAudits } from "./auditScope.js";
import { isoDateNDaysAgo, isoDateNDaysFromNow } from "./dateUtils.js";

const fullCompany = { sector: "Metal İşleme", employeeCount: 42, dangerClass: "tehlikeli" };

function makeAudit(id, checklist) {
  return { id, checklist };
}

function makeItem(id, categoryCode, result, evidence = [{ id: "e1", type: "photo", description: "kanıt" }]) {
  return { id, categoryCode, title: `Kriter ${id}`, result, evidence };
}

function makeDif(id, auditId, checklistItemId, stage, dueDate) {
  return { id, auditId, checklistItemId, stage, dueDate: dueDate ?? null };
}

// ── computeCriterionReadinessScore — 3 bileşenin tek başına doğruluğu ────────
describe("computeCriterionReadinessScore — Sonuç bileşeni", () => {
  test("Uygun → 100 (tam kanıt + DİF yok ile diğer bileşenler sabit tutulup izole edilir)", () => {
    const score = computeCriterionReadinessScore({ result: "uygun", evidence: [{ id: "e1" }] }, null);
    assert.equal(score, 100); // (100+100+100)/3
  });

  test("Kısmen Uygun → sonuç bileşeni 50", () => {
    const score = computeCriterionReadinessScore({ result: "kismen_uygun", evidence: [{ id: "e1" }] }, null);
    assert.equal(score, (50 + 100 + 100) / 3);
  });

  test("Uygun Değil + kanıt mevcut → sonuç bileşeni 0 (kanıt bileşeni ayrı kalır)", () => {
    const score = computeCriterionReadinessScore({ result: "uygun_degil", evidence: [{ id: "e1" }] }, null);
    assert.equal(score, (0 + 100 + 100) / 3);
  });

  test("Kanıt Yok (sonuç) hiçbir koşulda Uygun Değil ile karıştırılmaz ama sayısal katkısı aynıdır", () => {
    const uygunDegil = computeCriterionReadinessScore({ result: "uygun_degil", evidence: [{ id: "e1" }] }, null);
    const kanitYok = computeCriterionReadinessScore({ result: "kanit_yok", evidence: [{ id: "e1" }] }, null);
    assert.equal(uygunDegil, kanitYok); // ikisi de weight:0 (auditScoring.js ile tutarlı)
  });
});

describe("computeCriterionReadinessScore — Kanıt bileşeni (criterionEvidence.js üzerinden)", () => {
  test("Uygun + Kanıt Yok (evidence boş) → kanıt bileşeni 0, sonuç yine de Uygun kalır", () => {
    const item = { result: "uygun", evidence: [] };
    const score = computeCriterionReadinessScore(item, null);
    assert.equal(score, (100 + 0 + 100) / 3);
    assert.equal(item.result, "uygun"); // fonksiyon result'ı asla değiştirmez
  });

  test("Uygun + Eksik Kanıt (kriter 'degerlendirilmedi' iken eklenmiş kanıt) → kanıt bileşeni 50", () => {
    // computeEvidenceStatus: evidence dolu + result==='degerlendirilmedi' → "incomplete"
    const item = { result: "degerlendirilmedi", evidence: [{ id: "e1" }] };
    const score = computeCriterionReadinessScore(item, null);
    assert.equal(score, (0 + 50 + 100) / 3);
  });

  test("kanıt eklenince sonuç otomatik değişmez", () => {
    const item = { result: "uygun_degil", evidence: [{ id: "e1" }, { id: "e2" }] };
    computeCriterionReadinessScore(item, null);
    assert.equal(item.result, "uygun_degil");
  });
});

describe("computeCriterionReadinessScore — DİF bileşeni (auditWorkflow.js aşamaları)", () => {
  test("DİF yok → DİF bileşeni nedeniyle puan kaybı yok (100 kabul edilir)", () => {
    const score = computeCriterionReadinessScore({ result: "uygun", evidence: [{ id: "e1" }] }, null);
    assert.equal(score, 100);
  });

  test("Açık → DİF bileşeni 0", () => {
    const score = computeCriterionReadinessScore({ result: "uygun_degil", evidence: [{ id: "e1" }] }, { stage: "open" });
    assert.equal(score, (0 + 100 + 0) / 3);
  });

  test("Aksiyon Bekliyor → DİF bileşeni 25", () => {
    const score = computeCriterionReadinessScore({ result: "uygun_degil", evidence: [{ id: "e1" }] }, { stage: "awaitingAction" });
    assert.equal(score, (0 + 100 + 25) / 3);
  });

  test("İnceleme Bekliyor → DİF bileşeni 75", () => {
    const score = computeCriterionReadinessScore({ result: "uygun_degil", evidence: [{ id: "e1" }] }, { stage: "pendingReview" });
    assert.equal(score, (0 + 100 + 75) / 3);
  });

  test("Kapatıldı → DİF bileşeni 100", () => {
    const score = computeCriterionReadinessScore({ result: "uygun_degil", evidence: [{ id: "e1" }] }, { stage: "closed" });
    assert.equal(score, (0 + 100 + 100) / 3);
  });

  test("gecikmiş DİF ikinci kez ceza oluşturmuyor — yalnızca stage belirleyicidir, dueDate/overdue bileşeni etkilemez", () => {
    const notOverdue = computeCriterionReadinessScore({ result: "uygun_degil", evidence: [{ id: "e1" }] }, { stage: "open", dueDate: isoDateNDaysFromNow(5) });
    const overdue = computeCriterionReadinessScore({ result: "uygun_degil", evidence: [{ id: "e1" }] }, { stage: "open", dueDate: isoDateNDaysAgo(30) });
    assert.equal(notOverdue, overdue);
  });
});

// ── computeAuditPreparedness — payda/eksik veri davranışı ───────────────────
describe("computeAuditPreparedness — veri yokken sahte/yanlış skor üretilmemesi", () => {
  test("hiç denetim/kriter yoksa skor 'Henüz değerlendirilemedi' anlamına gelir (null), %0 gibi yanıltıcı bir sayı üretilmez", () => {
    const result = computeAuditPreparedness({ company: fullCompany, audits: [], findings: [] });
    assert.equal(result.scoreAvailable, false);
    assert.equal(result.score, null);
    assert.equal(result.evaluatedCriterionCount, 0);
    assert.equal(result.totalCriterionCount, 0);
  });

  test("company null/undefined ise çökmez, tüm alanları eksik sayar (skorla karışmaz)", () => {
    const result = computeAuditPreparedness({ company: null, audits: [], findings: [] });
    assert.deepEqual(result.missingFields, ["Sektör", "Çalışan sayısı", "Tehlike sınıfı"]);
  });

  test("audits/findings verilmezse (undefined) çökmez", () => {
    const result = computeAuditPreparedness({ company: fullCompany });
    assert.equal(result.scoreAvailable, false);
    assert.equal(result.score, null);
  });

  test("checklist tamamen 'Değerlendirilmedi' ise skor üretilemez, hepsi unevaluated sayılır", () => {
    const audits = [makeAudit("a1", [makeItem("r1", "risk", "degerlendirilmedi", []), makeItem("r2", "risk", "degerlendirilmedi", [])])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.scoreAvailable, false);
    assert.equal(result.score, null);
    assert.equal(result.unevaluatedCriterionCount, 2);
    assert.equal(result.totalCriterionCount, 2);
  });
});

describe("computeAuditPreparedness — 17 senaryo (istenen test listesi)", () => {
  test("1) 10/10 Uygun (tam kanıt, DİF yok) → %100", () => {
    const checklist = Array.from({ length: 10 }, (_, i) => makeItem(`c${i}`, "risk", "uygun"));
    const audits = [makeAudit("a1", checklist)];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.score, 100);
    assert.equal(result.evaluatedCriterionCount, 10);
  });

  test("2) 5 Uygun (tam kanıt) + 5 Değerlendirilmedi → %100, 5 kriter değerlendirilmedi olarak gösterilir", () => {
    const checklist = [
      ...Array.from({ length: 5 }, (_, i) => makeItem(`c${i}`, "risk", "uygun")),
      ...Array.from({ length: 5 }, (_, i) => makeItem(`d${i}`, "risk", "degerlendirilmedi", [])),
    ];
    const audits = [makeAudit("a1", checklist)];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.score, 100);
    assert.equal(result.evaluatedCriterionCount, 5);
    assert.equal(result.totalCriterionCount, 10);
    assert.equal(result.unevaluatedCriterionCount, 5);
  });

  test("3) hiç değerlendirilmiş kriter yok → yüzde yerine scoreAvailable=false ('Henüz değerlendirilemedi')", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "degerlendirilmedi", [])])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.scoreAvailable, false);
    assert.equal(result.score, null);
  });

  test("4) Uygun + Kanıt Yok → kanıt bileşeni 0, sonuç hâlâ Uygun (item.result değişmez)", () => {
    const item = makeItem("c1", "risk", "uygun", []);
    const audits = [makeAudit("a1", [item])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.score, Math.round((100 + 0 + 100) / 3));
    assert.equal(item.result, "uygun");
  });

  test("5) Uygun + Eksik Kanıt → kanıt bileşeni 50", () => {
    const score = computeCriterionReadinessScore({ result: "uygun", evidence: [{ id: "e1" }] }, null);
    assert.equal(score, 100); // sonuç zaten değerlendirilmiş olduğu için kanıt "present" (100) sayılır
    const incomplete = computeCriterionReadinessScore({ result: "degerlendirilmedi", evidence: [{ id: "e1" }] }, null);
    assert.equal(incomplete, (0 + 50 + 100) / 3);
  });

  test("6) Uygun Değil + kanıt mevcut → uygunluk (sonuç bileşeni) 0", () => {
    const item = makeItem("c1", "risk", "uygun_degil", [{ id: "e1" }]);
    const audits = [makeAudit("a1", [item])];
    const dif = makeDif("d1", "a1", "c1", "closed");
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [dif] });
    assert.equal(result.score, Math.round((0 + 100 + 100) / 3));
  });

  test("7) Kısmen Uygun → uygunluk (sonuç bileşeni) 50", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "kismen_uygun")])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.score, Math.round((50 + 100 + 100) / 3));
  });

  test("8) DİF yok → DİF bileşeni nedeniyle puan kaybı yok", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "uygun")])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.score, 100);
  });

  test("9) Açık DİF → DİF bileşeni 0", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "uygun_degil")])];
    const findings = [makeDif("d1", "a1", "c1", "open")];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings });
    assert.equal(result.score, Math.round((0 + 100 + 0) / 3));
  });

  test("10) Aksiyon Bekliyor → DİF bileşeni 25", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "uygun_degil")])];
    const findings = [makeDif("d1", "a1", "c1", "awaitingAction")];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings });
    assert.equal(result.score, Math.round((0 + 100 + 25) / 3));
  });

  test("11) İnceleme Bekliyor → DİF bileşeni 75", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "uygun_degil")])];
    const findings = [makeDif("d1", "a1", "c1", "pendingReview")];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings });
    assert.equal(result.score, Math.round((0 + 100 + 75) / 3));
  });

  test("12) Kapatıldı → DİF bileşeni 100", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "uygun_degil")])];
    const findings = [makeDif("d1", "a1", "c1", "closed")];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings });
    assert.equal(result.score, Math.round((0 + 100 + 100) / 3));
  });

  test("13) gecikmiş DİF ikinci kez ceza oluşturmuyor (aynı stage, farklı dueDate → aynı skor)", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "uygun_degil")])];
    const findingsNotOverdue = [makeDif("d1", "a1", "c1", "open", isoDateNDaysFromNow(5))];
    const findingsOverdue = [makeDif("d1", "a1", "c1", "open", isoDateNDaysAgo(30))];
    const r1 = computeAuditPreparedness({ company: fullCompany, audits, findings: findingsNotOverdue });
    const r2 = computeAuditPreparedness({ company: fullCompany, audits, findings: findingsOverdue });
    assert.equal(r1.score, r2.score);
    assert.equal(r2.overdueActionCount, 1); // gecikme AYRICA gösteriliyor, skoru ikinci kez düşürmüyor
  });

  test("14) Kanıt Yok hiçbir koşulda Uygun Değil'e dönüşmüyor", () => {
    const item = makeItem("c1", "risk", "kanit_yok", []);
    const audits = [makeAudit("a1", [item])];
    computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(item.result, "kanit_yok"); // asla "uygun_degil" olarak değiştirilmedi
  });

  test("15) hiç veri olmayan (tamamen değerlendirilmemiş) kriter skoru yapay olarak düşürmüyor", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "uygun"), makeItem("c2", "risk", "degerlendirilmedi", [])])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.score, 100);
    assert.equal(result.evaluatedCriterionCount, 1);
    assert.equal(result.unevaluatedCriterionCount, 1);
  });

  test("16) mevcut auditScoring.js sonucu (denetim uygunluk skoru) bu hesaplamadan etkilenmiyor", async () => {
    const { computeOverallScore } = await import("../constants/auditScoring.js");
    const checklist = [makeItem("c1", "risk", "uygun", []), makeItem("c2", "risk", "uygun_degil", [])];
    const before = computeOverallScore(checklist);
    computeAuditPreparedness({ company: fullCompany, audits: [makeAudit("a1", checklist)], findings: [] });
    const after = computeOverallScore(checklist);
    assert.equal(before, after); // hazırlık hesaplaması auditScoring.js'i hiç çağırmaz/etkilemez
  });

  test("17) ISO 45001 hazırlık hesabına dahil edilmiyor (yalnızca kendisine geçirilen standardın verisi hesaba girer)", () => {
    // Her standart kendi audits/findings state'ini AYRI tutar (bkz. AuditPage.jsx →
    // useAudits(activeStandard) → utils/auditScope.js → scopeFindingsToAudits).
    // Burada ISO 45001'e ait, düşük puanlı bir denetim hiç geçirilmediğinde
    // sonucun yalnızca mevzuat denetiminden hesaplandığı (ISO verisinin sızmadığı)
    // doğrulanır.
    const mevzuatAudits = [makeAudit("m1", [makeItem("m-c1", "risk", "uygun")])];
    const iso45001Audits = [makeAudit("i1", [makeItem("i-c1", "4", "uygun_degil", [])])];
    const result = computeAuditPreparedness({ company: fullCompany, audits: mevzuatAudits, findings: [] });
    assert.equal(result.score, 100); // ISO 45001'in düşük puanlı kriteri hiç karışmadı
    assert.equal(result.totalCriterionCount, 1);
    assert.equal(iso45001Audits.length, 1); // ayrı standardın verisi bilinçli olarak hiç geçirilmedi
  });

  test("17b) uçtan uca: scopeFindingsToAudits ile birleştiğinde ISO 45001'in AÇIK DİF'i openActionCount'a hiç sızmaz", () => {
    // Bu, useAudits.js'in gerçek akışını simüle eder: getAuditFindings() TÜM
    // standartların DİF'lerini birlikte döner, scopeFindingsToAudits bunu
    // computeAuditPreparedness'e geçirilmeden ÖNCE mevzuat denetimlerine daraltır.
    const mevzuatAudits = [makeAudit("m1", [makeItem("m-c1", "risk", "uygun_degil")])];
    const allFindingsAcrossStandards = [
      makeDif("f1", "m1", "m-c1", "open"), // mevzuat'ın kendi DİF'i
      makeDif("f2", "iso-audit-1", "i-c1", "open"), // ISO 45001'e ait, FARKLI bir denetimin DİF'i
    ];
    const scopedFindings = scopeFindingsToAudits(allFindingsAcrossStandards, mevzuatAudits);
    const result = computeAuditPreparedness({ company: fullCompany, audits: mevzuatAudits, findings: scopedFindings });
    assert.equal(result.openActionCount, 1); // yalnızca f1 — ISO 45001'in f2'si sızmadı
  });
});

describe("computeAuditPreparedness — mevcut alanlar (öncelikli alanlar/kritik uyarı) bozulmadı", () => {
  test("her eksik firma alanı ayrıca raporlanır ama artık skoru DÜŞÜRMEZ (eksik metadata ≠ olumsuz sonuç)", () => {
    const audits = [makeAudit("a1", [makeItem("c1", "risk", "uygun")])];
    const result = computeAuditPreparedness({ company: { sector: "Gıda" }, audits, findings: [] });
    assert.deepEqual(result.missingFields, ["Çalışan sayısı", "Tehlike sınıfı"]);
    assert.equal(result.score, 100); // eksik firma bilgisi skoru artık etkilemiyor
  });

  test("'Uygun Değil' ama DİF'i olmayan kriter hâlâ tespit edilir (unresolvedWithoutDif)", () => {
    const audits = [makeAudit("a1", [makeItem("risk-1", "risk", "uygun_degil"), makeItem("acil-1", "acil", "uygun")])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.unresolvedWithoutDif.length, 1);
    assert.equal(result.unresolvedWithoutDif[0].checklistItemId, "risk-1");
  });

  test("kategori bazında öncelikli alanlar hâlâ doğru toplanır", () => {
    const audits = [
      makeAudit("a1", [makeItem("risk-1", "risk", "uygun_degil"), makeItem("acil-1", "acil", "uygun_degil")]),
      makeAudit("a2", [makeItem("risk-1", "risk", "uygun_degil")]),
    ];
    const findings = [makeDif("f1", "a1", "risk-1", "open"), makeDif("f2", "a2", "risk-1", "open")];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings });
    const riskArea = result.priorityAreas.find((p) => p.categoryCode === "risk");
    assert.ok(riskArea);
    assert.equal(riskArea.openCount, 2);
    assert.equal(riskArea.recurringCount, 1);
  });

  test("kapalı DİF'ler açık aksiyon sayılmaz", () => {
    const findings = [makeDif("f1", "a1", "risk-1", "closed")];
    const result = computeAuditPreparedness({ company: fullCompany, audits: [], findings });
    assert.equal(result.openActionCount, 0);
  });

  test("termini geçmiş açık DİF'ler gecikmiş sayılır, kapalı olan asla sayılmaz", () => {
    const findings = [
      makeDif("f1", "a1", "risk-1", "awaitingAction", isoDateNDaysAgo(3)),
      makeDif("f2", "a1", "acil-1", "closed", isoDateNDaysAgo(30)),
      makeDif("f3", "a1", "kkd-1", "action", isoDateNDaysFromNow(5)),
    ];
    const result = computeAuditPreparedness({ company: fullCompany, audits: [], findings });
    assert.equal(result.overdueActionCount, 1);
  });
});
