import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generateChecklist, computeProgressPercent, computeOverallScore, computeCategoryScores, AUDIT_CRITERIA, AUDIT_CATEGORIES } from "./iso45001Checklist.js";

describe("generateChecklist", () => {
  test("tüm kriter sayısı kadar madde üretir, hepsi 'değerlendirilmedi' başlar", () => {
    const list = generateChecklist();
    assert.equal(list.length, AUDIT_CRITERIA.length);
    assert.ok(list.every((c) => c.result === "degerlendirilmedi" && c.note === "" && c.departmentId === null));
  });
});

describe("computeProgressPercent", () => {
  test("boş checklist için 0 döner", () => {
    assert.equal(computeProgressPercent([]), 0);
  });

  test("yarısı değerlendirilmişse %50 döner", () => {
    const list = [{ result: "uygun" }, { result: "degerlendirilmedi" }];
    assert.equal(computeProgressPercent(list), 50);
  });
});

describe("computeOverallScore", () => {
  test("hiç değerlendirme yoksa null döner", () => {
    assert.equal(computeOverallScore([{ result: "degerlendirilmedi" }]), null);
  });

  test("tamamı uygunsa 100 döner", () => {
    assert.equal(computeOverallScore([{ result: "uygun" }, { result: "uygun" }]), 100);
  });

  test("kısmen uygun yarım puan sayılır", () => {
    assert.equal(computeOverallScore([{ result: "uygun" }, { result: "kismen_uygun" }]), 75);
  });

  test("uygun değil ve kanıt yok sıfır puan sayılır", () => {
    assert.equal(computeOverallScore([{ result: "uygun_degil" }, { result: "kanit_yok" }]), 0);
  });

  test("değerlendirilmedi maddeler paydaya girmez", () => {
    const list = [{ result: "uygun" }, { result: "uygun" }, { result: "degerlendirilmedi" }];
    assert.equal(computeOverallScore(list), 100);
  });
});

describe("computeCategoryScores", () => {
  test("her HLS kategorisi (4-10) için bir sonuç döner", () => {
    const scores = computeCategoryScores([]);
    assert.equal(scores.length, AUDIT_CATEGORIES.length);
    assert.deepEqual(scores.map((s) => s.code), ["4", "5", "6", "7", "8", "9", "10"]);
  });

  test("kategori bazlı skor doğru hesaplanır", () => {
    const checklist = [
      { categoryCode: "4", result: "uygun" },
      { categoryCode: "4", result: "uygun_degil" },
      { categoryCode: "5", result: "degerlendirilmedi" },
    ];
    const scores = computeCategoryScores(checklist);
    const cat4 = scores.find((s) => s.code === "4");
    const cat5 = scores.find((s) => s.code === "5");
    assert.equal(cat4.score, 50);
    assert.equal(cat4.progress, 100);
    assert.equal(cat5.score, null);
    assert.equal(cat5.progress, 0);
  });
});
