export const SECTOR_OPTIONS = [
  "İnşaat", "Metal İşleme", "Tekstil", "Gıda", "Kimya", "Lojistik ve Depolama",
  "Enerji", "Otomotiv", "Ambalaj", "İSG Danışmanlığı", "Sağlık", "Eğitim", "Diğer",
];

// Yeni bir firma için departman listesi boşsa, ilk açılışta bu varsayılan set önerilir.
// Kullanıcı isterse bunlara ek olarak kendi departmanlarını da oluşturabilir (isCustom: true).
export const DEFAULT_DEPARTMENT_NAMES = ["Üretim", "Depo", "İdari İşler", "İnsan Kaynakları", "Bakım", "Kalite"];

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Pasif" },
];
