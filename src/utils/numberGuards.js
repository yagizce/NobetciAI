/**
 * HARDENING: `completionPercent` gibi alanlar normal UI akışında (range slider,
 * min=0 max=100) her zaman sınırlar içinde kalır — ama bu alanlar aynı zamanda
 * BackupSection.jsx'in "yedek geri yükle" akışıyla veya tarayıcının DevTools →
 * Application → IndexedDB panelinden DOĞRUDAN da yazılabilir. Elle bozulmuş bir
 * yedek dosyası (örn. `completionPercent: 99999` veya `-40`) UI tarafında hiç
 * kontrol edilmeden `width: ${value}%` olarak render edilirse, ilerleme çubuğu
 * konteynerinin çok dışına taşıp sayfa genelinde yatay kaymaya (mobilde özellikle
 * ciddi bir kırılmaya) yol açar. Bu yardımcı, hem YAZMA (kayıt) hem de GÖSTERME
 * (render) noktalarında son bir güvenlik ağı olarak kullanılır.
 *
 * @param {*} value
 * @returns {number} 0-100 arasına sıkıştırılmış tam sayı (geçersiz girdide 0)
 */
export function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}
