// Eğitim Modülü — kurs tanımları.
//
// Video: `videoUrl` şimdilik SABİT bir yer tutucudur: projenin kendi `public/videos/` klasöründeki
// kısa (20 sn) test videosu. (Önceden Google'ın herkese açık "Big Buck Bunny" örnek dosyasına
// bağlıydı; o bağlantı `AccessDenied` döndürmeye başlayınca hiçbir kurs oynamıyor ve sınava
// geçilemiyordu — dış bağlantıya bağımlı kalmamak için kendi sunucumuzdan sunuluyor.) Gerçek
// İSG eğitim videoları (AI ile üretilecek olanlar dahil) AYRI bir karara ve altyapıya bağlıdır —
// bkz. docs/AI_ROADMAP.md; hazır olduğunda yalnızca bu adres değiştirilir. Bu dosyadaki
// video/sınav içeriği yalnızca akışı (izleme takibi → sınav → otomatik puanlama → tamamlama
// kaydı) uçtan uca çalışır hale getirmek içindir.
//
// Önceki `EDUCATION_MODULES` (yalnızca başlık listesi) buradan türetilir — bkz.
// constants/education.js.

const PLACEHOLDER_VIDEO_URL = "/videos/egitim-yer-tutucu.mp4";

export const TRAINING_COURSES = [
  {
    id: "kkd-kullanimi",
    title: "KKD Kullanımı",
    description: "Kişisel koruyucu donanımların doğru seçimi, kullanımı ve bakımı.",
    videoUrl: PLACEHOLDER_VIDEO_URL,
    mandatory: true,
    passingScorePercent: 70,
    quiz: [
      { id: "q1", question: "KKD'nin açılımı nedir?", options: ["Kişisel Koruyucu Donanım", "Kurumsal Kalite Denetimi", "Kaza Kontrol Direktifi", "Kişisel Kontrol Defteri"], correctIndex: 0 },
      { id: "q2", question: "Hasarlı bir baret ne yapılmalıdır?", options: ["Bantla tamir edilip kullanılır", "Derhal değiştirilir", "Yalnızca iç kısımda kullanılır", "Yöneticiye haber verilmeden kullanılmaya devam edilir"], correctIndex: 1 },
      { id: "q3", question: "KKD kullanım sorumluluğu kime aittir?", options: ["Yalnızca işverene", "Yalnızca çalışana", "İşveren sağlar, çalışan kullanmakla yükümlüdür", "Yalnızca İSG uzmanına"], correctIndex: 2 },
      { id: "q4", type: "multi", question: "Aşağıdakilerden hangileri KKD (Kişisel Koruyucu Donanım) örnekleridir? (Birden fazla seçebilirsiniz)", options: ["Baret", "İş eldiveni", "Kravat", "Koruyucu gözlük"], correctIndices: [0, 1, 3] },
    ],
  },
  {
    id: "yangin-sondurme",
    title: "Yangın Söndürme",
    description: "Yangın türleri, söndürücü seçimi ve tahliye prosedürleri.",
    videoUrl: PLACEHOLDER_VIDEO_URL,
    mandatory: true,
    passingScorePercent: 70,
    quiz: [
      { id: "q1", question: "Elektrikli cihaz yangınında hangi söndürücü kullanılmaz?", options: ["CO2 söndürücü", "Su bazlı söndürücü", "Kuru kimyevi tozlu söndürücü", "Yangın battaniyesi"], correctIndex: 1 },
      { id: "q2", question: "Yangın anında ilk yapılması gereken nedir?", options: ["Asansörle tahliye", "Alarmı vermek ve tahliyeye başlamak", "Eşyaları toplamak", "Yangını fotoğraflamak"], correctIndex: 1 },
      { id: "q3", question: "Toplanma noktası neden önemlidir?", options: ["Molalar için kullanılır", "Herkesin güvenle tahliye edildiğinin sayılabilmesi için", "Yalnızca yöneticiler için ayrılmıştır", "Önemi yoktur"], correctIndex: 1 },
    ],
  },
  {
    id: "ilk-yardim",
    title: "İlk Yardım",
    description: "Temel yaşam desteği ve işyerinde sık karşılaşılan yaralanmalara ilk müdahale.",
    videoUrl: PLACEHOLDER_VIDEO_URL,
    mandatory: true,
    passingScorePercent: 70,
    quiz: [
      { id: "q1", question: "Bilinci kapalı, nefes alan bir kişiye hangi pozisyon verilir?", options: ["Yüzüstü pozisyon", "Koma (yan yatış) pozisyonu", "Oturur pozisyon", "Baş aşağı pozisyon"], correctIndex: 1 },
      { id: "q2", question: "112'yi aramadan önce ne yapılmalıdır?", options: ["Hiçbir şey, önce arama yapılır", "Olay yerinin güvenliğini kontrol etmek", "Yaralıyı taşımak", "Beklemek"], correctIndex: 1 },
      { id: "q3", question: "Ciddi kanamalarda ilk müdahale nedir?", options: ["Bölgeyi yükseltmeden beklemek", "Doğrudan baskı uygulamak", "Turnike her zaman ilk seçenektir", "Kanamayı görmezden gelmek"], correctIndex: 1 },
    ],
  },
  {
    id: "elektrik-guvenligi",
    title: "Elektrik Güvenliği",
    description: "Elektrik çarpması riskleri, topraklama ve güvenli çalışma koşulları.",
    videoUrl: PLACEHOLDER_VIDEO_URL,
    mandatory: true,
    passingScorePercent: 70,
    quiz: [
      { id: "q1", question: "Islak elle elektrikli cihaza dokunmak neden tehlikelidir?", options: ["Su elektriği iletmez, tehlikeli değildir", "Su, elektriği daha iyi iletir ve çarpma riskini artırır", "Yalnızca yüksek gerilimde tehlikelidir", "Hiçbir riski yoktur"], correctIndex: 1 },
      { id: "q2", question: "Elektrik panosu önünde ne bırakılmamalıdır?", options: ["Hiçbir şey bırakılmaz, önü açık tutulur", "Süs eşyaları", "Reklam panoları", "Hepsi doğru"], correctIndex: 0 },
      { id: "q3", question: "Topraklamanın amacı nedir?", options: ["Estetik görünüm sağlamak", "Kaçak akımı güvenli şekilde toprağa iletmek", "Enerji tasarrufu sağlamak", "Hiçbir işlevi yoktur"], correctIndex: 1 },
    ],
  },
  {
    id: "yuksekte-calisma",
    title: "Yüksekte Çalışma",
    description: "Düşme riskine karşı korunma yöntemleri ve emniyet ekipmanı kullanımı.",
    videoUrl: PLACEHOLDER_VIDEO_URL,
    mandatory: true,
    passingScorePercent: 70,
    quiz: [
      { id: "q1", question: "Yüksekte çalışma kaç metreden itibaren özel önlem gerektirir?", options: ["Yasal olarak tanımlı eşik değerin üzerinde her durumda", "Hiçbir zaman", "Yalnızca 100 metre üzerinde", "Yalnızca dış mekanlarda"], correctIndex: 0 },
      { id: "q2", question: "Paraşüt tipi emniyet kemerinin amacı nedir?", options: ["Yalnızca görsel uyarı sağlamak", "Düşme anında düşüş enerjisini güvenli şekilde karşılamak", "Sıcak tutmak", "Hareketi kısıtlamak için"], correctIndex: 1 },
      { id: "q3", question: "İskele kurulumunda kim yetkili olmalıdır?", options: ["Herhangi bir çalışan", "Bu konuda eğitimli ve yetkilendirilmiş personel", "Yalnızca işveren", "Yetkilendirme gerekmez"], correctIndex: 1 },
    ],
  },
];

export function getTrainingCourse(courseId) {
  return TRAINING_COURSES.find((c) => c.id === courseId) || null;
}
