// Yerel ilk sürümün ürün sınırı; yasal uzman kapasitesi hesabı değildir.
export const MAX_COMPANIES = 30;

export const SECTOR_OPTIONS = [
  "İnşaat", "Metal İşleme", "Tekstil", "Gıda", "Kimya", "Lojistik ve Depolama",
  "Enerji", "Otomotiv", "Ambalaj", "İSG Danışmanlığı", "Sağlık", "Eğitim", "Diğer",
];

// 6331 sayılı Kanun'un öngördüğü İSG tehlike sınıfı (NACE kodu üzerinden SGK
// tarafından belirlenir). Burada yalnızca firma profilinde ELLE beyan edilen bir
// bilgi olarak tutulur — otomatik hesaplama/tahmin YAPILMAZ (bkz. utils/auditPreparedness.js
// dosya başı notu: "uydurma veri üretme"). Boş bırakılabilir; Denetime Hazırlık
// kartı bilgi yoksa bunu skora dahil etmez, yalnızca "Belirtilmemiş" gösterir.
export const DANGER_CLASS_OPTIONS = [
  { value: "az_tehlikeli", label: "Az Tehlikeli" },
  { value: "tehlikeli", label: "Tehlikeli" },
  { value: "cok_tehlikeli", label: "Çok Tehlikeli" },
];

export function getDangerClassLabel(value) {
  return DANGER_CLASS_OPTIONS.find((d) => d.value === value)?.label || null;
}

// Yeni bir firma için departman listesi boşsa, ilk açılışta bu varsayılan set önerilir.
// Kullanıcı isterse bunlara ek olarak kendi departmanlarını da oluşturabilir (isCustom: true).
export const DEFAULT_DEPARTMENT_NAMES = ["Üretim", "Depo", "İdari İşler", "İnsan Kaynakları", "Bakım", "Kalite"];

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Pasif" },
];
