import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getStorageUsageLevel, formatStorageBytes, isStorageEstimateSupported } from "./storageEstimateService.js";

describe("getStorageUsageLevel", () => {
  test("90% ve üzeri 'Kritik'/danger", () => {
    assert.deepEqual(getStorageUsageLevel(90), { label: "Kritik", tone: "danger" });
    assert.deepEqual(getStorageUsageLevel(100), { label: "Kritik", tone: "danger" });
  });

  test("70-89 arası 'Yüksek'/warning", () => {
    assert.deepEqual(getStorageUsageLevel(70), { label: "Yüksek", tone: "warning" });
    assert.deepEqual(getStorageUsageLevel(89), { label: "Yüksek", tone: "warning" });
  });

  test("70'in altı 'Normal'/success", () => {
    assert.deepEqual(getStorageUsageLevel(69), { label: "Normal", tone: "success" });
    assert.deepEqual(getStorageUsageLevel(0), { label: "Normal", tone: "success" });
  });
});

describe("formatStorageBytes", () => {
  test("1 GB altındaki değerleri MB olarak formatlar", () => {
    assert.equal(formatStorageBytes(5 * 1024 * 1024), "5.0 MB");
    assert.equal(formatStorageBytes(127 * 1024 * 1024), "127 MB");
  });

  test("1 GB ve üzeri değerleri GB olarak formatlar", () => {
    assert.equal(formatStorageBytes(1024 * 1024 * 1024), "1.0 GB");
    assert.equal(formatStorageBytes(2.5 * 1024 * 1024 * 1024), "2.5 GB");
  });

  test("geçersiz/negatif değerlerde çökmez, '0 MB' döner", () => {
    assert.equal(formatStorageBytes(NaN), "0 MB");
    assert.equal(formatStorageBytes(-5), "0 MB");
    assert.equal(formatStorageBytes(undefined), "0 MB");
  });

  test("0 byte doğru formatlanır", () => {
    assert.equal(formatStorageBytes(0), "0.0 MB");
  });
});

describe("isStorageEstimateSupported", () => {
  test("Node test ortamında (navigator yok) false döner, çökmez", () => {
    assert.equal(isStorageEstimateSupported(), false);
  });
});
