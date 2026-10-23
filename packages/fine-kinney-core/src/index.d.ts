// SPDX-License-Identifier: Apache-2.0
export type RiskLevel = "low" | "possible" | "important" | "high" | "veryHigh";
export declare const PROBABILITY_SCALE: readonly number[];
export declare const FREQUENCY_SCALE: readonly number[];
export declare const SEVERITY_SCALE: readonly number[];
/** No runtime input validation; callers must supply valid finite numeric inputs. */
export declare function computeFineKinneyScore(probability: number, frequency: number, severity: number): number;
/** Callers must validate the score before classification. */
export declare function classifyFineKinneyRisk(score: number): RiskLevel;
