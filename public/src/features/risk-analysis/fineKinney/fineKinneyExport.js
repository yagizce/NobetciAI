import { getFineKinneyRiskLevel, STATUS_OPTIONS, getPriorityMeta } from "../../../constants/fineKinney.js";

// FineKinneyExportButtons.jsx'ten ÇIKARILDI: veri hazırlama mantığı React'tan bağımsız,
// test edilebilir olsun diye. departmentId ham id olarak saklanır (bkz.
// filterFineKinneyEntries.js); export için okunabilir isme çevrilmesi gerekir — bu
// yüzden departments listesi parametre olarak alınır (FineKinneyModule zaten
// useCompanyOrgLists ile buna sahip, ekstra bir sorgu gerekmez).

export const FINE_KINNEY_EXPORT_HEADERS = [
  "Sıra No", "Tehlike", "Risk", "Etkilenenler", "Departman", "Olasılık", "Maruziyet", "Şiddet", "Skor",
  "Risk Seviyesi", "Öncelik", "Durum", "Tarih", "Alınacak Önlemler", "Termin",
];

/**
 * @param {object[]} entries
 * @param {object[]} departments - {id, name}[]
 * @returns {Array<Array<string|number>>}
 */
export function buildFineKinneyExportRows(entries, departments) {
  const deptName = (id) => departments.find((d) => String(d.id) === String(id))?.name || "";
  const statusLabel = (value) => STATUS_OPTIONS.find((s) => s.value === value)?.label || value;

  return entries.map((e, index) => [
    index + 1,
    e.hazard,
    e.risk,
    e.affected || "",
    e.departmentId ? deptName(e.departmentId) : "",
    e.probability,
    e.frequency,
    e.severity,
    e.score,
    getFineKinneyRiskLevel(e.score).label,
    getPriorityMeta(e.priority).label,
    statusLabel(e.status),
    e.date || "",
    e.action || "",
    e.dueDate || "",
  ]);
}

/**
 * Sprint: PDF için AYRI, sade bir satır yapısı — Excel'in 15 sütunundan bağımsız.
 * PDF'in Excel formatına benzemesi gerekmiyor (müşteri talebi); her kayıt TEK SATIRDA:
 * Sıra No, Tehlike, Risk, Puan, Alınacak Önlemler. Departman/tarih/durum/öncelik gibi
 * alanlar PDF'te YOK — uzun "Alınacak Önlemler" metni için yer açmak amacıyla bilinçli
 * olarak çıkarıldı (çok sütunlu tablo, uzun önlem metniyle birlikte dağınık görünüyordu).
 * @param {object[]} entries
 * @returns {Array<{ no: number, hazard: string, risk: string, score: number, action: string }>}
 */
export function buildFineKinneyPdfRows(entries) {
  return entries.map((e, index) => ({
    no: index + 1,
    hazard: e.hazard,
    risk: e.risk,
    score: e.score,
    action: e.action || "—",
  }));
}
