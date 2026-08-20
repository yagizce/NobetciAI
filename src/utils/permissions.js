// permissions — küçük, saf (side-effect'siz) yetki kontrol fonksiyonları.
// Bugün mock oturum/rol üzerinden çalışıyor; gerçek auth (Supabase) eklenince
// `isAuthenticated`'a gerçek session objesi verilecek, `hasRole`/`hasPermission`
// imzaları AYNI kalacak — yalnızca çağıran RouteGuard'daki session kaynağı değişecek.

/**
 * @param {object|null} session - authService.getSession()'dan dönen session (veya mock'ta null/obj)
 * @returns {boolean}
 */
export function isAuthenticated(session) {
  // ⚠️ MOCK MODU: Gerçek login akışı henüz sayfalara bağlanmadı (bkz. CHANGELOG),
  // bu yüzden şimdilik oturum yoksa bile true dönüyoruz — aksi halde demo rol
  // değiştiricisiyle çalışan hiçbir sayfa açılamazdı. Gerçek auth bağlanınca bu satır
  // `return session !== null;` olacak.
  return true;
}

/**
 * @param {string} currentRole
 * @param {string[]} allowedRoles
 * @returns {boolean}
 */
export function hasRole(currentRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(currentRole);
}

// Rol → izin eşlemesi. Yalnızca bu sprintte gerçekten ihtiyaç duyulan izinler burada;
// yenileri eklendikçe bu tabloya satır eklemek yeterli olacak.
const ROLE_PERMISSIONS = {
  employer: ["manage_company", "manage_employees", "manage_branches", "manage_departments", "view_reports"],
  expert: ["view_reports", "approve_risk"],
  employee: ["submit_notification"],
};

/**
 * @param {string} currentRole
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(currentRole, permission) {
  return (ROLE_PERMISSIONS[currentRole] || []).includes(permission);
}
