import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildFineKinneyExportRows, FINE_KINNEY_EXPORT_HEADERS } from "./fineKinneyExport.js";

const departments = [{ id: 1, name: "Üretim" }, { id: 2, name: "Depo" }];

const entry = {
  hazard: "Kaygan zemin", risk: "Düşme", affected: "Çalışanlar", departmentId: 1,
  probability: 3, frequency: 6, severity: 15, score: 270,
  priority: "high", status: "open", date: "10.01.2026",
  action: "Uyarı levhası", dueDate: "20.01.2026",
};

describe("buildFineKinneyExportRows", () => {
  test("başlık sayısı ile her satırdaki sütun sayısı eşleşir", () => {
    const rows = buildFineKinneyExportRows([entry], departments);
    assert.equal(rows[0].length, FINE_KINNEY_EXPORT_HEADERS.length);
  });

  test("sıra numarası ve departman id'sini okunabilir isme çevirir", () => {
    const [row] = buildFineKinneyExportRows([entry], departments);
    assert.equal(row[0], 1); // Sıra No
    assert.equal(row[4], "Üretim"); // Departman
  });

  test("risk seviyesi ve öncelik etiketlerini (ham değer değil) doğru çözer", () => {
    const [row] = buildFineKinneyExportRows([entry], departments);
    assert.equal(row[9], "Yüksek Risk"); // score 270 -> high
    assert.equal(row[10], "Yüksek"); // priority "high" -> label
  });

  test("departmentId olmayan kayıt için boş string döner (çökmez)", () => {
    const noOrg = { ...entry, departmentId: null };
    const [row] = buildFineKinneyExportRows([noOrg], departments);
    assert.equal(row[4], "");
  });

  test("boş liste için boş dizi döner", () => {
    assert.deepEqual(buildFineKinneyExportRows([], departments), []);
  });
});
