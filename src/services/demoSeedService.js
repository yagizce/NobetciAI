// Sprint 11 — Demo Data & Realistic Product Experience.
//
// AMAÇ: yeni bir kullanıcı uygulamayı ilk açtığında "Henüz firma oluşturulmadı" boş
// ekranıyla karşılaşıp önce elle bir sürü form doldurmak zorunda kalmasın — tek tıkla
// gerçekçi, birbiriyle TUTARLI (aynı departman/çalışan id'lerine referans veren) bir
// örnek firma yüklenebilsin. Hiçbir gerçek kişisel veri içermez — tüm isimler, firma
// adı ve senaryolar tamamen kurgusaldır.
//
// GÜVENLİK İLKESİ: `seedDemoData()` yalnızca hiç firma yokken çalışır (idempotent,
// mevcut veriyi ASLA ezmez). Yıkıcı olan `resetAndSeedDemoData()` ayrı, açıkça
// adlandırılmış bir fonksiyondur ve yalnızca UI'da bir onay diyaloğunun ARKASINDA
// çağrılmalıdır (bkz. DemoDataSection.jsx). İkisi de aynı iç `buildDemoDataset()`
// fonksiyonunu kullanır — veri seti TEK bir yerde tanımlı, iki giriş noktası arasında
// tutarsızlık riski yok.
//
// Neden servis katmanından (saveBranch/saveEmployee/saveFineKinneyEntry/...) geçiyoruz,
// ham IndexedDB yazmıyoruz: bu fonksiyonlar zaten companyId doğrulaması, id üretimi ve
// firma kapsamı kontrolünü yapıyor (bkz. createCrudService.js) — aynı kuralları burada
// tekrar yazmak hem riskli hem gereksiz olurdu.

import { saveCompany, setActiveCompany } from "./companyService.js";
import { saveBranch } from "./branchService.js";
import { ensureDefaultDepartments } from "./departmentService.js";
import { saveEmployee } from "./employeeService.js";
import { saveFineKinneyEntry } from "./riskService.js";
import { savePeriodicCheck } from "./periodicCheckService.js";
import { saveDocument } from "./documentService.js";
import { saveTrainingCompletion, saveTrainingProgressRecord } from "./trainingService.js";
import { getCompanies } from "./companyService.js";
import { replaceAllData } from "./db.js";
import { requireFeature } from "../constants/releaseProfile.js";
import { computeFineKinneyScore, getFineKinneyRiskLevel } from "../constants/fineKinney.js";
import { createId } from "../utils/id.js";

const CHAT_HISTORY_KEY = "nobetci-chat-history";
const ACTIVE_COMPANY_STORAGE_KEY = "activeCompanyId";

function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Bir Fine-Kinney kaydını, formdan geçmeden doğrudan servis katmanına uygun tam bir
 * nesne olarak üretir — `score`/`riskLevel` FineKinneyForm.jsx'in normalde yaptığı
 * gibi burada elle hesaplanır (getFineKinneyEntries() bunu OKUMA anında yeniden
 * hesaplamıyor, yalnızca periyodik kontrollerin `status`'u öyle çalışıyor).
 */
function buildRiskEntry({ hazard, risk, affected, probability, frequency, severity, action, responsible, dueDate, dateOffsetDays, status, priority, completionPercent, departmentId, closureNote }) {
  const score = computeFineKinneyScore(probability, frequency, severity);
  const level = getFineKinneyRiskLevel(score);
  const isDone = status === "done";
  return {
    id: createId(),
    hazard, risk, affected,
    probability, frequency, severity, score, riskLevel: level.label,
    action, responsible, dueDate,
    date: isoDaysFromNow(dateOffsetDays),
    status,
    residualProbability: null, residualFrequency: null, residualSeverity: null, residualScore: null, residualRiskLevel: null,
    priority, completionPercent,
    closedAt: isDone ? isoDaysFromNow(dateOffsetDays + 2) : null,
    departmentId, branchId: null,
    photoId: null, photoDataUrl: null,
    closureNote: isDone ? (closureNote || "") : "",
    closurePhotoId: null,
  };
}

/**
 * Örnek AI sohbet geçmişini (yalnızca demo amaçlı, gerçek bir API çağrısı YAPILMADI —
 * el yazımı bir örnek diyalog) genel sohbet localStorage anahtarına yazar. ChatPanel.jsx
 * mount olduğunda bu anahtarı zaten okuyor (bkz. Sprint 10 — loadChatHistory), o yüzden
 * burada aynı formatı (role/text/time, image alanı yok) birebir kullanıyoruz.
 */
function seedChatHistory() {
  try {
    const existing = localStorage.getItem(CHAT_HISTORY_KEY);
    if (existing) return; // gerçek bir sohbet zaten varsa üzerine yazma
    const now = new Date();
    const label = (offsetMin) => {
      const t = new Date(now.getTime() - offsetMin * 60000);
      return t.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    };
    const demoMessages = [
      { role: "assistant", text: "İş Sağlığı ve Güvenliği ile ilgili sorularınızı yanıtlayabilirim. Bir tehlike bildirirseniz, doğru değerlendirebilmem için önce birkaç soru soracağım. Nasıl yardımcı olabilirim?", time: label(12) },
      { role: "user", text: "Üretim bölümünde elektrik panosunun kapağı açık kalmış, ne yapmalıyım?", time: label(11) },
      { role: "assistant", text: "Birkaç şeyi netleştirelim:\n\n- Pano şu anda enerjili mi (üzerinden geçen devrelerden herhangi biri aktif mi)?\n- Panoya yetkisiz kişilerin (özellikle üretim sahasındaki diğer çalışanların) erişimi mümkün mü?\n- Bu durum ne zamandan beri böyle?\n\nBu bilgilere göre risk seviyesini ve önerilen yöntemi (L Tipi veya Fine-Kinney) birlikte değerlendirebiliriz.", time: label(10) },
      { role: "user", text: "Enerjili, sahada herkes rahatça yanından geçebiliyor, muhtemelen birkaç gündür böyle.", time: label(9) },
      { role: "assistant", text: "**Risk Seviyesi:** Yüksek — gerekçe: enerjili bir panonun kapağının açık ve serbestçe erişilebilir olması, elektrik çarpması riskini doğrudan ve sürekli hale getiriyor; süregelen bir durum olması da riski artırıyor.\n\n**Önerilen Yöntem:** Fine-Kinney (Olasılık x Frekans x Şiddet) — sürekli maruziyet söz konusu olduğu için frekans bileşeninin ayrıca değerlendirilmesi önemli.\n\n**Gerekçe:** Enerjili+erişilebilir+süregelen kombinasyonu, iş kazası potansiyeli açısından acil müdahale gerektiren bir tehlike sınıfına giriyor.\n\nBu değerlendirmeyi Risk Yönetimi → Fine-Kinney'e kayıt olarak eklememi ister misiniz?", time: label(8) },
    ];
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(demoMessages));
  } catch {
    // localStorage kullanılamıyorsa demo sohbeti sessizce atlanır — kritik değil
  }
}

/**
 * Asıl veri setini oluşturur. Hem `seedDemoData()` hem `resetAndSeedDemoData()`
 * tarafından çağrılır — tanım TEK yerde.
 * @returns {Promise<{ companyId: string }>}
 */
async function buildDemoDataset() {
  const company = await saveCompany({
    name: "Karya Metal Sanayi ve Ticaret A.Ş.",
    taxNumber: "1234567890",
    sector: "Metal İşleme / İmalat",
    employeeCount: 42,
    logo: null,
    address: "Gebze Organize Sanayi Bölgesi, 41400 Gebze/Kocaeli",
    phone: "0262 555 00 00",
    email: "info@karyametal-ornek.com",
  });
  await setActiveCompany(company.id);
  const companyId = company.id;

  await saveBranch({ id: createId(), companyId, name: "Merkez Fabrika – Gebze", address: "Gebze OSB 3. Cadde No:14, Kocaeli", responsible: "Ahmet Yılmaz" });
  await saveBranch({ id: createId(), companyId, name: "Depo ve Sevkiyat – Tuzla", address: "Tuzla Deri OSB, İstanbul", responsible: "Ali Çelik" });

  // Var olan varsayılan departman seti aynen kullanılıyor (Üretim, Depo, İdari İşler,
  // İnsan Kaynakları, Bakım, Kalite) — DEFAULT_DEPARTMENT_NAMES'i burada tekrar
  // TANIMLAMAK yerine mevcut fonksiyon çağrıldı, tutarlılık garanti.
  const departments = await ensureDefaultDepartments(companyId);
  const deptId = (name) => departments.find((d) => d.name === name)?.id ?? null;

  const employees = await Promise.all([
    saveEmployee({ id: createId(), companyId, fullName: "Ahmet Yılmaz", employeeNumber: "1001", departmentId: deptId("Üretim"), position: "Vardiya Amiri", phone: "0532 000 00 01", email: "ahmet.yilmaz@karyametal-ornek.com", status: "active" }),
    saveEmployee({ id: createId(), companyId, fullName: "Mehmet Demir", employeeNumber: "1002", departmentId: deptId("Bakım"), position: "Bakım Teknisyeni", phone: "0532 000 00 02", email: "mehmet.demir@karyametal-ornek.com", status: "active" }),
    saveEmployee({ id: createId(), companyId, fullName: "Ayşe Kaya", employeeNumber: "1003", departmentId: deptId("Kalite"), position: "Kalite Sorumlusu", phone: "0532 000 00 03", email: "ayse.kaya@karyametal-ornek.com", status: "active" }),
    saveEmployee({ id: createId(), companyId, fullName: "Fatma Şahin", employeeNumber: "1004", departmentId: deptId("İdari İşler"), position: "İSG Uzmanı", phone: "0532 000 00 04", email: "fatma.sahin@karyametal-ornek.com", status: "active" }),
    saveEmployee({ id: createId(), companyId, fullName: "Ali Çelik", employeeNumber: "1005", departmentId: deptId("Depo"), position: "Forklift Operatörü", phone: "0532 000 00 05", email: "ali.celik@karyametal-ornek.com", status: "active" }),
    saveEmployee({ id: createId(), companyId, fullName: "Zeynep Arslan", employeeNumber: "1006", departmentId: deptId("İnsan Kaynakları"), position: "İK Uzmanı", phone: "0532 000 00 06", email: "zeynep.arslan@karyametal-ornek.com", status: "active" }),
  ]);
  const empName = (fullName) => employees.find((e) => e.fullName === fullName)?.fullName ?? fullName;

  // Sprint 11'de istenen 7 örnek tehlike — hepsi gerçekçi P/F/Ş değerleriyle, farklı
  // durum ve önceliklerle (bilerek çeşitlilik: bazısı açık/geciken, bazısı devam eden,
  // bazısı kanıtlı kapanmış, biri de KASITLI OLARAK kanıtsız kapatılmış — böylece Sprint
  // 8'de eklenen Denetim Hazırlık Checklist'inin gerçekten bir şey tespit ettiği görülsün,
  // her şeyin "tertemiz" görünmesi checklist'in ne işe yaradığını gizlerdi).
  await Promise.all([
    saveFineKinneyEntry(buildRiskEntry({
      hazard: "Elektrik panosunda açık kapak", risk: "Enerjili panoya doğrudan temas sonucu elektrik çarpması",
      affected: "Üretim çalışanları ve bakım personeli", probability: 3, frequency: 6, severity: 15,
      action: "Pano kapağı kilitli hale getirilecek, üzerine uyarı etiketi asılacak.", responsible: empName("Mehmet Demir"),
      dueDate: isoDaysFromNow(-1), dateOffsetDays: -6, status: "open", priority: "urgent", completionPercent: 0,
      departmentId: deptId("Üretim"),
    })),
    saveFineKinneyEntry(buildRiskEntry({
      hazard: "Kaygan zemin", risk: "Üretim hattında yağ/su birikintisi nedeniyle düşme",
      affected: "Üretim hattı çalışanları", probability: 3, frequency: 6, severity: 7,
      action: "Kaymaz zemin bandı uygulanacak, uyarı levhası konulacak.", responsible: empName("Ahmet Yılmaz"),
      dueDate: isoDaysFromNow(7), dateOffsetDays: -10, status: "in_progress", priority: "high", completionPercent: 40,
      departmentId: deptId("Üretim"),
    })),
    saveFineKinneyEntry(buildRiskEntry({
      hazard: "KKD kullanılmaması", risk: "Gürültülü alanda kulaklık takılmaması nedeniyle işitme kaybı riski",
      affected: "Üretim çalışanları", probability: 3, frequency: 6, severity: 7,
      action: "Tüm vardiya çalışanlarına KKD hatırlatma eğitimi verildi, saha denetimi yapıldı.", responsible: empName("Ayşe Kaya"),
      dueDate: isoDaysFromNow(-20), dateOffsetDays: -25, status: "done", priority: "medium", completionPercent: 100,
      departmentId: deptId("Üretim"), closureNote: "Tüm vardiya çalışanlarına KKD hatırlatma eğitimi verildi, saha denetimi yapılarak uyum doğrulandı.",
    })),
    saveFineKinneyEntry(buildRiskEntry({
      hazard: "Forklift yaya yolu ihlali", risk: "Forklift ve yaya trafiğinin ayrılmamış olması nedeniyle çarpışma",
      affected: "Depo çalışanları ve forklift operatörleri", probability: 6, frequency: 6, severity: 15,
      action: "Yaya yolu zemin çizgileri yenilenecek, forklift için hız sınırı ve ayna sistemi kontrol edilecek.", responsible: empName("Ali Çelik"),
      dueDate: isoDaysFromNow(3), dateOffsetDays: -4, status: "open", priority: "urgent", completionPercent: 0,
      departmentId: deptId("Depo"),
    })),
    saveFineKinneyEntry(buildRiskEntry({
      hazard: "Yangın tüpü önünün kapalı olması", risk: "Acil durumda yangın tüpüne hızlı erişilememesi",
      affected: "Tüm çalışanlar", probability: 1, frequency: 1, severity: 7,
      action: "Yangın tüpü önü boşaltıldı.", responsible: empName("Mehmet Demir"),
      dueDate: isoDaysFromNow(-15), dateOffsetDays: -18, status: "done", priority: "low", completionPercent: 100,
      departmentId: deptId("Bakım"), closureNote: "", // KASITLI BOŞ — bkz. yukarıdaki not
    })),
    saveFineKinneyEntry(buildRiskEntry({
      hazard: "Yüksekte çalışma", risk: "Çatı/platform bakımında düşme sonucu ağır yaralanma",
      affected: "Bakım ekibi", probability: 3, frequency: 1, severity: 40,
      action: "Yüksekte çalışma için tam vücut kemer sistemi sağlanacak, iskele periyodik kontrolü yapılacak.", responsible: empName("Mehmet Demir"),
      dueDate: isoDaysFromNow(10), dateOffsetDays: -3, status: "open", priority: "high", completionPercent: 0,
      departmentId: deptId("Bakım"),
    })),
    saveFineKinneyEntry(buildRiskEntry({
      hazard: "Acil çıkış kapısının engellenmesi", risk: "Tahliye sırasında gecikme, boğulma/yaralanma riski",
      affected: "Tüm ofis çalışanları", probability: 1, frequency: 1, severity: 15,
      action: "Kapı önündeki malzemeler kaldırıldı, alan sürekli açık tutulacak şekilde zemin işaretlemesi yapıldı.", responsible: empName("Fatma Şahin"),
      dueDate: isoDaysFromNow(-8), dateOffsetDays: -12, status: "done", priority: "medium", completionPercent: 100,
      departmentId: deptId("İdari İşler"), closureNote: "Kapı önündeki malzemeler kaldırıldı, alan sürekli açık tutulacak şekilde zemin işaretlemesi yapıldı.",
    })),
  ]);

  // Periyodik kontroller — bilerek karışık durum: biri gecikmiş (elektrik pano —
  // yukarıdaki açık riskle TEMATİK OLARAK bağlantılı), biri yaklaşan, ikisi güncel.
  await Promise.all([
    savePeriodicCheck({ id: createId(), companyId, itemName: "Elektrik Pano Periyodik Kontrolü – Üretim", category: "electrical", departmentId: deptId("Üretim"), lastCheckDate: isoDaysFromNow(-400), intervalDays: 365, nextDueDate: isoDaysFromNow(-35), responsible: empName("Mehmet Demir"), notes: "Yıllık pano topraklama ve yalıtım kontrolü." }),
    savePeriodicCheck({ id: createId(), companyId, itemName: "Yangın Tüpü – Merkez Fabrika", category: "fireExtinguisher", departmentId: null, lastCheckDate: isoDaysFromNow(-360), intervalDays: 365, nextDueDate: isoDaysFromNow(5), responsible: empName("Mehmet Demir"), notes: "Yıllık dolum kontrolü ve basınç göstergesi kontrolü." }),
    savePeriodicCheck({ id: createId(), companyId, itemName: "Forklift Periyodik Muayenesi", category: "equipment", departmentId: deptId("Depo"), lastCheckDate: isoDaysFromNow(-30), intervalDays: 180, nextDueDate: isoDaysFromNow(150), responsible: empName("Ali Çelik"), notes: "6 aylık periyodik muayene (yetkili servis)." }),
    savePeriodicCheck({ id: createId(), companyId, itemName: "İskele ve Yüksekte Çalışma Ekipmanı Kontrolü", category: "scaffolding", departmentId: deptId("Bakım"), lastCheckDate: isoDaysFromNow(-25), intervalDays: 90, nextDueDate: isoDaysFromNow(65), responsible: empName("Mehmet Demir"), notes: "Emniyet kemeri, halat ve iskele bağlantı kontrolü." }),
  ]);

  // Belgeler — Sprint 8'de eklenen "Zorunlu Belge Durumu" kontrolüyle DOĞRUDAN
  // ilişkili: bu iki tür tamamlanmış olarak var olduğu için Denetim Hazırlık
  // Checklist'i bu ikisini "Mevcut" gösterecek.
  await Promise.all([
    saveDocument({ id: createId(), companyId, type: "riskAnalizi", title: "2026 Yılı Risk Değerlendirme Raporu", createdBy: empName("Fatma Şahin"), createdAt: new Date(new Date().setDate(new Date().getDate() - 40)).toISOString(), status: "completed", content: "Karya Metal Sanayi ve Ticaret A.Ş. Gebze fabrikası için 6331 sayılı Kanun kapsamında hazırlanan risk değerlendirme raporu. Üretim, bakım ve depo alanlarındaki tehlikeler Fine-Kinney yöntemiyle değerlendirilmiştir." }),
    saveDocument({ id: createId(), companyId, type: "acilDurumPlani", title: "Acil Durum ve Tahliye Planı", createdBy: empName("Fatma Şahin"), createdAt: new Date(new Date().setDate(new Date().getDate() - 40)).toISOString(), status: "completed", content: "Yangın, deprem ve diğer acil durumlarda izlenecek tahliye yolları, toplanma noktaları ve sorumlu personel bu planda tanımlanmıştır." }),
  ]);

  // Eğitimler — bir kısmı tamamlanmış (sınav geçilmiş), biri de "devam ediyor"
  // durumunda bırakıldı (yalnızca ilerleme kaydı, tamamlama yok) — Eğitim modülünün
  // "Devam Eden Eğitimler" panelinin de dolu görünmesi için.
  await Promise.all([
    saveTrainingCompletion({ courseId: "kkd-kullanimi", employeeName: empName("Ahmet Yılmaz"), watchedFullVideo: true, quizScore: 90, passed: true }),
    saveTrainingCompletion({ courseId: "yuksekte-calisma", employeeName: empName("Mehmet Demir"), watchedFullVideo: true, quizScore: 88, passed: true }),
    saveTrainingCompletion({ courseId: "ilk-yardim", employeeName: empName("Ayşe Kaya"), watchedFullVideo: true, quizScore: 95, passed: true }),
    saveTrainingCompletion({ courseId: "elektrik-guvenligi", employeeName: empName("Ali Çelik"), watchedFullVideo: true, quizScore: 70, passed: true }),
    saveTrainingProgressRecord({ courseId: "yangin-sondurme", employeeName: empName("Zeynep Arslan"), positionSeconds: 45, durationSeconds: 180 }),
  ]);

  seedChatHistory();

  return { companyId };
}

/**
 * Yalnızca hiç firma yokken çalışır — mevcut veriyi ASLA silmez/ezmez. Ayarlar'da
 * "Örnek Verilerle Doldur" butonu ve boş dashboard ekranındaki kısayol bunu çağırır.
 * @returns {Promise<{ seeded: boolean, companyId: string|null }>}
 */
export async function seedDemoData() {
  requireFeature("demoData");
  const existing = await getCompanies();
  if (existing.length > 0) return { seeded: false, companyId: null };
  const { companyId } = await buildDemoDataset();
  return { seeded: true, companyId };
}

/**
 * YIKICI. Tüm yerel veriyi (tüm firmalar dahil) siler ve ardından aynı örnek veri
 * setini yeniden oluşturur. Yalnızca UI'da açık bir onay diyaloğunun ARDINDAN
 * çağrılmalıdır — bu fonksiyon kendi başına bir onay istemez.
 *
 * `replaceAllData({})` zaten var olan, yedek geri yüklemede kullanılan TEK ATOMİK
 * işlem üzerinden çalışır (bkz. db.js, backupService.js → restoreFullBackup) — burada
 * yeni bir silme mekanizması İCAT EDİLMEDİ.
 * @returns {Promise<{ companyId: string }>}
 */
export async function resetAndSeedDemoData() {
  requireFeature("demoData");
  await replaceAllData({});
  try {
    localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch {
    // no-op
  }
  return buildDemoDataset();
}
