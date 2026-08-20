import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { clampPercent } from "./numberGuards.js";

describe("clampPercent", () => {
  test("0-100 aralığındaki normal bir değeri olduğu gibi döner", () => {
    assert.equal(clampPercent(45), 45);
  });

  test("100'den büyük değerleri 100'e sıkıştırır", () => {
    assert.equal(clampPercent(99999), 100);
  });

  test("negatif değerleri 0'a sıkıştırır", () => {
    assert.equal(clampPercent(-40), 0);
  });

  test("NaN/geçersiz/eksik değerlerde 0 döner", () => {
    assert.equal(clampPercent(NaN), 0);
    assert.equal(clampPercent(undefined), 0);
    assert.equal(clampPercent(null), 0);
    assert.equal(clampPercent("elma"), 0);
  });

  test("ondalıklı değerleri en yakın tam sayıya yuvarlar", () => {
    assert.equal(clampPercent(45.6), 46);
  });

  test("string sayı gelirse (örn. yedek dosyasından) doğru dönüştürür", () => {
    assert.equal(clampPercent("75"), 75);
  });
});
