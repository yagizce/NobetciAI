import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { generateAuditChecklist, computeComplianceScore, computeSuggestedAuditDays, distributeAuditDays } from "./isoStandards.js";

describe("generateAuditChecklist", () => {
  test("tek standart için 7 madde üretir (HLS 4-10)", () => {
    assert.equal(generateAuditChecklist(["9001"]).length, 7);
  });

  test("entegre denetimde (2 standart) her madde standart bazında ayrı satır olur", () => {
    const list = generateAuditChecklist(["9001", "45001"]);
    assert.equal(list.length, 14);
    assert.ok(list.every((i) => i.result === null));
  });

  test("boş/geçersiz standart listesi boş checklist döner", () => {
    assert.deepEqual(generateAuditChecklist([]), []);
    assert.deepEqual(generateAuditChecklist(undefined), []);
  });
});

describe("computeComplianceScore", () => {
  test("hiç değerlendirme yoksa null döner (yarım kalmış denetim yanıltıcı görünmesin)", () => {
    assert.equal(computeComplianceScore([{ result: null }, { result: null }]), null);
  });

  test("gözlem ve iyi uygulama skora dahil edilmez", () => {
    const list = [{ result: "uygun" }, { result: "observation" }, { result: "good_practice" }];
    assert.equal(computeComplianceScore(list), 100);
  });

  test("majör/minör uygunsuzluklar paydaya girer ve skoru düşürür", () => {
    const list = [{ result: "uygun" }, { result: "uygun" }, { result: "major" }, { result: "minor" }];
    assert.equal(computeComplianceScore(list), 50);
  });
});

describe("computeSuggestedAuditDays", () => {
  test("çalışan sayısı arttıkça önerilen gün artar", () => {
    assert.ok(computeSuggestedAuditDays(5, 1) < computeSuggestedAuditDays(300, 1));
  });

  test("entegre denetimde ek standart başına 0.5 gün eklenir", () => {
    const single = computeSuggestedAuditDays(20, 1);
    const integrated = computeSuggestedAuditDays(20, 2);
    assert.equal(integrated - single, 0.5);
  });
});

describe("distributeAuditDays", () => {
  test("toplam günü denetçi sayısına eşit dağıtır", () => {
    const result = distributeAuditDays(4, ["Ali", "Veli"]);
    assert.deepEqual(result, [{ name: "Ali", days: 2 }, { name: "Veli", days: 2 }]);
  });

  test("küsuratlı bölünmede toplam korunur", () => {
    const result = distributeAuditDays(5, ["Ali", "Veli"]);
    const total = result.reduce((sum, a) => sum + a.days, 0);
    assert.equal(total, 5);
  });

  test("denetçi girilmezse boş dizi döner", () => {
    assert.deepEqual(distributeAuditDays(4, []), []);
  });
});
