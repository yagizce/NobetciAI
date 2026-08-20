// employeeNameMatch — Sprint: "isim→çalışan bağlantısının sağlamlaştırılması".
//
// NEDEN VAR: `Notification` (ramak kala/tehlike/kaza, types/index.js:160) ve
// `TrainingCompletion`/`TrainingProgress` (types/index.js:190,205) kayıtları çalışanı
// bir `employeeId` İLE DEĞİL, serbest metin isimle (`worker` / `employeeName`) tutuyor.
// Bu, departman bazlı raporlama (örn. "bu departmanda son kaza ne zaman oldu") için tek
// kaynak: her yerde farklı bir eşleştirme mantığı YAZILMASIN diye buraya toplandı.
//
// BİLİNÇLİ SINIRLAMA: Bu, veri modelini DEĞİŞTİRMEZ (Notification/TrainingCompletion'a
// employeeId eklemek DATABASE_PLAN.md kapsamında ayrı, daha büyük bir karar — bkz.
// ROADMAP.md → Backlog). Bu dosya, MEVCUT serbest metin veriyle en iyi eşleştirmeyi
// yapan bir KÖPRÜdür; %100 güvenilir değildir (iki çalışan aynı isimdeyse veya isim
// yanlış yazıldıysa yanlış/eksik eşleşir). Bu yüzden tüketen her ekran, bu fonksiyonun
// sonucunu "kesin" değil "en iyi eşleşme" olarak sunmalı — bkz. DepartmentDetailPanel.jsx,
// TrainingComplianceListCard.jsx.

import { turkishLower } from "./text.js";

export function normalizeName(name) {
  return turkishLower(name || "").trim().replace(/\s+/g, " ");
}

function normalize(name) {
  return normalizeName(name);
}

/**
 * Bir serbest metin ismi, çalışan listesindeki `fullName` ile eşleştirir.
 * @param {string} name
 * @param {import("../types/index.js").Employee[]} employees
 * @returns {{ employee: import("../types/index.js").Employee|null, ambiguous: boolean }}
 *   `ambiguous: true` ise birden fazla çalışan aynı isme sahip — hangisi olduğu
 *   belirsiz, `employee` bu durumda ilk bulunanı döner (kullanıcı arayüzü bu durumu
 *   "kesin değil" olarak işaretlemeli).
 */
export function matchEmployeeByName(name, employees) {
  const target = normalize(name);
  if (!target) return { employee: null, ambiguous: false };

  const matches = (employees || []).filter((e) => normalize(e.fullName) === target);
  if (matches.length === 0) return { employee: null, ambiguous: false };
  return { employee: matches[0], ambiguous: matches.length > 1 };
}

/**
 * Bir departmandaki çalışanların isimlerini (normalize edilmiş Set) döner —
 * "bu kayıt bu departmana mı ait" kontrolünü O(1) yapmak için.
 * @param {string|number} departmentId
 * @param {import("../types/index.js").Employee[]} employees
 * @returns {Set<string>}
 */
export function getDepartmentEmployeeNameSet(departmentId, employees) {
  return new Set(
    (employees || [])
      .filter((e) => String(e.departmentId) === String(departmentId))
      .map((e) => normalize(e.fullName))
  );
}

/**
 * `nameField`'ı verilen kayıt listesini, bir departmana ait olanlarla filtreler.
 * @param {object[]} records
 * @param {string} nameField - kaydın isim alanının adı (örn. "worker", "employeeName")
 * @param {Set<string>} departmentNameSet - getDepartmentEmployeeNameSet() çıktısı
 * @returns {object[]}
 */
export function filterRecordsByDepartment(records, nameField, departmentNameSet) {
  return (records || []).filter((r) => departmentNameSet.has(normalize(r[nameField])));
}
