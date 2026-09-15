import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "./printWindow.js";

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
