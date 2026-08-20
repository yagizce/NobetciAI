import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseInitialScoreSuggestion } from "./systemPrompt.js";

describe("parseInitialScoreSuggestion", () => {
  test("beklenen formattaki cevabı doğru ayrıştırır", () => {
    const text = "Olasılık: 3\nMaruziyet: 6\nŞiddet: 15\nGerekçe: Yüksekten düşme ciddi yaralanmaya yol açabilir.";
    const result = parseInitialScoreSuggestion(text);
    assert.equal(result.probability, 3);
    assert.equal(result.frequency, 6);
    assert.equal(result.severity, 15);
    assert.equal(result.reasoning, "Yüksekten düşme ciddi yaralanmaya yol açabilir.");
  });

  test("boş/null cevap için tüm alanlar null döner (arayüz çökmez)", () => {
    assert.deepEqual(parseInitialScoreSuggestion(""), { probability: null, frequency: null, severity: null, reasoning: null });
    assert.deepEqual(parseInitialScoreSuggestion(null), { probability: null, frequency: null, severity: null, reasoning: null });
  });

  test("format dışı cevapta bulunamayan alanlar null, bulunanlar ayrıştırılır", () => {
    const text = "Olasılık: 1\nbeklenmeyen bir cevap yapısı";
    const result = parseInitialScoreSuggestion(text);
    assert.equal(result.probability, 1);
    assert.equal(result.frequency, null);
    assert.equal(result.severity, null);
  });

  test("ondalıklı değerleri (0.1, 0.5 gibi) doğru ayrıştırır", () => {
    const text = "Olasılık: 0.2\nMaruziyet: 0.5\nŞiddet: 1\nGerekçe: Nadir görülen, düşük etkili bir durum.";
    const result = parseInitialScoreSuggestion(text);
    assert.equal(result.probability, 0.2);
    assert.equal(result.frequency, 0.5);
    assert.equal(result.severity, 1);
  });
});
