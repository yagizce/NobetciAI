// `printTrainingCompletionCertificate.js`'te tanıtılan "sıfır yeni bağımlılık, tarayıcı
// yazdırma diyaloğu" deseninin genel amaçlı hâli — artık 2. bir yerde (Fine-Kinney PDF
// export'u) de aynı desen gerekince buraya çıkarıldı. Ayrı bir pencerede açılır ki ana
// uygulamanın CSS'i/state'i etkilenmesin, yalnızca rapor içeriği yazdırılsın.

/**
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * Yazdırılacak tam HTML belgesini üretir (saf fonksiyon — popup ve iframe yolu AYNI belgeyi
 * kullanır).
 * @param {string} title
 * @param {string} bodyHtml
 * @param {string} [headExtra]
 * @returns {string}
 */
export function buildPrintDocument(title, bodyHtml, headExtra = "") {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
${headExtra}
</head>
<body>${bodyHtml}</body>
</html>`;
}

/**
 * Popup engellendiğinde (mobil tarayıcılar, kullanıcı etkileşiminden sonra `await` ile
 * gecikmiş çağrılar — örn. Denetim Dosyası kanıt fotoğraflarını önce çözümlüyor) yedek yol:
 * aynı sayfada görünmez bir iframe'e yazıp yalnızca onu yazdırır. Yeni pencere açılmadığı
 * için popup engelleyiciden etkilenmez; ana uygulamanın CSS'i yine etkilenmez.
 * @returns {boolean} iframe kurulup yazdırma tetiklendiyse true
 */
function printViaHiddenIframe(html) {
  try {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!doc) {
      iframe.remove();
      return false;
    }
    doc.open();
    doc.write(html);
    doc.close();
    const cleanup = () => setTimeout(() => iframe.remove(), 1000);
    win.addEventListener("afterprint", cleanup);
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        cleanup();
      }
    }, 250);
    setTimeout(() => iframe.remove(), 60_000); // afterprint hiç tetiklenmezse yine de temizle
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} title - Sekme başlığı (otomatik kaçırılır)
 * @param {string} bodyHtml - `<body>` içine yazılacak HTML (çağıran taraf sorumludur;
 *   kullanıcıdan/veriden gelen serbest metinler `escapeHtml` ile kaçırılmalıdır)
 * @param {string} [headExtra] - `<head>` içine eklenecek ek içerik (örn. `<style>...</style>`)
 * @returns {boolean} Yazdırma başlatılabildiyse true (popup ya da yedek iframe ile);
 *   ikisi de başarısızsa false
 */
export function openPrintWindow(title, bodyHtml, headExtra = "") {
  const html = buildPrintDocument(title, bodyHtml, headExtra);
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  // Popup engellenmişse (null) yedek yola düş — kullanıcı butona basıp hiçbir şey
  // olmadığını görmesin.
  if (!printWindow) return printViaHiddenIframe(html);

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  // Baskı diyaloğunu açmadan önce içeriğin render olması için kısa bir gecikme.
  setTimeout(() => printWindow.print(), 250);
  return true;
}
