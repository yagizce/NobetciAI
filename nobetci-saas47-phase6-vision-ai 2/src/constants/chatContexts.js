// Bağlama Duyarlı AI Copilot (Phase 4).
//
// Amaç: kullanıcı "AI'ya Sor" ile belirli bir modülden (Fine-Kinney, Risk Tespiti,
// Periyodik Kontrol, Mevzuat) sohbete geçtiğinde, asistanın o bağlama göre daha
// odaklı yardımcı olması — SYSTEM_PROMPT'u değiştirmeden, üzerine kısa bir ek
// (`promptAddendum`) ekleyerek. Genel /chat girişinde (context'siz) hiçbir şey
// değişmez, davranış aynı kalır.
//
// Yeni bir modülden giriş noktası eklemek için: 1) buraya yeni bir CHAT_CONTEXTS
// girdisi ekle, 2) ilgili sayfada `useNavigate()` ile `/chat` rotasına
// `state={{ contextId: "..." }}` geçir. Bkz. RiskAnalysisPage.jsx örneği.
export const CHAT_CONTEXTS = {
  fineKinney: {
    label: "Fine-Kinney Değerlendirmesi",
    promptAddendum:
      "Kullanıcı şu anda Fine-Kinney risk değerlendirmesi ekranından geldi. Sorularını bu bağlamda yanıtla: " +
      "Olasılık/Maruziyet/Şiddet ölçeklerini nasıl okuyacağı, kontrol tedbiri/KKD önerileri, artık risk hesaplaması gibi konularda somut ve uygulanabilir cevaplar ver.",
    greeting: "Fine-Kinney değerlendirmesiyle ilgili sorularını yanıtlayabilirim — ölçek okuma, kontrol tedbiri önerisi veya artık risk hesaplaması hakkında sorabilirsin.",
    quickPrompts: [
      "Olasılık ve Maruziyet arasındaki fark ne?",
      "Bu tehlike için hangi kontrol tedbirlerini önerirsin?",
    ],
  },
  riskDetection: {
    label: "Risk Tespiti",
    promptAddendum:
      "Kullanıcı şu anda Risk Tespiti (saha triage) ekranından geldi. Tespit kategorileri, öncelik seviyeleri ve tespitin nasıl Fine-Kinney'e dönüştürüleceği konusunda yardımcı ol.",
    greeting: "Risk Tespiti ile ilgili sorularını yanıtlayabilirim — kategori seçimi, öncelik değerlendirmesi veya Fine-Kinney'e dönüştürme hakkında sorabilirsin.",
    quickPrompts: ["Bir tespiti ne zaman acil olarak işaretlemeliyim?"],
  },
  periodicChecks: {
    label: "Periyodik Kontrol",
    promptAddendum:
      "Kullanıcı şu anda Periyodik Kontrol (ekipman/tesisat muayene takibi) ekranından geldi. Muayene periyotları, gecikmiş kontroller ve mevzuata uygunluk konusunda yardımcı ol. Emin olmadığın spesifik yönetmelik maddesi/süresi varsa uydurma, genel iyi uygulamayı belirtip resmi kaynağı teyit etmesini öner.",
    greeting: "Periyodik Kontrol ile ilgili sorularını yanıtlayabilirim — muayene periyotları, gecikmiş kontroller veya hangi ekipmanın hangi sıklıkta kontrol edilmesi gerektiği hakkında sorabilirsin.",
    quickPrompts: ["Forklift periyodik kontrolü kaç ayda bir yapılmalı?"],
  },
  legislation: {
    label: "Mevzuat",
    promptAddendum:
      "Kullanıcı şu anda Mevzuat ekranından geldi. İSG mevzuatı hakkındaki genel sorularını yanıtla. Belirsiz veya sık değişen madde numaralarını/tarihlerini uydurma; genel çerçeveyi anlat ve güncel metni resmi kaynaktan (Mevzuat Bilgi Sistemi) teyit etmesini öner.",
    greeting: "İSG mevzuatıyla ilgili sorularını yanıtlayabilirim. Güncel madde numaraları/tarihler için her zaman resmi kaynağı teyit etmeni öneririm.",
    quickPrompts: ["6331 sayılı Kanun'un temel amacı nedir?"],
  },
};

/**
 * @param {string|undefined|null} contextId
 * @returns {typeof CHAT_CONTEXTS[keyof typeof CHAT_CONTEXTS] | null}
 */
export function getChatContext(contextId) {
  return (contextId && CHAT_CONTEXTS[contextId]) || null;
}
