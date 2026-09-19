import { useState, useCallback, useRef, useEffect } from "react";

/**
 * HARDENING: uygulama genelinde (Fine-Kinney, Risk Tespiti, Departman/Çalışan/Şube,
 * Periyodik Kontrol formları) "Kaydet" butonları yalnızca FORM GEÇERLİLİĞİNE göre
 * disable ediliyordu — async kaydetme işlemi (IndexedDB yazma + bildirim + denetim
 * kaydı) sürerken buton tıklanabilir kalıyordu. Hızlı çift tıklama (veya klavyeden
 * Enter + tıklama), aynı kaydın İKİ KEZ oluşturulmasına yol açabiliyordu.
 *
 * Bu hook, verilen async fonksiyonu "aynı anda yalnızca bir çağrı" kuralıyla sarar ve
 * `isSubmitting` durumunu döner — çağıran taraf bunu `disabled={... || isSubmitting}`
 * olarak buton üzerine ekler. Bileşen unmount olduktan sonra state güncellemesi
 * denenmez (React uyarısı / memory-leak riski yok).
 *
 * @param {(...args: any[]) => Promise<any>} handler
 * @returns {[(...args: any[]) => Promise<any|undefined>, boolean]}
 */
export function useSubmitGuard(handler) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const guardedHandler = useCallback(async (...args) => {
    if (inFlightRef.current) return undefined; // zaten devam eden bir çağrı varsa yenisini yok say
    inFlightRef.current = true;
    if (mountedRef.current) setIsSubmitting(true);
    try {
      return await handler(...args);
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  }, [handler]);

  return [guardedHandler, isSubmitting];
}
