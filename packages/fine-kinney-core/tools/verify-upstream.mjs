// SPDX-License-Identifier: Apache-2.0
// Optional comparison against an explicitly supplied, trusted source checkout.
// This script executes that source module; never pass untrusted code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as core from "../src/index.js";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Usage: node tools/verify-upstream.mjs /trusted/path/to/fineKinney.js");
const absolutePath = resolve(sourcePath);
const source = await import(pathToFileURL(absolutePath).href);
for (const name of ["PROBABILITY_SCALE", "FREQUENCY_SCALE", "SEVERITY_SCALE"]) {
  assert.deepEqual(core[name], source[name].map(item => item.value));
}
let combinations = 0;
for (const p of core.PROBABILITY_SCALE) for (const f of core.FREQUENCY_SCALE) {
  for (const s of core.SEVERITY_SCALE) {
    const actual = core.computeFineKinneyScore(p, f, s);
    assert.ok(Object.is(actual, source.computeFineKinneyScore(p, f, s)));
    assert.equal(core.classifyFineKinneyRisk(actual), source.getFineKinneyRiskLevel(actual).key);
    combinations++;
  }
}
const edges = [-Infinity, -1, -0, 0, 19.999999, 20, 20.000001, 69.999999, 70,
  70.000001, 199.999999, 200, 200.000001, 399.999999, 400, 400.000001, 10000, Infinity, NaN];
for (const value of edges) {
  assert.equal(core.classifyFineKinneyRisk(value), source.getFineKinneyRiskLevel(value).key);
}
const invalid = [[NaN, 1, 1], [Infinity, 0, 1], [-1, 2, 3], [0, 2, 3],
  [Infinity, 1, 1], [-0, 1, 1], [0.1, 0.2, 3]];
for (const inputs of invalid) {
  assert.ok(Object.is(core.computeFineKinneyScore(...inputs), source.computeFineKinneyScore(...inputs)));
}
console.log(JSON.stringify({ sourceSha256: createHash("sha256").update(readFileSync(absolutePath)).digest("hex"),
  scaleCombinations: combinations, classificationEdges: edges.length, arithmeticEdges: invalid.length,
  result: "pass" }, null, 2));
