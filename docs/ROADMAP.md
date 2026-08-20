# Yol Haritası

Bu doküman Nöbetçi'nin ürün gelişimini **9 fazlı** bir yapıda tanımlar. Fazlar
birbirini mantıksal olarak takip eder (temel platform → risk zekası → bilgi merkezi →
AI copilot → RAG/proaktif besleme → görsel AI → kurumsallaşma → mobil dağıtım → canlı
kamera & sensör AI) ancak paralel ilerleme mümkündür. Sprint bazlı ayrıntı için
[SPRINTS.md](./SPRINTS.md)'e bakın.

## Durum Özeti

| Faz | Başlık | Durum |
|---|---|---|
| 1 | Core Platform | ✅ Tamamlandı |
| 2 | Risk Intelligence | ✅ Tamamlandı |
| 3 | Knowledge Center | ✅ Tamamlandı |
| 4 | AI Copilot | 🟡 Kısmen tamamlandı |
| 5 | RAG & Proaktif Besleme | 🟡 Kısmen tamamlandı |
| 6 | Vision AI (statik fotoğraf) | 🟡 Kısmen tamamlandı (v1 mock/adapter teslim edildi) |
| 7 | Enterprise | 🔲 Planlandı |
| 8 | Mobile Platform | 🔲 Karar bekliyor |
| 9 | Canlı Kamera & Sensör AI | 🟡 Kısmen tamamlandı (9.1 teslim edildi) |

---

## Phase 1 — Core Platform

**Amaç:** İSG yönetimi için gerekli temel veri modelini ve uygulama iskeletini
kurmak; sonraki tüm fazların üzerine inşa edileceği sağlam bir zemin oluşturmak.

- Firma / Şube / Departman / Çalışan veri modeli
- Rol bazlı arayüz/izin hazırlığı (İSG Uzmanı / İşveren / Çalışan; authentication mock)
- Aktif firma scope'lu, backend'e hazır tek veri erişim katmanı (`dataProvider`)
- Bildirim akışı, denetim günlüğü, periyodik kontrol takvimi
- Yönetici dashboard'u (KPI'lar, güvenlik skoru, trendler)

**Durum:** Tamamlandı.

## Phase 2 — Risk Intelligence

**Amaç:** Fine-Kinney risk değerlendirmesini kağıt/Excel seviyesinden, açıklamalı ve
izlenebilir kurumsal bir sürece taşımak.

- Açıklamalı Olasılık/Maruziyet/Şiddet puanlama skalaları
- Otomatik risk skoru, renklendirme ve artık risk hesaplama
- Çoklu düzeltici faaliyet takibi ve risk geçmişi (timeline)
- Departman/şube/durum/öncelik/tarih bazlı gelişmiş filtreleme

**Durum:** Tamamlandı.

## Phase 3 — Knowledge Center

**Amaç:** Mevzuat, risk ve eğitim dokümanlarını dağınık dosyalardan çıkarıp tek,
aranabilir bir kurumsal kütüphanede toplamak.

- Kategorilere ayrılmış doküman kütüphanesi
- Arama, kategori ve doküman türü bazlı filtreleme
- Doküman detay ekranı

**Durum:** Tamamlandı (mock veri ile; gerçek dosya deposu Phase 7 kapsamındadır).

## Phase 4 — AI Copilot

**Amaç:** Yapay zekayı tek bir sohbet ekranından çıkarıp, platformun her adımında
(risk girişi, öneri, karar destek) bağlama duyarlı bir yardımcıya dönüştürmek.

- AI sohbet danışmanı ve fotoğraf yorumlama (mevcut)
- Fine-Kinney önlem/KKD önerisi (mevcut, artık risk sınırlaması ile güvenli)
- Modül-bilinçli öneriler: aktif ekrana göre bağlamsal yardım
- Serbest metinden otomatik risk puanı önerisi (`scoreRisk`)

**Durum:** Temel sohbet ve Fine-Kinney önerisi canlıda; bağlamsal copilot deneyimi
genişletilecek.

## Phase 5 — RAG & Proaktif Besleme

**Amaç:** AI Copilot'un cevaplarını genel bilgiden değil, firmanın kendi Bilgi
Kütüphanesi içeriğinden (mevzuat, geçmiş risk raporları, firma dokümanları) üretmesini
sağlamak; fazın kapanışında bunu "sorulunca cevaplayan" bir asistandan "kendiliğinden
uyaran" bir sisteme evriltmek — bu, **mobil/yazılım tarafının mantıksal son aşamasıdır**
(bkz. Phase 9, donanım/kamera tarafının son aşaması).

- ✅ Bilgi Kütüphanesi'nde "AI'ya Sor" — soru, anahtar kelime eşleştirmesiyle ilgili
  dokümanlara daraltılıp AI'ye bağlam olarak veriliyor, cevapla birlikte kaynak
  doküman(lar) gösteriliyor.
- 🔲 Dokümanların **vektör/embedding tabanlı** aranabilir hale getirilmesi — bugünkü
  sürüm basit anahtar kelime eşleştirmesi kullanıyor, gerçek semantik arama değil.
- 🔲 Firma bazlı bilgi izolasyonu (bir firmanın dokümanı başka firmanın AI yanıtına
  karışmaz) — bugün tüm dokümanlar tek, paylaşılan bir mock listesinde.
- 🔲 **Mevzuat Takibi** — mevzuat güncellendiğinde AI, etkilenen mevcut Fine-Kinney
  kayıtlarını otomatik işaretlesin ("bu yönetmelik değişti, şu risk kayıtları gözden
  geçirilmeli").
- 🔲 **Proaktif Risk Önerisi** — AI, geçmiş Fine-Kinney kayıtları + Bilgi
  Kütüphanesi'nden örüntü çıkarıp kullanıcı hiçbir şey sormadan yeni risk taslağı
  önerebilsin (bugünkü `useAIRiskAnalysis` yalnızca kullanıcı bir şey sorunca/yazınca
  çalışıyor — bu madde onu tersine çeviriyor, sistem kendiliğinden öneriyor).

**Durum:** Temel akış (soru → ilgili doküman bulma → AI sentezi → kaynak gösterimi)
çalışıyor durumda; vektör tabanlı arama, firma izolasyonu ve proaktif besleme gerçek
backend'e (Phase 7) bağlı, henüz yapılmadı.

## Phase 6 — Vision AI

**Amaç:** Risk değerlendirmesine eklenen fotoğrafları pasif bir kayıttan, aktif bir
tehlike tespit aracına dönüştürmek. Bu faz aynı zamanda Phase 9'un (canlı kamera)
küçük ölçekli, düşük riskli provasıdır — fotoğraf üzerinde doğrulanan "tespit →
Fine-Kinney'e bağlama" deseni, Phase 9'da canlı akışa taşınacaktır.

- ✅ **Vision AI v1 (mock/adapter):** Risk Tespiti'ndeki fotoğraf akışı, tek
  kategori+not önerisinden (bkz. Phase 9 — `usePhotoDetection.js`, o akış hâlâ mevcut
  ve değişmedi) YAPILANDIRILMIŞ, ÇOKLU tehlike bulgusuna genişletildi: her bulgu
  tehlike/açıklama/kategori/önerilen önlem/etkilenenler/mevzuat referansı/AI güven
  skoru alanlarına sahip (bkz. `services/visionAnalysisService.js` → `VisionFinding`).
  Kullanıcı her bulguyu tek tek gözden geçirip düzenler, onaylamadığını işaretten
  çıkarır; yalnızca onaylananlar Risk Tespiti'ne aktarılır (`VisionFindingsPanel.jsx`).
  Bugün GERÇEK bir Vision API'sine bağlı DEĞİL — bilinçli mock adapter (bkz. o dosyanın
  başındaki "gerçek adaptere geçiş" notu, Anthropic/OpenAI Vision için hazır arayüz).
- ✅ Onaylanan bulgunun ilgili Fine-Kinney kaydına otomatik ön-doldurma olarak
  sunulması (öneri niteliğinde, onay zorunlu) — `recommendedAction`/`affected` alanları
  mevcut Risk Tespiti→Fine-Kinney köprüsü (Phase 9.1) üzerinden formun
  `action`/`affected` alanlarına taşınıyor.
- 🔲 Gerçek bir Vision AI sağlayıcısına bağlanma (Anthropic/OpenAI Vision) — adapter
  arayüzü hazır, aktif adapter hâlâ mock.
- 🔲 Fotoğrafın Fine-Kinney kaydına ek dosya (attachment) olarak da eklenmesi — bugün
  yalnızca Risk Tespiti kaydında saklanıyor, Fine-Kinney'e dönüştürüldüğünde otomatik
  taşınmıyor (kullanıcı isterse elle ekleyebilir, bkz. AttachmentsTab.jsx).

**Durum:** Kısmen tamamlandı — mock/adapter tabanlı çoklu tehlike tespiti ve
Fine-Kinney köprüsü canlı; gerçek Vision API entegrasyonu Phase 7 (gerçek backend)
sonrasına bırakıldı. Ek dosya veri modeli (Phase 2) bu senaryo için zaten hazır
şekilde tasarlanmıştı.

## Phase 7 — Enterprise

**Amaç:** Platformu tek kiracılı demodan, gerçek kimlik doğrulama ve veri
izolasyonuna sahip çok kiracılı bir kurumsal SaaS'a taşımak.

- Gerçek kullanıcı kimlik doğrulama (Supabase Auth)
- Sunucu taraflı veri izolasyonu (Row Level Security)
- Tek hesaptan birden fazla firma yönetimi (OSGB senaryosu)
- Gerçek doküman/dosya depolama

**Durum:** Planlandı. Teknik plan için bkz. [DATABASE_PLAN.md](./DATABASE_PLAN.md).

## Phase 8 — Mobile Platform

**Amaç:** Sahada, çevrimdışı da çalışabilen bir mobil deneyim sunmak.

- PWA (Progressive Web App) yeniden etkinleştirme **veya** Capacitor ile native
  paketleme kararı
- Çevrimdışı AI davranışının tanımlanması
- Push bildirim ve kamera/dosya erişiminin native seviyede iyileştirilmesi

**Durum:** Karar bekliyor — bkz. aşağıdaki "Açık Kararlar" bölümü.

## Phase 9 — Canlı Kamera & Sensör AI

**Amaç:** Ürünün tamamlayıcı, en son katmanı. Sahadaki 7/24 gözlemi otomatikleştirip
yeni bir **Risk Tespiti** havuzu üzerinden Fine-Kinney'i besleyen, İSG uzmanının saha
gözlem yükünü azaltan (uzman zorunluluğunu KALDIRMAYAN, verimliliğini artıran) üçüncü
ürün katmanı. Bilinçli olarak en sonda planlanıyor: hem Phase 7'nin (gerçek çok-kiracılı
backend) hem Phase 8'in (mobil bildirim/kamera erişimi kararı) tamamlanmış olmasını
gerektiriyor, hem de mevcut modüllerin (Fine-Kinney/Eğitim/Periyodik Kontrol/Dashboard)
müşteride kanıtlanmış olması kamera modülünün satışını kolaylaştırıyor.

- ✅ **9.1 — Risk Tespiti sekmesi (triage havuzu):** Fine-Kinney'den ayrı, ham/
  doğrulanmamış tespitlerin toplandığı bir ekran. Durum akışı: Yeni → İncelemede →
  Fine-Kinney'e Dönüştürüldü / Reddedildi (yanlış pozitif). Kamera olmadan, manuel
  veya simüle veriyle dahi bağımsız değer üretir ve iş akışı erken test edilebilir.
  **Teslim edildi (Sprint 9.1):** manuel ekleme + "Demo: Otomatik Simülasyon" toggle'ı
  (periyodik mock tespit üretimi), aynı kategori+konum tekrar tespit edilince
  biriktirme (occurrenceCount), AI destekli Fine-Kinney taslağı ("AI ile Taslak
  Oluştur") ve manuel "Sahaya İn" akışı — ikisi de Fine-Kinney formunu ön doldurarak
  açar, kayıt kararı kullanıcıdadır.
- 🔲 **9.2 — Dar kapsamlı pilot CV entegrasyonu:** Türkiye kaza istatistiklerinde en
  sık görülen 3-4 kategoriyle sınırlı başlangıç (KKD eksikliği, forklift-insan
  yakınlığı, düşme/yüksekte çalışma riski, kapalı alan girişi). Sıfırdan model eğitmek
  yerine hazır/üçüncü parti computer-vision servisleriyle başlanması önerilir.
- 🔲 **9.3 — Detect → Act → Coach döngüsü:** Tespit sıklığına göre Eğitim modülüne
  otomatik hedefli eğitim ataması (mevcut `OngoingTrainingsCard`/eğitim atama akışıyla
  bağlanır).
- 🔲 **9.4 — Gizlilik-by-design:** Yüz verisi/kişi kimliği saklanmaz; yalnızca
  olay + bölge + zaman meta verisi tutulur ("kişiyi değil ihlali kaydediyoruz").
  Sona bırakılamaz — mimariye en baştan gömülmesi gerekir (KVKK + çalışan güveni).
- 🔲 **9.5 — Kendi kamera/donanım paketi:** Yalnızca talep doğrulandıktan sonra;
  önce mevcut CCTV altyapısına entegrasyon ile başlanıp, istenirse ayrı bir donanım
  ürünü olarak genişletilir.

**Durum:** 9.1 teslim edildi (kamerasız, mock/manuel veriyle). 9.2'den itibaren gerçek
kamera/CV entegrasyonu ve donanım kararları gerektirir — planlandı.

---

## Backlog — Değerlendirilen, Henüz Onaylanmamış Öneriler

Müşteri görüşmesinde gelen öneriler; veri modeli/metodoloji netleşmeden
uygulanmayacak şekilde kasıtlı olarak beklemede tutuluyor:

- **Ekipman bazlı maliyet/duruş takibi** — `equipment` kaydına (bkz.
  [DATABASE_PLAN.md](./DATABASE_PLAN.md)) maliyet, duruş süresi ve bakım sıklığı
  alanları eklenmesi; "en çok riske sebep olan / en pahalı makine" analizini
  mümkün kılar. **Ön koşul:** bu verinin müşteri tarafında zaten dijital olarak
  tutulup tutulmadığının netleşmesi — yoksa özellik boş veriden anlamsız
  çıktı üretir.
- **Vardiya alanı** — çalışan veri modeline `shift` alanı eklenmesi; vardiya
  bazlı risk ısı haritasının ön koşulu.
- **Şeffaf "Önlenen Maliyet" hesaplayıcısı** — yalnızca net, yazılı bir
  metodoloji (örn. sektör ortalama kaza maliyeti × önlenen olay sayısı)
  tanımlanırsa eklenir; kara kutu/temsili rakam olarak **eklenmeyecek**.

## Açık Kararlar

- **Mobil dağıtım formatı** — PWA mı, Capacitor mı? (Phase 8)
- **Offline AI davranışı** — bağlantı yokken Copilot/Vision AI ne yapmalı? (Phase 4, 6, 8)
- **Çoklu firma UX detayı** — firma değiştirme ve izin modeli tasarımı (Phase 7)

## Güncelleme Kuralı

Bir faz tamamlandığında yalnızca "Durum Özeti" tablosu ve ilgili fazın "Durum" satırı
güncellenir. Faz kapsamı genişletilecekse önce bu dosyada, sonra
[SPRINTS.md](./SPRINTS.md)'de planlama yapılır.
