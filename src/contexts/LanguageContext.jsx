import { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

const LanguageContext = createContext(null);
const STORAGE_KEY = "nobetci-language";

// Only Turkish has real content right now. English is listed (disabled) so the Settings UI
// and data shape are ready for real i18n later without adding a translation library now.
export const LANGUAGES = [
  { id: "tr", label: "Türkçe", enabled: true },
  { id: "en", label: "English", enabled: false },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useLocalStorage(STORAGE_KEY, "tr");
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
