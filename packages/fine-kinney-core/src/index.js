// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 yagizce
// Extracted and adapted from NobetciAI; see PROVENANCE.md for source revisions.
// UI metadata was removed; multiplication and threshold comparisons are unchanged.

export const PROBABILITY_SCALE = Object.freeze([0.1, 0.2, 0.5, 1, 3, 6, 10]);
export const FREQUENCY_SCALE = Object.freeze([0.5, 1, 2, 3, 6, 10]);
export const SEVERITY_SCALE = Object.freeze([1, 3, 7, 15, 40, 100]);

/** Multiply numeric inputs without validation, rounding, or clamping. */
export function computeFineKinneyScore(probability, frequency, severity) {
  return probability * frequency * severity;
}

/** Return the source application's risk key without UI metadata. */
export function classifyFineKinneyRisk(score) {
  if (score < 20) return "low";
  if (score < 70) return "possible";
  if (score < 200) return "important";
  if (score < 400) return "high";
  return "veryHigh";
}
