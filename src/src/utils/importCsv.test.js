import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, rowsToObjects } from "./importCsv.js";
import { buildCsv } from "./exportCsv.js";

describe("parseCsv", () => {
  test("basit noktalı virgülle ayrılmış satırları doğru ayrıştırır", () => {
    const result = parseCsv("Ad;Skor\r\nAhmet;90\r\nAyşe;85");
    assert.deepEqual(result, [["Ad", "Skor"], ["Ahmet", "90"], ["Ayşe", "85"]]);
  });

  test("UTF-8 BOM'u temizler", () => {
    const result = parseCsv("\uFEFFAd;Skor\r\nAhmet;90");
    assert.deepEqual(result[0], ["Ad", "Skor"]);
  });

  test("tırnak içindeki noktalı virgülü hücre ayırıcı SAYMAZ", () => {
    const result = parseCsv('Not\r\n"Elektrik; su kaçağı"');
    assert.deepEqual(result[1], ["Elektrik; su kaçağı"]);
  });

  test("tırnak içindeki ikiye katlanmış tırnakları tek tırnağa çevirir", () => {
    const result = parseCsv('Not\r\n"""Acil"" durum"');
    assert.deepEqual(result[1], ['"Acil" durum']);
  });

  test("tırnak içindeki satır sonunu hücre içinde korur", () => {
    const result = parseCsv('Not\r\n"Birinci satır\nİkinci satır"');
    assert.deepEqual(result[1], ["Birinci satır\nİkinci satır"]);
  });

  test("yalnızca \\n satır sonlarını da (Windows \\r\\n olmadan) doğru işler", () => {
    const result = parseCsv("Ad;Skor\nAhmet;90\nAyşe;85");
    assert.equal(result.length, 3);
  });

  test("boş metin için boş dizi döner", () => {
    assert.deepEqual(parseCsv(""), []);
  });

  test("buildCsv ile round-trip uyumludur (export edip geri okuma)", () => {
    const original = [["Elektrik; su kaçağı", '"Acil" durum'], ["Basit satır", "Normal"]];
    const csv = buildCsv(["Not1", "Not2"], original);
    const parsed = parseCsv(csv);
    assert.deepEqual(parsed, [["Not1", "Not2"], ...original]);
  });
});

describe("rowsToObjects", () => {
  test("başlık satırını anahtar olarak kullanıp nesne dizisine çevirir", () => {
    const rows = [["Ad Soyad", "Sicil No"], ["Ahmet Yılmaz", "1024"]];
    const result = rowsToObjects(rows);
    assert.deepEqual(result, [{ "Ad Soyad": "Ahmet Yılmaz", "Sicil No": "1024" }]);
  });

  test("eksik hücreler için boş string kullanır (çökmez)", () => {
    const rows = [["Ad", "Telefon"], ["Ahmet"]];
    const result = rowsToObjects(rows);
    assert.equal(result[0].Telefon, "");
  });

  test("boş satır dizisi için boş dizi döner", () => {
    assert.deepEqual(rowsToObjects([]), []);
  });

  test("yalnızca başlık satırı (veri satırı yok) için boş dizi döner", () => {
    assert.deepEqual(rowsToObjects([["Ad", "Soyad"]]), []);
  });
});
