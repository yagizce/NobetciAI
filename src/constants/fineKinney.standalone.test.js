import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PROBABILITY_SCALE, FREQUENCY_SCALE, SEVERITY_SCALE, computeFineKinneyScore, getFineKinneyRiskLevel } from "./fineKinney.js";

test("tüm 252 ölçek birleşimi finite puan üretir; tema risk sınıfını değiştirmez", () => {
  const scores = [];
  for (const p of PROBABILITY_SCALE) for (const f of FREQUENCY_SCALE) for (const s of SEVERITY_SCALE) {
    const score = computeFineKinneyScore(p.value, f.value, s.value);
    assert.ok(Number.isFinite(score));
    assert.equal(getFineKinneyRiskLevel(score, "light").key, getFineKinneyRiskLevel(score, "dark").key);
    scores.push(score);
  }
  assert.equal(scores.length, 252);
  assert.equal(Math.min(...scores), 0.05);
  assert.equal(Math.max(...scores), 10000);
});
test("belgelenen örnek tarayıcı, React ve depolama olmadan çalışır", () => {
  const example = fileURLToPath(new URL("../../examples/fine-kinney.mjs", import.meta.url));
  const actual = JSON.parse(execFileSync(process.execPath, [example], { encoding: "utf8" }));
  assert.deepEqual(actual, { score: 126, key: "important", label: "Önemli Risk" });
});
test("geçersiz girdi davranışı değiştirilmez; çağıran doğrulaması gereklidir", () => {
  assert.ok(Number.isNaN(computeFineKinneyScore(undefined, 6, 7)));
  assert.equal(computeFineKinneyScore(-1, 6, 7), -42);
  assert.equal(getFineKinneyRiskLevel(NaN).key, "veryHigh");
});
