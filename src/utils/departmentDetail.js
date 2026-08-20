// departmentDetail — Risk Isı Haritası'ndaki bir departmana tıklanınca açılan panelin
// veri hesaplama katmanı. İki güven seviyesi vardır (bkz. employeeNameMatch.js):
//   GÜVENİLİR: fineKinneyEntries ve periodicChecks doğrudan departmentId taşır.
//   BEST-EFFORT: notifications (ramak kala/kaza) ve eğitim kayıtları yalnızca isim
//   taşır; departmana employeeNameMatch.js üzerinden dolaylı bağlanır. Panel bu
//   ikisini görsel olarak AYIRT ETMELİDİR (bkz. DepartmentDetailPanel.jsx).

import { toComparableDate } from "./dateUtils.js";
import { getFineKinneyRiskLevel } from "../constants/fineKinney.js";
import { computeTrainingStats } from "../constants/trainingStatus.js";
import { computePeriodicCheckStats } from "../constants/periodicCheck.js";
import { getDepartmentEmployeeNameSet, filterRecordsByDepartment } from "./employeeNameMatch.js";

function latestByDate(records) {
  return records
    .map((r) => ({ ...r, _comparableDate: toComparableDate(r.date) }))
    .filter((r) => r._comparableDate)
    .sort((a, b) => b._comparableDate.localeCompare(a._comparableDate))[0] || null;
}

/**
 * @param {string|number} departmentId
 * @param {object} sources
 * @param {object[]} sources.fineKinneyEntries
 * @param {object[]} sources.periodicChecks
 * @param {object[]} sources.notifications
 * @param {object[]} sources.employees
 * @param {object[]} sources.trainingProgressRecords
 * @param {object[]} sources.trainingCompletionRecords
 * @param {object[]} sources.courses - TRAINING_COURSES
 * @returns {{
 *   openRiskCount: number, avgRiskScore: number|null, riskLevel: object|null,
 *   lastNearMiss: object|null, lastAccident: object|null,
 *   trainingCompletionRatePercent: number, trainingParticipantCount: number,
 *   periodicCheckStats: object, departmentEmployeeCount: number,
 * }}
 */
export function computeDepartmentDetail(departmentId, sources) {
  const {
    fineKinneyEntries = [], periodicChecks = [], notifications = [], employees = [],
    trainingProgressRecords = [], trainingCompletionRecords = [], courses = [],
  } = sources;

  // GÜVENİLİR bölüm — doğrudan departmentId
  const deptEntries = fineKinneyEntries.filter((e) => String(e.departmentId) === String(departmentId));
  const openEntries = deptEntries.filter((e) => e.status !== "done");
  const avgRiskScore = deptEntries.length > 0
    ? Math.round(deptEntries.reduce((sum, e) => sum + e.score, 0) / deptEntries.length)
    : null;

  const deptChecks = periodicChecks.filter((c) => String(c.departmentId) === String(departmentId));
  const periodicCheckStats = computePeriodicCheckStats(deptChecks);

  // BEST-EFFORT bölüm — isim eşleştirmesi
  const nameSet = getDepartmentEmployeeNameSet(departmentId, employees);
  const departmentEmployeeCount = nameSet.size;

  const deptNotifications = filterRecordsByDepartment(notifications, "worker", nameSet);
  const lastNearMiss = latestByDate(deptNotifications.filter((n) => n.type === "ramakKala"));
  const lastAccident = latestByDate(deptNotifications.filter((n) => n.type === "kaza"));

  const deptProgress = filterRecordsByDepartment(trainingProgressRecords, "employeeName", nameSet);
  const deptCompletions = filterRecordsByDepartment(trainingCompletionRecords, "employeeName", nameSet);
  const trainingStats = computeTrainingStats(courses, deptProgress, deptCompletions);

  return {
    openRiskCount: openEntries.length,
    avgRiskScore,
    riskLevel: avgRiskScore !== null ? getFineKinneyRiskLevel(avgRiskScore) : null,
    lastNearMiss,
    lastAccident,
    trainingCompletionRatePercent: trainingStats.completionRatePercent,
    trainingParticipantCount: trainingStats.participantCount,
    periodicCheckStats,
    departmentEmployeeCount,
  };
}
