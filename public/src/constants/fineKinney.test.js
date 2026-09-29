import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeFineKinneyScore, getFineKinneyRiskLevel } from "./fineKinney.js";

describe("computeFineKinneyScore", () => {
  test("olasılık × frekans × şiddet çarpımını doğru hesaplar", () => {
    assert.equal(computeFineKinneyScore(3, 6, 7), 126);
  });

  test("herhangi bir bileşen 0 ise skor 0 olur", () => {
    assert.equal(computeFineKinneyScore(0, 6, 7), 0);
    assert.equal(computeFineKinneyScore(3, 0, 7), 0);
    assert.equal(computeFineKinneyScore(3, 6, 0), 0);
  });

  test("en yüksek skala değerleriyle en yüksek skoru üretir", () => {
    assert.equal(computeFineKinneyScore(10, 10, 10), 1000);
  });
});

describe("getFineKinneyRiskLevel", () => {
  // Sınır (boundary) değerler — RISK_LEVEL eşiklerinin yanlışlıkla kaymasını yakalamak
  // için özellikle sınırın HEM altı hem üstü test ediliyor.
  test("20'nin altı 'low' (Düşük Risk)", () => {
    assert.equal(getFineKinneyRiskLevel(19).key, "low");
  });

  test("tam 20 'possible' (Olası Risk) sınırına girer", () => {
    assert.equal(getFineKinneyRiskLevel(20).key, "possible");
  });

  test("69 hâlâ 'possible', 70 'important' olur", () => {
    assert.equal(getFineKinneyRiskLevel(69).key, "possible");
    assert.equal(getFineKinneyRiskLevel(70).key, "important");
  });

  test("199 hâlâ 'important', 200 'high' olur", () => {
    assert.equal(getFineKinneyRiskLevel(199).key, "important");
    assert.equal(getFineKinneyRiskLevel(200).key, "high");
  });

  test("399 hâlâ 'high', 400 'veryHigh' olur", () => {
    assert.equal(getFineKinneyRiskLevel(399).key, "high");
    assert.equal(getFineKinneyRiskLevel(400).key, "veryHigh");
  });

  test("çok yüksek skorlarda da 'veryHigh' kalır", () => {
    assert.equal(getFineKinneyRiskLevel(1000).key, "veryHigh");
  });
});
