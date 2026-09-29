import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildAuditReportData } from "./auditReport.js";
import {
  CHECKLIST_RESULTS, getResultMeta, computeOverallScore, computeProgressPercent, computeCategoryScores,
} from "../constants/auditScoring.js";

const CATEGORIES = [
  { code: "risk", title: "Risk Değerlendirmesi" },
  { code: "egitim", title: "İSG Eğitimleri" },
];
function getCategoryTitle(code) {
  return CATEGORIES.find((c) => c.code === code)?.title || code;
}

function baseConfig(overrides = {}) {
  return {
    standardLabel: "İSG Mevzuat",
    checklistResults: CHECKLIST_RESULTS,
    getResultMeta,
    computeOverallScore,
    computeProgressPercent,
    computeCategoryScores: (checklist) => computeCategoryScores(checklist, CATEGORIES),
    getCategoryTitle,
    ...overrides,
  };
}

function makeItem(id, categoryCode, result, extra = {}) {
  return { id, categoryCode, title: `Kriter ${id}`, result, note: "", departmentId: null, evidence: [], ...extra };
}

function makeAudit(overrides = {}) {
  return {
    id: "audit-1",
    companyId: "company-1",
    standard: "mevzuat",
    scopeDescription: "Üretim sahası",
    plannedDate: "2026-01-10",
    completedAt: "2026-01-12T10:00:00.000Z",
    checklist: [],
    ...overrides,
  };
}

describe("buildAuditReportData — temel davranış", () => {
  test("audit yoksa null döner", () => {
    assert.equal(buildAuditReportData({ audit: null, ...baseConfig() }), null);
  });

  test("kapak bilgileri yalnızca gerçek verilerden gelir, hiçbir alan uydurulmaz", () => {
    const audit = makeAudit();
    const company = { name: "ACME A.Ş.", sector: "Metal İşleme", dangerClass: "tehlikeli" };
    const report = buildAuditReportData({
      audit, company, findings: [], auditorName: "Elif Demir", ...baseConfig(),
    });
    assert.equal(report.cover.companyName, "ACME A.Ş.");
    assert.equal(report.cover.auditName, "Üretim sahası");
    assert.equal(report.cover.plannedDate, "2026-01-10");
    assert.equal(report.cover.auditorLabel, "Elif Demir");
    assert.equal(report.cover.standardLabel, "İSG Mevzuat");
  });

  test("denetçi adı verilmezse rol etiketiyle DOLDURULMAZ, boş kalır", () => {
    const audit = makeAudit();
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    // auditorName geçirilmedi — cover.auditorLabel "İSG Uzmanı" gibi bir rol
    // etiketiyle DOLDURULMAMALI, boş string olarak kalmalı (UI bunu "Belirtilmemiş"
    // gösterir, bu dosya bir isim UYDURMAZ).
    assert.equal(report.cover.auditorLabel, "");
  });

  test("şirket/denetçi verisi yoksa alanlar boş kalır, sahte değer üretilmez", () => {
    const audit = makeAudit();
    const report = buildAuditReportData({ audit, company: null, findings: [], ...baseConfig() });
    assert.equal(report.cover.companyName, "");
    assert.equal(report.cover.auditorLabel, "");
    assert.equal(report.cover.dangerClassLabel, "");
  });
});

describe("buildAuditReportData — sonuç dağılımı (Yönetici Özeti)", () => {
  test("5 gerçek sonuç kategorisi doğru sayılır, uydurma 'Uygulanamaz' kategorisi eklenmez", () => {
    const checklist = [
      makeItem("1", "risk", "uygun"),
      makeItem("2", "risk", "uygun"),
      makeItem("3", "risk", "kismen_uygun"),
      makeItem("4", "egitim", "uygun_degil"),
      makeItem("5", "egitim", "kanit_yok"),
      makeItem("6", "egitim", "degerlendirilmedi"),
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });

    assert.equal(report.summary.totalCriteria, 6);
    assert.deepEqual(report.summary.resultCounts, {
      uygun: 2, kismen_uygun: 1, uygun_degil: 1, kanit_yok: 1, degerlendirilmedi: 1,
    });
    assert.equal(Object.keys(report.summary.resultCounts).includes("uygulanamaz"), false);
    assert.equal(report.summary.criticalFindingsCount, 1); // yalnızca uygun_degil
  });

  test("overallScore/progress mevcut auditScoring.js motorundan gelir, burada yeniden hesaplanmaz", () => {
    const checklist = [
      makeItem("1", "risk", "uygun"),
      makeItem("2", "risk", "uygun_degil"),
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.summary.overallScore, computeOverallScore(checklist));
    assert.equal(report.summary.progressPercent, computeProgressPercent(checklist));
  });

  test("hiç değerlendirme yoksa overallScore null olur, scoreLevel de null olur (uydurma seviye yok)", () => {
    const checklist = [makeItem("1", "risk", "degerlendirilmedi")];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.summary.overallScore, null);
    assert.equal(report.summary.scoreLevel, null);
  });
});

describe("buildAuditReportData — kategori sonuçları", () => {
  test("kategori bazlı sonuçlar computeCategoryScores ile birebir eşleşir", () => {
    const checklist = [
      makeItem("1", "risk", "uygun"),
      makeItem("2", "risk", "uygun_degil"),
      makeItem("3", "egitim", "kismen_uygun"),
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    const expected = computeCategoryScores(checklist, CATEGORIES);
    assert.deepEqual(report.categoryResults, expected);
  });
});

describe("buildAuditReportData — Tespitler ve Uygunsuzluklar", () => {
  test("yalnızca uygun_degil/kismen_uygun/kanit_yok sonuçları listelenir; 'uygun' ve 'degerlendirilmedi' bulgu sayılmaz", () => {
    const checklist = [
      makeItem("1", "risk", "uygun"),
      makeItem("2", "risk", "uygun_degil"),
      makeItem("3", "risk", "kismen_uygun"),
      makeItem("4", "risk", "kanit_yok"),
      makeItem("5", "risk", "degerlendirilmedi"),
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.deepEqual(report.nonconformities.map((n) => n.criterionId), ["2", "3", "4"]);
  });

  test("mevzuat dayanağı checklist maddesinden AYNEN kopyalanır, madde numarası uydurulmaz", () => {
    const checklist = [
      makeItem("1", "risk", "uygun_degil", { legislationName: "6331 sayılı Kanun", article: "Madde 10", verified: true }),
      makeItem("2", "risk", "uygun_degil", { legislationName: "Bir Yönetmelik", article: null, verified: false }),
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.nonconformities[0].article, "Madde 10");
    assert.equal(report.nonconformities[0].verified, true);
    assert.equal(report.nonconformities[1].article, null); // uydurulmadı, null olarak kaldı
    assert.equal(report.nonconformities[1].verified, false);
  });

  test("'Kanıt Yok' sonucu 'Uygun Değil' olarak yorumlanmaz — ayrı bir sonuç değeri olarak kalır", () => {
    const checklist = [makeItem("1", "risk", "kanit_yok")];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.nonconformities[0].result, "kanit_yok");
    assert.notEqual(report.nonconformities[0].result, "uygun_degil");
  });

  test("weight yalnızca skor amaçlıdır — rapor uygunsuzluk kaydına sahte bir 'öncelik/risk seviyesi' alanı eklemez", () => {
    const checklist = [
      makeItem("1", "risk", "uygun_degil"), // weight 0 — skor formülünde kullanılır, risk seviyesi DEĞİLDİR
      makeItem("2", "risk", "kismen_uygun"), // weight 0.5 — aynı şekilde
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    for (const n of report.nonconformities) {
      assert.equal("priority" in n, false); // uydurma bir risk/öncelik alanı YOK
    }
  });

  test("ilgili DİF varsa bağlanır, DİF durumu ve gecikme doğru yansır", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil")];
    const audit = makeAudit({ id: "audit-9", checklist });
    const findings = [
      { id: "dif-1", auditId: "audit-9", checklistItemId: "1", stage: "awaitingAction", dueDate: "2020-01-01", responsible: "Ali" },
    ];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    assert.equal(report.nonconformities[0].dif.stage, "awaitingAction");
    assert.equal(report.nonconformities[0].dif.overdue, true); // dueDate geçmişte
    assert.equal(report.nonconformities[0].dif.responsible, "Ali");
  });

  test("ilgili DİF yoksa dif alanı null olur, uydurulmaz", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil")];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.nonconformities[0].dif, null);
  });
});

describe("buildAuditReportData — Bulgu Zinciri (Kriter → Tespit → Mevzuat Dayanağı → Kanıt → DİF → Güncel Durum)", () => {
  test("her bulgu kaydı, kriterin KENDİ checklist[].evidence dizisini taşır (evidenceEntries)", () => {
    const checklist = [
      makeItem("1", "risk", "uygun_degil", {
        evidence: [{ id: "e1", type: "photo", description: "Yangın söndürücü eksik", createdAt: "2026-01-05T00:00:00.000Z" }],
      }),
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.nonconformities[0].evidenceEntries.length, 1);
    assert.equal(report.nonconformities[0].evidenceEntries[0].description, "Yangın söndürücü eksik");
    assert.equal(report.nonconformities[0].evidenceEntries[0].typeLabel, "Fotoğraf");
  });

  test("kanıtsız bir bulgu kaydında evidenceEntries boş dizi döner, uydurulmaz", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil", { evidence: [] })];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.deepEqual(report.nonconformities[0].evidenceEntries, []);
  });

  test("DİF'in kendi actionEvidence/evidence alanı KESİNLİKLE kriter kanıtı (evidenceEntries) olarak sayılmaz", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil", { evidence: [] })]; // kriterin kendi kanıtı YOK
    const audit = makeAudit({ id: "audit-11", checklist });
    const findings = [{
      id: "dif-1", auditId: "audit-11", checklistItemId: "1", stage: "pendingReview",
      actionEvidence: "Yangın söndürücü değiştirildi, fotoğraf eklendi.",
      evidence: [{ id: "dif-e1", name: "kapanis-foto.jpg", type: "photo", addedAt: "2026-01-06T00:00:00.000Z" }],
    }];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    // Kriterin kanıt zinciri hâlâ boş — DİF'in kendi kanıtı/aksiyon açıklaması bunu doldurmaz.
    assert.deepEqual(report.nonconformities[0].evidenceEntries, []);
    assert.equal(report.nonconformities[0].evidenceStatus, "none");
    // DİF'in kendi aksiyon kanıtı YALNIZCA dif.actionEvidence alanında durur.
    assert.equal(report.nonconformities[0].dif.actionEvidence, "Yangın söndürücü değiştirildi, fotoğraf eklendi.");
  });

  test("DİF bilgisi genişletildi: düzeltici faaliyet, aksiyon kanıtı, kapanış açıklaması ve kapanış tarihi AYNEN aktarılır", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil")];
    const audit = makeAudit({ id: "audit-12", checklist });
    const findings = [{
      id: "dif-1", auditId: "audit-12", checklistItemId: "1", stage: "closed",
      correctiveAction: "Yangın söndürücüler değiştirilecek.",
      actionEvidence: "Yeni söndürücüler temin edildi.",
      closureNote: "Kontrol edildi, uygunluk sağlandı.",
      closedAt: "2026-01-20T00:00:00.000Z",
    }];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    const dif = report.nonconformities[0].dif;
    assert.equal(dif.correctiveAction, "Yangın söndürücüler değiştirilecek.");
    assert.equal(dif.actionEvidence, "Yeni söndürücüler temin edildi.");
    assert.equal(dif.closureNote, "Kontrol edildi, uygunluk sağlandı.");
    assert.equal(dif.closedAt, "2026-01-20T00:00:00.000Z");
  });

  test("DİF alanları boşsa (henüz doldurulmamışsa) boş string/null döner, metin UYDURULMAZ", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil")];
    const audit = makeAudit({ id: "audit-13", checklist });
    const findings = [{ id: "dif-1", auditId: "audit-13", checklistItemId: "1", stage: "open" }];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    const dif = report.nonconformities[0].dif;
    assert.equal(dif.correctiveAction, "");
    assert.equal(dif.actionEvidence, "");
    assert.equal(dif.closureNote, "");
    assert.equal(dif.closedAt, null);
  });

  test("kapalı bir DİF, bulgu zincirinde ASLA açık/gecikmiş olarak görünmez", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil")];
    const audit = makeAudit({ id: "audit-14", checklist });
    const findings = [{ id: "dif-1", auditId: "audit-14", checklistItemId: "1", stage: "closed", dueDate: "2020-01-01", closedAt: "2020-02-01" }];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    const dif = report.nonconformities[0].dif;
    assert.equal(dif.stage, "closed");
    assert.equal(dif.overdue, false); // kapalı DİF asla gecikmiş sayılmaz
  });

  test("boş tespit (item.note boş) durumunda metin uydurulmaz — note '' olarak kalır", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil", { note: "" })];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.nonconformities[0].note, "");
  });

  test("mevcut item.note dolu ise AYNEN aktarılır", () => {
    const checklist = [makeItem("1", "risk", "uygun_degil", { note: "Sahada acil çıkış kapısı kilitli bulundu." })];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.nonconformities[0].note, "Sahada acil çıkış kapısı kilitli bulundu.");
  });

  test("ISO 45001 tipi bir uygunsuzlukta (legislationName yok) rapor bozulmaz, diğer alanlar doğru kalır", () => {
    const checklist = [makeItem("1", "4", "uygun_degil", { note: "Politika belgesi güncel değil.", evidence: [{ id: "e1", type: "note" }] })];
    const audit = makeAudit({ standard: "45001", checklist });
    const findings = [{ id: "dif-1", auditId: audit.id, checklistItemId: "1", stage: "open" }];
    const report = buildAuditReportData({ audit, findings, ...baseConfig({ standardLabel: "ISO 45001" }) });
    assert.equal(report.nonconformities[0].legislationName, null);
    assert.equal(report.nonconformities[0].note, "Politika belgesi güncel değil.");
    assert.equal(report.nonconformities[0].evidenceEntries.length, 1);
    assert.equal(report.nonconformities[0].dif.stage, "open");
  });
});

describe("buildAuditReportData — Kanıtlar", () => {
  test("yalnızca kanıtı olan kriterler listelenir, kanıt kayıtları olduğu gibi aktarılır", () => {
    const checklist = [
      makeItem("1", "risk", "uygun", { evidence: [{ id: "e1", type: "photo", description: "Fotoğraf 1", createdAt: "2026-01-01T00:00:00.000Z" }] }),
      makeItem("2", "risk", "uygun_degil", { evidence: [] }),
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.evidenceByCriterion.length, 1);
    assert.equal(report.evidenceByCriterion[0].criterionId, "1");
    assert.equal(report.evidenceByCriterion[0].entries[0].description, "Fotoğraf 1");
    assert.equal(report.evidenceByCriterion[0].entries[0].typeLabel, "Fotoğraf");
  });

  test("kanıt durumu (Mevcut/Eksik/Kanıt Yok) computeEvidenceStatus ile birebir, burada yeniden yorumlanmaz", () => {
    const checklist = [
      makeItem("1", "risk", "degerlendirilmedi", { evidence: [{ id: "e1", type: "note", description: "" }] }),
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.evidenceByCriterion[0].evidenceStatus, "incomplete");
  });
});

describe("buildAuditReportData — Düzeltici Faaliyetler", () => {
  test("bu denetime ait tüm DİF'ler aşamaya göre doğru gruplanır", () => {
    const audit = makeAudit({ id: "audit-5" });
    const findings = [
      { id: "d1", auditId: "audit-5", checklistItemId: "1", stage: "open", description: "A" },
      { id: "d2", auditId: "audit-5", checklistItemId: "2", stage: "awaitingAction", description: "B" },
      { id: "d3", auditId: "audit-5", checklistItemId: "3", stage: "pendingReview", description: "C" },
      { id: "d4", auditId: "audit-5", checklistItemId: "4", stage: "closed", description: "D", closedAt: "2026-01-05" },
      { id: "d5", auditId: "other-audit", checklistItemId: "5", stage: "open", description: "Başka denetimin DİF'i" },
    ];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    assert.equal(report.correctiveActions.length, 4); // başka denetimin DİF'i dahil edilmez
    assert.equal(report.correctiveActionsByStage.open.length, 1);
    assert.equal(report.correctiveActionsByStage.awaitingAction.length, 1);
    assert.equal(report.correctiveActionsByStage.pendingReview.length, 1);
    assert.equal(report.correctiveActionsByStage.closed.length, 1);
  });

  test("kapatılmış (closed) DİF'ler hiçbir şekilde açık/gecikmiş olarak işaretlenmez", () => {
    const audit = makeAudit({ id: "audit-6" });
    const findings = [
      { id: "d1", auditId: "audit-6", checklistItemId: "1", stage: "closed", description: "A", dueDate: "2020-01-01", closedAt: "2020-01-02" },
    ];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    assert.equal(report.correctiveActions[0].overdue, false); // closed olduğu için isDifOverdue false döner
    assert.equal(report.overdueActions.length, 0);
    assert.equal(report.summary.openDifCount, 0);
    assert.equal(report.summary.overdueDifCount, 0);
  });

  test("gecikmiş DİF ayrımı doğru yapılır (yalnızca açık VE termini geçmiş olanlar)", () => {
    const audit = makeAudit({ id: "audit-7" });
    const findings = [
      { id: "d1", auditId: "audit-7", checklistItemId: "1", stage: "open", description: "A", dueDate: "2020-01-01" },
      { id: "d2", auditId: "audit-7", checklistItemId: "2", stage: "awaitingAction", description: "B", dueDate: "2099-01-01" },
    ];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    assert.equal(report.summary.openDifCount, 2);
    assert.equal(report.summary.overdueDifCount, 1);
    assert.deepEqual(report.overdueActions.map((f) => f.id), ["d1"]);
  });
});

describe("buildAuditReportData — Öncelikli Aksiyonlar", () => {
  test("kapalı DİF'ler öncelikli aksiyon listesine hiç girmez", () => {
    const audit = makeAudit({ id: "audit-8" });
    const findings = [
      { id: "d1", auditId: "audit-8", checklistItemId: "1", stage: "closed", description: "A" },
      { id: "d2", auditId: "audit-8", checklistItemId: "2", stage: "open", description: "B" },
    ];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    assert.deepEqual(report.priorityActions.map((f) => f.id), ["d2"]);
  });

  test("gecikmiş olanlar en önce, sonra termine göre sıralanır", () => {
    const audit = makeAudit({ id: "audit-10" });
    const findings = [
      { id: "d1", auditId: "audit-10", checklistItemId: "1", stage: "open", description: "geç değil, yakın", dueDate: "2099-02-01" },
      { id: "d2", auditId: "audit-10", checklistItemId: "2", stage: "open", description: "gecikmiş", dueDate: "2020-01-01" },
      { id: "d3", auditId: "audit-10", checklistItemId: "3", stage: "open", description: "geç değil, uzak", dueDate: "2099-05-01" },
    ];
    const report = buildAuditReportData({ audit, findings, ...baseConfig() });
    assert.deepEqual(report.priorityActions.map((f) => f.id), ["d2", "d1", "d3"]);
  });
});

describe("buildAuditReportData — Mevzuat Bulguları", () => {
  test("yalnızca mevzuat dayanağı olan kriterler listelenir (ISO 45001'de bu alan hiç yoktur)", () => {
    const checklist = [
      makeItem("1", "risk", "uygun", { legislationName: "6331 sayılı Kanun", article: "Madde 10" }),
      makeItem("2", "risk", "uygun"), // legislationName yok (ISO 45001 kriteri gibi)
    ];
    const audit = makeAudit({ checklist });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.legislationFindings.length, 1);
    assert.equal(report.legislationFindings[0].legislationName, "6331 sayılı Kanun");
  });

  test("mevzuat alanı olan hiç kriter yoksa (ISO 45001) boş liste döner, uydurulmaz", () => {
    const checklist = [makeItem("1", "4", "uygun"), makeItem("2", "5", "uygun_degil")];
    const audit = makeAudit({ checklist, standard: "45001" });
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig({ standardLabel: "ISO 45001" }) });
    assert.deepEqual(report.legislationFindings, []);
  });
});

describe("buildAuditReportData — Hazırlık skoru dışarıdan gelir", () => {
  test("preparednessScore parametre olarak verilmezse null kalır, burada hesaplanmaz", () => {
    const audit = makeAudit();
    const report = buildAuditReportData({ audit, findings: [], ...baseConfig() });
    assert.equal(report.summary.preparednessScore, null);
  });

  test("preparednessScore verilirse olduğu gibi aktarılır", () => {
    const audit = makeAudit();
    const report = buildAuditReportData({ audit, findings: [], preparednessScore: 72, ...baseConfig() });
    assert.equal(report.summary.preparednessScore, 72);
  });
});
