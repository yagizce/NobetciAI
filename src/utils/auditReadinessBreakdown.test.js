import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildAuditReadinessBreakdown } from "./auditReadinessBreakdown.js";

function makeAudit(id, scopeDescription, plannedDate, checklist) {
  return { id, scopeDescription, plannedDate, checklist };
}

function makeItem(id, categoryCode, result, overrides = {}) {
  return { id, categoryCode, title: `Kriter ${id}`, result, evidence: [], verified: true, ...overrides };
}

function makeDif(id, auditId, criterionTitle, stage, dueDate = null, responsible = "") {
  return { id, auditId, criterionTitle, stage, dueDate, responsible };
}

const SIX_CATEGORY_KEYS = ["nonconformities", "partiallyCompliant", "missingEvidence", "unevaluated", "actions", "unverifiedLegislation"];

describe("buildAuditReadinessBreakdown — kategori sayısı tam olarak 6", () => {
  test("dönen nesnede tam olarak bu 6 kategori alanı var, fazlası/eksiği yok", () => {
    const result = buildAuditReadinessBreakdown({});
    for (const key of SIX_CATEGORY_KEYS) {
      assert.ok(Array.isArray(result[key]), `${key} bir dizi olmalı`);
    }
    // Eski sürümde ayrı birer kategori olan openDifs/overdueDifs/incompleteEvidence
    // artık YOK — openDifs+overdueDifs "actions" içinde birleşti, incompleteEvidence
    // "missingEvidence" oldu (Kanıt Yok + Eksik Kanıt birleşik).
    assert.equal(result.openDifs, undefined);
    assert.equal(result.overdueDifs, undefined);
    assert.equal(result.incompleteEvidence, undefined);
  });

  test("Açık DİF ve Gecikmiş DİF ayrı kategori DEĞİL — ikisi de tek 'actions' listesinde", () => {
    const findings = [
      makeDif("d1", "a1", "Yakın termin", "open", "2099-01-01"),
      makeDif("d2", "a1", "Gecikmiş", "open", "2020-01-01"),
    ];
    const result = buildAuditReadinessBreakdown({ audits: [], findings });
    assert.equal(result.actions.length, 2);
    assert.equal(result.actions.filter((f) => f.overdue).length, 1);
  });
});

describe("buildAuditReadinessBreakdown — hiç veri yokken", () => {
  test("audits/findings verilmezse çökmez, her şey boş ve hasAnyAudits false döner", () => {
    const result = buildAuditReadinessBreakdown({});
    assert.equal(result.hasAnyAudits, false);
    assert.equal(result.hasAnyEvaluatedCriteria, false);
    for (const key of SIX_CATEGORY_KEYS) assert.deepEqual(result[key], []);
    assert.deepEqual(result.preAuditActions, []);
    assert.equal(result.isFullyReady, false); // hasAnyAudits false olduğu için "hazır" denemez
  });

  test("denetim var ama hiçbir kriter değerlendirilmemişse hasAnyEvaluatedCriteria false, Değerlendirilmemişler tüm kriterleri listeler", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "degerlendirilmedi"), makeItem("c2", "risk", "degerlendirilmedi")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.hasAnyAudits, true);
    assert.equal(result.hasAnyEvaluatedCriteria, false);
    assert.equal(result.unevaluated.length, 2);
    assert.equal(result.isFullyReady, false);
  });
});

describe("buildAuditReadinessBreakdown — 6 kategorinin içeriği ve doğru aksiyonlar", () => {
  test("1) Uygunsuzluklar (uygun_degil) → aksiyon 'İncele'", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.nonconformities.map((r) => r.criterionId), ["c1"]);
    const action = result.preAuditActions.find((a) => a.criterionId === "c1" && a.sectionLabel === "Uygunsuzluk");
    assert.equal(action.actionLabel, "İncele");
  });

  test("2) Kısmen Uygunlar (kismen_uygun) → aksiyon 'Düzenle', Uygunsuzluklarla karışmaz", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil"), makeItem("c2", "risk", "kismen_uygun")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.partiallyCompliant.map((r) => r.criterionId), ["c2"]);
    const action = result.preAuditActions.find((a) => a.criterionId === "c2");
    assert.equal(action.actionLabel, "Düzenle");
  });

  test("3) Eksik Kanıtlar: Kanıt Yok VE Eksik Kanıt birlikte, aksiyon 'Düzenle'", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "degerlendirilmedi", { evidence: [{ id: "e1" }] }), // Eksik Kanıt (incomplete)
      makeItem("c2", "risk", "uygun", { evidence: [] }), // Kanıt Yok (none) — Uygun sonucuna rağmen bu kategoriye girer
      makeItem("c3", "risk", "uygun", { evidence: [{ id: "e2" }] }), // Mevcut — hiçbir kategoriye girmez
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.missingEvidence.map((r) => r.criterionId).sort(), ["c1", "c2"]);
    const c1 = result.missingEvidence.find((r) => r.criterionId === "c1");
    const c2 = result.missingEvidence.find((r) => r.criterionId === "c2");
    assert.equal(c1.statusLabel, "Eksik Kanıt");
    assert.equal(c2.statusLabel, "Kanıt Yok");
    const action = result.preAuditActions.find((a) => a.criterionId === "c2" && a.sectionLabel === "Eksik Kanıt");
    assert.equal(action.actionLabel, "Düzenle");
  });

  test("Eksik Kanıtlar bir DİF'in KENDİ kanıtına (dif.evidence) hiç bakmaz — yalnızca checklist[].evidence okunur", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [] })])];
    // DİF'in kendi aksiyon kanıtı dolu olsa bile checklist kanıtı hâlâ boş —
    // Eksik Kanıtlar'da görünmeye devam etmeli.
    const findings = [{ id: "d1", auditId: "a1", checklistItemId: "c1", stage: "open", evidence: [{ id: "dif-e1", name: "kapanış-fotografi.jpg" }] }];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    assert.deepEqual(result.missingEvidence.map((r) => r.criterionId), ["c1"]);
  });

  test("4) Değerlendirilmemişler (degerlendirilmedi) → aksiyon 'Düzenle'", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "degerlendirilmedi")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.unevaluated.map((r) => r.criterionId), ["c1"]);
    const action = result.preAuditActions.find((a) => a.sectionLabel === "Değerlendirilmemiş");
    assert.equal(action.actionLabel, "Düzenle");
  });

  test("5) Aksiyonlar: açık DİF → 'Yönet', gecikmiş DİF → 'Yönet' + öncelikli görünür", () => {
    const findings = [
      makeDif("d1", "a1", "Açık bulgu", "awaitingAction", "2099-01-01"),
      makeDif("d2", "a1", "Gecikmiş bulgu", "open", "2020-01-01"),
    ];
    const result = buildAuditReadinessBreakdown({ audits: [], findings });
    assert.equal(result.actions.length, 2);
    assert.deepEqual(result.actions.map((f) => f.id), ["d2", "d1"]); // gecikmiş önce
    const overdueAction = result.preAuditActions.find((a) => a.id === "d2");
    const openAction = result.preAuditActions.find((a) => a.id === "d1");
    assert.equal(overdueAction.actionLabel, "Yönet");
    assert.equal(overdueAction.sectionLabel, "Gecikmiş DİF");
    assert.equal(openAction.sectionLabel, "Açık DİF");
  });

  test("kapalı DİF Aksiyonlar'a hiç dahil edilmez", () => {
    const findings = [makeDif("d1", "a1", "Kapalı bulgu", "closed", "2020-01-01")];
    const result = buildAuditReadinessBreakdown({ audits: [], findings });
    assert.deepEqual(result.actions, []);
    assert.equal(result.preAuditActions.some((a) => a.id === "d1"), false);
  });

  test("6) Mevzuat Doğrulaması (verified:false) → aksiyon 'İncele', doğru uyarı", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun", { verified: false, legislationName: "X Yönetmeliği" }),
      makeItem("c2", "risk", "uygun", { verified: true, legislationName: "Y Kanunu" }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.unverifiedLegislation.map((r) => r.criterionId), ["c1"]);
    assert.equal(result.unverifiedLegislation[0].legislationName, "X Yönetmeliği");
    const action = result.preAuditActions.find((a) => a.criterionId === "c1" && a.sectionLabel === "Mevzuat Doğrulaması");
    assert.equal(action.actionLabel, "İncele");
  });

  test("ISO 45001 tipi kriterlerde verified alanı hiç olmadığı için Mevzuat Doğrulaması listesi doğal olarak boş kalır", () => {
    const audits = [makeAudit("a1", "ISO Denetimi", "2026-01-10", [makeItem("c1", "4", "uygun_degil")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.unverifiedLegislation, []);
    assert.deepEqual(result.nonconformities.map((r) => r.criterionId), ["c1"]); // diğer kategoriler etkilenmez
  });
});

describe("buildAuditReadinessBreakdown — Kanıt Yok ≠ Uygun Değil", () => {
  test("Kanıt Yok olan bir 'Uygun' kriter Uygunsuzluklar'a asla girmez, result değişmez", () => {
    const item = makeItem("c1", "risk", "uygun", { evidence: [] });
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [item])];
    buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(item.result, "uygun"); // fonksiyon hiçbir alanı yazmaz
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.nonconformities, []);
    assert.equal(result.missingEvidence.length, 1);
  });
});

describe("buildAuditReadinessBreakdown — isFullyReady (Denetime hazır)", () => {
  test("değerlendirilmiş kriter var, hiçbir kategori dolu değilse isFullyReady true", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }], verified: true }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.isFullyReady, true);
    assert.deepEqual(result.preAuditActions, []);
  });

  test("tek bir açık DİF bile isFullyReady'yi false yapar", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun")])];
    const findings = [makeDif("d1", "a1", "Başka kriter", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    assert.equal(result.isFullyReady, false);
  });

  test("diğer 5 kategori boş olsa bile verified:false varsa isFullyReady true OLMAZ — doğrulama uyarısı yok sayılmaz", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }], verified: false, legislationName: "X" }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.isFullyReady, false);
    assert.equal(result.unverifiedLegislation.length, 1);
  });

  test("hiç değerlendirilmiş kriter yoksa isFullyReady true OLAMAZ (henüz değerlendirilemedi durumu ile karışmaz)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "degerlendirilmedi")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.isFullyReady, false);
  });
});

describe("buildAuditReadinessBreakdown — Denetim Öncesi Tamamlanması Gerekenler sırası", () => {
  test("preAuditActions sabit kategori sırasına göre düzleştirilir: Uygunsuzluk, Kısmen Uygun, Eksik Kanıt, Değerlendirilmemiş, DİF, Mevzuat", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c-nc", "risk", "uygun_degil", { evidence: [{ id: "e1" }] }),
      makeItem("c-pc", "risk", "kismen_uygun", { evidence: [{ id: "e1" }] }),
      makeItem("c-me", "risk", "uygun", { evidence: [] }),
      makeItem("c-ue", "risk", "degerlendirilmedi", { evidence: [] }),
      makeItem("c-uv", "risk", "uygun", { evidence: [{ id: "e1" }], verified: false, legislationName: "X" }),
    ])];
    const findings = [makeDif("d1", "a1", "DİF kriteri", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const sections = result.preAuditActions.map((a) => a.sectionLabel);
    // c-me hem Eksik Kanıt hem c-ue Değerlendirilmemiş+Eksik Kanıt üretir; yine de
    // genel BLOK sırası (Uygunsuzluk → ... → Mevzuat) korunmalı.
    const firstNonconformityIdx = sections.indexOf("Uygunsuzluk");
    const firstPartialIdx = sections.indexOf("Kısmen Uygun");
    const firstEvidenceIdx = sections.indexOf("Eksik Kanıt");
    const firstUnevaluatedIdx = sections.indexOf("Değerlendirilmemiş");
    const firstDifIdx = sections.findIndex((s) => s === "Açık DİF" || s === "Gecikmiş DİF");
    const firstLegislationIdx = sections.indexOf("Mevzuat Doğrulaması");
    assert.ok(firstNonconformityIdx < firstPartialIdx);
    assert.ok(firstPartialIdx < firstEvidenceIdx);
    assert.ok(firstEvidenceIdx < firstUnevaluatedIdx);
    assert.ok(firstUnevaluatedIdx < firstDifIdx);
    assert.ok(firstDifIdx < firstLegislationIdx);
  });

  test("aynı kriter birden fazla kategoriye giriyorsa (ör. Uygunsuzluk + Eksik Kanıt), her ikisi de ayrı satır olarak görünür", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const rowsForC1 = result.preAuditActions.filter((a) => a.criterionId === "c1");
    assert.equal(rowsForC1.length, 2);
    assert.deepEqual(rowsForC1.map((r) => r.sectionLabel).sort(), ["Eksik Kanıt", "Uygunsuzluk"]);
  });
});

describe("buildAuditReadinessBreakdown — satır bilgisi doğru aktarılır", () => {
  test("her kriter satırı hangi denetime ait olduğunu (kapsam + tarih) taşır", () => {
    const audits = [makeAudit("a1", "Depo B", "2026-03-01", [makeItem("c1", "risk", "uygun_degil")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.nonconformities[0].auditLabel, "Depo B — 2026-03-01");
    assert.equal(result.nonconformities[0].auditId, "a1");
  });

  test("DİF satırı kendi üzerindeki criterionTitle'ı kullanır, yeniden aranmaz", () => {
    const findings = [makeDif("d1", "a1", "Forklift bakım kaydı", "open")];
    const result = buildAuditReadinessBreakdown({ audits: [], findings });
    assert.equal(result.actions[0].criterionTitle, "Forklift bakım kaydı");
  });

  test("mevzuat dayanağı varsa satırda aynen taşınır, uydurulmaz", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { legislationName: "6331 sayılı Kanun", article: "Madde 10" })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.nonconformities[0].legislationName, "6331 sayılı Kanun");
    assert.equal(result.nonconformities[0].article, "Madde 10");
  });
});
