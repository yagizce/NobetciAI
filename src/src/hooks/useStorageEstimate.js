import { useEffect, useState } from "react";
import { getStorageEstimate } from "../services/storageEstimateService.js";

/**
 * @returns {{ estimate: {usageBytes:number,quotaBytes:number,percentUsed:number}|null, loading: boolean }}
 *   `estimate: null` (loading: false durumunda) hem "desteklenmiyor" hem "hata oluştu"
 *   anlamına gelir — çağıran taraf (StorageUsageIndicator.jsx) ikisini de aynı şekilde
 *   ele alır: göstergeyi SESSİZCE gizler, hata mesajı göstermez.
 */
export function useStorageEstimate() {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStorageEstimate().then((result) => {
      if (cancelled) return;
      setEstimate(result);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { estimate, loading };
}
