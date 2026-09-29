import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildAuditReadinessBreakdown, pickPrimaryAction, getTopPriorityActions } from "./auditReadinessBreakdown.js";

function makeAudit(id, scopeDescription, plannedDate, checklist) {
  return { id, scopeDescription, plannedDate, checklist };
}

function makeItem(id, categoryCode, result, overrides = {}) {
  return { id, categoryCode, title: `Kriter ${id}`, result, evidence: [], verified: true, ...overrides };
}

function makeDif(id, auditId, checklistItemId, criterionTitle, stage, dueDate = null, responsible = "") {
  return { id, auditId, checklistItemId, criterionTitle, stage, dueDate, responsible };
}

const SIX_CATEGORY_KEYS = ["nonconformities", "partiallyCompliant", "missingEvidence", "unevaluated", "actions", "unverifiedLegislation"];

describe("buildAuditReadinessBreakdown — kategori sayısı tam olarak 6", () => {
  test("dönen nesnede tam olarak bu 6 kategori alanı var, fazlası/eksiği yok", () => {
    const result = buildAuditReadinessBreakdown({});
    for (const key of SIX_CATEGORY_KEYS) {
      assert.ok(Array.isArray(result[key]), `${key} bir dizi olmalı`);
    }
    assert.equal(result.openDifs, undefined);
    assert.equal(result.overdueDifs, undefined);
    assert.equal(result.incompleteEvidence, undefined);
  });

  test("Açık DİF ve Gecikmiş DİF ayrı kategori DEĞİL — ikisi de tek 'actions' listesinde", () => {
    const findings = [
      makeDif("d1", "a1", "c1", "Yakın termin", "open", "2099-01-01"),
      makeDif("d2", "a1", "c2", "Gecikmiş", "open", "2020-01-01"),
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
    assert.deepEqual(result.preAuditSummary, { criterionCount: 0, issueCount: 0 });
    assert.equal(result.isFullyReady, false);
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

describe("buildAuditReadinessBreakdown — 6 kategorinin içeriği (kategori davranışları korunuyor)", () => {
  test("1) Uygunsuzluklar (uygun_degil)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [{ id: "e1" }] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.nonconformities.map((r) => r.criterionId), ["c1"]);
  });

  test("2) Kısmen Uygunlar (kismen_uygun), Uygunsuzluklarla karışmaz", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil"), makeItem("c2", "risk", "kismen_uygun")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.partiallyCompliant.map((r) => r.criterionId), ["c2"]);
  });

  test("3) Eksik Kanıtlar: Kanıt Yok VE Eksik Kanıt birlikte", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "degerlendirilmedi", { evidence: [{ id: "e1" }] }), // Eksik Kanıt (incomplete)
      makeItem("c2", "risk", "uygun", { evidence: [] }), // Kanıt Yok (none) — Uygun sonucuna rağmen bu kategoriye girer
      makeItem("c3", "risk", "uygun", { evidence: [{ id: "e2" }] }), // Mevcut — hiçbir kategoriye girmez
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.missingEvidence.map((r) => r.criterionId).sort(), ["c1", "c2"]);
  });

  test("Eksik Kanıtlar bir DİF'in KENDİ kanıtına (dif.evidence) hiç bakmaz — yalnızca checklist[].evidence okunur", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [] })])];
    const findings = [{ id: "d1", auditId: "a1", checklistItemId: "c1", stage: "open", evidence: [{ id: "dif-e1", name: "kapanış-fotografi.jpg" }] }];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    assert.deepEqual(result.missingEvidence.map((r) => r.criterionId), ["c1"]);
  });

  test("4) Değerlendirilmemişler (degerlendirilmedi)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "degerlendirilmedi")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.unevaluated.map((r) => r.criterionId), ["c1"]);
  });

  test("5) Aksiyonlar: gecikmiş DİF önce sıralanır", () => {
    const findings = [
      makeDif("d1", "a1", "c1", "Açık bulgu", "awaitingAction", "2099-01-01"),
      makeDif("d2", "a1", "c2", "Gecikmiş bulgu", "open", "2020-01-01"),
    ];
    const result = buildAuditReadinessBreakdown({ audits: [], findings });
    assert.deepEqual(result.actions.map((f) => f.id), ["d2", "d1"]);
  });

  test("kapalı DİF Aksiyonlar'a hiç dahil edilmez", () => {
    const findings = [makeDif("d1", "a1", "c1", "Kapalı bulgu", "closed", "2020-01-01")];
    const result = buildAuditReadinessBreakdown({ audits: [], findings });
    assert.deepEqual(result.actions, []);
    assert.equal(result.preAuditActions.some((a) => a.difId === "d1"), false);
  });

  test("6) Mevzuat Doğrulaması (verified:false)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun", { verified: false, legislationName: "X Yönetmeliği" }),
      makeItem("c2", "risk", "uygun", { verified: true, legislationName: "Y Kanunu" }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.unverifiedLegislation.map((r) => r.criterionId), ["c1"]);
    assert.equal(result.unverifiedLegislation[0].legislationName, "X Yönetmeliği");
  });

  test("ISO 45001 tipi kriterlerde verified alanı hiç olmadığı için Mevzuat Doğrulaması listesi doğal olarak boş kalır", () => {
    const audits = [makeAudit("a1", "ISO Denetimi", "2026-01-10", [makeItem("c1", "4", "uygun_degil")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.unverifiedLegislation, []);
    assert.deepEqual(result.nonconformities.map((r) => r.criterionId), ["c1"]);
  });
});

describe("buildAuditReadinessBreakdown — Kanıt Yok ≠ Uygun Değil", () => {
  test("Kanıt Yok olan bir 'Uygun' kriter Uygunsuzluklar'a asla girmez, result değişmez", () => {
    const item = makeItem("c1", "risk", "uygun", { evidence: [] });
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [item])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(item.result, "uygun");
    assert.deepEqual(result.nonconformities, []);
    assert.equal(result.missingEvidence.length, 1);
  });
});

describe("buildAuditReadinessBreakdown — isFullyReady (Denetime hazır) korunuyor", () => {
  test("değerlendirilmiş kriter var, hiçbir kategori dolu değilse isFullyReady true, preAuditActions boş", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }], verified: true }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.isFullyReady, true);
    assert.deepEqual(result.preAuditActions, []);
    assert.deepEqual(result.preAuditSummary, { criterionCount: 0, issueCount: 0 });
  });

  test("tek bir açık DİF bile isFullyReady'yi false yapar", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun")])];
    const findings = [makeDif("d1", "a1", "cX", "Başka kriter", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    assert.equal(result.isFullyReady, false);
  });

  test("verified:false varsa isFullyReady true OLMAZ — doğrulama uyarısı yok sayılmaz", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }], verified: false, legislationName: "X" }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.isFullyReady, false);
    assert.equal(result.unverifiedLegislation.length, 1);
  });

  test("hiç değerlendirilmiş kriter yoksa isFullyReady true OLAMAZ", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "degerlendirilmedi")])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.isFullyReady, false);
  });
});

describe("buildAuditReadinessBreakdown — Denetim Öncesi Tamamlanması Gerekenler (BİRLEŞİK satır)", () => {
  test("aynı kriter 3 probleme sahipse (Uygun Değil + Kanıt Eksik + Açık DİF) TEK satır oluşur", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [] })])];
    const findings = [makeDif("d1", "a1", "c1", "Kriter c1", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const rowsForC1 = result.preAuditActions.filter((r) => r.criterionId === "c1");
    assert.equal(rowsForC1.length, 1); // AYRI satırlar değil, TEK satır
  });

  test("sorunların TAMAMI aynı satırda (badges) görünür", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [] })])];
    const findings = [makeDif("d1", "a1", "c1", "Kriter c1", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const row = result.preAuditActions.find((r) => r.criterionId === "c1");
    assert.deepEqual(row.badges.sort(), ["DİF Açık", "Kanıt Eksik", "Uygun Değil"].sort());
  });

  test("her satırda TEK aksiyon butonu (tek actionLabel/actionKind) vardır", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [] })])];
    const findings = [makeDif("d1", "a1", "c1", "Kriter c1", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const row = result.preAuditActions.find((r) => r.criterionId === "c1");
    assert.equal(typeof row.actionLabel, "string");
    assert.ok(["criterion", "dif"].includes(row.actionKind));
    // "Uygun Değil" en yüksek öncelikli olduğu için ana aksiyon "İncele" olmalı.
    assert.equal(row.actionLabel, "İncele");
    assert.equal(row.actionKind, "criterion");
  });

  test("Uygun Değil + Kanıt Yok + Açık DİF örneği → satır formatı istekle birebir eşleşir", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [] })])];
    const findings = [makeDif("d1", "a1", "c1", "Kriter c1", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const row = result.preAuditActions.find((r) => r.criterionId === "c1");
    assert.equal(row.criterionTitle, "Kriter c1");
    // Rozetler sabit öncelik sırasıyla (Uygun Değil > ... > DİF Açık > ... > Kanıt Eksik).
    assert.deepEqual(row.badges, ["Uygun Değil", "DİF Açık", "Kanıt Eksik"]);
    assert.equal(row.actionLabel, "İncele");
  });

  test("aksiyon belirleme: her tek-sorunlu kriter için doğru aksiyon üretilir (yeni öncelik sırasıyla)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c-nc", "risk", "uygun_degil", { evidence: [{ id: "e1" }] }),
      makeItem("c-pc", "risk", "kismen_uygun", { evidence: [{ id: "e1" }] }),
      makeItem("c-me", "risk", "uygun", { evidence: [] }),
      makeItem("c-uv", "risk", "uygun", { evidence: [{ id: "e1" }], verified: false, legislationName: "X" }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const byId = Object.fromEntries(result.preAuditActions.map((r) => [r.criterionId, r]));
    assert.equal(byId["c-nc"].actionLabel, "İncele");
    assert.equal(byId["c-pc"].actionLabel, "İncele"); // artık "Düzenle" değil, Kısmen Uygun → İncele
    assert.equal(byId["c-me"].actionLabel, "Kanıt Ekle");
    assert.equal(byId["c-uv"].actionLabel, "Doğrulamayı İncele"); // artık "Mevzuatı İncele" değil
  });

  // ── REGRESYON: değerlendirilmedi + kanıt mevcut ────────────────────────
  // computeEvidenceStatus'e göre result==='degerlendirilmedi' olan bir kriter ASLA
  // "present" kanıt durumuna sahip olamaz (bkz. criterionEvidence.js) — yani her
  // Değerlendirilmemiş kriter aynı zamanda Eksik Kanıt'tır da. Yeni öncelik sırasında
  // Değerlendirilmedi (1) Eksik Kanıt'tan (6) daha yüksek olduğu için ana aksiyon artık
  // DOĞRU şekilde "Değerlendir" olur — HER İKİ rozet de satırda kalmaya devam eder.
  test("REGRESYON: 'degerlendirilmedi + evidence mevcut' → Değerlendirilmedi VE Eksik Kanıt rozetleri birlikte, ana aksiyon Değerlendir", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "degerlendirilmedi", { evidence: [{ id: "e1" }] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const row = result.preAuditActions.find((r) => r.criterionId === "c1");
    assert.ok(row.badges.includes("Değerlendirilmedi"));
    assert.ok(row.badges.includes("Kanıt Eksik"));
    assert.equal(row.actionLabel, "Değerlendir");
  });

  test("gecikmiş DİF doğru önceliklenir: yalnızca DİF sorunu olan kriterlerde gecikmiş olan açık olandan önce sıralanır", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }] }),
      makeItem("c2", "risk", "uygun", { evidence: [{ id: "e1" }] }),
    ])];
    const findings = [
      makeDif("d1", "a1", "c1", "Kriter c1", "open", "2099-01-01"), // açık, gecikmemiş
      makeDif("d2", "a1", "c2", "Kriter c2", "open", "2020-01-01"), // gecikmiş
    ];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const order = result.preAuditActions.map((r) => r.criterionId);
    assert.ok(order.indexOf("c2") < order.indexOf("c1")); // gecikmiş (c2) önce
  });

  test("genel sıralama: Değerlendirilmedi > Uygun Değil > Gecikmiş DİF > Açık DİF > Kısmen Uygun > Kanıt Eksik > Mevzuat", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c-nc", "risk", "uygun_degil", { evidence: [{ id: "e1" }] }),
      makeItem("c-pc", "risk", "kismen_uygun", { evidence: [{ id: "e1" }] }),
      makeItem("c-me", "risk", "uygun", { evidence: [] }),
      makeItem("c-ue", "risk", "degerlendirilmedi", { evidence: [{ id: "e1" }] }),
      makeItem("c-uv", "risk", "uygun", { evidence: [{ id: "e1" }], verified: false, legislationName: "X" }),
      makeItem("c-difopen", "risk", "uygun", { evidence: [{ id: "e1" }] }),
      makeItem("c-difoverdue", "risk", "uygun", { evidence: [{ id: "e1" }] }),
    ])];
    const findings = [
      makeDif("d1", "a1", "c-difopen", "Açık DİF kriteri", "open", "2099-01-01"),
      makeDif("d2", "a1", "c-difoverdue", "Gecikmiş DİF kriteri", "open", "2020-01-01"),
    ];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const order = result.preAuditActions.map((r) => r.criterionId);
    // c-ue (Değerlendirilmedi) her şeyden önce gelir — Kanıt Eksik'i de taşısa bile.
    assert.deepEqual(order, ["c-ue", "c-nc", "c-difoverdue", "c-difopen", "c-pc", "c-me", "c-uv"]);
  });

  test("boş durum: hiç sorun yoksa preAuditActions boş, isFullyReady true kalır", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.preAuditActions, []);
    assert.equal(result.isFullyReady, true);
  });
});

describe("pickPrimaryAction — TEK merkezi ana aksiyon seçim fonksiyonu (istekteki tüm senaryolar)", () => {
  test("issueKeys boşsa null döner", () => {
    assert.equal(pickPrimaryAction([]), null);
  });

  test("Değerlendirilmedi + kanıt yok → Değerlendir", () => {
    const audits = [makeAudit("a1", "S", "2026-01-01", [makeItem("c1", "risk", "degerlendirilmedi", { evidence: [] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const row = result.preAuditActions.find((r) => r.criterionId === "c1");
    assert.equal(row.actionLabel, "Değerlendir");
    assert.ok(row.badges.includes("Değerlendirilmedi"));
    assert.ok(row.badges.includes("Kanıt Eksik"));
  });

  test("Değerlendirilmedi + kanıt var (incomplete) → Değerlendir", () => {
    const audits = [makeAudit("a1", "S", "2026-01-01", [makeItem("c1", "risk", "degerlendirilmedi", { evidence: [{ id: "e1" }] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const row = result.preAuditActions.find((r) => r.criterionId === "c1");
    assert.equal(row.actionLabel, "Değerlendir");
  });

  test("Değerlendirilmedi + açık DİF → Değerlendir (değerlendirilmemişlik öncelikli)", () => {
    const result = pickPrimaryAction(["unevaluated", "difOpen"]);
    assert.equal(result.actionLabel, "Değerlendir");
    assert.deepEqual(result.badges, ["Değerlendirilmedi", "DİF Açık"]);
  });

  test("Uygun + kanıt yok → Kanıt Ekle", () => {
    const result = pickPrimaryAction(["missingEvidence"]);
    assert.equal(result.actionLabel, "Kanıt Ekle");
  });

  test("Uygun + eksik kanıt + mevzuat doğrulaması → Kanıt Ekle", () => {
    const result = pickPrimaryAction(["missingEvidence", "unverified"]);
    assert.equal(result.actionLabel, "Kanıt Ekle");
    assert.deepEqual(result.badges, ["Kanıt Eksik", "Mevzuat Doğrulaması"]);
  });

  test("Uygun Değil + kanıt yok → İncele", () => {
    const result = pickPrimaryAction(["uygun_degil", "missingEvidence"]);
    assert.equal(result.actionLabel, "İncele");
  });

  test("Uygun Değil + açık DİF → İncele", () => {
    const result = pickPrimaryAction(["uygun_degil", "difOpen"]);
    assert.equal(result.actionLabel, "İncele");
  });

  test("Uygun Değil + gecikmiş DİF → İncele (Uygun Değil, gecikmiş DİF'ten bile önceliklidir)", () => {
    const result = pickPrimaryAction(["uygun_degil", "difOverdue"]);
    assert.equal(result.actionLabel, "İncele");
  });

  test("Kısmen Uygun + kanıt eksik → İncele", () => {
    const result = pickPrimaryAction(["kismen_uygun", "missingEvidence"]);
    assert.equal(result.actionLabel, "İncele");
  });

  test("Yalnızca eksik kanıt → Kanıt Ekle", () => {
    const result = pickPrimaryAction(["missingEvidence"]);
    assert.equal(result.actionLabel, "Kanıt Ekle");
  });

  test("Yalnızca mevzuat doğrulaması → Doğrulamayı İncele", () => {
    const result = pickPrimaryAction(["unverified"]);
    assert.equal(result.actionLabel, "Doğrulamayı İncele");
  });

  test("tam öncelik sırası: Değerlendirilmedi > Uygun Değil > Gecikmiş DİF > Açık DİF > Kısmen Uygun > Eksik Kanıt > Mevzuat", () => {
    const allKeys = ["unverified", "missingEvidence", "kismen_uygun", "difOpen", "difOverdue", "uygun_degil", "unevaluated"];
    const result = pickPrimaryAction(allKeys);
    assert.equal(result.actionLabel, "Değerlendir"); // en yüksek öncelikli: unevaluated
    assert.deepEqual(result.badges, ["Değerlendirilmedi", "Uygun Değil", "DİF Gecikmiş", "DİF Açık", "Kısmen Uygun", "Kanıt Eksik", "Mevzuat Doğrulaması"]);
  });

  test("rozetlerin tamamı korunur — ana aksiyon değişse bile diğer sorunlar kaybolmaz", () => {
    // Ana aksiyon Değerlendir olsa da diğer 2 sorun (Uygun Değil, Kanıt Eksik) rozet
    // olarak KAYBOLMAZ — hepsi aynı satırda görünür.
    const result = pickPrimaryAction(["unevaluated", "uygun_degil", "missingEvidence"]);
    assert.equal(result.actionLabel, "Değerlendir");
    assert.equal(result.badges.length, 3);
    assert.deepEqual(result.badges, ["Değerlendirilmedi", "Uygun Değil", "Kanıt Eksik"]);
  });
});

describe("buildAuditReadinessBreakdown — kriter/konu özeti (preAuditSummary)", () => {
  test("tek sorunlu kriterlerde kriter sayısı = konu sayısı", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun_degil", { evidence: [{ id: "e1" }] }),
      makeItem("c2", "risk", "kismen_uygun", { evidence: [{ id: "e1" }] }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.preAuditSummary, { criterionCount: 2, issueCount: 2 });
  });

  test("aynı kriter iki problem taşıyorsa kriter sayısı 1, konu sayısı 2 olur", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun_degil", { evidence: [] }), // Uygun Değil + Kanıt Eksik = 2 konu, 1 kriter
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(result.preAuditSummary, { criterionCount: 1, issueCount: 2 });
  });

  test("5 kriterde 8 konu örneğine benzer karma senaryo doğru sayılır", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c1", "risk", "uygun_degil", { evidence: [] }), // Uygun Değil + Kanıt Eksik = 2 konu
      makeItem("c2", "risk", "kismen_uygun", { evidence: [{ id: "e1" }] }), // Kısmen Uygun + (aşağıdaki DİF) = 2 konu
      makeItem("c3", "risk", "uygun", { evidence: [] }), // Kanıt Eksik = 1 konu
      makeItem("c4", "risk", "degerlendirilmedi", { evidence: [{ id: "e1" }] }), // Kanıt Eksik + Değerlendirilmedi = 2 konu (bkz. yapısal not testi)
      makeItem("c5", "risk", "uygun", { evidence: [{ id: "e1" }], verified: false, legislationName: "X" }), // Mevzuat Doğrulaması = 1 konu
    ])];
    const findings = [makeDif("d1", "a1", "c2", "Kriter c2", "open")]; // c2'ye +1 konu (Açık DİF)
    const result = buildAuditReadinessBreakdown({ audits, findings });
    assert.equal(result.preAuditSummary.criterionCount, 5);
    assert.equal(result.preAuditSummary.issueCount, 8); // 2+2+1+2+1
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
    const findings = [makeDif("d1", "a1", "c1", "Forklift bakım kaydı", "open")];
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

// ── AuditReadinessPanel.jsx TUTARLILIK TESTLERİ ──────────────────────────────
// AuditReadinessPanel.jsx artık kendi kategori bölümlerinde HARDCODED aksiyon
// etiketi kullanmıyor — her satır için preAuditActions'taki (auditId+criterionId
// eşleşen) satırı bulup ONUN actionLabel'ını gösteriyor (bkz. AuditReadinessPanel.jsx
// → resolveAction()). Burada bu DAVRANIŞI, panelin yaptığı AYNI eşleştirmeyi test
// içinde simüle ederek doğruluyoruz: React render'ı olmadan da veri katmanının
// "aynı kriter, aynı aksiyon" garantisini VERDİĞİNİ kanıtlıyoruz.
describe("Kategori bölümleri ve birleşik liste TUTARLILIĞI (pickPrimaryAction tek kaynak)", () => {
  function actionMapFrom(result) {
    const map = new Map();
    result.preAuditActions.forEach((row) => {
      if (row.criterionId != null) map.set(`${row.auditId}::${row.criterionId}`, row);
    });
    return map;
  }

  test("yalnızca Uygunsuzluk olan bir kriter, kategori bölümünde de birleşik listede de 'İncele' gösterir", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [{ id: "e1" }] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const map = actionMapFrom(result);
    const mergedAction = map.get(`${result.nonconformities[0].auditId}::${result.nonconformities[0].criterionId}`);
    assert.equal(mergedAction.actionLabel, "İncele");
  });

  test("ÖNEMLİ SENARYO: hem Uygunsuzluk hem Açık DİF olan bir kriter, Aksiyonlar bölümünde bile 'Yönet' değil 'İncele' göstermeli " +
    "(Uygun Değil, Açık DİF'ten daha yüksek öncelikli — aynı kriter iki farklı bölümde FARKLI aksiyon göstermemeli)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [{ id: "e1" }] })])];
    const findings = [makeDif("d1", "a1", "c1", "Kriter c1", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const map = actionMapFrom(result);

    // Uygunsuzluklar bölümündeki satır:
    const nonconformityAction = map.get(`${result.nonconformities[0].auditId}::${result.nonconformities[0].criterionId}`);
    // Aksiyonlar bölümündeki AYNI kriterin DİF'i — panelin yaptığı gibi checklistItemId ile eşleştirilir:
    const difRow = result.actions[0];
    const actionsSectionAction = map.get(`${difRow.auditId}::${difRow.checklistItemId}`);

    assert.equal(nonconformityAction.actionLabel, "İncele");
    assert.equal(actionsSectionAction.actionLabel, "İncele"); // AYNI kriter, AYNI aksiyon — "Yönet" DEĞİL
    assert.equal(nonconformityAction, actionsSectionAction); // gerçekten AYNI satır nesnesi
  });

  test("yalnızca Açık DİF olan (başka sorunu olmayan) kriter Aksiyonlar bölümünde 'DİF'i Yönet' gösterir", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }] })])];
    const findings = [makeDif("d1", "a1", "c1", "Kriter c1", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const map = actionMapFrom(result);
    const difRow = result.actions[0];
    const action = map.get(`${difRow.auditId}::${difRow.checklistItemId}`);
    assert.equal(action.actionLabel, "DİF'i Yönet");
    assert.equal(action.actionKind, "dif");
  });

  test("hem Kısmen Uygun hem Eksik Kanıt olan kriter iki bölümde de 'İncele' gösterir (Kısmen Uygun, Eksik Kanıt'tan yüksek öncelikli)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "kismen_uygun", { evidence: [] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const map = actionMapFrom(result);
    const partialAction = map.get(`${result.partiallyCompliant[0].auditId}::${result.partiallyCompliant[0].criterionId}`);
    const evidenceAction = map.get(`${result.missingEvidence[0].auditId}::${result.missingEvidence[0].criterionId}`);
    assert.equal(partialAction.actionLabel, "İncele");
    assert.equal(evidenceAction.actionLabel, "İncele");
    assert.equal(partialAction, evidenceAction); // aynı satır — iki bölümde de aynı obje
  });

  test("her 6 kategorinin TEK sorunlu örnek satırı, panelin kullandığı aksiyon kelime dağarcığıyla birebir eşleşir", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c-nc", "risk", "uygun_degil", { evidence: [{ id: "e1" }] }),
      makeItem("c-pc", "risk", "kismen_uygun", { evidence: [{ id: "e1" }] }),
      makeItem("c-me", "risk", "uygun", { evidence: [] }),
      makeItem("c-ue", "risk", "degerlendirilmedi", { evidence: [] }),
      makeItem("c-uv", "risk", "uygun", { evidence: [{ id: "e1" }], verified: false, legislationName: "X" }),
    ])];
    const findings = [makeDif("d1", "a1", "c-solo-dif", "Yalnızca DİF kriteri", "open")];
    const audits2 = [makeAudit("a1", "Saha 1", "2026-01-10", [...audits[0].checklist, makeItem("c-solo-dif", "risk", "uygun", { evidence: [{ id: "e1" }] })])];
    const result = buildAuditReadinessBreakdown({ audits: audits2, findings });
    const map = actionMapFrom(result);

    assert.equal(map.get("a1::c-nc").actionLabel, "İncele");
    assert.equal(map.get("a1::c-pc").actionLabel, "İncele");
    assert.equal(map.get("a1::c-me").actionLabel, "Kanıt Ekle");
    assert.equal(map.get("a1::c-ue").actionLabel, "Değerlendir");
    assert.equal(map.get("a1::c-uv").actionLabel, "Doğrulamayı İncele");
    assert.equal(map.get("a1::c-solo-dif").actionLabel, "DİF'i Yönet");
  });
});

// ── "Şimdi Yapılmalı" bölümü (getTopPriorityActions) ─────────────────────────
describe("getTopPriorityActions — 'Şimdi Yapılmalı' için en fazla N kayıt, YENİ sıralama YOK", () => {
  test("5'ten fazla aksiyon varsa en fazla 5 tanesi döner", () => {
    const checklist = Array.from({ length: 8 }, (_, i) => makeItem(`c${i}`, "risk", "uygun_degil", { evidence: [{ id: "e1" }] }));
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", checklist)];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(result.preAuditActions.length, 8); // tam liste hâlâ 8
    const top = getTopPriorityActions(result.preAuditActions);
    assert.equal(top.length, 5); // "Şimdi Yapılmalı" en fazla 5
  });

  test("5'ten az aksiyon varsa hepsi döner (yapay olarak 5'e tamamlanmaz)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [{ id: "e1" }] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const top = getTopPriorityActions(result.preAuditActions);
    assert.equal(top.length, 1);
  });

  test("boşsa boş dizi döner (undefined/null da çökmez)", () => {
    assert.deepEqual(getTopPriorityActions([]), []);
    assert.deepEqual(getTopPriorityActions(undefined), []);
    assert.deepEqual(getTopPriorityActions(null), []);
  });

  test("özel limit parametresi desteklenir", () => {
    const checklist = Array.from({ length: 8 }, (_, i) => makeItem(`c${i}`, "risk", "uygun_degil", { evidence: [{ id: "e1" }] }));
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", checklist)];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.equal(getTopPriorityActions(result.preAuditActions, 3).length, 3);
  });

  test("sıralama pickPrimaryAction ile uyumlu — dönen ilk N kayıt, tam listenin İLK N'i ile BİREBİR aynıdır (yeniden sıralama yok)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [
      makeItem("c-uv", "risk", "uygun", { evidence: [{ id: "e1" }], verified: false, legislationName: "X" }), // en düşük öncelik
      makeItem("c-nc", "risk", "uygun_degil", { evidence: [{ id: "e1" }] }), // en yüksek öncelik
      makeItem("c-me", "risk", "uygun", { evidence: [] }),
      makeItem("c-pc", "risk", "kismen_uygun", { evidence: [{ id: "e1" }] }),
      makeItem("c-ue", "risk", "degerlendirilmedi", { evidence: [] }),
    ])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    const top = getTopPriorityActions(result.preAuditActions, 3);
    // Tam liste zaten pickPrimaryAction önceliğine göre sıralı geliyor (Değerlendirilmedi
    // > Uygun Değil > ... ); getTopPriorityActions bu sırayı DEĞİŞTİRMEDEN ilk 3'ü alır.
    assert.deepEqual(top.map((r) => r.criterionId), result.preAuditActions.slice(0, 3).map((r) => r.criterionId));
    assert.equal(top[0].criterionId, "c-ue"); // Değerlendirilmedi en önde
    assert.equal(top[1].criterionId, "c-nc"); // sonra Uygun Değil
  });

  test("aynı kriter birden fazla soruna sahip olsa bile 'Şimdi Yapılmalı'da TEK satır olarak kalır (dilimleme birleştirmeyi bozmaz)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun_degil", { evidence: [] })])];
    const findings = [makeDif("d1", "a1", "c1", "Kriter c1", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const top = getTopPriorityActions(result.preAuditActions);
    const rowsForC1 = top.filter((r) => r.criterionId === "c1");
    assert.equal(rowsForC1.length, 1);
    assert.equal(rowsForC1[0].badges.length, 3); // Uygun Değil + Kanıt Eksik + Açık DİF rozetleri kaybolmadı
  });

  test("her satırda doğru navigasyon bilgisi (auditId/actionKind/difId) korunur", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }] })])];
    const findings = [makeDif("d1", "a1", "c1", "Kriter c1", "open")];
    const result = buildAuditReadinessBreakdown({ audits, findings });
    const top = getTopPriorityActions(result.preAuditActions);
    assert.equal(top[0].actionKind, "dif");
    assert.equal(top[0].difId, "d1");
  });

  test("boş durum: hiç aksiyon yoksa getTopPriorityActions boş dizi döner (panel bu durumda 'Denetime hazırlık için açık aksiyon bulunmuyor.' gösterir)", () => {
    const audits = [makeAudit("a1", "Saha 1", "2026-01-10", [makeItem("c1", "risk", "uygun", { evidence: [{ id: "e1" }] })])];
    const result = buildAuditReadinessBreakdown({ audits, findings: [] });
    assert.deepEqual(getTopPriorityActions(result.preAuditActions), []);
  });
});
