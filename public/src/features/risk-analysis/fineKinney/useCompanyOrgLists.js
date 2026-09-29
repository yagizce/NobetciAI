import { useState, useEffect } from "react";
import { getPrimaryCompanyId } from "../../../services/companyService.js";
import { getDepartments } from "../../../services/departmentService.js";
import { getBranches } from "../../../services/branchService.js";

/**
 * Firmanın departman/şube listesini yükler. FineKinneyForm (seçim alanları) ve
 * FineKinneyFilters (filtreleme) tarafından ortak kullanılır — Sprint 5A #8
 * (duplicate kod yazma) gereği tek yerde toplandı.
 * @returns {{ departments: object[], branches: object[], hasMultipleBranches: boolean, loaded: boolean }}
 */
export function useCompanyOrgLists() {
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPrimaryCompanyId().then(async (companyId) => {
      if (!companyId) {
        if (!cancelled) setLoaded(true);
        return;
      }
      const [d, b] = await Promise.all([getDepartments(companyId), getBranches(companyId)]);
      if (!cancelled) {
        setDepartments(d);
        setBranches(b);
        setLoaded(true);
      }
    }).catch((err) => {
      // BUG FIX (Sprint 8 polish): .catch() yoktu — konsola işlenmeyen bir promise
      // reddi düşüyordu ve departman/şube dropdown'ları sessizce boş kalıyordu.
      // `loaded` hiçbir tüketici tarafından okunmadığı için burada bir hata state'i
      // eklemedim — yalnızca konsola düzgün loglanmasını sağladım.
      console.error("Departman/şube listesi yüklenemedi:", err);
      if (!cancelled) setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  return { departments, branches, hasMultipleBranches: branches.length > 1, loaded };
}
