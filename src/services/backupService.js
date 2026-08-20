// backupService — TÜM uygulama verisinin (Fine-Kinney, çalışanlar, dokümanlar, eğitim
// kayıtları, her şey) tek bir JSON dosyasına yedeklenmesi/geri yüklenmesi.
//
// NEDEN ÖNEMLİ: Bu uygulama tek bir cihazda (telefonda), yalnızca IndexedDB'de veri
// tutuyor — backend/senkronizasyon yok. Telefon kaybolur, arızalanır veya tarayıcı verisi
// temizlenirse şu ana kadar HİÇBİR veri kurtarma yolu yoktu. Bu servis o riski kapatır.
//
// STORES listesi db.js'ten import edilir (tekrar tanımlanmaz) — yeni bir store eklendiğinde
// (DB_VERSION artışı) bu dosyanın ayrıca güncellenmesi GEREKMEZ, otomatik kapsar.

import { dataProvider } from "./dataProvider.js";
import { STORES, replaceAllData } from "./db.js";

const BACKUP_FORMAT_VERSION = 1;

/**
 * @param {{ includePhotos?: boolean }} [options] - includePhotos: false ise
 *   `riskDetectionPhotos` store'u ATLANIR (boş dizi olarak yazılır, dataProvider'a hiç
 *   sorulmaz). BUG FIX/HARDENING: Phase 6'dan beri fotoğraflar da tam yedeğe otomatik
 *   dahil oluyordu (STORES'tan geliyor) — biriken Vision AI fotoğrafları yedeği,
 *   BackupSection.jsx'teki geri yükleme dosya boyutu sınırının ÜZERİNE çıkarabiliyordu.
 *   Yani kullanıcı kendi ürettiği yedeği ileride bu cihaza GERİ YÜKLEYEMEYEBİLİYORDU —
 *   tam da bu özelliğin var olma sebebi olan senaryoda (telefon kaybolur, yedek gerekir)
 *   sessizce kilitleniyordu. Bu seçenek, BackupSection.jsx'in "fotoğrafsız yedek indir"
 *   düşme yolunu (fallback) mümkün kılar — tüm uyum-kritik veri (Fine-Kinney, çalışan,
 *   eğitim, periyodik kontrol) her koşulda yedeklenebilir kalır.
 * @returns {Promise<{ formatVersion: number, exportedAt: string, data: Record<string, object[]> }>}
 */
export async function buildFullBackup({ includePhotos = true } = {}) {
  const data = {};
  for (const store of STORES) {
    data[store] = store === "riskDetectionPhotos" && !includePhotos ? [] : await dataProvider.getAll(store);
  }
  return { formatVersion: BACKUP_FORMAT_VERSION, exportedAt: new Date().toISOString(), data };
}

/**
 * Bir yedek nesnesinin YAKLAŞIK indirilmiş dosya boyutunu (byte) hesaplar — saf/test
 * edilebilir. `Blob` tarayıcıda da Node'da da mevcut olduğu için ek bir bağımlılık
 * gerekmez. BackupSection.jsx bunu, indirmeden ÖNCE "bu yedek bu cihazda geri
 * yüklenebilir mi" kontrolü için kullanır (bkz. o dosyadaki MAX_BACKUP_SIZE_BYTES).
 * @param {object} backup
 * @returns {number}
 */
export function estimateBackupSizeBytes(backup) {
  return new Blob([JSON.stringify(backup)]).size;
}

/**
 * Bir yedek dosyasının restore edilmeden önce şeklini doğrular — saf/test edilebilir.
 * @param {any} backup - JSON.parse edilmiş, henüz doğrulanmamış veri
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBackup(backup) {
  if (!backup || typeof backup !== "object") return { valid: false, error: "Geçersiz dosya formatı." };
  if (backup.formatVersion !== BACKUP_FORMAT_VERSION) {
    return { valid: false, error: `Desteklenmeyen yedek sürümü (${backup.formatVersion ?? "yok"}). Bu uygulama sürümüyle uyumsuz.` };
  }
  // Eski yerel yedeklerde exportedAt bulunmayabilir; varsa geçerli bir tarih olmalı,
  // yoksa restore işlemi geriye dönük uyumluluk için yine değerlendirilebilir.
  if (backup.exportedAt !== undefined && Number.isNaN(Date.parse(backup.exportedAt))) {
    return { valid: false, error: "Yedek tarihi geçersiz." };
  }
  if (!backup.data || typeof backup.data !== "object" || Array.isArray(backup.data)) {
    return { valid: false, error: "Yedek dosyasında geçerli veri bulunamadı." };
  }
  for (const store of STORES) {
    if (backup.data[store] === undefined) continue;
    if (!Array.isArray(backup.data[store])) {
      return { valid: false, error: `"${store}" verisi geçersiz (dizi olmalı).` };
    }
    // IndexedDB store'ları keyPath: "id" kullanır; kayıtlar plain object olmalı,
    // id taşımalı ve aynı store içinde aynı anahtarı iki kez kullanmamalıdır.
    const seenIds = new Set();
    for (const record of backup.data[store]) {
      if (record == null || typeof record !== "object" || Array.isArray(record) || record.id === undefined || record.id === null) {
        return { valid: false, error: `"${store}" içinde geçersiz kayıt bulundu (plain object ve id gerekli).` };
      }
      const idKey = `${typeof record.id}:${String(record.id)}`;
      if (seenIds.has(idKey)) {
        return { valid: false, error: `"${store}" içinde yinelenen id bulundu (${record.id}). Dosya bozuk olabilir.` };
      }
      seenIds.add(idKey);
    }
  }
  return { valid: true };
}

/**
 * TÜM MEVCUT VERİYİ yedekteki veriyle DEĞİŞTİRİR (restore = replace, mevcut veriyle
 * BİRLEŞTİRMEZ). Çağırmadan önce kullanıcıya bunun geri alınamaz olduğu AÇIKÇA
 * belirtilip onay aldırılmalıdır (bkz. BackupSection.jsx). `validateBackup` ile önce
 * doğrulanmamış bir nesneyle çağrılmamalıdır — bu fonksiyon kendi başına doğrulama YAPMAZ.
 *
 * RİSK TEMİZLİĞİ (bkz. CHANGELOG.md → Bilinen Risk, artık ÇÖZÜLDÜ): önceden bu fonksiyon
 * her store için AYRI bir transaction açıyordu — bir store başarıyla değiştirilip bir
 * SONRAKİ store'da hata olursa, veritabanı yarı-eski/yarı-yeni halde kalabiliyordu. Artık
 * `db.js` → `replaceAllData` ile TÜM store'lar TEK bir IndexedDB transaction'ında
 * değiştiriliyor — IndexedDB'nin native "ya hep ya hiç" garantisi sayesinde, herhangi bir
 * hata olursa TÜM değişiklikler otomatik geri alınır (uygulama kodunda taklit edilmiyor).
 * @param {{ data: Record<string, object[]> }} backup
 */
export async function restoreFullBackup(backup) {
  const validation = validateBackup(backup);
  if (!validation.valid) throw new Error(validation.error);

  const dataByStore = {};
  for (const store of STORES) dataByStore[store] = backup.data[store] || [];
  try {
    await replaceAllData(dataByStore);
  } catch (err) {
    throw new Error(`Geri yükleme başarısız oldu, HİÇBİR değişiklik uygulanmadı: ${err?.message || err}`);
  }
}

/**
 * Yedek dosyasını tarayıcıda indirir. DOM'a bağımlı olduğu için (Blob/URL/document)
 * doğrudan birim testi yazılmadı — tutarlı bir sınır (diğer DOM-bağımlı export
 * fonksiyonlarıyla aynı, bkz. utils/exportCsv.js).
 * @param {object} backup - buildFullBackup() çıktısı
 * @param {{ labelSuffix?: string }} [options] - dosya adına eklenecek ek etiket (ör. "fotografsiz")
 */
export function downloadBackupFile(backup, { labelSuffix = "" } = {}) {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateLabel = backup.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `nobetci-yedek-${dateLabel}${labelSuffix ? `-${labelSuffix}` : ""}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
