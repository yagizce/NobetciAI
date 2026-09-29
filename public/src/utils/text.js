/**
 * Türkçe'ye duyarlı küçük harfe çevirme.
 *
 * BUG FIX (test infra'sının glob hatası düzeltilip filterFineKinneyEntries.test.js gerçekten
 * çalıştırılınca ortaya çıktı): JS'in varsayılan (locale'siz) `.toLowerCase()`'i Türkçe büyük
 * "İ"yi düz "i" değil, nokta işaretli "i̇" (U+0069 + U+0307, iki kod noktası) karakterine
 * çevirir. Örnek: "FORKLİFT".toLowerCase() === "forkli̇ft" — bu, "forklift" ile substring
 * eşleşmesi YAPMAZ. Bu, Caps Lock açıkken veya mobil Türkçe klavyede otomatik büyük harfle
 * başlarken gerçekten karşılaşılabilecek bir durumdur.
 *
 * Bu ürün tamamen Türkçe olduğu için TÜM serbest metin arama/karşılaştırmalarında bu
 * fonksiyon kullanılmalı, çıplak `.toLowerCase()` değil.
 *
 * @param {string} str
 * @returns {string}
 */
export function turkishLower(str) {
  return (str || "").toLocaleLowerCase("tr-TR");
}
