// executiveSummary — Dashboard'daki "Yönetici Özeti" metnini gerçek verilerden üretir.
// Fine-Kinney kayıtlarının `date`/`closedAt` alanlarını kullanarak "bu hafta" penceresini
// hesaplar — mock değil, gerçek veri üzerinden çalışır (veri azsa sayılar küçük/sıfır çıkar,
// bu normaldir).

function isWithinLastDays(dateStr, days) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

/**
 * @param {import("../types/index.js").FineKinneyEntry[]} fineKinneyEntries
 * @param {import("../types/index.js").PeriodicCheck[]} periodicChecks
 * @returns {{ newRisksThisWeek: number, closedRisksThisWeek: number, ongoingCriticalRisks: number, upcomingChecks: number, sentence: string }}
 */
export function computeWeeklySummary(fineKinneyEntries, periodicChecks) {
  const newRisksThisWeek = fineKinneyEntries.filter((e) => isWithinLastDays(e.date, 7)).length;
  const closedRisksThisWeek = fineKinneyEntries.filter((e) => e.closedAt && isWithinLastDays(e.closedAt, 7)).length;
  const ongoingCriticalRisks = fineKinneyEntries.filter((e) => e.status !== "done" && (e.priority === "high" || e.priority === "urgent")).length;
  const upcomingChecks = periodicChecks.filter((c) => c.status === "upcoming" || c.status === "overdue").length;

  const parts = [];
  parts.push(newRisksThisWeek > 0 ? `Bu hafta ${newRisksThisWeek} yeni risk oluşturuldu.` : "Bu hafta yeni risk oluşturulmadı.");
  if (closedRisksThisWeek > 0) parts.push(`${closedRisksThisWeek} risk kapatıldı.`);
  if (ongoingCriticalRisks > 0) parts.push(`${ongoingCriticalRisks} yüksek öncelikli risk devam ediyor.`);
  if (upcomingChecks > 0) parts.push(`${upcomingChecks} periyodik kontrol yaklaşmaktadır.`);
  if (parts.length === 1 && closedRisksThisWeek === 0 && ongoingCriticalRisks === 0 && upcomingChecks === 0) {
    parts.push("Genel durum sakin görünüyor.");
  }

  return { newRisksThisWeek, closedRisksThisWeek, ongoingCriticalRisks, upcomingChecks, sentence: parts.join(" ") };
}
