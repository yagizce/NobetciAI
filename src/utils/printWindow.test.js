import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, buildPrintDocument } from "./printWindow.js";

describe("escapeHtml", () => {
  test("HTML özel karakterlerini kaçırır (XSS koruması — belge çalışan adı/kurs başlığını gömüyor)", () => {
    assert.equal(escapeHtml('<script>alert("x")</script>'), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });

  test("tek tırnak ve & karakterini de kaçırır", () => {
    assert.equal(escapeHtml("Ahmet & Mehmet's"), "Ahmet &amp; Mehmet&#39;s");
  });

  test("özel karakter içermeyen düz Türkçe metni değiştirmeden bırakır", () => {
    assert.equal(escapeHtml("Ahmet Yıldız"), "Ahmet Yıldız");
  });

  test("null/undefined için boş string döner (çökmez)", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
  });
});

describe("buildPrintDocument", () => {
  test("başlığı kaçırır, gövdeyi ve head ekini olduğu gibi yerleştirir", () => {
    const html = buildPrintDocument("A <b> & B", "<p>içerik</p>", "<style>p{color:red}</style>");
    assert.ok(html.startsWith("<!DOCTYPE html>"));
    assert.ok(html.includes("<title>A &lt;b&gt; &amp; B</title>"));
    assert.ok(html.includes("<style>p{color:red}</style>"));
    assert.ok(html.includes("<body><p>içerik</p></body>"));
  });

  test("head eki verilmezse de geçerli belge üretir", () => {
    const html = buildPrintDocument("Başlık", "<p>x</p>");
    assert.ok(html.includes("<title>Başlık</title>"));
    assert.ok(!html.includes("undefined"));
  });
});
