import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildCsv } from "./exportCsv.js";

describe("buildCsv", () => {
  test("başlık + satırları noktalı virgülle ayırır (Türkçe Excel uyumluluğu)", () => {
    const csv = buildCsv(["Ad", "Skor"], [["Ahmet", 90], ["Ayşe", 85]]);
    assert.equal(csv, "Ad;Skor\r\nAhmet;90\r\nAyşe;85");
  });

  test("noktalı virgül içeren hücreyi tırnak içine alır", () => {
    const csv = buildCsv(["Not"], [["Elektrik; su kaçağı"]]);
    assert.equal(csv, 'Not\r\n"Elektrik; su kaçağı"');
  });

  test("tırnak içeren hücrede tırnakları ikiye katlar", () => {
    const csv = buildCsv(["Not"], [['"Acil" durum']]);
    assert.equal(csv, 'Not\r\n"""Acil"" durum"');
  });

  test("satır sonu içeren hücreyi tırnak içine alır", () => {
    const csv = buildCsv(["Not"], [["Birinci satır\nİkinci satır"]]);
    assert.equal(csv, 'Not\r\n"Birinci satır\nİkinci satır"');
  });

  test("null/undefined hücreleri boş string olarak yazar (çökmez)", () => {
    const csv = buildCsv(["A", "B"], [[null, undefined]]);
    assert.equal(csv, "A;B\r\n;");
  });

  test("boş satır listesi için yalnızca başlık satırını döner", () => {
    const csv = buildCsv(["A", "B"], []);
    assert.equal(csv, "A;B");
  });

  describe("Formula/CSV Injection koruması", () => {
    test("'=' ile başlayan hücrenin önüne tek tırnak eklenir (Excel formülü çalıştırmasın diye)", () => {
      const csv = buildCsv(["Ad"], [["=CMD(\"calc\")"]]);
      assert.ok(csv.includes("'=CMD"));
    });

    test("'+', '-', '@' ile başlayan hücrelerde de aynı koruma uygulanır", () => {
      assert.ok(buildCsv(["A"], [["+1+1"]]).includes("'+1+1"));
      assert.ok(buildCsv(["A"], [["-2+3"]]).includes("'-2+3"));
      assert.ok(buildCsv(["A"], [["@SUM(1,1)"]]).includes("'@SUM"));
    });

    test("tehlikeli olmayan normal metinlerin önüne tırnak EKLENMEZ", () => {
      const csv = buildCsv(["Ad"], [["Ahmet Yılmaz"]]);
      assert.equal(csv, "Ad\r\nAhmet Yılmaz");
    });

    test("bir hücre içinde ortada geçen '=' işareti (başta değil) etkilenmez", () => {
      const csv = buildCsv(["Not"], [["Sonuç = 5"]]);
      assert.equal(csv, "Not\r\nSonuç = 5");
    });
  });
});
