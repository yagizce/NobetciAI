import { useState, useEffect } from "react";

/**
 * Generic localStorage-backed state. Used by ThemeContext, RoleContext, LanguageContext,
 * and notification preferences — previously each of these hand-rolled the same
 * try/catch read-on-init + write-on-change pattern independently.
 *
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {[T, (value: T) => void]}
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return defaultValue;
      try {
        return JSON.parse(stored);
      } catch {
        // Backward compatibility: earlier versions stored plain strings (e.g. "dark")
        // instead of JSON ("\"dark\""). Treat an unparsable value as a raw string.
        return stored;
      }
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable (e.g. private browsing) — value just won't persist
    }
  }, [key, value]);

  return [value, setValue];
}
