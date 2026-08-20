const DB_NAME = "nobetci-isg";
// v12: riskDetectionPhotos store eklendi. Phase 6/Vision AI v1'de bir fotoğraftan
// birden fazla tehlike bulgusu onaylanınca (bkz. RiskDetectionPanel.jsx →
// handleConfirmFindings) her bulgu ayrı bir RiskDetection kaydı oluyordu, ama fotoğraf
// HER kayda ayrı ayrı (tam base64) gömülüyordu — 3 bulgulu tek bir fotoğraf 3 kat yer
// kaplıyordu. Artık fotoğraf bir kez bu store'a kaydediliyor, ilgili RiskDetection
// kayıtları yalnızca `photoId` referansı tutuyor (bkz. riskDetectionPhotoService.js).
// Eski `photoDataUrl` alanı (artık üretilmeyen, kaldırılmış tek-tespit fotoğraf akışının geçmiş
// kayıtlar için) hâlâ destekleniyor — geriye dönük uyumluluk bozulmadı.
const DB_VERSION = 12;
// Export edilir: backupService.js gibi "tüm store'ları dolaş" ihtiyacı olan kodlar bu
// listeyi TEKRAR TANIMLAMAK yerine buradan alır — yeni bir store eklendiğinde (bkz.
// DB_VERSION artışı) yedekleme kodunun ayrıca güncellenmesi gerekmez, otomatik kapsar.
export const STORES = ["equipment", "notifications", "risks", "fineKinney", "documents", "periodicChecks", "auditLog", "companies", "branches", "departments", "employees", "systemNotifications", "trainingCompletions", "trainingProgress", "riskDetections", "trainingCourseSettings", "riskDetectionPhotos"];

// REFACTOR: Bağlantı önbelleği — saveData/loadAllData/deleteData her çağrıldığında
// önceden `indexedDB.open()` YENİDEN çalıştırılıyordu (her okuma/yazma kendi bağlantısını
// açıp bırakıyordu). Tek bir kullanıcı etkileşiminde onlarca ardışık çağrı olabildiği için
// (örn. backupService.restoreFullBackup — her store için her kayıtta ayrı open/transaction),
// bu gözle görülür bir gecikmeye yol açıyordu. Artık bağlantı bir kez açılıp Promise olarak
// önbelleğe alınıyor ve sonraki tüm çağrılar aynı bağlantıyı paylaşıyor.
let dbInstancePromise = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      // Başka bir sekme DB_VERSION'ı yükseltirse bu bağlantı geçersiz kalabilir —
      // önbelleği temizleyip bir sonraki çağrının yeniden bağlanmasına izin ver.
      db.onversionchange = () => {
        db.close();
        dbInstancePromise = null;
      };
      resolve(db);
    };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach((s) => {
        if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" });
      });
    };
  });
}

function getDBInstance() {
  if (!dbInstancePromise) {
    dbInstancePromise = openDB().catch((err) => {
      dbInstancePromise = null; // başarısız bağlantıyı önbellekte tutma, sonraki çağrı tekrar denesin
      throw err;
    });
  }
  return dbInstancePromise;
}

/**
 * NOT: aşağıdaki üç fonksiyon artık transaction `oncomplete`/`onerror`'ını BEKLİYOR ve
 * hata durumunda THROW ediyor (önceden: `put()`/`delete()` çağrısı senkron olarak
 * kuyruğa alınır alınmaz Promise resolve oluyordu — transaction gerçekten commit olmadan,
 * hatta QuotaExceededError gibi bir hata olsa bile). Çağıran servis katmanı (dataProvider.js)
 * ve UI (örn. IsgDataContext.jsx'teki optimistic update'ler) artık gerçek yazma hatalarını
 * yakalayıp kullanıcıya gösterebilir; önceden veri sessizce kaydedilmemiş olabiliyordu ama
 * UI "kaydedildi" gibi davranmaya devam ediyordu.
 */
export async function saveData(storeName, data) {
  const db = await getDBInstance();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(data);
    tx.oncomplete = () => resolve(data);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error(`"${storeName}" yazma işlemi iptal edildi.`));
  });
}

export async function loadAllData(storeName) {
  const db = await getDBInstance();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteData(storeName, id) {
  const db = await getDBInstance();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error(`"${storeName}" silme işlemi iptal edildi.`));
  });
}

/**
 * RİSK TEMİZLİĞİ (bkz. CHANGELOG.md → Bilinen Risk): backupService.restoreFullBackup
 * önceden her store için AYRI bir transaction açıyordu (her store: mevcut kayıtları
 * oku → tek tek sil → tek tek yeni kayıtları yaz — hepsi bağımsız transaction'lar).
 * Bir store başarıyla değiştirilip bir SONRAKİ store'da hata olursa (örn. IndexedDB
 * kotası dolarsa), veritabanı bazı store'lar eski, bazıları yeni halinde YARIM KALMIŞ
 * olarak kalabiliyordu.
 *
 * Bu fonksiyon TÜM store'ları TEK bir IndexedDB transaction'ı içinde temizleyip yeni
 * veriyle doldurur. IndexedDB'nin native davranışı gereği, transaction içindeki
 * HERHANGİ bir işlem başarısız olursa TÜM transaction otomatik olarak abort edilir ve
 * o transaction'daki bütün değişiklikler (hem clear hem put, hangi store'da olursa
 * olsun) geri alınır — gerçek "ya hep ya hiç" garantisi, uygulama kodunda try/catch
 * ile taklit edilmiyor, IndexedDB'nin kendi transaction motoru sağlıyor.
 *
 * @param {Record<string, object[]>} dataByStore - store adı → yeni kayıtlar dizisi.
 *   `STORES` listesindeki bir store burada yoksa/boşsa, o store tamamen BOŞALTILIR
 *   (restore = değiştirme, birleştirme değil — bkz. backupService.js).
 * @returns {Promise<void>}
 */
export async function replaceAllData(dataByStore) {
  const db = await getDBInstance();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Geri yükleme işlemi iptal edildi, HİÇBİR değişiklik uygulanmadı (tüm store'lar önceki haliyle korundu)."));

    for (const storeName of STORES) {
      const store = tx.objectStore(storeName);
      store.clear();
      const incoming = dataByStore[storeName] || [];
      for (const record of incoming) store.put(record);
    }
  });
}
