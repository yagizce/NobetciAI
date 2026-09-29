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
 * @param {string} title - Sekme başlığı (otomatik kaçırılır)
 * @param {string} bodyHtml - `<body>` içine yazılacak HTML (çağıran taraf sorumludur;
 *   kullanıcıdan/veriden gelen serbest metinler `escapeHtml` ile kaçırılmalıdır)
 * @param {string} [headExtra] - `<head>` içine eklenecek ek içerik (örn. `<style>...</style>`)
 * @returns {boolean} Pencere açılabildiyse true, popup engellendiyse false
 */
export function openPrintWindow(title, bodyHtml, headExtra = "") {
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) return false; // popup engellenmiş olabilir

  printWindow.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
${headExtra}
</head>
<body>${bodyHtml}</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  // Baskı diyaloğunu açmadan önce içeriğin render olması için kısa bir gecikme.
  setTimeout(() => printWindow.print(), 250);
  return true;
}
