// departmentRiskTrend — Sprint: "hangi bölümde risk artıyor" uyarısı. dashboardTrends.js'teki
// (Son 30 Gün Değişim) FİRMA GENELİ karşılaştırma deseninin aynısını departman kırılımında
// uygular — yeni bir hesaplama yaklaşımı icat edilmedi, mevcut pencere mantığı yeniden
// kullanıldı. Gerçek zaman damgalı `date` alanından hesaplanır, mock/temsili veri yoktur.
//
// GÜRÜLTÜ FİLTRESİ: az sayıda kayıtla ("1 kayıttan 2 kayda çıktı") yanlış alarm vermemek
// için yalnızca current >= MIN_CURRENT_FOR_ALERT olan departmanlar "artıyor" sayılır.

import { toComparableDate, isoDateNDaysAgo, isoDateNDaysFromNow } from "./dateUtils.js";

const MIN_CURRENT_FOR_ALERT = 3;

function tomorrowISO() {
  return isoDateNDaysFromNow(1);
}

/**
 * @param {import("../types/index.js").FineKinneyEntry[]} fineKinneyEntries
 * @param {Array<{id: string|number, name: string}>} departments
 * @returns {Array<{ departmentId: string|number, label: string, current: number, previous: number, delta: number, increasing: boolean }>}
 *   Yalnızca current >= 3 VE delta > 0 olan (yani gerçekten artan) departmanlar döner,
 *   en çok artandan aza sıralı.
 */
export function computeDepartmentRiskTrends(fineKinneyEntries, departments) {
  const windowEnd = tomorrowISO();
  const currentStart = isoDateNDaysAgo(30);
  const previousStart = isoDateNDaysAgo(60);

  const counts = {}; // departmentId -> { current, previous }

  (fineKinneyEntries || []).forEach((e) => {
    if (!e.departmentId) return;
    const d = toComparableDate(e.date);
    if (!d) return;
    if (!counts[e.departmentId]) counts[e.departmentId] = { current: 0, previous: 0 };
    if (d >= currentStart && d < windowEnd) counts[e.departmentId].current += 1;
    else if (d >= previousStart && d < currentStart) counts[e.departmentId].previous += 1;
  });

  return Object.entries(counts)
    .map(([departmentId, c]) => ({
      departmentId,
      label: departments.find((dep) => String(dep.id) === String(departmentId))?.name || "Bilinmeyen departman",
      current: c.current,
      previous: c.previous,
      delta: c.current - c.previous,
      increasing: c.current >= MIN_CURRENT_FOR_ALERT && c.current > c.previous,
    }))
    .filter((r) => r.increasing)
    .sort((a, b) => b.delta - a.delta);
}
