// useFineKinneyEntries.js'teki filteredEntries useMemo'sundan ÇIKARILDI (davranış birebir
// aynı) — amaç, kritik filtreleme mantığını React'tan bağımsız, test edilebilir bir
// fonksiyon haline getirmek. Bkz. filterFineKinneyEntries.test.js.

import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { toComparableDate } from "../../../utils/dateUtils.js";
import { turkishLower } from "../../../utils/text.js";

/**
 * @param {object[]} entries
 * @param {object} filters
 * @param {string} filters.search
 * @param {string} filters.levelFilter
 * @param {string} filters.departmentFilter
 * @param {string} filters.branchFilter
 * @param {string} filters.statusFilter
 * @param {string} filters.priorityFilter
 * @param {string} filters.dateFrom
 * @param {string} filters.dateTo
 * @returns {object[]}
 */
export function filterFineKinneyEntries(entries, filters) {
  const { search, levelFilter, departmentFilter, branchFilter, statusFilter, priorityFilter, dateFrom, dateTo } = filters;
  const query = turkishLower((search || "").trim());

  return entries.filter((e) => {
    const matchesSearch = !query || turkishLower(e.hazard).includes(query) || turkishLower(e.risk).includes(query);
    const matchesLevel = !levelFilter || levelFilter === "all" || getFineKinneyRiskLevel(e.score).key === levelFilter;
    const matchesDepartment = !departmentFilter || departmentFilter === "all" || String(e.departmentId) === departmentFilter;
    const matchesBranch = !branchFilter || branchFilter === "all" || String(e.branchId) === branchFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || e.status === statusFilter;
    const matchesPriority = !priorityFilter || priorityFilter === "all" || e.priority === priorityFilter;
    const comparableDate = toComparableDate(e.date);
    const matchesDateFrom = !dateFrom || (comparableDate && comparableDate >= dateFrom);
    const matchesDateTo = !dateTo || (comparableDate && comparableDate <= dateTo);
    return matchesSearch && matchesLevel && matchesDepartment && matchesBranch && matchesStatus && matchesPriority && matchesDateFrom && matchesDateTo;
  });
}
