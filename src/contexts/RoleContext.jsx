import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { SWITCHABLE_ROLES } from "../constants/allRoles.js";

const RoleContext = createContext(null);
const STORAGE_KEY = "nobetci-role";

// Rol verisinin TEK KAYNAĞI src/constants/allRoles.js'tir. Burada ayrı bir liste
// TANIMLANMAZ — geriye dönük uyumluluk için yalnızca re-export edilir. Yeni kod
// yazarken rol verisine ihtiyaç duyan modüller doğrudan allRoles.js'i kullanmalıdır.
export const ROLES = SWITCHABLE_ROLES;

export function RoleProvider({ children }) {
  const [role, setRole] = useLocalStorage(STORAGE_KEY, "employee");
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
