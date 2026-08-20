import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeScaledDimensions } from "./imageCompression.js";

describe("computeScaledDimensions", () => {
  test("uzun kenar sınırın altındaysa değiştirmez", () => {
    assert.deepEqual(computeScaledDimensions(800, 600, 1600), { width: 800, height: 600 });
  });

  test("uzun kenar sınırın üstündeyse en-boy oranını koruyarak küçültür (yatay)", () => {
    assert.deepEqual(computeScaledDimensions(4000, 3000, 1600), { width: 1600, height: 1200 });
  });

  test("uzun kenar sınırın üstündeyse en-boy oranını koruyarak küçültür (dikey)", () => {
    assert.deepEqual(computeScaledDimensions(3000, 4000, 1600), { width: 1200, height: 1600 });
  });

  test("tam sınıra eşitse değiştirmez", () => {
    assert.deepEqual(computeScaledDimensions(1600, 900, 1600), { width: 1600, height: 900 });
  });

  test("kare görsel doğru ölçeklenir", () => {
    assert.deepEqual(computeScaledDimensions(5000, 5000, 1000), { width: 1000, height: 1000 });
  });

  test("geçersiz girdilerde (0/negatif) olduğu gibi döner, çökmez", () => {
    assert.deepEqual(computeScaledDimensions(0, 0, 1600), { width: 0, height: 0 });
    assert.deepEqual(computeScaledDimensions(-10, 100, 1600), { width: -10, height: 100 });
    assert.deepEqual(computeScaledDimensions(800, 600, 0), { width: 800, height: 600 });
  });
});
