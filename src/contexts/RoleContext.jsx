import { createContext, useContext, useCallback } from "react";
import { resolveReleaseRole } from "../constants/releaseProfile.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { SWITCHABLE_ROLES } from "../constants/allRoles.js";

const RoleContext = createContext(null);
const STORAGE_KEY = "nobetci-role";

// Rol verisinin TEK KAYNAĞI src/constants/allRoles.js'tir. Burada ayrı bir liste
// TANIMLANMAZ — geriye dönük uyumluluk için yalnızca re-export edilir. Yeni kod
// yazarken rol verisine ihtiyaç duyan modüller doğrudan allRoles.js'i kullanmalıdır.
export const ROLES = SWITCHABLE_ROLES;

export function RoleProvider({ children }) {
  const [storedRole, setStoredRole] = useLocalStorage(STORAGE_KEY, "expert");
  // Eski tercihi silmeden, ilk render'dan itibaren yalnızca açık rolü sun.
  const role = resolveReleaseRole(storedRole);
  const setRole = useCallback((next) => {
    setStoredRole((previous) => resolveReleaseRole(typeof next === "function" ? next(resolveReleaseRole(previous)) : next));
  }, [setStoredRole]);
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
