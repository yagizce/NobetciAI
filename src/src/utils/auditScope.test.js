import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { scopeFindingsToAudits } from "./auditScope.js";

describe("scopeFindingsToAudits — standartlar arası DİF karışmasını engeller", () => {
  test("yalnızca verilen audits listesindeki auditId'lere ait findings döner", () => {
    const mevzuatAudits = [{ id: "m1", standard: "mevzuat" }, { id: "m2", standard: "mevzuat" }];
    // getAuditFindings() TÜM standartların DİF'lerini birlikte döner (bkz. useAudits.js notu) —
    // burada ISO 45001'e ait "i1" denetiminin DİF'i de aynı listede simüle edilir.
    const allFindings = [
      { id: "f1", auditId: "m1", stage: "open" },
      { id: "f2", auditId: "m2", stage: "closed" },
      { id: "f3", auditId: "i1", stage: "open" }, // farklı standardın (ISO 45001) DİF'i
    ];
    const result = scopeFindingsToAudits(allFindings, mevzuatAudits);
    assert.deepEqual(result.map((f) => f.id), ["f1", "f2"]);
    assert.equal(result.some((f) => f.id === "f3"), false); // ISO 45001'in DİF'i sızmadı
  });

  test("audits boşsa hiçbir finding eşleşmez (yanlışlıkla tüm DİF'ler dahil edilmez)", () => {
    const result = scopeFindingsToAudits([{ id: "f1", auditId: "m1" }], []);
    assert.deepEqual(result, []);
  });

  test("findings/audits verilmezse (undefined) çökmez, boş dizi döner", () => {
    assert.deepEqual(scopeFindingsToAudits(undefined, undefined), []);
  });

  test("auditId tipi (string/number) farkı eşleşmeyi bozmaz", () => {
    const audits = [{ id: 1 }];
    const findings = [{ id: "f1", auditId: "1" }, { id: "f2", auditId: 1 }, { id: "f3", auditId: 2 }];
    const result = scopeFindingsToAudits(findings, audits);
    assert.deepEqual(result.map((f) => f.id), ["f1", "f2"]);
  });
});
