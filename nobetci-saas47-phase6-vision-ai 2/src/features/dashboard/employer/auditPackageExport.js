// Sprint: Tek Tık Denetim Dosyası — DashboardExportButtons.jsx'in tek sayfalık özet
// PDF'inden FARKLI bir ihtiyaç için: müfettiş/denetim anında, seçilen tarih aralığındaki
// TÜM Fine-Kinney kayıtlarını + periyodik kontrol sonuçlarını + eğitim durumunu tek
// dosyada, hazır ibraz edilebilir şekilde birleştirmek. Aynı sıfır-bağımlılık deseni
// (utils/printWindow.js → openPrintWindow) kullanılır; ayrı bir PDF kütüphanesi eklenmedi.
//
// BİLİNÇLİ SINIRLAMA: Eğitim bölümü, kurs bazlı özet istatistiktir (trainingStats) —
// kişi bazlı tam liste değil. Kişi bazlı "Tamamlama Belgesi" zaten ayrı bir özellik
// (printTrainingCompletionCertificate.js, Eğitim modülünden kişi bazlı üretiliyor).
// İkisini burada birleştirmek büyük bir refactor gerektirirdi (DEVELOPMENT_RULES.md
// → Code Quality: "gerçekten ihtiyaç yoksa büyük refactor yapma").

import { openPrintWindow, escapeHtml } from "../../../utils/printWindow.js";
import { toComparableDate, todayLabel } from "../../../utils/dateUtils.js";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { getCategoryLabel } from "../../../constants/periodicCheck.js";

/**
 * @param {object} args
 * @param {import("../../../types/index.js").FineKinneyEntry[]} args.fineKinneyEntries
 * @param {import("../../../types/index.js").PeriodicCheck[]} args.periodicChecks
 * @param {{ participantCount: number, completedCount: number, failedCount: number, inProgressCount: number, assignedCount: number, completionRatePercent: number }} args.trainingStats
 * @param {string|null} args.companyName
 * @param {string} args.startDate - ISO "YYYY-MM-DD" (dahil)
 * @param {string} args.endDate - ISO "YYYY-MM-DD" (dahil)
 * @returns {{ opened: boolean, riskCount: number, checkCount: number }}
 */
export function exportAuditPackage({ fineKinneyEntries, periodicChecks, trainingStats, companyName, startDate, endDate }) {
  const inRange = (isoDate) => Boolean(isoDate) && isoDate >= startDate && isoDate <= endDate;

  const risksInRange = fineKinneyEntries
    .filter((e) => inRange(toComparableDate(e.date)))
    .sort((a, b) => (toComparableDate(a.date) || "").localeCompare(toComparableDate(b.date) || ""));

  const checksInRange = periodicChecks
    .filter((c) => inRange(c.lastCheckDate))
    .sort((a, b) => (a.lastCheckDate || "").localeCompare(b.lastCheckDate || ""));

  const startLabel = new Date(startDate).toLocaleDateString("tr-TR");
  const endLabel = new Date(endDate).toLocaleDateString("tr-TR");

  const style = `<style>
    @page { size: A4 portrait; margin: 16mm; }
    body { font-family: Arial, sans-serif; color: #2b2822; font-size: 12px; }
    h1 { font-size: 19px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 24px 0 8px; padding-top: 12px; border-top: 2px solid #2b2822; }
    .meta { font-size: 11px; color: #666; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
    th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left; vertical-align: top; }
    th { background: #f3f1ea; }
    .empty { font-size: 11px; color: #888; font-style: italic; padding: 6px 0; }
    .summary-grid { display: flex; gap: 12px; margin: 8px 0 16px; }
    .summary-cell { flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 8px 10px; }
    .summary-cell .n { font-size: 18px; font-weight: bold; display: block; }
    .summary-cell .l { font-size: 10px; color: #666; }
    .footer-note { font-size: 9.5px; color: #999; margin-top: 28px; }
  </style>`;

  const riskRows = risksInRange.length > 0
    ? risksInRange.map((e) => {
        const level = getFineKinneyRiskLevel(e.score);
        return `<tr>
          <td>${escapeHtml(e.date || "-")}</td>
          <td>${escapeHtml(e.hazard || "-")}</td>
          <td>${e.score} — ${escapeHtml(level.label)}</td>
          <td>${escapeHtml(e.status === "done" ? "Kapandı" : "Açık")}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="4" class="empty">Seçilen tarih aralığında Fine-Kinney kaydı yok.</td></tr>`;

  const checkRows = checksInRange.length > 0
    ? checksInRange.map((c) => `<tr>
        <td>${escapeHtml(c.lastCheckDate || "-")}</td>
        <td>${escapeHtml(c.itemName || "-")}</td>
        <td>${escapeHtml(getCategoryLabel(c.category))}</td>
        <td>${escapeHtml(c.nextDueDate || "-")}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" class="empty">Seçilen tarih aralığında yapılmış periyodik kontrol kaydı yok.</td></tr>`;

  const body = `
    <h1>Denetim Dosyası</h1>
    <p class="meta">${escapeHtml(companyName || "Firma")} • Kapsanan dönem: ${escapeHtml(startLabel)} – ${escapeHtml(endLabel)} • Oluşturulma: ${escapeHtml(todayLabel())}</p>

    <div class="summary-grid">
      <div class="summary-cell"><span class="n">${risksInRange.length}</span><span class="l">Dönem içi risk kaydı</span></div>
      <div class="summary-cell"><span class="n">${checksInRange.length}</span><span class="l">Dönem içi yapılan kontrol</span></div>
      <div class="summary-cell"><span class="n">${trainingStats?.completionRatePercent ?? 0}%</span><span class="l">Genel eğitim tamamlama</span></div>
    </div>

    <h2>Fine-Kinney Risk Kayıtları</h2>
    <table><thead><tr><th>Tarih</th><th>Tehlike</th><th>Skor / Seviye</th><th>Durum</th></tr></thead>
      <tbody>${riskRows}</tbody></table>

    <h2>Periyodik Kontroller (Bu Dönemde Yapılan)</h2>
    <table><thead><tr><th>Tarih</th><th>Kalem</th><th>Kategori</th><th>Sonraki Kontrol</th></tr></thead>
      <tbody>${checkRows}</tbody></table>

    <h2>Eğitim Durumu (Genel — anlık durum, döneme özel değil)</h2>
    <table><thead><tr><th>Atandı</th><th>Devam Ediyor</th><th>Tamamlandı</th><th>Kaldı</th><th>Tamamlama Oranı</th></tr></thead>
      <tbody><tr>
        <td>${trainingStats?.assignedCount ?? 0}</td>
        <td>${trainingStats?.inProgressCount ?? 0}</td>
        <td>${trainingStats?.completedCount ?? 0}</td>
        <td>${trainingStats?.failedCount ?? 0}</td>
        <td>${trainingStats?.completionRatePercent ?? 0}%</td>
      </tr></tbody></table>

    <p class="footer-note">Bu dosya Nöbetçi İSG Yönetim Platformu üzerinden, sistemde kayıtlı gerçek verilerden otomatik oluşturulmuştur. Eğitim bölümü kurs bazlı özet niteliğindedir; kişi bazlı tamamlama belgesi Eğitim modülünden ayrıca alınabilir.</p>`;

  const opened = openPrintWindow("Denetim Dosyası", body, style);
  return { opened, riskCount: risksInRange.length, checkCount: checksInRange.length };
}
