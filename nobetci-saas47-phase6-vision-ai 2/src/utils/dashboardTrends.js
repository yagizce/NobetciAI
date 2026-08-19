// dashboardTrends — "Son 30 Gün Değişim" kartı için GERÇEK zaman-bazlı karşılaştırma.
// TrendsPanel.jsx'teki 6 dönemlik seyrin aksine (orada açıkça "temsili" işaretli), burada
// yalnızca gerçek zaman damgalı kayıtlar sayılır. Veri azsa/yoksa delta 0 çıkar — bu
// beklenen ve doğru davranıştır (bkz. DEVELOPMENT_RULES.md → General Rules, "emin
// olmadığın konularda varsayım yapma").
//
// fineKinney.date alanı "DD.MM.YYYY" (todayLabel() ile üretilir, bkz.
// risk-analysis/fineKinney/useFineKinneyEntries.js), ISO DEĞİLDİR — bu yüzden
// `toComparableDate` ile "YYYY-MM-DD"ye çevrilir. closedAt/completedAt/lastCheckDate
// zaten ISO'dur (types/index.js).
//
// RİSK TEMİZLİĞİ: "bugün"/"N gün önce" hesaplamaları artık dateUtils.js'teki YEREL
// (UTC değil) `isoDateNDaysAgo`/`isoDateNDaysFromNow`'dan geliyor — bkz. o dosyadaki
// `toLocalIsoDate` notu.

import { toComparableDate, isoDateNDaysAgo, isoDateNDaysFromNow, toLocalIsoDate } from "./dateUtils.js";

function tomorrowISO() {
  return isoDateNDaysFromNow(1);
}

function inRange(comparableDate, start, end) {
  return Boolean(comparableDate) && comparableDate >= start && comparableDate < end;
}

/**
 * Son N ayın her biri için (ay sonu anlık görüntüsü), o ana kadar OLUŞTURULMUŞ risk
 * kayıtlarının kaçının o ana kadar KAPATILMIŞ olduğunu hesaplar — gerçek "risk kapanma
 * oranı" trendi. Önceden PerformancePanel.jsx'teki bu trend, mevcut orandan ofsetlerle
 * üretilen SENTETİK bir diziydi ("temsili" olarak işaretlenmişti); artık gerçek
 * `date`/`closedAt` zaman damgalarından hesaplanıyor — yeni bir backend/API gerekmedi,
 * bu veri zaten her Fine-Kinney kaydında tutuluyordu (bkz. useFineKinneyEntries.js).
 *
 * Veri azsa/yoksa (örn. yeni bir firma, geçmiş ay verisi yok) ilgili ay için oran 0
 * çıkar — bu beklenen ve doğru davranıştır (bkz. DEVELOPMENT_RULES.md → "emin olmadığın
 * konularda varsayım yapma"), sentetik bir eğri UYDURULMAZ.
 *
 * @param {import("../types/index.js").FineKinneyEntry[]} fineKinneyEntries
 * @param {number} [months=6]
 * @returns {number[]} en eskiden en yeniye, her ay için 0-100 arası kapanma oranı
 */
export function computeRiskClosureTrend(fineKinneyEntries, months = 6) {
  const withComparableDate = fineKinneyEntries
    .map((e) => ({ date: toComparableDate(e.date), closedAt: e.closedAt ? e.closedAt.slice(0, 10) : null }))
    .filter((e) => e.date); // tarihsiz/bozuk kayıtları say(ma) — trend'i çarpıtmasın

  const trend = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    // İlgili ayın SON gününün ISO tarihi (o ana kadar var olan/kapanan kayıtları saymak için).
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthEndIso = toLocalIsoDate(monthEnd);

    const existingByThen = withComparableDate.filter((e) => e.date <= monthEndIso);
    const closedByThen = existingByThen.filter((e) => e.closedAt && e.closedAt <= monthEndIso);

    trend.push(existingByThen.length > 0 ? Math.round((closedByThen.length / existingByThen.length) * 100) : 0);
  }
  return trend;
}

/**
 * @param {import("../types/index.js").FineKinneyEntry[]} fineKinneyEntries
 * @param {import("../types/index.js").PeriodicCheck[]} periodicChecks
 * @param {import("../types/index.js").TrainingCompletion[]} trainingCompletionRecords
 * @returns {{
 *   newRisks: { current: number, previous: number, delta: number, goodDirection: "down" },
 *   closedRisks: { current: number, previous: number, delta: number, goodDirection: "up" },
 *   completedTrainings: { current: number, previous: number, delta: number, goodDirection: "up" },
 *   checksPerformed: { current: number, previous: number, delta: number, goodDirection: "up" },
 * }}
 */
export function computeLast30DayChange(fineKinneyEntries, periodicChecks, trainingCompletionRecords) {
  const windowEnd = tomorrowISO(); // bugünü dahil etmek için "yarın" sınırı (exclusive üst sınır)
  const currentStart = isoDateNDaysAgo(30);
  const previousStart = isoDateNDaysAgo(60);

  function countInWindows(items, getComparableDate) {
    let current = 0;
    let previous = 0;
    for (const item of items) {
      const d = getComparableDate(item);
      if (!d) continue;
      if (inRange(d, currentStart, windowEnd)) current += 1;
      else if (inRange(d, previousStart, currentStart)) previous += 1;
    }
    return { current, previous, delta: current - previous };
  }

  const newRisks = {
    ...countInWindows(fineKinneyEntries, (e) => toComparableDate(e.date)),
    goodDirection: "down",
  };

  const closedRisks = {
    ...countInWindows(fineKinneyEntries.filter((e) => e.closedAt), (e) => e.closedAt.slice(0, 10)),
    goodDirection: "up",
  };

  const completedTrainings = {
    ...countInWindows(trainingCompletionRecords.filter((c) => c.passed), (c) => c.completedAt.slice(0, 10)),
    goodDirection: "up",
  };

  // "Gerçekleşen kontrol" = son kontrol tarihi bu pencerede olan kayıtlar (bir kontrolün
  // fiilen yapıldığı an — nextDueDate değil, lastCheckDate esas alınır).
  const checksPerformed = {
    ...countInWindows(periodicChecks, (c) => c.lastCheckDate),
    goodDirection: "up",
  };

  return { newRisks, closedRisks, completedTrainings, checksPerformed };
}
