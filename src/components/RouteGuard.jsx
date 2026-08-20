import { useRole } from "../contexts/RoleContext.jsx";
import { isAuthenticated, hasRole, hasPermission } from "../utils/permissions.js";
import EmptyState from "./EmptyState.jsx";
import { ShieldAlert } from "./icons/index.jsx";

/**
 * Guards its children behind authentication + role/permission checks.
 *
 * ⚠️ MOCK MODU: `isAuthenticated()` bugün her zaman true dönüyor (gerçek login akışı
 * sayfalara henüz bağlı değil — bkz. CHANGELOG). Rol kontrolü ise gerçek: aktif
 * `RoleContext` rolüne göre çalışır, demo rol değiştiriciyle anında test edilebilir.
 *
 * Kullanım:
 *   <RouteGuard allowedRoles={["employer"]}>
 *     <CompanyManagementPanel />
 *   </RouteGuard>
 *
 * @param {{ children: React.ReactNode, allowedRoles?: string[], permission?: string, fallback?: React.ReactNode }} props
 */
export default function RouteGuard({ children, allowedRoles, permission, fallback }) {
  const { role } = useRole();

  if (!isAuthenticated(null)) {
    return fallback ?? <EmptyState icon={ShieldAlert} title="Giriş yapmanız gerekiyor" />;
  }

  if (allowedRoles && !hasRole(role, allowedRoles)) {
    return fallback ?? (
      <EmptyState
        icon={ShieldAlert}
        title="Bu bölüme erişim yetkiniz yok"
        description={`Bu içerik yalnızca şu roller için görünür: ${allowedRoles.join(", ")}.`}
      />
    );
  }

  if (permission && !hasPermission(role, permission)) {
    return fallback ?? <EmptyState icon={ShieldAlert} title="Bu işlem için yetkiniz yok" />;
  }

  return children;
}
