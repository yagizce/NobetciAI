import { useEffect, useState } from "react";
import { getRiskDetectionPhoto } from "../../../services/riskDetectionPhotoService.js";

// Modül seviyesi önbellek: aynı photoId'ye sahip birden fazla kart (bkz. Phase 6 —
// tek fotoğraftan türeyen çoklu bulgu) IndexedDB'yi tekrar tekrar sorgulamasın. Basit
// bir Map yeterli — fotoğraflar değişmez (immutable) olduğu için geçersiz kılma
// (invalidation) gerekmiyor; sayfa yenilenince zaten sıfırlanır.
const photoUrlCache = new Map();

/**
 * Bir RiskDetection kaydının fotoğrafını görüntülemek için data URL döner.
 * İki kaynağı da destekler:
 * - `photoDataUrl`: LEGACY/inline biçim (artık üretilmeyen, kaldırılmış tek-tespit fotoğraf akışının geçmiş kayıtları) — senkron, hemen döner.
 * - `photoId`: Phase 6 optimize edilmiş biçim (bkz. riskDetectionPhotoService.js) — IndexedDB'den asenkron çözülür, sonuç önbelleğe alınır.
 * @param {string|null} photoDataUrl
 * @param {string|null} photoId
 * @returns {string|null}
 */
export function useRiskDetectionPhotoUrl(photoDataUrl, photoId) {
  const [url, setUrl] = useState(() => photoDataUrl || (photoId ? photoUrlCache.get(photoId) : null) || null);

  useEffect(() => {
    if (photoDataUrl) {
      setUrl(photoDataUrl);
      return;
    }
    if (!photoId) {
      setUrl(null);
      return;
    }
    if (photoUrlCache.has(photoId)) {
      setUrl(photoUrlCache.get(photoId));
      return;
    }

    let cancelled = false;
    getRiskDetectionPhoto(photoId)
      .then((photo) => {
        if (cancelled) return;
        const resolvedUrl = photo?.dataUrl || null;
        if (resolvedUrl) photoUrlCache.set(photoId, resolvedUrl);
        setUrl(resolvedUrl);
      })
      .catch((err) => {
        console.error("Risk tespiti fotoğrafı yüklenemedi:", err);
        if (!cancelled) setUrl(null);
      });

    return () => { cancelled = true; };
  }, [photoDataUrl, photoId]);

  return url;
}
