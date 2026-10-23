// SPDX-License-Identifier: Apache-2.0
import { computeFineKinneyScore, classifyFineKinneyRisk } from "fine-kinney-core";

// Inputs chosen for demonstration; a qualified assessor must select real values.
const probability = 3;
const frequency = 6;
const severity = 15;
const score = computeFineKinneyScore(probability, frequency, severity);
console.log(JSON.stringify({ score, level: classifyFineKinneyRisk(score) }));
// {"score":270,"level":"high"}
