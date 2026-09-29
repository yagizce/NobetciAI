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
//
// FOTOĞRAF KANITI: Risk Tespiti (Vision AI) → Fine-Kinney köprüsünden gelen kayıtlar
// artık kanıt fotoğrafını (photoId/photoDataUrl, bkz. RiskDetectionCard.jsx) taşıyor;
// bu dosya popup'ı açmadan önce hepsini paralel çözüp (bkz. resolveEntryPhoto) tabloya
// küçük bir görsel olarak ekliyor. Manuel girilen kayıtlarda fotoğraf alanı zaten
// yok — o satırlarda "Kanıt" hücresi boş kalır, bu beklenen bir durumdur.
//
// ZORUNLU BELGE DURUMU: Risk Değerlendirme Raporu / Acil Durum Planı gibi temel
// belgelerin sistemde olup olmadığı, dosyanın en üstünde ayrı bir bölümde gösterilir
// (bkz. utils/mandatoryDocumentsCheck.js). Bu bir HUKUKİ TAM KONTROL DEĞİL, en sık
// unutulan iki belgenin otomatik hatırlatmasıdır.
//
// KAPANIŞ KANITI: Bir kayıt "Kapandı" işaretlenirken eklenen düzeltici faaliyet kanıtı
// (closureNote/closurePhotoId, bkz. FineKinneyForm.jsx → ClosureEvidenceFields) varsa,
// "Kanıt" sütununda tehlike fotoğrafının ÖNÜNE geçer — denetçi için asıl önemli olan
// tehlikenin giderildiğinin görsel kanıtıdır (bkz. resolveEntryPhoto).

import { openPrintWindow, escapeHtml } from "../../../utils/printWindow.js";
import { toComparableDate, todayLabel } from "../../../utils/dateUtils.js";
import { getFineKinneyRiskLevel } from "../../../constants/fineKinney.js";
import { getCategoryLabel } from "../../../constants/periodicCheck.js";
import { getRiskDetectionPhoto } from "../../../services/riskDetectionPhotoService.js";
import { getClosureEvidencePhoto } from "../../../services/closureEvidenceService.js";
import { getMandatoryDocumentStatus } from "../../../utils/mandatoryDocumentsCheck.js";

/**
 * Bir Fine-Kinney kaydının kanıt fotoğrafını data URL olarak döner (varsa). Öncelik
 * kapanış kanıtına (closurePhotoId) verilir — bir kayıt kapandıysa denetçinin asıl
 * görmek isteyeceği şey tehlikenin GİDERİLDİĞİNİN kanıtıdır. Kapanış kanıtı yoksa
 * (kayıt hâlâ açık, veya kapandı ama fotoğraf değil yalnızca not eklendi) Risk
 * Tespiti'nden köprülenen orijinal tehlike fotoğrafına düşülür.
 * Bulunamazsa/hata olursa sessizce null döner: eksik bir fotoğraf, denetim dosyasının
 * geri kalanının oluşmasını engellememeli.
 * @param {import("../../../types/index.js").FineKinneyEntry} entry
 * @returns {Promise<string|null>}
 */
async function resolveEntryPhoto(entry) {
  if (entry.closurePhotoId) {
    try {
      const closurePhoto = await getClosureEvidencePhoto(entry.closurePhotoId);
      if (closurePhoto?.dataUrl) return closurePhoto.dataUrl;
    } catch (err) {
      console.error("Denetim dosyası: kapanış kanıtı fotoğrafı yüklenemedi:", err);
    }
  }
  if (entry.photoDataUrl) return entry.photoDataUrl;
  if (!entry.photoId) return null;
  try {
    const photo = await getRiskDetectionPhoto(entry.photoId);
    return photo?.dataUrl || null;
  } catch (err) {
    console.error("Denetim dosyası: kanıt fotoğrafı yüklenemedi:", err);
    return null;
  }
}

/**
 * @param {object} args
 * @param {import("../../../types/index.js").FineKinneyEntry[]} args.fineKinneyEntries
 * @param {import("../../../types/index.js").PeriodicCheck[]} args.periodicChecks
 * @param {{ participantCount: number, completedCount: number, failedCount: number, inProgressCount: number, assignedCount: number, completionRatePercent: number }} args.trainingStats
 * @param {string|null} args.companyName
 * @param {string} args.startDate - ISO "YYYY-MM-DD" (dahil)
 * @param {string} args.endDate - ISO "YYYY-MM-DD" (dahil)
 * @param {import("../../../types/index.js").DocumentRecord[]} [args.documents] - Zorunlu Belge Durumu bölümü için; verilmezse bölüm atlanır.
 * @returns {Promise<{ opened: boolean, riskCount: number, checkCount: number }>}
 */
export async function exportAuditPackage({ fineKinneyEntries, periodicChecks, trainingStats, companyName, startDate, endDate, documents = [] }) {
  const inRange = (isoDate) => Boolean(isoDate) && isoDate >= startDate && isoDate <= endDate;

  const risksInRange = fineKinneyEntries
    .filter((e) => inRange(toComparableDate(e.date)))
    .sort((a, b) => (toComparableDate(a.date) || "").localeCompare(toComparableDate(b.date) || ""));

  // Popup'ı açmadan ÖNCE tüm fotoğrafları paralel çözümlüyoruz (bkz. FineKinneyExportButtons.jsx
  // handlePdfExport → getPrimaryCompany için aynı "aç'tan önce await'le" deseni zaten kullanılıyor).
  const entryPhotos = await Promise.all(risksInRange.map(resolveEntryPhoto));

  const checksInRange = periodicChecks
    .filter((c) => inRange(c.lastCheckDate))
    .sort((a, b) => (a.lastCheckDate || "").localeCompare(b.lastCheckDate || ""));

  const mandatoryDocStatus = getMandatoryDocumentStatus(documents);

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
    .photo-cell { width: 64px; text-align: center; }
    .evidence-thumb { width: 56px; height: 56px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc; }
    .status-badge { display: inline-block; font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
    .status-ok { background: #e3f3e6; color: #1e7a34; }
    .status-missing { background: #fbe3e0; color: #b3341f; }
    .status-draft { background: #fdf1d9; color: #93650a; }
    .evidence-note { font-size: 9.5px; color: #555; margin-top: 3px; max-width: 140px; }
    .evidence-none { font-size: 10px; color: #999; }
  </style>`;

  const riskRows = risksInRange.length > 0
    ? risksInRange.map((e, i) => {
        const level = getFineKinneyRiskLevel(e.score);
        const photoDataUrl = entryPhotos[i];
        // UX FIX (Audit Readiness/kanıt cilası): kapanış kanıtı NOT VEYA fotoğraf ile
        // sağlanabilir (bkz. ClosureEvidenceFields.jsx) — ama bu hücre önceden yalnızca
        // fotoğraf varsa dolduruluyordu, metin-yalnız bir kapanış notu (`closureNote`)
        // yalnızca fotoğrafın HTML `title` özniteliğine gizleniyordu ki bu YAZDIRILDIĞINDA
        // hiç görünmez (tooltip'ler basılmaz). Sonuç: metinle kapatılmış, tamamen geçerli
        // bir kaydın "Kanıt" hücresi denetçiye TAMAMEN BOŞ görünüyordu — yanıltıcıydı.
        // Artık not her zaman görünür metin olarak basılıyor; hiçbiri yoksa "—" ile
        // hücrenin kasıtlı olarak boş olduğu (render hatası değil) netleştiriliyor.
        const noteHtml = e.closureNote ? `<div class="evidence-note">${escapeHtml(e.closureNote)}</div>` : "";
        const photoHtml = photoDataUrl ? `<img src="${photoDataUrl}" class="evidence-thumb" alt="Kanıt fotoğrafı" />` : "";
        const cellContent = photoHtml || noteHtml
          ? `${photoHtml}${noteHtml}`
          : `<span class="evidence-none">—</span>`;
        return `<tr>
          <td>${escapeHtml(e.date || "-")}</td>
          <td>${escapeHtml(e.hazard || "-")}</td>
          <td>${e.score} — ${escapeHtml(level.label)}</td>
          <td>${escapeHtml(e.status === "done" ? "Kapandı" : "Açık")}</td>
          <td class="photo-cell">${cellContent}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="5" class="empty">Seçilen tarih aralığında Fine-Kinney kaydı yok.</td></tr>`;

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
      <div class="summary-cell"><span class="n">${mandatoryDocStatus.filter((d) => d.status !== "ok").length}</span><span class="l">Eksik/taslak zorunlu belge</span></div>
    </div>

    <h2>Zorunlu Belge Durumu</h2>
    <table><thead><tr><th>Belge</th><th>Durum</th></tr></thead>
      <tbody>${mandatoryDocStatus.map((d) => {
        const badge = d.status === "ok"
          ? `<span class="status-badge status-ok">Mevcut</span>`
          : d.status === "draftOnly"
            ? `<span class="status-badge status-draft">Yalnızca Taslak</span>`
            : `<span class="status-badge status-missing">Eksik</span>`;
        return `<tr><td>${escapeHtml(d.label)}</td><td>${badge}</td></tr>`;
      }).join("")}</tbody></table>
    <p class="meta" style="margin-top: -4px;">Bu liste temel/genel bir kontroldür — sektöre veya tehlike sınıfına özgü ek zorunlu belgeler bu listede yer almayabilir.</p>

    <h2>Fine-Kinney Risk Kayıtları</h2>
    <table><thead><tr><th>Tarih</th><th>Tehlike</th><th>Skor / Seviye</th><th>Durum</th><th>Kanıt</th></tr></thead>
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

    <p class="footer-note">Bu dosya Nöbetçi İSG Yönetim Platformu üzerinden, sistemde kayıtlı gerçek verilerden otomatik oluşturulmuştur. Eğitim bölümü kurs bazlı özet niteliğindedir; kişi bazlı tamamlama belgesi Eğitim modülünden ayrıca alınabilir. Kanıt fotoğrafı yalnızca Risk Tespiti (Vision AI) üzerinden oluşturulan kayıtlarda bulunur — manuel girilen kayıtlarda bu alan boş kalır.</p>`;

  const opened = openPrintWindow("Denetim Dosyası", body, style);
  return { opened, riskCount: risksInRange.length, checkCount: checksInRange.length };
}
