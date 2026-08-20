// Pre-written quick-action Q&A — answered instantly in chat without an API call.
export const QUICK_ACTIONS = [
  {
    label: "Ramak kala bildir", iconKey: "ClipboardList", prompt: "Ramak kala olayı nasıl bildiririm?",
    answer: "Ramak kala bildirimi için:\n• Risk Analizi sayfasından \"Yeni Bildirim\" oluştur\n• Türü \"Ramak Kala\" seç, yer/açıklama gir, fotoğraf ekleyebilirsin\n• AI ön analiz yapar, İSG uzmanına düşer\n• Uzman onaylayınca işverene görev olarak düşer\nKimlik bilgin süreçte saklı tutulur.",
  },
  {
    label: "KKD kuralları", iconKey: "HardHat", prompt: "Bu alanda hangi KKD'leri kullanmalıyım?",
    answer: "Genel saha kuralı:\n• Baret ve çelik burunlu ayakkabı her zaman\n• İş gözlüğü kesme/taşlama alanlarında\n• 85 dB üzeri gürültüde kulaklık\n• Kimyasal alanlarda eldiven + maske\nAlan girişindeki tabelayı da kontrol et, bölgeye özel ek KKD olabilir.",
  },
  {
    label: "Kimyasal güvenlik", iconKey: "ShieldAlert", prompt: "Kimyasal madde ile çalışırken nelere dikkat etmeliyim?",
    answer: "• Kullanmadan önce SDS (güvenlik bilgi formu) etiketini oku\n• Uygun eldiven/gözlük/maske tak\n• Alanı havalandır, yiyecek-içecek bulundurma\n• Cilde/göze temasta bol suyla yıka, İSG'ye haber ver\nFarklı kimyasalları asla karıştırma.",
  },
  {
    label: "Elektrik güvenliği", iconKey: "Zap", prompt: "Elektrik panolarında ve kablolarda nelere dikkat etmeliyim?",
    answer: "• Yetkin değilsen pano kapaklarını asla açma\n• Hasarlı kabloyu kullanma, etiketleyip bildir\n• Bakım öncesi enerjinin kesildiğinden emin ol (LOTO)\n• Islak elle elektrikli ekipmana dokunma",
  },
  {
    label: "Yangın söndürücü", iconKey: "Flame", prompt: "Yangın söndürücü nasıl kullanılır?",
    answer: "PASS yöntemi:\n• Pimi çek\n• Hortumu ateşin dibine nişanla\n• Tetiği sık\n• Alevin tabanını süpürerek söndür\nDuman yoğunsa müdahale etme, tahliye et ve 112'yi ara.",
  },
  {
    label: "Acil toplanma noktası", iconKey: "MapPin", prompt: "Acil durumda toplanma noktası neresi ve nasıl davranmalıyım?",
    answer: "• Alarm çalınca çalışmayı bırak, makineyi güvenli konuma al\n• En yakın çıkışa yürüyerek (koşmadan) ilerle\n• Toplanma noktasına git\n• Amirin sayım yapana kadar alanı terk etme",
  },
];
