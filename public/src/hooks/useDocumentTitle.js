import { useEffect } from "react";

/**
 * Sets document.title for the current page. Lightweight alternative to
 * react-helmet — avoids adding a new dependency for a single use case.
 * @param {string} title
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — Nöbetçi` : "Nöbetçi";
    return () => {
      document.title = previous;
    };
  }, [title]);
}
