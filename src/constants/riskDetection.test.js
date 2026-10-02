import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { findOpenDetection, mergeFindingIntoDetection } from "./riskDetection.js";

const base = {
  id: "d1", category: "ppe", location: "Depo B", status: "new", occurrenceCount: 1,
  detectedAt: "2026-01-01T00:00:00.000Z", lastSeenAt: "2026-01-01T00:00:00.000Z",
  hazardNote: "eski not", description: "eski açıklama", recommendedAction: "eski önlem",
  affected: "eski kişiler", legislationRef: "eski ref", confidenceScore: 60,
  photoId: "p-old", photoDataUrl: null,
};
const NOW = "2026-02-02T00:00:00.000Z";

describe("findOpenDetection", () => {
  test("aynı kategori+konumda AÇIK kaydı bulur, kapalı olanı bulmaz", () => {
    assert.equal(findOpenDetection([base], "ppe", "Depo B")?.id, "d1");
    assert.equal(findOpenDetection([{ ...base, status: "converted" }], "ppe", "Depo B"), undefined);
    assert.equal(findOpenDetection([{ ...base, status: "dismissed" }], "ppe", "Depo B"), undefined);
    assert.equal(findOpenDetection([base], "fallRisk", "Depo B"), undefined);
  });

  test("excludeIds içindeki (aynı toplu kayıtta açılan) kayıt hedef olmaz", () => {
    assert.equal(findOpenDetection([base], "ppe", "Depo B", ["d1"]), undefined);
  });
});

describe("mergeFindingIntoDetection", () => {
  test("yeni bulgunun fotoğraf ve metinlerini korur, sayaç artar", () => {
    const merged = mergeFindingIntoDetection(base, {
      photoId: "p-new", hazardNote: "yeni not", description: "yeni açıklama",
      recommendedAction: "yeni önlem", affected: "yeni kişiler", legislationRef: "yeni ref", confidenceScore: 85,
    }, NOW);
    assert.equal(merged.photoId, "p-new");
    assert.equal(merged.hazardNote, "yeni not");
    assert.equal(merged.description, "yeni açıklama");
    assert.equal(merged.recommendedAction, "yeni önlem");
    assert.equal(merged.affected, "yeni kişiler");
    assert.equal(merged.legislationRef, "yeni ref");
    assert.equal(merged.confidenceScore, 85);
    assert.equal(merged.occurrenceCount, 2);
    assert.equal(merged.lastSeenAt, NOW);
    assert.equal(merged.detectedAt, base.detectedAt); // ilk görülme değişmez
    assert.equal(merged.status, "new");
  });

  test("gelen alan boşsa mevcut değer ezilmez (örn. notsuz manuel ekleme)", () => {
    const merged = mergeFindingIntoDetection(base, { hazardNote: "", legislationRef: "" }, NOW);
    assert.equal(merged.hazardNote, "eski not");
    assert.equal(merged.legislationRef, "eski ref");
    assert.equal(merged.description, "eski açıklama");
    assert.equal(merged.photoId, "p-old");
    assert.equal(merged.confidenceScore, 60);
  });

  test("güven skoru 0 geçerli bir değerdir, undefined ezmez", () => {
    assert.equal(mergeFindingIntoDetection(base, { confidenceScore: 0 }, NOW).confidenceScore, 0);
    assert.equal(mergeFindingIntoDetection(base, {}, NOW).confidenceScore, 60);
  });

  test("photoId ve photoDataUrl birlikte tutulmaz", () => {
    const legacy = { ...base, photoId: null, photoDataUrl: "data:image/jpeg;base64,AAA" };
    const withId = mergeFindingIntoDetection(legacy, { photoId: "p-new" }, NOW);
    assert.equal(withId.photoId, "p-new");
    assert.equal(withId.photoDataUrl, null);
    const withData = mergeFindingIntoDetection(base, { photoDataUrl: "data:image/jpeg;base64,BBB" }, NOW);
    assert.equal(withData.photoDataUrl, "data:image/jpeg;base64,BBB");
    assert.equal(withData.photoId, null);
  });

  test("mevcut kaydı değiştirmez (saf)", () => {
    const snapshot = JSON.stringify(base);
    mergeFindingIntoDetection(base, { photoId: "p-new", description: "x" }, NOW);
    assert.equal(JSON.stringify(base), snapshot);
  });

  test("aynı kayda arka arkaya iki birleşme sayacı +2 artırır", () => {
    const once = mergeFindingIntoDetection(base, { photoId: "p1" }, NOW);
    const twice = mergeFindingIntoDetection(once, { photoId: "p1" }, NOW);
    assert.equal(twice.occurrenceCount, 3);
  });
});
