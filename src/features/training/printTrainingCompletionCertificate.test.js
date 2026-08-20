import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "./printTrainingCompletionCertificate.js";
import { escapeHtml as escapeHtmlFromSource } from "../../utils/printWindow.js";

// Tam test paketi utils/printWindow.test.js'te — burada yalnızca bu dosyanın onu
// doğru re-export ettiğini (aynı fonksiyon referansı) doğruluyoruz.
describe("printTrainingCompletionCertificate re-export", () => {
  test("escapeHtml, utils/printWindow.js'teki ile aynı fonksiyondur", () => {
    assert.equal(escapeHtml, escapeHtmlFromSource);
  });

  test("re-export edilen fonksiyon beklendiği gibi çalışır", () => {
    assert.equal(escapeHtml("<b>test</b>"), "&lt;b&gt;test&lt;/b&gt;");
  });
});
