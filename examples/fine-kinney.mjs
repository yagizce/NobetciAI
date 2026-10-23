// Depo içi teknik örnek; ağ, React veya veritabanı gerektirmez.
import { computeFineKinneyScore, getFineKinneyRiskLevel } from "../src/constants/fineKinney.js";

const score = computeFineKinneyScore(3, 6, 7);
const { key, label } = getFineKinneyRiskLevel(score);
console.log(JSON.stringify({ score, key, label }, null, 2));
