// imageCompression — fotoğrafları IndexedDB'ye/analize göndermeden önce küçültür.
// Amaç: telefon kameraları genelde 3-5MB'lık orijinal dosya üretir; Risk Tespiti'nde
// bunu ham haliyle saklamak (özellikle Phase 6'da tek fotoğraftan birden fazla kayıt
// türeyebildiği için, bkz. riskDetectionPhotoService.js) IndexedDB'yi gereksiz şişirir.
// Görsel önizleme/AI analizi için 1600px uzun kenar ve %80 JPEG kalitesi fazlasıyla
// yeterli — bu, tipik bir 4-5MB fotoğrafı çoğu durumda 200-500KB'a indirir.
//
// BİLİNÇLİ SINIRLAMA: Bu bir "iyi niyet" optimizasyonudur, KESİN bir üst sınır DEĞİLDİR
// — bazı görseller (çok karmaşık/gürültülü içerik) sıkıştırma sonrası hâlâ büyük
// kalabilir. Gerçek bir üst sınır için fileValidation.js'teki MAX_IMAGE_SIZE_MB kontrolü
// (orijinal dosya üzerinde, giriş noktasında) kullanılmaya devam ediyor.

/**
 * Verilen genişlik/yükseklik çiftini, en-boy oranını KORUYARAK en uzun kenarı
 * `maxDimension`'ı aşmayacak şekilde ölçekler. Zaten küçükse büyütmez.
 * Canvas/Image gerektirmeyen saf bir hesaplama — birim testi bu yüzden mümkün.
 * @param {number} width
 * @param {number} height
 * @param {number} maxDimension
 * @returns {{ width: number, height: number }}
 */
export function computeScaledDimensions(width, height, maxDimension) {
  if (width <= 0 || height <= 0 || maxDimension <= 0) return { width, height };
  const longestSide = Math.max(width, height);
  if (longestSide <= maxDimension) return { width, height };
  const scale = maxDimension / longestSide;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Bir görsel dosyasını canvas üzerinden yeniden boyutlandırıp JPEG olarak sıkıştırır.
 * Yalnızca tarayıcıda çalışır (Image/canvas gerektirir).
 * @param {File} file
 * @param {{ maxDimension?: number, quality?: number }} [options]
 * @returns {Promise<string>} data URL (image/jpeg)
 */
export async function compressImageToDataUrl(file, { maxDimension = 1600, quality = 0.8 } = {}) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Görsel yüklenemedi"));
      el.src = objectUrl;
    });

    const { width, height } = computeScaledDimensions(img.naturalWidth, img.naturalHeight, maxDimension);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    // GIF/şeffaf PNG canvas üzerinde JPEG'e çevrilirken şeffaflık siyaha döner; bu
    // uygulamada yalnızca fotoğraf (kamera/galeri) akışı için kullanılıyor, ekran
    // görüntüsü/logo gibi şeffaflık gerektiren bir senaryo yok — bilinçli ödünleşim.
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
