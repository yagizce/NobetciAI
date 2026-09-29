// safetyScore — 0-100 arası "Güvenlik Skoru" hesaplaması. Saf fonksiyon (side-effect yok),
// gerçek servis verilerinden beslenen metrics objesini alır, mock/tahmini bir formülle
// puanlar. İleride gerçek bir risk-skorlama modeli/backend eklenince yalnızca bu dosyanın
// içi değişecek — çağıran bileşen (SafetyScoreCard) aynı kalacak.

/**
 * @param {{ openRisks: number, criticalRisks: number, totalRisks: number, trainingCompletionRate: number, upcomingChecks: number, totalChecks: number, correctiveActionCompletionRate: number }} metrics
 * @returns {{ score: number, breakdown: Array<{ label: string, impact: number, description: string }> }}
 */
export function computeSafetyScore(metrics) {
  const breakdown = [];
  let score = 100;

  // Açık riskler — her açık risk için küçük bir düşüş, çok fazla birikince etkisi artar.
  if (metrics.openRisks > 0) {
    const impact = -Math.min(metrics.openRisks * 2, 20);
    score += impact;
    breakdown.push({ label: "Açık Riskler", impact, description: `${metrics.openRisks} açık risk kaydı` });
  }

  // Kritik riskler — çok daha ağır etki, çünkü ciddi yaralanma/ölüm potansiyeli taşıyor.
  if (metrics.criticalRisks > 0) {
    const impact = -Math.min(metrics.criticalRisks * 8, 35);
    score += impact;
    breakdown.push({ label: "Kritik Riskler", impact, description: `${metrics.criticalRisks} kritik seviyeli risk` });
  }

  // Eğitim tamamlama oranı — %100'den her sapma puandan düşer (ağırlık: %20'lik pay).
  const trainingGap = 100 - (metrics.trainingCompletionRate ?? 100);
  if (trainingGap > 0) {
    const impact = -Math.round(trainingGap * 0.2);
    score += impact;
    breakdown.push({ label: "Eğitim Tamamlama", impact, description: `Eğitimlerin %${metrics.trainingCompletionRate}'i tamamlandı` });
  }

  // Yaklaşan/geciken periyodik kontroller.
  if (metrics.upcomingChecks > 0) {
    const impact = -Math.min(metrics.upcomingChecks * 3, 15);
    score += impact;
    breakdown.push({ label: "Periyodik Kontroller", impact, description: `${metrics.upcomingChecks} kontrol yaklaşıyor veya gecikti` });
  }

  // Düzeltici faaliyet tamamlanma oranı — düşükse ciddi bir etki (asıl önlemler hayata geçmiyor demektir).
  const correctiveGap = 100 - (metrics.correctiveActionCompletionRate ?? 100);
  if (correctiveGap > 0) {
    const impact = -Math.round(correctiveGap * 0.15);
    score += impact;
    breakdown.push({ label: "Düzeltici Faaliyetler", impact, description: `Düzeltici faaliyetlerin %${metrics.correctiveActionCompletionRate}'i tamamlandı` });
  }

  if (breakdown.length === 0) {
    breakdown.push({ label: "Genel Durum", impact: 0, description: "Henüz yeterli veri yok — risk/eğitim/kontrol kaydı ekledikçe skor daha anlamlı olacak." });
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), breakdown };
}

/**
 * @param {number} score
 * @returns {{ label: string, tone: "success"|"warning"|"danger" }}
 */
export function getSafetyScoreLevel(score) {
  if (score >= 80) return { label: "İyi", tone: "success" };
  if (score >= 60) return { label: "Orta", tone: "warning" };
  return { label: "Riskli", tone: "danger" };
}
