import { useState } from "react";

// Teknik borç sağlamlaştırma sprintinde işaretlenen madde: `useAIRiskAnalysis.js` ve
// `useInitialRiskScore.js` aynı loading/error/try-catch iskeletini tekrar ediyordu.
// Bu hook, o ortak kısmı taşır; domain'e özel kısım (hangi servis çağrılacak, cevap
// nasıl parse edilip forma uygulanacak) çağıran hook'un `fetcher` fonksiyonunda kalır —
// burada AI/prompt/form'a dair HİÇBİR bilgi yok, yalnızca "bekliyor / hata / bitti" akışı var.

/**
 * @template T
 * @param {(...args: any[]) => Promise<T>} fetcher - AI çağrısını yapıp sonucu döndüren fonksiyon.
 *   Kendi içindeki hataları fırlatabilir; bu hook onları yakalayıp `error`'a çevirir.
 * @param {{ errorMessage?: string }} [options]
 * @returns {{ loading: boolean, error: string|null, run: (...args: any[]) => Promise<T|null> }}
 */
export function useAiSuggestion(fetcher, options = {}) {
  const { errorMessage = "AI önerisi alınamadı. İnternet bağlantınızı kontrol edip tekrar deneyin." } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function run(...args) {
    setLoading(true);
    setError(null);
    try {
      return await fetcher(...args);
    } catch {
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, run };
}
