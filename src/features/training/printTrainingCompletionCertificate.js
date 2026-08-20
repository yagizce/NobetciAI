// AI_ROADMAP.md → Eğitim Modülü genişletmeleri: "Tamamlama Belgesi" (PDF).
//
// BİLİNÇLİ İSİMLENDİRME KARARI: Bu, "sertifika" DEĞİL, "Tamamlama Belgesi"dir —
// types/index.js → TrainingCompletion'daki mevcut tasarım notu ("Sertifika/PDF
// ÜRETMEZ, kaydın kendisi belgedir") bilinçli bir karardı: "sertifika" kelimesi,
// uygulamanın resmi bir eğitim/akreditasyon kurumu olduğu izlenimini verebilir.
// Kullanıcıyla konuşulup "Tamamlama Belgesi" adıyla, bunun bir OSGB/resmi kurum
// sertifikası olmadığını açıkça belirten bir notla üretilmesine karar verildi —
// bkz. aşağıdaki belge içeriğindeki açıklama metni.
//
// SIFIR YENİ BAĞIMLILIK: jsPDF gibi bir kütüphane eklemek yerine, tarayıcının kendi
// yazdırma diyaloğu (bkz. utils/printWindow.js → openPrintWindow) kullanılıyor.

import { openPrintWindow, escapeHtml } from "../../utils/printWindow.js";

// Geriye dönük uyumluluk için re-export (bu dosyadan escapeHtml import eden varsa,
// örn. printTrainingCompletionCertificate.test.js).
export { escapeHtml };

/**
 * @param {{ employeeName: string, courseTitle: string, completedAt: string, quizScore: number, companyName?: string|null }} data
 * @returns {boolean} Pencere açılabildiyse true, popup engellendiyse false
 */
export function printTrainingCompletionCertificate({ employeeName, courseTitle, completedAt, quizScore, companyName }) {
  const dateLabel = new Date(completedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  const style = `<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #fff; color: #2b2822; }
  .sheet { width: 100%; min-height: 100vh; padding: 48px 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 10px double #b08a2e; }
  .eyebrow { letter-spacing: 4px; font-size: 12px; text-transform: uppercase; color: #8a7550; margin-bottom: 12px; font-family: Arial, sans-serif; }
  h1 { font-size: 34px; margin: 0 0 28px; color: #2b2822; }
  .name { font-size: 28px; font-weight: bold; margin: 8px 0 20px; border-bottom: 1px solid #b08a2e; display: inline-block; padding: 0 24px 6px; }
  .body-text { font-size: 15px; line-height: 1.7; max-width: 560px; margin: 0 auto 24px; }
  .course-title { font-weight: bold; }
  .meta { font-size: 13px; color: #555; font-family: Arial, sans-serif; margin-bottom: 36px; }
  .footer { display: flex; justify-content: space-between; width: 100%; max-width: 520px; margin-top: 24px; font-family: Arial, sans-serif; font-size: 12px; }
  .sig-line { border-top: 1px solid #999; padding-top: 6px; width: 200px; }
  .disclaimer { font-family: Arial, sans-serif; font-size: 10px; color: #999; margin-top: 40px; max-width: 520px; }
</style>`;

  const body = `
  <div class="sheet">
    <p class="eyebrow">${escapeHtml(companyName || "İş Sağlığı ve Güvenliği")}</p>
    <h1>Eğitim Tamamlama Belgesi</h1>
    <p class="body-text">Bu belge,</p>
    <p class="name">${escapeHtml(employeeName)}</p>
    <p class="body-text">isimli çalışanın <span class="course-title">"${escapeHtml(courseTitle)}"</span> eğitimini başarıyla (%${quizScore} sınav puanıyla) tamamladığını gösterir.</p>
    <p class="meta">Tamamlanma Tarihi: ${dateLabel}</p>
    <div class="footer">
      <div class="sig-line">İSG Uzmanı</div>
      <div class="sig-line">İşveren</div>
    </div>
    <p class="disclaimer">Bu belge, işyeri içi eğitim takibi amacıyla Nöbetçi İSG Yönetim Platformu üzerinden üretilmiştir; resmi bir eğitim kurumu veya OSGB sertifikası yerine geçmez.</p>
  </div>`;

  return openPrintWindow(`Tamamlama Belgesi — ${employeeName}`, body, style);
}
