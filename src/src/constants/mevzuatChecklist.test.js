import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generateChecklist, computeCategoryScores, computeOverallScore, AUDIT_CRITERIA, AUDIT_CATEGORIES } from "./mevzuatChecklist.js";

describe("mevzuatChecklist generateChecklist", () => {
  test("tüm kriter sayısı kadar madde üretir, hepsi 'değerlendirilmedi' başlar", () => {
    const list = generateChecklist();
    assert.equal(list.length, AUDIT_CRITERIA.length);
    assert.ok(list.every((c) => c.result === "degerlendirilmedi"));
  });

  test("12 kategori tanımlı ve her biri en az bir kritere sahip", () => {
    assert.equal(AUDIT_CATEGORIES.length, 12);
    AUDIT_CATEGORIES.forEach((cat) => {
      assert.ok(AUDIT_CRITERIA.some((c) => c.categoryCode === cat.code), `${cat.code} için kriter yok`);
    });
  });

  test("hiçbir kriter id'si madde numarası formatında değil (uydurma mevzuat maddesi yok)", () => {
    AUDIT_CRITERIA.forEach((c) => {
      assert.ok(!/^\d/.test(c.id), `${c.id} sayı ile başlıyor, madde numarası gibi görünüyor`);
    });
  });

  test("generateChecklist mevzuat dayanağı alanlarını (Faz 2) checklist maddesine aynen kopyalar", () => {
    const list = generateChecklist();
    const risk1 = list.find((c) => c.id === "risk-1");
    assert.equal(risk1.legislationName, "6331 sayılı İş Sağlığı ve Güvenliği Kanunu");
    assert.equal(risk1.article, "Madde 10");
    assert.equal(risk1.verified, true);
    assert.ok(risk1.controlPurpose.length > 0);
    assert.ok(risk1.expectedEvidence.length > 0);
  });
});

describe("Faz 2 mevzuat doğrulama disiplini", () => {
  test("her kriterin mevzuat adı, kontrol amacı ve beklenen kanıtı dolu", () => {
    AUDIT_CRITERIA.forEach((c) => {
      assert.ok(c.legislationName?.length > 0, `${c.id}: legislationName boş olamaz`);
      assert.ok(c.controlPurpose?.length > 0, `${c.id}: controlPurpose boş olamaz`);
      assert.ok(c.expectedEvidence?.length > 0, `${c.id}: expectedEvidence boş olamaz`);
      assert.equal(typeof c.verified, "boolean", `${c.id}: verified boolean olmalı`);
    });
  });

  test("verified:false olan hiçbir kriterde uydurma bir madde numarası YOK (article null olmalı)", () => {
    AUDIT_CRITERIA.filter((c) => !c.verified).forEach((c) => {
      assert.equal(c.article, null, `${c.id}: doğrulanmamış kriterde madde numarası olamaz`);
    });
  });

  test("verified:true olan her kriterde gerçek bir madde referansı var (boş değil)", () => {
    AUDIT_CRITERIA.filter((c) => c.verified).forEach((c) => {
      assert.ok(c.article?.length > 0, `${c.id}: doğrulanmış kriterde madde referansı olmalı`);
    });
  });
});

describe("mevzuatChecklist skorlama (jenerik motoru doğru kullanıyor)", () => {
  test("computeOverallScore auditScoring.js ile aynı davranır", () => {
    assert.equal(computeOverallScore([{ result: "uygun" }, { result: "uygun_degil" }]), 50);
  });

  test("computeCategoryScores kendi 12 kategorisini döner", () => {
    const scores = computeCategoryScores([]);
    assert.equal(scores.length, 12);
    assert.ok(scores.some((s) => s.code === "yangin"));
  });
});
