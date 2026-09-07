// İSG Mevzuat Denetimi Modülü — Faz 2: gerçek mevzuat eşleştirmesi
// Kriter verisi, ISO 45001 dosyasıyla AYNI desende, ayrı bir dosyada tutulur
// (bkz. constants/iso45001Checklist.js dosya başı notu) — skor/ilerleme mantığı
// constants/auditScoring.js'teki jenerik motordan gelir, burada TEKRAR edilmez.
// Skor/ilerleme SADECE `result` alanına bakar (bkz. auditScoring.js) — aşağıdaki
// yeni alanlar (legislationName/article/controlPurpose/expectedEvidence/verified)
// salt bilgilendirme amaçlıdır, skor hesaplamasını HİÇ etkilemez.
//
// MEVZUAT DOĞRULAMA NOTU (Faz 2):
// Her kriterin mevzuat adı ve ilgili maddesi, resmi/güvenilir kaynaklardan
// (mevzuat.gov.tr, resmigazete.gov.tr ve çok sayıda birbirini doğrulayan ikincil
// kaynak) TEK TEK araştırılarak eklendi. Madde numarası TAHMİN EDİLMEDİ:
//   - `verified: true` → mevzuat adı VE madde numarası doğrudan kaynakla teyit edildi.
//   - `verified: false` → kriterin dayandığı KONU/yönetmelik bilinsе de, tam madde
//     numarası bu araştırmada teyit edilemedi. Kriter SİLİNMEDİ, `article: null`
//     bırakıldı; UI bunu "⚠️ DOĞRULAMA GEREKLİ" rozetiyle açıkça gösterir
//     (bkz. AuditDetailDrawer.jsx). Bu kayıtlar denetimde KULLANILABİLİR durumda
//     kalır — yalnızca kullanıcı mevzuat dayanağının teyide muhtaç olduğunu görür.
// Kaynaklar (Faz 2 araştırması, tümü resmi/çok kaynaklı doğrulama ile):
//   - 6331 sayılı İş Sağlığı ve Güvenliği Kanunu (10, 11, 12, 14, 15, 17, 20. maddeler)
//   - İşyerlerinde Acil Durumlar Hakkında Yönetmelik (madde 11)
//   - Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında
//     Yönetmelik (2 Nisan 2026 tarihli güncel yönetmelik — madde 8, 14)
//   - Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik
//     (madde 6, 8)
//   - Binaların Yangından Korunması Hakkında Yönetmelik (madde 30-31, kaçış yolları)
//   - İş Sağlığı ve Güvenliği Kurulları Hakkında Yönetmelik (madde 4)

import { computeCategoryScores as computeCategoryScoresGeneric } from "./auditScoring.js";

export {
  CHECKLIST_RESULTS,
  getResultMeta,
  computeProgressPercent,
  computeOverallScore,
} from "./auditScoring.js";

export const AUDIT_CATEGORIES = [
  { code: "risk", title: "Risk Değerlendirmesi" },
  { code: "acil", title: "Acil Durumlar" },
  { code: "egitim", title: "İSG Eğitimleri" },
  { code: "saglik", title: "Sağlık Gözetimi" },
  { code: "ekipman", title: "İş Ekipmanları ve Periyodik Kontroller" },
  { code: "kkd", title: "KKD" },
  { code: "yangin", title: "Yangın" },
  { code: "elektrik", title: "Elektrik" },
  { code: "kaza", title: "İş Kazaları ve Ramak Kala" },
  { code: "ortam", title: "Çalışma Ortamı" },
  { code: "organizasyon", title: "İSG Organizasyonu ve Görevlendirmeler" },
  { code: "kayit", title: "Kayıtlar ve Dokümantasyon" },
];

export function getCategoryTitle(code) {
  return AUDIT_CATEGORIES.find((c) => c.code === code)?.title || code;
}

export const AUDIT_CRITERIA = [
  // ─── Risk Değerlendirmesi ───────────────────────────────────────────────
  {
    id: "risk-1", categoryCode: "risk",
    title: "Risk değerlendirmesinin yapılmış ve güncel olması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: "Madde 10", verified: true,
    controlPurpose: "İşyerinde risk değerlendirmesinin yapılmış, güncel ve yasal süresi içinde yenilenmiş olduğunu doğrulamak.",
    expectedEvidence: "Onaylı risk değerlendirmesi raporu (ekip üyelerince paraflanmış/imzalanmış), güncelleme/yenileme tarihleri.",
  },
  {
    id: "risk-2", categoryCode: "risk",
    title: "İşyerine özgü tehlike kaynaklarının belirlenmiş olması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: "Madde 10/1", verified: true,
    controlPurpose: "Risk değerlendirmesinin işyerine özgü gerçek tehlikeleri (ekipman, madde, tertip-düzen, özel risk grupları) kapsayıp kapsamadığını doğrulamak.",
    expectedEvidence: "Risk değerlendirmesi raporunda işyerine özgü tehlike/risk listesi.",
  },
  {
    id: "risk-3", categoryCode: "risk",
    title: "Risk değerlendirmesine çalışan katılımının sağlanması",
    legislationName: "İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği", article: null, verified: false,
    controlPurpose: "Risk değerlendirme ekibinde çalışan temsilcisi ve ilgili çalışanların yer alıp almadığını doğrulamak.",
    expectedEvidence: "Risk değerlendirme ekibi listesi, çalışan temsilcisi imzası.",
  },

  // ─── Acil Durumlar ──────────────────────────────────────────────────────
  {
    id: "acil-1", categoryCode: "acil",
    title: "Acil durum planının hazırlanmış olması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: "Madde 11", verified: true,
    controlPurpose: "İşyerinde olası acil durumların önceden belirlenip yazılı bir acil durum planına bağlanıp bağlanmadığını doğrulamak.",
    expectedEvidence: "Onaylı acil durum planı dokümanı, hazırlanma/geçerlilik tarihi.",
  },
  {
    id: "acil-2", categoryCode: "acil",
    title: "Tahliye tatbikatlarının düzenli yapılması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: "Madde 11/1-c", verified: true,
    controlPurpose: "Acil durum ekiplerinin ve çalışanların tahliye tatbikatlarıyla fiilen hazır olup olmadığını doğrulamak.",
    expectedEvidence: "Tatbikat tutanağı/raporu, tarih ve katılımcı listesi.",
  },
  {
    id: "acil-3", categoryCode: "acil",
    title: "Acil durum ekiplerinin (arama-kurtarma, yangın, ilkyardım) oluşturulmuş olması",
    legislationName: "İşyerlerinde Acil Durumlar Hakkında Yönetmelik", article: "Madde 11", verified: true,
    controlPurpose: "Tehlike sınıfı ve çalışan sayısına uygun sayıda arama-kurtarma, yangınla mücadele ve ilkyardım ekibinin görevlendirilip görevlendirilmediğini doğrulamak.",
    expectedEvidence: "Görevlendirme yazısı, ekip üyeleri listesi, ekip eğitim belgeleri.",
  },

  // ─── İSG Eğitimleri ─────────────────────────────────────────────────────
  {
    id: "egitim-1", categoryCode: "egitim",
    title: "Çalışanlara temel İSG eğitiminin verilmiş olması",
    legislationName: "Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik", article: "Madde 8", verified: true,
    controlPurpose: "Tüm çalışanların işe başlamalarından itibaren en geç 3 ay içinde temel İSG eğitimini alıp almadığını doğrulamak.",
    expectedEvidence: "Eğitim katılım/tamamlama belgeleri, eğitim tarihi.",
  },
  {
    id: "egitim-2", categoryCode: "egitim",
    title: "Eğitimlerin periyodik olarak tekrarlanması",
    legislationName: "Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik", article: "Madde 14", verified: true,
    controlPurpose: "Temel eğitimlerin tehlike sınıfına göre öngörülen periyotlarda (çok tehlikeli: yılda 1, tehlikeli: 2 yılda 1, az tehlikeli: 3 yılda 1) tekrarlanıp tekrarlanmadığını doğrulamak.",
    expectedEvidence: "Tekrar eğitim kayıtları, önceki ve güncel eğitim tarihlerinin karşılaştırması.",
  },
  {
    id: "egitim-3", categoryCode: "egitim",
    title: "Eğitim kayıtlarının tutulması",
    legislationName: "Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik", article: null, verified: false,
    controlPurpose: "Verilen eğitimlerin belgelenip erişilebilir şekilde saklanıp saklanmadığını doğrulamak.",
    expectedEvidence: "Eğitim kayıt defteri/dijital kayıt sistemi, katılımcı imzaları.",
  },

  // ─── Sağlık Gözetimi ────────────────────────────────────────────────────
  {
    id: "saglik-1", categoryCode: "saglik",
    title: "İşe giriş/periyodik sağlık muayenelerinin yapılması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: "Madde 15", verified: true,
    controlPurpose: "Çalışanların işe girişte ve tehlike sınıfına göre öngörülen periyotlarda sağlık muayenesinden geçirilip geçirilmediğini doğrulamak.",
    expectedEvidence: "İşyeri hekimi onaylı sağlık raporları, muayene tarihleri.",
  },
  {
    id: "saglik-2", categoryCode: "saglik",
    title: "Özel risk grubundaki çalışanlar için ek tedbir alınması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: null, verified: false,
    controlPurpose: "Genç, yaşlı, engelli, gebe/emziren gibi özel risk grubundaki çalışanlar için ek koruyucu tedbir alınıp alınmadığını doğrulamak.",
    expectedEvidence: "Özel risk grubu tespiti ve alınan ek tedbirlere ilişkin kayıt.",
  },
  {
    id: "saglik-3", categoryCode: "saglik",
    title: "Sağlık gözetimi kayıtlarının saklanması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: "Madde 15/3", verified: true,
    controlPurpose: "Sağlık muayenesi sonuçlarının gizlilik içinde kayıt altına alınıp saklandığını doğrulamak.",
    expectedEvidence: "Kişisel sağlık dosyaları, işyeri hekimi kayıt sistemi.",
  },

  // ─── İş Ekipmanları ve Periyodik Kontroller ─────────────────────────────
  {
    id: "ekipman-1", categoryCode: "ekipman",
    title: "İş ekipmanlarının periyodik kontrollerinin yapılmış olması",
    legislationName: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği", article: null, verified: false,
    controlPurpose: "Yönetmeliğin EK-III'ünde belirtilen iş ekipmanlarının öngörülen aralıklarla periyodik kontrolden geçirilip geçirilmediğini doğrulamak.",
    expectedEvidence: "Periyodik kontrol raporları, kontrol tarihleri.",
  },
  {
    id: "ekipman-2", categoryCode: "ekipman",
    title: "Kontrol raporlarının yetkili kişi/kuruluşça düzenlenmiş olması",
    legislationName: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği", article: null, verified: false,
    controlPurpose: "Periyodik kontrolü yapan kişinin ilgili branştan ve EKİPNET'e kayıtlı yetkili biri olup olmadığını doğrulamak.",
    expectedEvidence: "Kontrolü yapan kişinin unvan/yetki belgesi, EKİPNET kayıt bilgisi.",
  },
  {
    id: "ekipman-3", categoryCode: "ekipman",
    title: "Uygunsuz çıkan ekipmanın kullanımdan kaldırılması",
    legislationName: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği", article: null, verified: false,
    controlPurpose: "Periyodik kontrolde ağır kusur tespit edilen ekipmanın, kusur giderilmeden çalıştırılmadığını doğrulamak.",
    expectedEvidence: "Kusurlu ekipman etiketleme/kullanım dışı bırakma kaydı, düzeltme sonrası yeniden kontrol raporu.",
  },

  // ─── KKD ────────────────────────────────────────────────────────────────
  {
    id: "kkd-1", categoryCode: "kkd",
    title: "Risklere uygun KKD'nin temin edilmiş olması",
    legislationName: "Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik", article: "Madde 6", verified: true,
    controlPurpose: "Risk değerlendirmesi sonucunda belirlenen kişisel koruyucu donanımların işveren tarafından ücretsiz temin edilip edilmediğini doğrulamak.",
    expectedEvidence: "KKD tedarik/satın alma kayıtları, stok listesi.",
  },
  {
    id: "kkd-2", categoryCode: "kkd",
    title: "KKD kullanımının fiilen sağlanması ve denetlenmesi",
    legislationName: "Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik", article: "Madde 6, Madde 8", verified: true,
    controlPurpose: "Çalışanların KKD'yi doğru ve sürekli kullanıp kullanmadığının sahada denetlenip denetlenmediğini doğrulamak.",
    expectedEvidence: "Saha gözlem/denetim kayıtları, KKD kullanım eğitim belgeleri.",
  },
  {
    id: "kkd-3", categoryCode: "kkd",
    title: "KKD teslim tutanaklarının tutulması",
    legislationName: "Kişisel Koruyucu Donanımların İşyerlerinde Kullanılması Hakkında Yönetmelik", article: null, verified: false,
    controlPurpose: "Her çalışana teslim edilen KKD'nin imzalı bir tutanakla belgelenip belgelenmediğini doğrulamak.",
    expectedEvidence: "İmzalı KKD teslim tutanakları.",
  },

  // ─── Yangın ─────────────────────────────────────────────────────────────
  {
    id: "yangin-1", categoryCode: "yangin",
    title: "Yangın söndürme ekipmanlarının bulundurulması ve bakımı",
    legislationName: "Binaların Yangından Korunması Hakkında Yönetmelik", article: null, verified: false,
    controlPurpose: "Uygun standartta yangın söndürme cihazlarının bulundurulup periyodik bakımının yapıldığını doğrulamak.",
    expectedEvidence: "Söndürme cihazı bakım/dolum etiketleri, periyodik bakım raporu.",
  },
  {
    id: "yangin-2", categoryCode: "yangin",
    title: "Yangın algılama/uyarı sistemlerinin çalışır durumda olması",
    legislationName: "Binaların Yangından Korunması Hakkında Yönetmelik", article: null, verified: false,
    controlPurpose: "Yangın algılama ve uyarı sistemlerinin periyodik test/bakımının yapılıp çalışır durumda olduğunu doğrulamak.",
    expectedEvidence: "Sistem periyodik test/bakım kayıtları.",
  },
  {
    id: "yangin-3", categoryCode: "yangin",
    title: "Kaçış yollarının işaretlenmiş ve açık olması",
    legislationName: "Binaların Yangından Korunması Hakkında Yönetmelik", article: "Madde 30-31", verified: true,
    controlPurpose: "Kaçış yollarının engelsiz, işaretli ve her zaman erişilebilir durumda tutulup tutulmadığını doğrulamak.",
    expectedEvidence: "Saha gözlemi, tahliye planı/işaretleme fotoğrafları.",
  },

  // ─── Elektrik ───────────────────────────────────────────────────────────
  {
    id: "elektrik-1", categoryCode: "elektrik",
    title: "Elektrik tesisatının periyodik kontrolünün yapılmış olması",
    legislationName: "Elektrik İç Tesisleri Yönetmeliği (doğrulanacak)", article: null, verified: false,
    controlPurpose: "Elektrik tesisatının yetkili kişilerce periyodik olarak kontrol edildiğini doğrulamak.",
    expectedEvidence: "Elektrik periyodik kontrol raporları.",
  },
  {
    id: "elektrik-2", categoryCode: "elektrik",
    title: "Topraklama tesisatının uygunluğu",
    legislationName: "Elektrik Tesislerinde Topraklamalar Yönetmeliği (doğrulanacak)", article: null, verified: false,
    controlPurpose: "Topraklama tesisatının ölçüm sonuçlarının standartlara uygun olduğunu doğrulamak.",
    expectedEvidence: "Topraklama ölçüm raporu ve ölçüm değerleri.",
  },
  {
    id: "elektrik-3", categoryCode: "elektrik",
    title: "Elektrik pano/dolaplarının erişiminin kısıtlı ve işaretli olması",
    legislationName: "(doğrulanacak)", article: null, verified: false,
    controlPurpose: "Yetkisiz erişimi önleyecek kilit/işaretleme önlemlerinin alındığını doğrulamak.",
    expectedEvidence: "Pano kilit/uyarı etiketi, erişim yetkilendirme kaydı.",
  },

  // ─── İş Kazaları ve Ramak Kala ──────────────────────────────────────────
  {
    id: "kaza-1", categoryCode: "kaza",
    title: "İş kazalarının usulüne uygun bildirilmesi",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: "Madde 14", verified: true,
    controlPurpose: "Meydana gelen iş kazalarının yasal süresi (3 iş günü) içinde SGK'ya, gerekiyorsa kolluk kuvvetlerine bildirilip bildirilmediğini doğrulamak.",
    expectedEvidence: "SGK iş kazası bildirim formu, bildirim tarihi.",
  },
  {
    id: "kaza-2", categoryCode: "kaza",
    title: "Ramak kala olaylarının kayıt altına alınması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: null, verified: false,
    controlPurpose: "Ramak kala olaylarının sistematik olarak kayıt altına alınıp değerlendirildiğini doğrulamak.",
    expectedEvidence: "Ramak kala bildirim/kayıt formları.",
  },
  {
    id: "kaza-3", categoryCode: "kaza",
    title: "Kaza/ramak kala sonrası kök neden analizi yapılması",
    legislationName: "(doğrulanacak)", article: null, verified: false,
    controlPurpose: "Kaza ve ramak kala sonrasında kök neden analizi yapılıp risk değerlendirmesine yansıtıldığını doğrulamak.",
    expectedEvidence: "Kök neden analiz raporu, güncellenmiş risk değerlendirmesi.",
  },

  // ─── Çalışma Ortamı ─────────────────────────────────────────────────────
  {
    id: "ortam-1", categoryCode: "ortam",
    title: "Ortam ölçümlerinin (gürültü, aydınlatma, toz vb.) yapılmış olması",
    legislationName: "(doğrulanacak — ilgili fiziksel/kimyasal risk yönetmelikleri)", article: null, verified: false,
    controlPurpose: "İşyerindeki fiziksel/kimyasal risklerin ölçülüp sınır değerlerle karşılaştırıldığını doğrulamak.",
    expectedEvidence: "Ortam ölçüm raporları, ölçüm tarihleri.",
  },
  {
    id: "ortam-2", categoryCode: "ortam",
    title: "Havalandırma/iklimlendirme koşullarının uygunluğu",
    legislationName: "(doğrulanacak)", article: null, verified: false,
    controlPurpose: "Çalışma ortamının havalandırma/iklimlendirme açısından uygun koşullarda olduğunu doğrulamak.",
    expectedEvidence: "Havalandırma sistemi bakım kaydı, ortam sıcaklık/nem ölçümü.",
  },
  {
    id: "ortam-3", categoryCode: "ortam",
    title: "Çalışma alanlarının düzen ve temizliğinin sağlanması",
    legislationName: "(doğrulanacak)", article: null, verified: false,
    controlPurpose: "Çalışma alanlarının tertip-düzen ve temizlik açısından güvenli tutulduğunu doğrulamak.",
    expectedEvidence: "Saha gözlem kaydı/fotoğraf, temizlik/kontrol çizelgesi.",
  },

  // ─── İSG Organizasyonu ve Görevlendirmeler ──────────────────────────────
  {
    id: "organizasyon-1", categoryCode: "organizasyon",
    title: "İSG uzmanı/işyeri hekimi görevlendirmesinin yapılmış olması",
    legislationName: "(doğrulanacak — 6331 sayılı Kanun ve İSG Hizmetleri Yönetmeliği)", article: null, verified: false,
    controlPurpose: "İşyerinin tehlike sınıfı ve çalışan sayısına uygun İSG uzmanı/işyeri hekimi görevlendirmesinin yapılıp yapılmadığını doğrulamak.",
    expectedEvidence: "Görevlendirme belgesi/sözleşmesi, SGK bildirimi.",
  },
  {
    id: "organizasyon-2", categoryCode: "organizasyon",
    title: "İSG kurulunun oluşturulmuş ve düzenli toplanması",
    legislationName: "İş Sağlığı ve Güvenliği Kurulları Hakkında Yönetmelik", article: "Madde 4", verified: true,
    controlPurpose: "50 ve üzeri çalışanı olan işyerinde kurulun oluşturulup öngörülen periyotlarda (en az ayda bir) düzenli toplanıp toplanmadığını doğrulamak.",
    expectedEvidence: "Kurul toplantı tutanakları, katılımcı listesi.",
  },
  {
    id: "organizasyon-3", categoryCode: "organizasyon",
    title: "Çalışan temsilcisinin belirlenmiş olması",
    legislationName: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu", article: "Madde 20", verified: true,
    controlPurpose: "Çalışan sayısına uygun sayıda çalışan temsilcisinin seçilip görevlendirildiğini doğrulamak.",
    expectedEvidence: "Çalışan temsilcisi seçim/atama tutanağı.",
  },

  // ─── Kayıtlar ve Dokümantasyon ───────────────────────────────────────────
  {
    id: "kayit-1", categoryCode: "kayit",
    title: "Yasal olarak istenen kayıtların eksiksiz tutulması",
    legislationName: "(doğrulanacak — 6331 sayılı Kanun ve ilgili yönetmelikler geneli)", article: null, verified: false,
    controlPurpose: "İSG mevzuatının öngördüğü zorunlu kayıtların (risk değerlendirmesi, eğitim, sağlık, kaza vb.) eksiksiz tutulduğunu doğrulamak.",
    expectedEvidence: "İlgili kayıt/doküman listesi ve tarihleri.",
  },
  {
    id: "kayit-2", categoryCode: "kayit",
    title: "Dokümanların güncel ve erişilebilir olması",
    legislationName: "(doğrulanacak)", article: null, verified: false,
    controlPurpose: "İSG dokümanlarının güncel versiyonlarının ilgili kişilerce erişilebilir olduğunu doğrulamak.",
    expectedEvidence: "Doküman revizyon kayıtları, erişim/paylaşım kanıtı.",
  },
  {
    id: "kayit-3", categoryCode: "kayit",
    title: "Önceki denetim/kontrol sonuçlarının izlenebilir olması",
    legislationName: "(doğrulanacak)", article: null, verified: false,
    controlPurpose: "Önceki denetim/periyodik kontrol bulgularının takip edilip kapatıldığının izlenebilir olduğunu doğrulamak.",
    expectedEvidence: "Önceki denetim raporları, aksiyon takip kayıtları.",
  },
];

/**
 * Yeni bir denetim için tüm kriterlerden boş bir checklist üretir. Mevzuat
 * dayanağı alanları (legislationName/article/controlPurpose/expectedEvidence/
 * verified) kriterden AYNEN kopyalanır — bunlar salt bilgi amaçlıdır, skor/
 * ilerleme hesaplaması yalnızca `result` alanına bakar (bkz. auditScoring.js).
 * @returns {Array<{ id: string, categoryCode: string, title: string, result: "degerlendirilmedi",
 *   note: string, departmentId: string|number|null, legislationName: string, article: string|null,
 *   controlPurpose: string, expectedEvidence: string, verified: boolean }>}
 */
export function generateChecklist() {
  return AUDIT_CRITERIA.map((c) => ({
    id: c.id,
    categoryCode: c.categoryCode,
    title: c.title,
    result: "degerlendirilmedi",
    note: "",
    departmentId: null,
    legislationName: c.legislationName,
    article: c.article,
    controlPurpose: c.controlPurpose,
    expectedEvidence: c.expectedEvidence,
    verified: c.verified,
  }));
}

/**
 * @param {Array<{ categoryCode: string, result: string }>} checklist
 * @returns {Array<{ code: string, title: string, score: number|null, progress: number, total: number, evaluatedCount: number }>}
 */
export function computeCategoryScores(checklist) {
  return computeCategoryScoresGeneric(checklist, AUDIT_CATEGORIES);
}
