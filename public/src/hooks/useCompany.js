import { useState, useEffect, useCallback } from "react";
import { getPrimaryCompany } from "../services/companyService.js";

/**
 * Uygulama genelinde tekrar tekrar yazılan `getPrimaryCompany()` + loading state
 * deseninin paylaşılan hali. Şimdilik tek firma varsayımıyla çalışır (bkz.
 * companyService.js → getPrimaryCompanyId). Rol/izin kararları (örn.
 * canManageRiskAssessments) firma bazlı ayarlara ihtiyaç duyduğunda bu hook kullanılır.
 *
 * @returns {{ company: object|null, loaded: boolean }}
 */
export function useCompany() {
  const [company, setCompany] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    getPrimaryCompany()
      .then((c) => {
        setCompany(c);
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Firma bilgisi yüklenemedi:", err);
        setCompany(null);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { company, loaded, reload: load };
}
