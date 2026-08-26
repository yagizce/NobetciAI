# Veritabanı Planı

Bu doküman, Nöbetçi backend'e geçtiğinde **Supabase (Postgres)** üzerinde kullanılacak
veri modelini tanımlar. Yalnızca **tabloları ve aralarındaki ilişkileri** açıklar —
SQL şeması veya uygulama kodu içermez. Mevcut (IndexedDB tabanlı) durum için bkz.
[ARCHITECTURE.md](./ARCHITECTURE.md) → "Mock Veri Yapısı".

> Bu plan **yalnızca planlamadır.** Uygulanması kullanıcı açık onayı gerektirir
> (bkz. [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) → "Architecture").

---

## Çok Kiracılılık İlkesi

Kiracıya (firmaya) özel her tablo bir `companyId` alanı taşır. Gerçek izolasyon,
Postgres **Row Level Security (RLS)** ile sağlanır: bir kullanıcı yalnızca kendi
`companyId`'sine ait satırları görebilir/değiştirebilir. Bu ilke, çok kiracılı
olan her tablonun tanımında ayrıca belirtilmemiştir — aksi belirtilmedikçe geçerli
kabul edilir. Yalnızca genel/mevzuat niteliğindeki veriler (örn. tüm firmalara açık
Bilgi Kütüphanesi dokümanları) `companyId` alanını boş bırakabilir.

Tablolar altı kategoride gruplanmıştır: **Kimlik & Erişim**, **Organizasyon**,
**Risk Yönetimi**, **Bilgi & İletişim**, **Operasyonel Takip**, **Yapay Zeka**.

---

## Kategori 1: Kimlik, Rol ve Erişim

### Users

Sisteme giriş yapabilen her kişinin hesabı. Supabase Auth ile birebir eşleşir —
tablo kimliği doğrudan `auth.users` kimliğidir.

**Alanlar:** ad-soyad, e-posta, telefon, profil fotoğrafı, unvan, hesap durumu
(aktif/pasif), **hesap türü** (`employer` | `expert` | `employee` — kayıt sırasında
seçilir, SABİTTİR, bkz. aşağıdaki kısıt), **platform yöneticisi mi** (bool,
varsayılan false — yalnızca Nöbetçi ekibi için, bkz. "Sistem Yöneticisi İstisnası"),
oluşturulma tarihi.

**İlişkiler:**
- Bir Kullanıcı, `UserRoles` ilişki tablosu üzerinden **birden fazla Firmada
  farklı Role** sahip olabilir (OSGB/danışman senaryosu — tek kişi birden fazla
  firmayı yönetebilir).
- Bir Kullanıcı, en fazla bir Employee kaydına bağlanabilir (bir kullanıcı aynı
  zamanda bir personel kaydına karşılık gelebilir, ama her personelin hesabı
  olmak zorunda değildir).

**Hesap Türü Kısıtı (KARAR — kullanıcıyla netleştirildi):** `account_type` kayıtta
seçilir ve değiştirilemez. Bir kullanıcının `UserRoles` üzerinden **kaç firmaya**
bağlanabileceğini SINIRLAMAZ (bir uzman istediği kadar firmada "uzman" rolüyle
çalışabilir) — sadece **hangi role türüne girebileceğini** sınırlar:
`account_type = 'expert'` olan bir kullanıcıya **hiçbir firmada `employer` rolü
atanamaz** (elle bile atansa reddedilir — bkz. RLS taslağındaki
`check_user_role_account_type` trigger'ı). Sebep: İSG uzmanı ile işveren aynı
kişi olursa denetim/tarafsızlık açısından karışıklık yaratır; bu platform bunu
veri seviyesinde engeller, sadece UI kuralı olarak bırakmaz.

### Roles

Sistemdeki sabit rol tanımları (örn. İSG Uzmanı, İşveren, Çalışan, Firma Yöneticisi,
Sistem Yöneticisi). Referans/sabit veri niteliğindedir.

**Alanlar:** rol anahtarı, görünen ad, açıklama.

**İlişkiler:**
- `UserRoles` ilişki tablosu üzerinden Users ile **çoka-çok** bağlanır; bu ilişki
  ayrıca `companyId` taşır — bir kullanıcının rolü **firma bazlıdır**, global değildir.
- `RolePermissions` ilişki tablosu üzerinden Permissions ile **çoka-çok** bağlanır.

**Rol Yükseltme Kuralı (KARAR):** Bir firmaya "Çalışan" olarak katılan biri, o
firmadaki mevcut bir "İşveren" tarafından "Uzman" veya ek "İşveren" rolüne elle
yükseltilebilir (kullanıcı kendi kendine yükselemez — bkz. CompanyInvites, "Rol
Yükseltme (kendi kendine değil)"). **İstisna:** platform yöneticisi (`is_platform_admin`),
işverenin onayı olmadan da herhangi bir firmada rol atayabilir/değiştirebilir —
"işveren uğraşmak istemezse destek ekibi halleder" senaryosu için (bkz. RLS
taslağı → `is_platform_admin()`).

### Permissions

İnce taneli yetki tanımları (örn. "risk oluşturma", "risk onaylama", "firma
yönetimi"). Referans/sabit veri niteliğindedir.

**Alanlar:** izin anahtarı, görünen ad, ait olduğu modül.

**İlişkiler:**
- `RolePermissions` ilişki tablosu üzerinden Roles ile **çoka-çok** bağlanır.

### CompanyInvites

Bir firmaya yeni kişi eklemenin TEK yolu — kullanıcılar kendi kendine bir firmaya
"katılamaz", her zaman geçerli bir davet kaydı üzerinden gelir.

**Alanlar:** tek kullanımlık token (rastgele/tahmin edilemez), ait olduğu firma,
davet edilen kişiye önerilen rol, davet edilen e-posta (isteğe bağlı — boşsa link
herkese açık ama yine de token bilmeyen katılamaz), daveti oluşturan kullanıcı,
son kullanma tarihi (varsayılan 7 gün), kullanıldı mı / ne zaman kullanıldı.

**Nasıl işler (KARAR — kullanıcıyla netleştirildi):**
1. İşveren (veya yetkili Uzman) uygulama içinde "Yeni Kişi Davet Et" der, rol
   seçer (varsayılan **Çalışan**) — bir davet kaydı oluşur, paylaşılabilir bir
   link üretilir. Link işveren tarafından WhatsApp/SMS/e-posta ile **kendisi**
   paylaşılır (uygulama otomatik e-posta göndermiyor — ayrı bir SMTP sağlayıcısı
   gerektirir, kapsam dışı bırakıldı).
2. Davet edilen kişi linke tıklar → normal kayıt formunu görür (e-posta alanı
   davette belirtildiyse önceden dolu) → kendi şifresini belirler.
3. Kayıt tamamlanır tamamlanmaz sistem OTOMATİK olarak o kullanıcıyı davetteki
   firma + role ile `UserRoles`'a ekler — kullanıcının ayrıca bir şey yapmasına
   gerek yok, işverenin de ayrıca elle onaylamasına gerek yok (davet zaten
   işverenin bilinçli onayıydı).
4. Token tek kullanımlıktır, kullanılınca kapanır; süresi dolan bir daveti
   açan kişiye "bu davetin süresi dolmuş, yeni bir davet isteyin" gösterilir.

**"Kendi kendine yükselme" kısıtıyla ilişkisi:** davet linkinin taşıdığı rol
İŞVERENİN seçimidir (kullanıcının değil) — bu yüzden bir işveren davet ederken
"Uzman" rolü seçmesi, daha önce konuşulan "kimse kendi kendine yükselemez"
kuralını ÇİĞNEMEZ; kısıtladığımız şey davet edilenin kendi rolünü kendinin
seçmesiydi, işverenin bilinçli olarak seçmesi değil.

**İlişkiler:** Companies ile **çoka-bir**. Oluşturan kullanıcı (Users) ile
**çoka-bir**.

---

## Kategori 2: Organizasyon

### Companies

Platformdaki her firma/kiracı.

**Alanlar:** firma adı, vergi no, sektör, risk sınıfı (az/tehlikeli/çok tehlikeli),
adres, iletişim bilgisi, oluşturulma tarihi.

**İlişkiler:** Branches, Departments, Employees, Risks, KnowledgeDocuments (firmaya
özel olanlar), Notifications, Audits, Trainings, Equipment, PeriodicInspections
tablolarının tümü **bire-çok** olarak Companies'e bağlıdır (`companyId`).

### Branches

Bir firmaya ait şubeler.

**Alanlar:** şube adı, adres, ait olduğu firma.

**İlişkiler:** Companies ile **çoka-bir**. Employees ve Risks tablolarından
**bire-çok** referans alır (bir çalışan/risk isteğe bağlı olarak bir şubeye
bağlanabilir).

### Departments

Bir firmaya ait departmanlar.

**Alanlar:** departman adı, ait olduğu firma.

**İlişkiler:** Companies ile **çoka-bir**. Employees ve Risks tablolarından
**bire-çok** referans alır.

### Employees

Bir firmadaki personel kaydı (illa sisteme giriş yapması gerekmez — HR kaydı
niteliğindedir).

**Alanlar:** ad-soyad, unvan, telefon, işe başlama tarihi, ait olduğu firma/şube/
departman, bağlı kullanıcı hesabı (varsa).

**İlişkiler:**
- Companies, Branches, Departments ile **çoka-bir**.
- Users ile **bire-bir, isteğe bağlı** (her personelin hesabı olmayabilir).
- Risks (sorumlu kişi), CorrectiveActions (sorumlu kişi), Trainings,
  PeriodicInspections (sorumlu kişi) tablolarından **bire-çok** referans alır.

---

## Kategori 3: Risk Yönetimi

### Risks

Fine-Kinney risk değerlendirme kayıtları (mevcut IndexedDB'deki `fineKinney`
koleksiyonunun karşılığı).

**Alanlar:** tehlike tanımı, risk açıklaması, olasılık/maruziyet/şiddet puanları,
toplam skor, risk seviyesi, alınacak önlem, sorumlu, termin tarihi, durum, öncelik,
tamamlanma yüzdesi, artık risk puanları/skoru, kapanma tarihi, ait olduğu firma/
şube/departman, oluşturan kullanıcı.

**İlişkiler:**
- Companies, Branches, Departments ile **çoka-bir**.
- Employees ile **çoka-bir** (sorumlu kişi).
- Users ile **çoka-bir** (oluşturan kişi).
- RiskAttachments, CorrectiveActions, RiskHistory tablolarından **bire-çok**
  referans alır.

### RiskAttachments

Bir riske eklenen dosyalar (fotoğraf, PDF, Word, Excel).

**Alanlar:** dosya adı, dosya türü, depolama yolu, ait olduğu risk, ekleyen
kullanıcı, eklenme tarihi.

**İlişkiler:** Risks ile **çoka-bir**. Users ile **çoka-bir** (ekleyen kişi).
Planlanan Vision AI özelliği (bkz. [AI_ROADMAP.md](./AI_ROADMAP.md)) bu tablodaki
kayıtları girdi olarak kullanacaktır.

### CorrectiveActions

Bir riskle ilişkili düzeltici/önleyici faaliyetler (bire-çok — bir risk için
birden fazla faaliyet olabilir).

**Alanlar:** faaliyet başlığı, açıklama, sorumlu, termin tarihi, öncelik, durum,
tamamlanma yüzdesi, oluşturulma tarihi, ait olduğu risk.

**İlişkiler:** Risks ile **çoka-bir**. Employees ile **çoka-bir** (sorumlu kişi).

### RiskHistory

Bir riskin yaşam döngüsü boyunca gerçekleşen olayların kronolojik kaydı (oluşturma,
güncelleme, dosya ekleme, faaliyet tamamlama, kapatma).

**Alanlar:** olay türü, açıklama, ait olduğu risk, aksiyonu yapan kullanıcı,
zaman damgası.

**İlişkiler:** Risks ile **çoka-bir**. Users ile **çoka-bir** (aksiyonu yapan
kişi). Bu tablo, genel `Audits` tablosundan **bilinçli olarak ayrıdır** — riske
özel, kullanıcı arayüzünde doğrudan gösterilen bir zaman çizelgesi sağlar; Audits
ise sistem geneli teknik denetim kaydıdır.

### RiskDetections

**Ham/doğrulanmamış tespit havuzu** — Risk Tespiti ekranındaki (kamera/fotoğraf
veya manuel giriş kaynaklı) ilk-elden tehlike tespitleri. `Risks`'ten **bilinçli
olarak ayrı** bir tablodur: bir tespit henüz Fine-Kinney değerlendirmesine
dönüşmemiş olabilir (durum "new"/"reviewing"), hiç dönüşmeyebilir ("dismissed"),
veya bir Risk kaydına dönüştürülebilir ("converted" — bu durumda ilgili Risk
kaydına bir referans taşır). Aynı kategori+konum kombinasyonu tekrar tespit
edilirse yeni satır AÇILMAZ, `occurrenceCount` artırılır (biriktirme).

**Alanlar:** kategori, konum (serbest metin), ait olduğu departman, kaynak
(manuel/simüle/fotoğraf), ilk görülme zamanı, son görülme zamanı, tekrar sayısı,
durum (yeni/inceleniyor/dönüştürüldü/reddedildi), reddetme gerekçesi, AI
tehlike notu (yalnızca fotoğraf kaynaklıysa), fotoğraf depolama yolu (yalnızca
fotoğraf kaynaklıysa — bugünkü mock'ta base64 data URL olarak IndexedDB'de
tutuluyor, gerçek backend'de bu bir **Supabase Storage yoluna** dönüşmelidir,
tıpkı RiskAttachments gibi; ham base64'ü veritabanı satırında tutmak önerilmez).

**İlişkiler:** Companies ile **çoka-bir**. Departments ile **çoka-bir**
(isteğe bağlı). Dönüştürüldüğünde oluşan Risks kaydıyla **bire-bir** (isteğe
bağlı, yalnızca durum "converted" ise dolu).

---

## Kategori 4: Bilgi ve İletişim

### KnowledgeDocuments

Bilgi Kütüphanesi doküman kayıtları (mevzuat, Fine-Kinney kılavuzları, risk
raporları, periyodik kontrol formları, KKD rehberleri, acil durum planları,
eğitim materyalleri, firma dokümanları).

**Alanlar:** başlık, özet, içerik/kaynak metni, kategori, doküman türü, etiketler,
depolama yolu, güncellenme tarihi, ait olduğu firma (mevzuat gibi genel dokümanlar
için boş bırakılabilir).

**İlişkiler:** Companies ile **çoka-bir, isteğe bağlı** (firmaya özel dokümanlar
için dolu, genel/mevzuat dokümanları için boş). Planlanan RAG özelliği (bkz.
[AI_ROADMAP.md](./AI_ROADMAP.md)) bu tabloyu AI yanıtları için kaynak olarak
kullanacaktır.

### Documents

AI destekli **belge oluşturma** modülünün taslak/tamamlanmış çıktıları (örn.
risk değerlendirme raporu, acil durum planı taslağı) — `KnowledgeDocuments`'tan
**bilinçli olarak ayrıdır**: biri OKUNAN referans kütüphanesi, bu ise
kullanıcının ÜRETTİĞİ/ÜRETMEKTE OLDUĞU belge kaydıdır.

**Alanlar:** belge türü, başlık, oluşturan kullanıcı, oluşturulma tarihi,
durum (taslak/tamamlandı), içerik (bugün mock/placeholder — gerçek AI üretimi
Phase 4/5 kapsamında), ait olduğu firma.

**İlişkiler:** Companies ile **çoka-bir**. Users ile **çoka-bir** (oluşturan).

### Notifications

**DÜZELTME (bkz. Sonraki Öneriler takibi):** bu tablo önceden hem iş akışı hem
sistem bildirimlerini TEK tabloda birleştirilmiş olarak planlanmıştı — bu,
kod tabanındaki gerçek ayrımla ÇELİŞİYORDU. IndexedDB'de bunlar bilerek İKİ
AYRI koleksiyondur (`notifications` ve `systemNotifications`) ve aşağıda da
öyle modellenir; bu, `RiskHistory`/`Audits` ayrımıyla AYNI gerekçeye dayanır
(bkz. "İlişki Özeti").

Ramak kala/tehlike/iş kazası **OLAY KAYITLARI** — çalışan↔uzman/işveren iş
akışının parçası (bildirim, AI analizi, uzman onayı).

**Alanlar:** tür (ramakKala/tehlike/kaza), açıklama, durum (beklemede/AI
analiz edildi/onaylandı), bildiren çalışan, tarih, AI analiz sonucu, uzman
notu, ait olduğu firma.

**İlişkiler:** Companies ile **çoka-bir**.

### SystemNotifications

Header'daki Bildirim Merkezi'nin (zil ikonu) **UYGULAMA İÇİ UYARI AKIŞI** —
"yeni risk oluşturuldu", "eğitim tarihi yaklaşıyor" gibi sistem tarafından
üretilen, okundu/okunmadı durumu taşıyan bildirimler. Yukarıdaki
`Notifications`'tan (olay kaydı) kavramsal olarak TAMAMEN AYRIDIR — biri iş
akışı verisi, diğeri geçici bir UI uyarı listesidir.

**Alanlar:** tür (riskCreated/criticalRisk/trainingDue/periodicCheckDue/
employeeAdded), başlık, mesaj, okundu mu, oluşturulma tarihi, ait olduğu firma.

**İlişkiler:** Companies ile **çoka-bir**.

**İlişkiler:** Companies ile **çoka-bir**. Users ile **çoka-bir** (gönderen ve
hedef için iki ayrı referans).

### Audits

Sistem genelinde kritik işlemlerin teknik denetim kaydı (oluşturma, güncelleme,
silme, onay).

**Alanlar:** işlem türü, açıklama, ilgili kayıt türü ve kimliği, aksiyonu yapan
kullanıcı, zaman damgası, ait olduğu firma.

**İlişkiler:** Companies ile **çoka-bir**. Users ile **çoka-bir**. `ilgili kayıt
türü/kimliği` alanı üzerinden Risks, Employees, Companies gibi herhangi bir
tabloya **çok biçimli (polymorphic)** referans verir.

---

## Kategori 5: Operasyonel Takip

### Trainings

Personel eğitim kayıtları. **Bugün kısmi bir karşılığı var:** IndexedDB'de İKİ ayrı
koleksiyon — `trainingCompletions` (sınav denemesi sonucu) ve `trainingProgress`
(video izleme ilerlemesi, "kaldığı yerden devam et" için — Sprint 7.2.1). Bu ikisi
bilinçli olarak ayrı tutuluyor: biri "değerlendirme", diğeri "izleme" kaydı (bkz.
`RiskHistory`/`Audits` ayrımıyla aynı gerekçe, yukarıda). Kurs tanımları (video,
sınav soruları) henüz bir tabloda değil, statik sabit olarak
(`constants/trainingCourses.js`) tutuluyor — bir "kurs oluşturma" arayüzü yok.
Supabase'e geçişte üçü ayrılacak: `Trainings` (kurs tanımı), `TrainingCompletions`
(sınav sonucu) ve `TrainingProgress` (video izleme ilerlemesi).

**Alanlar (TrainingCompletions):** kurs referansı, personel adı, video tamamlandı mı,
sınav puanı, geçti mi, tamamlanma tarihi, ait olduğu firma.

**Alanlar (TrainingProgress):** kurs referansı, personel adı, izlenen saniye,
video süresi, güncellenme tarihi, ait olduğu firma. Her (kurs, personel) çifti
için tek kayıt.

**İlişkiler:** Employees ile **çoka-bir**. Companies ile **çoka-bir**.

### TrainingCourseSettings

Kurs bazlı (kişiye özel DEĞİL, **firma çapında**) son tarih/hatırlatma ayarı —
örn. "Yangın Söndürme eğitiminin firma çapındaki bir sonraki son tarihi".
Aynı kurs farklı firmalarda farklı bir son tarihe sahip olabilir. Bugünkü
IndexedDB kaydında birincil anahtar geçmişte `courseId`'nin kendisiydi (tek
firma varsayımıyla); Sprint: Veri Mimarisi ile UUID id + ayrı `courseId` alanına
geçildi (bkz. services/trainingCourseSettingsService.js), bu yüzden burada da
iki firmanın aynı kursu ayrı satırlarda tutabilmesi doğrudan mümkündür.

**Alanlar:** kurs referansı (`Trainings.course_key`), son tarih, ait olduğu firma.

**İlişkiler:** Companies ile **çoka-bir**. `(company_id, course_key)` **benzersiz**
olmalıdır — aynı firma aynı kurs için birden fazla son tarih tutamaz.

### Equipment

Ekipman/QR kayıtları (mevcut `equipment` koleksiyonunun karşılığı).

**Alanlar:** ekipman adı, QR kodu, tür, son kontrol tarihi, ait olduğu firma/şube.

**İlişkiler:** Companies, Branches ile **çoka-bir**. PeriodicInspections'tan
**bire-çok** referans alır.

### PeriodicInspections

Ekipman/tesisat periyodik kontrol kayıtları (mevcut `periodicChecks`
koleksiyonunun karşılığı).

**Alanlar:** kontrol türü, son kontrol tarihi, bir sonraki kontrol tarihi, durum,
sorumlu, ait olduğu firma ve (varsa) ekipman.

**İlişkiler:** Companies ile **çoka-bir**. Equipment ile **çoka-bir, isteğe
bağlı** (bazı kontroller belirli bir ekipmana değil, genel tesisata aittir).
Employees ile **çoka-bir** (sorumlu kişi).

---

## Kategori 6: Yapay Zeka

### AIHistory

AI Copilot ile yapılan her etkileşimin (sohbet, Fine-Kinney önerisi, gelecekte
Vision AI/RAG sorguları) izlenebilir kaydı — denetlenebilirlik ve gelecekteki
kalite iyileştirmesi için.

**Alanlar:** modül (sohbet/Fine-Kinney önerisi/vision/rag), istek özeti, yanıt
özeti, ilişkili kayıt türü ve kimliği (varsa, örn. hangi Risk için öneri
istendiği), oluşturulma tarihi, ait olduğu kullanıcı ve firma.

**İlişkiler:** Users ile **çoka-bir**. Companies ile **çoka-bir**. `ilişkili
kayıt` alanı üzerinden Risks gibi tablolara **çok biçimli (polymorphic)**
referans verebilir.

---

## İlişki Özeti

- **Companies**, tüm kiracıya özel verinin kök noktasıdır; Branches, Departments,
  Employees doğrudan ona bağlanır.
- **Users**, kimliktir; **Employees** ise organizasyondaki bir kişiyi temsil eder.
  İkisi bağımsızdır ve isteğe bağlı olarak birbirine bağlanır — her kullanıcının
  personel kaydı, her personelin kullanıcı hesabı olmak zorunda değildir.
- **Roles/Permissions**, kullanıcıdan bağımsız, sabit referans veridir; kullanıcıya
  bağlanması her zaman **firma bazlı** bir ilişki (`UserRoles`) üzerinden olur —
  bu, tek bir kullanıcının birden fazla firmayı farklı rollerle yönetebilmesini
  (OSGB senaryosu) mümkün kılar.
- **Risks**, modülün merkezidir; RiskAttachments, CorrectiveActions ve
  RiskHistory ona bağlı **alt kayıt** tablolarıdır — bugün IndexedDB'de bu üçü
  Risk kaydının içine gömülü dizi olarak tutulur, ilişkisel modelde ayrı
  tablolara ayrılır.
- **KnowledgeDocuments**, tek tablo içinde hem genel (mevzuat) hem firmaya özel
  içeriği `companyId`'nin boş/dolu olmasıyla ayırt eder.
- **Audits** ve **RiskHistory**, kasıtlı olarak ayrı tutulur: biri sistem geneli
  teknik denetim, diğeri kullanıcıya gösterilen risk bazlı zaman çizelgesidir.
- **RiskDetections** ve **Risks**, kasıtlı olarak ayrı tutulur: biri ham/doğrulanmamış
  tespit havuzu, diğeri değerlendirilmiş/puanlanmış risk kaydıdır — bir tespit
  Risk'e "dönüştürülebilir" ama otomatik olarak bir Risk kaydı DEĞİLDİR.
- **Notifications** ve **SystemNotifications**, kasıtlı olarak ayrı tutulur: biri
  iş akışı OLAY KAYDI (ramak kala/tehlike/kaza), diğeri UI bildirim zilinin
  geçici uyarı akışıdır — aynı gerekçeyle (Audits/RiskHistory ayrımı) birbirine
  karıştırılmamalıdır.
- **Documents** ve **KnowledgeDocuments**, kasıtlı olarak ayrı tutulur: biri
  kullanıcının ÜRETTİĞİ taslak/tamamlanmış belge, diğeri OKUNAN referans
  kütüphanesidir.

## SQL Taslakları

Bu planın birebir Postgres/Supabase karşılığı — CREATE TABLE ve RLS politikaları
dahil — `docs/backend-migration/` altında taslak olarak hazırlandı:
`supabase-schema-draft.sql`, `supabase-rls-policies-draft.sql` ve (referans
amaçlı, devrede olmayan) `supabaseDataProvider.draft.js`. Bu üç dosya da
yalnızca taslaktır, hiçbir Supabase projesine karşı çalıştırılmamıştır — bkz.
her dosyanın başındaki uyarı.

**ÇÖZÜLDÜ:** SQL taslağı ilk hazırlandığında ortaya çıkan 4 modelleme boşluğu
(`documents`, `riskDetections`, `systemNotifications`'ın `notifications`'tan
ayrımı, `trainingCourseSettings`) bu plana yukarıda eklendi ve SQL/RLS/provider
taslakları buna göre güncellendi — artık IndexedDB'deki 16 store'un TAMAMI bu
planda ve SQL taslağında karşılığını buluyor (bkz. her dosyanın en altındaki
kapsam listesi).

## Bu Plan Ne Zaman Uygulanır

Bu doküman yalnızca **plandır**; herhangi bir tablo, migrasyon ya da Supabase
istemci kodu, kullanıcı açık onayı olmadan oluşturulmaz. Uygulama başladığında
[SPRINTS.md](./SPRINTS.md) ve [CHANGELOG.md](./CHANGELOG.md) güncellenir.
