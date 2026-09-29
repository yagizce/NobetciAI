// accidentFreeStreak — Dashboard'daki "Kazasız Gün Sayacı" widget'ı için gerçek veriden
// (bildirim akışındaki type: "kaza" kayıtları) hesaplama yapar. Mock değildir; hiç "kaza"
// bildirimi yoksa sahte bir gün sayısı UYDURULMAZ — bunun yerine "henüz kayıt yok" durumu
// açıkça döndürülür (bkz. DEVELOPMENT_RULES.md → General Rules: "emin olmadığın konularda
// varsayım yapma").

import { toComparableDate } from "./dateUtils.js";

/**
 * @param {Array<{type: string, date: string}>} notifications - useIsgData().notifications
 * @returns {{ hasRecord: boolean, days: number|null, lastAccidentDate: string|null }}
 */
export function computeAccidentFreeStreak(notifications) {
  const accidentDates = (notifications || [])
    .filter((n) => n.type === "kaza")
    .map((n) => toComparableDate(n.date))
    .filter(Boolean)
    .sort()
    .reverse();

  if (accidentDates.length === 0) {
    return { hasRecord: false, days: null, lastAccidentDate: null };
  }

  const lastDate = new Date(accidentDates[0]);
  const days = Math.max(0, Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
  return { hasRecord: true, days, lastAccidentDate: accidentDates[0] };
}
