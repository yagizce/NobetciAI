import { useLocalStorage } from "../../hooks/useLocalStorage.js";

const STORAGE_KEY = "nobetci-knowledge-favorites";

/**
 * Sprint 7.3 — doküman favorileri. Kalıcı bir backend/IndexedDB store gerekmiyor;
 * `useLocalStorage` (tema/widget görünürlüğüyle aynı desen) yeterli — favoriler
 * yalnızca bir doküman id listesi, düşük riskli/düşük hacimli bir tercih verisi.
 * @returns {{ favoriteIds: number[], isFavorite: (id: number) => boolean, toggleFavorite: (id: number) => void }}
 */
export function useKnowledgeFavorites() {
  const [favoriteIds, setFavoriteIds] = useLocalStorage(STORAGE_KEY, []);

  function isFavorite(id) {
    return favoriteIds.includes(id);
  }

  function toggleFavorite(id) {
    setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return { favoriteIds, isFavorite, toggleFavorite };
}
