export function nowLabel() {
  return new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function todayLabel() {
  return new Date().toLocaleDateString("tr-TR");
}

/**
 * RİSK TEMİZLİĞİ: Bir Date nesnesini YEREL tarih bileşenlerinden (getFullYear/getMonth/
 * getDate) "YYYY-MM-DD" stringine çevirir — `date.toISOString().slice(0,10)`'un aksine
 * UTC'ye ÇEVİRMEZ. Bu fark önemliydi: `toISOString` UTC kullandığı için, Türkiye gibi
 * UTC'nin İLERİSİNDEKİ (+3) saat dilimlerinde gece yarısından sonraki ~birkaç saatlik
 * dilimde (yerel saat 00:00-02:59 arası) YANLIŞ GÜNÜ (bir önceki günü) döndürebiliyordu
 * — örn. `computeNextDueDate` yeni bir periyodik kontrol için "bugünü" baz aldığında,
 * gece 01:00'de oluşturulan bir kayıt bir gün ERKEN bir sonraki kontrol tarihiyle
 * kaydedilebiliyordu. Bu dosyadaki ve `dashboardTrends.js`/`departmentRiskTrend.js`/
 * `legislationRiskLinker.js`/`attentionItems.js`/`periodicCheck.js`/
 * `PeriodicCheckCalendar.jsx`/`useReminderScheduler.js`/`AuditPackageButton.jsx`'teki
 * TÜM "bugünün tarihi" / "N gün önce/sonra" hesaplamaları artık bu tek fonksiyon
 * üzerinden yapılıyor — hem zaman dilimi hatası düzeltildi hem de aynı mantığın 15
 * farklı yerde tekrar tekrar yazılması (kod tekrarı) sona erdi.
 * @param {Date} date
 * @returns {string}
 */
export function toLocalIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Bugünün tarihi, "YYYY-MM-DD" (ISO, `<input type="date">` ile uyumlu) formatında.
 * @returns {string}
 */
export function todayISO() {
  return toLocalIsoDate(new Date());
}

/**
 * Bugünden N gün ÖNCESİNİN ISO tarihi. Negatif `n` verilirse (veya `isoDateNDaysFromNow`
 * kullanılırsa) gelecekteki bir tarih döner.
 * @param {number} n
 * @returns {string}
 */
export function isoDateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - Number(n));
  return toLocalIsoDate(d);
}

/**
 * Bugünden N gün SONRASININ ISO tarihi (bkz. isoDateNDaysAgo).
 * @param {number} n
 * @returns {string}
 */
export function isoDateNDaysFromNow(n) {
  return isoDateNDaysAgo(-Number(n));
}

/**
 * "DD.MM.YYYY" (todayLabel formatı) → "YYYY-MM-DD" karşılaştırılabilir string.
 * Fine-Kinney tarih filtresi (input type="date", YYYY-MM-DD) ile date="DD.MM.YYYY"
 * alanını karşılaştırabilmek için kullanılır. Geçersiz/boş girişte null döner.
 * @param {string} trDateStr
 * @returns {string|null}
 */
export function toComparableDate(trDateStr) {
  if (!trDateStr) return null;
  const parts = trDateStr.split(".");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
