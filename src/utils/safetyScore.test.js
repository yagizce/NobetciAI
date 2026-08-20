import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeSafetyScore, getSafetyScoreLevel } from "./safetyScore.js";

const PERFECT_METRICS = {
  openRisks: 0,
  criticalRisks: 0,
  totalRisks: 0,
  trainingCompletionRate: 100,
  upcomingChecks: 0,
  totalChecks: 0,
  correctiveActionCompletionRate: 100,
};

describe("computeSafetyScore", () => {
  test("her şey mükemmelse skor 100 ve breakdown'da genel bir 'veri yok' değil, gerçek bir metrik satırı yoktur (hepsi 0 etkili)", () => {
    const { score, breakdown } = computeSafetyScore(PERFECT_METRICS);
    assert.equal(score, 100);
    // Hiçbir metrik puan düşürmediği için breakdown'a hiçbir satır eklenmez —
    // bu durumda fonksiyon "Genel Durum / henüz yeterli veri yok" placeholder'ını basar.
    assert.equal(breakdown.length, 1);
    assert.equal(breakdown[0].label, "Genel Durum");
  });

  test("skor asla 0'ın altına inmez (aşırı kötü metriklerde bile)", () => {
    const { score } = computeSafetyScore({
      openRisks: 1000,
      criticalRisks: 1000,
      totalRisks: 1000,
      trainingCompletionRate: 0,
      upcomingChecks: 1000,
      totalChecks: 1000,
      correctiveActionCompletionRate: 0,
    });
    assert.equal(score, 0);
  });

  test("skor asla 100'ün üstüne çıkmaz", () => {
    const { score } = computeSafetyScore(PERFECT_METRICS);
    assert.ok(score <= 100);
  });

  test("kritik riskler açık risklerden daha ağır etki eder (aynı sayıda)", () => {
    const withOpen = computeSafetyScore({ ...PERFECT_METRICS, openRisks: 3 });
    const withCritical = computeSafetyScore({ ...PERFECT_METRICS, criticalRisks: 3 });
    assert.ok(withCritical.score < withOpen.score, "kritik risk etkisi açık riskten daha küçük olmamalı");
  });

  test("açık risk etkisi 20 puanda tavanlanır (çok sayıda açık risk sonsuza kadar düşürmez)", () => {
    const a = computeSafetyScore({ ...PERFECT_METRICS, openRisks: 10 }); // 10*2=20, tavan
    const b = computeSafetyScore({ ...PERFECT_METRICS, openRisks: 50 }); // tavan yine 20
    assert.equal(a.score, b.score);
    assert.equal(a.score, 80);
  });

  test("kritik risk etkisi 35 puanda tavanlanır", () => {
    const a = computeSafetyScore({ ...PERFECT_METRICS, criticalRisks: 5 }); // 5*8=40 -> tavan 35
    const b = computeSafetyScore({ ...PERFECT_METRICS, criticalRisks: 20 });
    assert.equal(a.score, b.score);
    assert.equal(a.score, 65);
  });

  test("eğitim tamamlama oranı düştükçe skor düşer, breakdown'a satır eklenir", () => {
    const { score, breakdown } = computeSafetyScore({ ...PERFECT_METRICS, trainingCompletionRate: 50 });
    assert.ok(score < 100);
    assert.ok(breakdown.some((b) => b.label === "Eğitim Tamamlama"));
  });

  test("trainingCompletionRate/correctiveActionCompletionRate belirtilmezse (undefined) 100 varsayılır, hata vermez", () => {
    const { score, breakdown } = computeSafetyScore({ openRisks: 0, criticalRisks: 0 });
    assert.equal(score, 100);
    assert.equal(breakdown.length, 1);
  });

  test("her breakdown etkisi negatif veya sıfırdır (skoru asla artırmaz)", () => {
    const { breakdown } = computeSafetyScore({
      openRisks: 2, criticalRisks: 1, trainingCompletionRate: 70, upcomingChecks: 4, correctiveActionCompletionRate: 60,
    });
    for (const item of breakdown) assert.ok(item.impact <= 0, `${item.label} pozitif etki üretti: ${item.impact}`);
  });
});

describe("getSafetyScoreLevel", () => {
  test("80 ve üzeri 'İyi'", () => {
    assert.deepEqual(getSafetyScoreLevel(80), { label: "İyi", tone: "success" });
    assert.deepEqual(getSafetyScoreLevel(100), { label: "İyi", tone: "success" });
  });

  test("60-79 arası 'Orta'", () => {
    assert.deepEqual(getSafetyScoreLevel(60), { label: "Orta", tone: "warning" });
    assert.deepEqual(getSafetyScoreLevel(79), { label: "Orta", tone: "warning" });
  });

  test("60'ın altı 'Riskli'", () => {
    assert.deepEqual(getSafetyScoreLevel(59), { label: "Riskli", tone: "danger" });
    assert.deepEqual(getSafetyScoreLevel(0), { label: "Riskli", tone: "danger" });
  });
});
