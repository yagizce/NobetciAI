// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import * as core from "fine-kinney-core";

const { PROBABILITY_SCALE: probabilities, FREQUENCY_SCALE: frequencies,
  SEVERITY_SCALE: severities, computeFineKinneyScore: score,
  classifyFineKinneyRisk: level } = core;

test("public exports stay limited to arithmetic, classification, and numeric scales", () => {
  assert.deepEqual(Object.keys(core).sort(), ["FREQUENCY_SCALE", "PROBABILITY_SCALE", "SEVERITY_SCALE", "classifyFineKinneyRisk", "computeFineKinneyScore"].sort());
});

test("numeric scales match the extracted source and are immutable", () => {
  assert.deepEqual(probabilities, [0.1, 0.2, 0.5, 1, 3, 6, 10]);
  assert.deepEqual(frequencies, [0.5, 1, 2, 3, 6, 10]);
  assert.deepEqual(severities, [1, 3, 7, 15, 40, 100]);
  for (const scale of [probabilities, frequencies, severities]) {
    assert.ok(Object.isFrozen(scale));
    assert.throws(() => scale.push(999), TypeError);
  }
});

// Independent integer-unit reference avoids mirroring floating-point multiplication.
// Probability is in tenths, frequency in halves; the denominator is 20.
const probabilityUnits = [1, 2, 5, 10, 30, 60, 100];
const frequencyUnits = [1, 2, 4, 6, 12, 20];
const orderedLevels = ["low", "possible", "important", "high", "veryHigh"];
for (let p = 0; p < probabilities.length; p++) {
  for (let f = 0; f < frequencies.length; f++) {
    for (const s of severities) {
      test(`scale combination ${probabilities[p]} x ${frequencies[f]} x ${s}`, () => {
        const expected = probabilityUnits[p] * frequencyUnits[f] * s / 20;
        const actual = score(probabilities[p], frequencies[f], s);
        assert.ok(Math.abs(actual - expected) <= Number.EPSILON * Math.max(1, expected) * 2);
        const index = [20, 70, 200, 400].filter(boundary => expected >= boundary).length;
        assert.equal(level(actual), orderedLevels[index]);
      });
    }
  }
}

for (const [value, expected] of [
  [0, "low"], [19.999999, "low"], [20, "possible"], [20.000001, "possible"],
  [69.999999, "possible"], [70, "important"], [70.000001, "important"],
  [199.999999, "important"], [200, "high"], [200.000001, "high"],
  [399.999999, "high"], [400, "veryHigh"], [400.000001, "veryHigh"], [10000, "veryHigh"]
]) test(`boundary ${value} is ${expected}`, () => assert.equal(level(value), expected));

test("sample score and range", () => {
  assert.equal(score(3, 6, 15), 270);
  assert.equal(score(0.1, 0.5, 1), 0.05);
  assert.equal(score(10, 10, 100), 10000);
});

test("invalid numeric values retain source arithmetic; they are not safe assessments", () => {
  assert.ok(Number.isNaN(score(NaN, 1, 1)));
  assert.ok(Number.isNaN(score(Infinity, 0, 1)));
  assert.equal(score(-1, 2, 3), -6);
  assert.equal(score(0, 2, 3), 0);
  assert.equal(score(Infinity, 1, 1), Infinity);
  assert.equal(level(NaN), "veryHigh");
  assert.equal(level(Infinity), "veryHigh");
  assert.equal(level(-Infinity), "low");
  assert.equal(level(-1), "low");
});

test("IEEE-754 evaluation order is preserved without rounding", () => {
  assert.equal(score(0.1, 0.2, 3), 0.06000000000000001);
  assert.ok(Object.is(score(-0, 1, 1), -0));
});

test("increasing a valid factor cannot reduce the score or risk class", () => {
  for (const p of probabilities) for (const f of frequencies) {
    let previous = -Infinity;
    let previousLevel = -1;
    for (const s of severities) {
      const current = score(p, f, s);
      const currentLevel = orderedLevels.indexOf(level(current));
      assert.ok(current >= previous);
      assert.ok(currentLevel >= previousLevel);
      previous = current;
      previousLevel = currentLevel;
    }
  }
});
