// Rol Modeli — TEK KAYNAK (single source of truth).
//
// ALL_ROLES, sistemdeki tüm rolleri tanımlar. Demo rol değiştirici (Header/Settings/
// Profile) ve tüm "aktör etiketi" ihtiyaçları (denetim günlüğü, risk geçmişi vb.)
// buradan türetilir — başka hiçbir dosyada ayrı bir rol listesi TANIMLANMAZ.
//
// `src/contexts/RoleContext.jsx`, kendi ROLES listesini tutmak yerine bu dosyadaki
// SWITCHABLE_ROLES'ü re-export eder. Diğer tüm modüller `getRoleLabel`/`getRoleMeta`
// fonksiyonlarını doğrudan buradan import eder.
//
// ⚠️ KAPSAM KARARI: `companyAdmin`/`superAdmin` (OSGB / çoklu firma yönetimi senaryosu)
// bilinçli olarak kaldırıldı — ürün şu anlık çoklu firma yönetimi/OSGB'ye satılan bir
// ürün değil. Bu roller ileride gerçekten gerekirse (bkz. docs/ROADMAP.md Phase 7)
// buraya geri eklenebilir; DATABASE_PLAN.md'deki companyId yapısı zaten buna hazır.

export const ALL_ROLES = [
  { id: "expert", emoji: "🦺", label: "İSG Uzmanı" },
  { id: "employer", emoji: "👨‍💼", label: "İşveren" },
  { id: "employee", emoji: "👷", label: "Çalışan" },
];

// Bugün ALL_ROLES ile birebir aynı (üçü de switchable). Ayrı bir liste olarak
// kalıyor ki `RoleContext.jsx` ve diğer modüller import yolunu değiştirmesin —
// ileride yeniden ayrım gerekirse (örn. bir rol eklenip switchable olmaması
// gerekirse) tek satır değişiklikle geri dönülebilir.
export const SWITCHABLE_ROLES = ALL_ROLES;

export function getRoleLabel(roleId) {
  return ALL_ROLES.find((r) => r.id === roleId)?.label || roleId;
}

export function getRoleMeta(roleId) {
  return ALL_ROLES.find((r) => r.id === roleId) || null;
}
