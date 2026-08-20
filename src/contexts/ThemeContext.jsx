import { createContext, useContext } from "react";
import { THEMES } from "../constants/theme.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

const ThemeContext = createContext(null);
const STORAGE_KEY = "nobetci-theme-mode";

export function ThemeProvider({ children }) {
  const [mode, setMode] = useLocalStorage(STORAGE_KEY, "light");

  const toggleMode = () => setMode(mode === "light" ? "dark" : "light");
  const theme = THEMES[mode];

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
