import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { computeAuditPreparedness } from "./auditPreparedness.js";
import { isoDateNDaysAgo, isoDateNDaysFromNow } from "./dateUtils.js";

const fullCompany = { sector: "Metal İşleme", employeeCount: 42, dangerClass: "tehlikeli" };

function makeAudit(id, checklist) {
  return { id, checklist };
}

function makeItem(id, categoryCode, result) {
  return { id, categoryCode, title: `Kriter ${id}`, result };
}

function makeDif(id, auditId, checklistItemId, stage, dueDate) {
  return { id, auditId, checklistItemId, stage, dueDate: dueDate ?? null };
}

describe("computeAuditPreparedness — veri yokken sahte/yanlış skor üretilmemesi", () => {
  test("firma bilgisi tam, hiç denetim/DİF geçmişi yoksa skor 100 olur (ceza yok)", () => {
    const result = computeAuditPreparedness({ company: fullCompany, audits: [], findings: [] });
    assert.equal(result.score, 100);
    assert.deepEqual(result.missingFields, []);
    assert.equal(result.openActionCount, 0);
    assert.equal(result.overdueActionCount, 0);
    assert.deepEqual(result.priorityAreas, []);
  });

  test("company null/undefined ise çökmez, tüm alanları eksik sayar", () => {
    const result = computeAuditPreparedness({ company: null, audits: [], findings: [] });
    assert.deepEqual(result.missingFields, ["Sektör", "Çalışan sayısı", "Tehlike sınıfı"]);
  });

  test("audits/findings verilmezse (undefined) çökmez, boş dizi gibi davranır", () => {
    const result = computeAuditPreparedness({ company: fullCompany });
    assert.equal(result.score, 100);
  });
});

describe("computeAuditPreparedness — eksik kritik firma bilgisi skoru düşürür", () => {
  test("her eksik alan skoru 5 puan düşürür", () => {
    const result = computeAuditPreparedness({ company: { sector: "Gıda" }, audits: [], findings: [] });
    assert.deepEqual(result.missingFields, ["Çalışan sayısı", "Tehlike sınıfı"]);
    assert.equal(result.score, 90);
  });
});

describe("computeAuditPreparedness — açık/gecikmiş aksiyon sayımı", () => {
  test("kapalı DİF'ler açık aksiyon sayılmaz", () => {
    const findings = [makeDif("f1", "a1", "risk-1", "closed")];
    const result = computeAuditPreparedness({ company: fullCompany, audits: [], findings });
    assert.equal(result.openActionCount, 0);
  });

  test("açık aşamadaki (closed dışı) DİF'ler doğru sayılır", () => {
    const findings = [
      makeDif("f1", "a1", "risk-1", "open"),
      makeDif("f2", "a1", "acil-1", "awaitingAction"),
      makeDif("f3", "a1", "kkd-1", "closed"),
    ];
    const result = computeAuditPreparedness({ company: fullCompany, audits: [], findings });
    assert.equal(result.openActionCount, 2);
    assert.equal(result.score, 100 - 2 * 8);
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

  test("açık aksiyon cezası 40 puanda sınırlanır (5+ açık aksiyon skoru negatife düşürmez)", () => {
    const findings = Array.from({ length: 10 }, (_, i) => makeDif(`f${i}`, "a1", `c${i}`, "open"));
    const result = computeAuditPreparedness({ company: fullCompany, audits: [], findings });
    assert.equal(result.score, 100 - 40);
  });
});

describe("computeAuditPreparedness — DİF açılmamış 'Uygun Değil' kriterler (eksik/uyarılı alanlar)", () => {
  test("'Uygun Değil' ama DİF'i olmayan kriter tespit edilir", () => {
    const audits = [makeAudit("a1", [makeItem("risk-1", "risk", "uygun_degil"), makeItem("acil-1", "acil", "uygun")])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.equal(result.unresolvedWithoutDif.length, 1);
    assert.equal(result.unresolvedWithoutDif[0].checklistItemId, "risk-1");
  });

  test("DİF'i zaten açılmış bir 'Uygun Değil' kriter tekrar uyarı olarak sayılmaz", () => {
    const audits = [makeAudit("a1", [makeItem("risk-1", "risk", "uygun_degil")])];
    const findings = [makeDif("f1", "a1", "risk-1", "open")];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings });
    assert.equal(result.unresolvedWithoutDif.length, 0);
  });

  test("kritik uyarı sayısı eksik alan + çözülmemiş kriter toplamıdır", () => {
    const audits = [makeAudit("a1", [makeItem("risk-1", "risk", "uygun_degil")])];
    const result = computeAuditPreparedness({ company: { sector: "Gıda" }, audits, findings: [] });
    assert.equal(result.criticalWarningCount, 2 + 1); // 2 eksik alan + 1 çözülmemiş kriter
  });
});

describe("computeAuditPreparedness — öncelikli kontrol alanları doğru çıkarılır", () => {
  test("kategori bazında açık/çözülmemiş/tekrarlayan sayıları doğru toplanır, en çoktan aza sıralanır", () => {
    const audits = [
      makeAudit("a1", [makeItem("risk-1", "risk", "uygun_degil"), makeItem("acil-1", "acil", "uygun_degil")]),
      makeAudit("a2", [makeItem("risk-1", "risk", "uygun_degil")]),
    ];
    const findings = [
      makeDif("f1", "a1", "risk-1", "open"),
      makeDif("f2", "a2", "risk-1", "open"), // aynı kriter, farklı denetim → tekrarlayan
    ];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings });

    const riskArea = result.priorityAreas.find((p) => p.categoryCode === "risk");
    assert.ok(riskArea, "risk kategorisi öncelikli alanlarda olmalı");
    assert.equal(riskArea.openCount, 2);
    assert.equal(riskArea.recurringCount, 1); // yalnızca "risk-1" kriteri tekrarlayan (2 farklı denetimde DİF üretmiş), kategori bazında BİR kez sayılır
    assert.equal(riskArea.total, riskArea.openCount + riskArea.unresolvedCount + riskArea.recurringCount);

    const acilArea = result.priorityAreas.find((p) => p.categoryCode === "acil");
    assert.equal(acilArea.unresolvedCount, 1); // DİF açılmamış "Uygun Değil"

    assert.equal(result.priorityAreas[0].categoryCode, "risk", "en yüksek toplam ilk sırada olmalı");
  });

  test("her öncelikli alan, tıklanabilir bir örnek DİF id'si taşır (kullanıcı ilgili DİF'e geçebilsin)", () => {
    const audits = [makeAudit("a1", [makeItem("risk-1", "risk", "uygun_degil")])];
    const findings = [makeDif("f1", "a1", "risk-1", "open")];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings });
    const riskArea = result.priorityAreas.find((p) => p.categoryCode === "risk");
    assert.equal(riskArea.exampleFindingId, "f1");
  });

  test("yalnızca DİF'i olmayan (unresolvedWithoutDif) bir alan için exampleFindingId null olur", () => {
    const audits = [makeAudit("a1", [makeItem("risk-1", "risk", "uygun_degil")])];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    const riskArea = result.priorityAreas.find((p) => p.categoryCode === "risk");
    assert.equal(riskArea.exampleFindingId, null);
  });

  test("hiç kategori sinyali yoksa öncelikli alanlar boş döner (uydurma kategori yok)", () => {
    const result = computeAuditPreparedness({ company: fullCompany, audits: [], findings: [] });
    assert.deepEqual(result.priorityAreas, []);
  });

  test("en fazla 5 öncelikli alan döner", () => {
    const audits = [makeAudit("a1", ["c1", "c2", "c3", "c4", "c5", "c6"].map((id) => makeItem(id, id, "uygun_degil")))];
    const result = computeAuditPreparedness({ company: fullCompany, audits, findings: [] });
    assert.ok(result.priorityAreas.length <= 5);
  });
});
