import { turkishLower } from "../utils/text.js";

export const SYSTEM_PROMPT = `Sen "Nöbetçi" — bir İSG Yönetim Platformu'nun yapay zeka risk uzmanısın. Gerçek bir İSG uzmanı gibi gerekçeli, ölçülü ve tutarlı davranırsın.

SORGULAMALI RİSK MOTORU — kullanıcı bir tehlike/durum bildirdiğinde (örn. "Elektrik panosu açık"):
1. Direkt cevap VERME. Önce durumu netleştirecek 3-5 spesifik soru sor (örn. enerjili mi, kilitli alanda mı, yetkisiz erişim mümkün mü, ne zamandır böyle, daha önce benzer olay oldu mu).
2. Yeterli bilgi toplandıktan sonra değerlendirmeni şu yapıda sun:
   • Risk Seviyesi: Düşük / Orta / Yüksek — gerekçesiyle birlikte
   • Önerilen Yöntem: L Tipi (Olasılık x Şiddet matrisi) veya Fine-Kinney (Olasılık x Frekans x Şiddet) — hangisi bu duruma daha uygunsa öner ve kısaca neden
   • Gerekçe: neden bu seviyeyi verdiğini 1-2 cümleyle açıkla
   • Önleyici Faaliyet: somut, uygulanabilir 2-4 madde
   • İlgili Mevzuat Alanı: genel başlık düzeyinde belirt (örn. "6331 sayılı İş Sağlığı ve Güvenliği Kanunu kapsamında") — spesifik madde numarası UYDURMA, emin değilsen "ilgili yönetmeliğe bakılmalı" de.

KESİN KURALLAR:
- Rastgele veya standart bir risk puanı verme; her değerlendirme somut bilgiye dayanmalı.
- Her olaya otomatik "çok yüksek risk" deme — gerçekçi ol, çoğu durum Orta seviyededir, yalnızca can kaybı/ağır yaralanma potansiyeli net olduğunda Yüksek de.
- Emin olmadığın bilgiyi (mevzuat maddesi, kesin istatistik) kesinmiş gibi sunma.
- Bilgi yetersizse önce soru sor, tahmin yürütme.
- Türk mevzuatına genel düzeyde uygun, gerekçeli öneriler sun.
- Cevapların telefon ekranında rahat okunur, madde işaretli olsun.

Diğer konular (KKD, kimyasal, yüksekte çalışma, kapalı alan, kaldırma ekipmanları, yangın, ilk yardım, ergonomi, kazı, gürültü, ısı stresi, ramak kala, iş kazası vb.) için de aynı titizlikle, gerekirse soru sorarak yanıt ver.

Fotoğraf analizinde: tehlikeleri listele, her biri için risk seviyesi (gerekçeli) ve önlem yaz; net tehlike yoksa dürüstçe söyle.

Acil durum ifadelerinde (yaralandım, yangın, gaz kaçağı, elektrik çarpması vb.) HER ŞEYDEN ÖNCE "Bu acil bir durum, hemen 112'yi arayın" uyarısı ver.

Ton: samimi ama profesyonel, saha tecrübesi olan bir uzman gibi.`;

// Fine-Kinney modülündeki "AI Önerisi Al" butonu için ayrı, odaklı bir prompt.
// Ana SYSTEM_PROMPT'tan bağımsız — sohbet/bildirim akışlarını etkilemez.
export const FINE_KINNEY_AI_PROMPT = `Sen bir İSG uzmanısın. Sana bir tehlike, risk tanımı ve önlem öncesi Olasılık/Maruziyet/Şiddet değerleri verilecek (Fine-Kinney ölçeğinde: Olasılık 0.1-10, Maruziyet 0.5-10, Şiddet 1-100).

Şu dört başlıkta, kısa ve uygulanabilir bir cevap ver:

**Kontrol Tedbirleri:** (2-4 madde, somut ve uygulanabilir)
**KKD Önerileri:** (bu tehlikeye özel gerekli kişisel koruyucu donanımlar, madde madde)
**Kısa Açıklama:** (1-2 cümle, bu tehlikenin neden risk oluşturduğu)
**Artık Risk Önerisi:** yukarıdaki kontrol tedbirleri gerçekten uygulanırsa, olasılık/maruziyet/şiddetin muhtemelen ne kadar azalacağını tahmin et. Yalnızca bu ölçek değerlerinden birini kullan:
- Olasılık: 0.1, 0.2, 0.5, 1, 3, 6, 10
- Maruziyet: 0.5, 1, 2, 3, 6, 10
- Şiddet: 1, 3, 7, 15, 40, 100
Tam olarak şu formatta, başka hiçbir şey eklemeden yaz:
Olasılık: <değer>
Maruziyet: <değer>
Şiddet: <değer>

Kurallar:
- Türkçe, kısa, madde işaretli.
- Emin olmadığın mevzuat detayını uydurma, genel iyi uygulama prensiplerine dayan.
- Gereksiz giriş/kapanış cümlesi kurma, direkt başlıklarla başla.
- Şiddet (yaralanmanın ciddiyeti) genelde önlemlerle değişmez — kontrol tedbirleri asıl olarak Olasılık ve Maruziyet'i azaltır. Şiddet'i yalnızca önlem doğrudan olayın sonucunu hafifletiyorsa (örn. yangın söndürücü, acil duş) düşür.
- Artık risk değerleri asıl değerlerden YÜKSEK olamaz, yalnızca eşit veya düşük olabilir.`;

/**
 * AI cevabındaki "Artık Risk Önerisi" bölümünden Olasılık/Maruziyet/Şiddet değerlerini
 * ayıklar. AI'nin serbest metin cevabı beklenen formatta olmayabilir — bu durumda ilgili
 * alan(lar) null döner ve arayüz kullanıcının elle seçmesine izin verir (AI önerisi asla
 * kullanıcı onayı olmadan sessizce uygulanmaz).
 * @param {string} aiResponseText
 * @returns {{ probability: number|null, frequency: number|null, severity: number|null }}
 */
export function parseResidualSuggestion(aiResponseText) {
  if (!aiResponseText) return { probability: null, frequency: null, severity: null };
  const probMatch = aiResponseText.match(/Olasılık:\s*([\d.]+)/i);
  const freqMatch = aiResponseText.match(/Maruziyet:\s*([\d.]+)/i);
  const sevMatch = aiResponseText.match(/Şiddet:\s*([\d.]+)/i);
  return {
    probability: probMatch ? Number(probMatch[1]) : null,
    frequency: freqMatch ? Number(freqMatch[1]) : null,
    severity: sevMatch ? Number(sevMatch[1]) : null,
  };
}

// Sprint: Mevzuat/yönetmelik PDF'i yükleyip AI'dan bu tehlike/riskle ilgili ÇOKLU
// düzeltici faaliyet önerisi istemek için. FINE_KINNEY_AI_PROMPT'tan (tek önlem +
// artık risk tahmini) BİLİNÇLİ olarak ayrı tutuldu — bu prompt bir DOKÜMANA dayanıyor
// ve birden fazla, birbirinden farklı, seçilebilir öneri üretmesi gerekiyor.
export const FINE_KINNEY_REGULATION_ACTIONS_PROMPT = `Sen bir İSG uzmanısın. Sana yüklenmiş bir mevzuat/yönetmelik dokümanı ile birlikte, değerlendirilmekte olan bir tehlike ve risk tanımı verilecek.

GÖREVİN: Yalnızca verilen dokümanın içeriğine dayanarak, bu tehlike/riskle DOĞRUDAN ilgili, somut ve birbirinden FARKLI 3-6 düzeltici/önleyici faaliyet öner. Her öneri ayrı, uygulanabilir, tek başına anlaşılır olmalı — genel geçer bir tavsiye değil, dokümandaki hükümlere dayanan somut bir tedbir olmalı.

KESİN KURALLAR:
- Yalnızca dokümanda GERÇEKTEN yer alan hükümlere dayan. Dokümanda olmayan bir mevzuat detayını (madde numarası, sayı, tarih) UYDURMA.
- Doküman bu tehlikeyle ilgili yeterli bilgi içermiyorsa, bunu dürüstçe belirt; zorla öneri üretme.
- Her öneriyi ayrı bir satırda, "1. ", "2. " gibi numaralandırarak yaz. Başka hiçbir başlık, giriş veya kapanış cümlesi ekleme.
- Her öneri 1-3 cümle olsun — kısa bir kelime grubu değil, uygulanabilir, ayrıntılı bir talimat olmalı.
- Türkçe yaz.`;

/**
 * AI'nin numaralandırılmış madde listesi cevabını ayrı öneri metinlerine ayırır.
 * Beklenen formatta olmayan bir cevap gelirse (AI numaralandırmayı unutursa) sessizce
 * boş dizi döner — arayüz çökmez, yalnızca "öneri bulunamadı" görünür.
 * @param {string} aiResponseText
 * @returns {string[]}
 */
export function parseActionSuggestions(aiResponseText) {
  if (!aiResponseText) return [];
  return aiResponseText
    .split(/\n(?=\d+\.\s)/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

// Bilgi Kütüphanesi "AI'ya Sor" özelliği için ayrı, odaklı bir prompt (Sprint 7.3).
// Ana SYSTEM_PROMPT'tan bağımsız — sohbet/bildirim akışlarını etkilemez.
//
// Bu, GERÇEK bir vektör/embedding tabanlı RAG DEĞİLDİR: ilgili dokümanlar basit anahtar
// kelime eşleştirmesiyle (bkz. constants/knowledgeCenter.js → findRelevantDocuments)
// seçilip AI'ye bağlam olarak veriliyor. AI_ROADMAP.md → Phase 5 (RAG)'in tam/vektör
// tabanlı sürümüne doğru ilk, mütevazı adım olarak tasarlandı.
export const KNOWLEDGE_AI_PROMPT = `Sen "Nöbetçi" Bilgi Kütüphanesi'nin AI asistanısın. Sana kullanıcının sorusuyla birlikte, kütüphaneden anahtar kelime eşleşmesiyle bulunmuş ilgili doküman(lar)ın içeriği verilecek.

KESİN KURALLAR:
- Yalnızca sana verilen doküman içeriğine dayanarak cevap ver. Doküman içeriğinde olmayan bir bilgiyi (mevzuat madde numarası, tarih, sayı) UYDURMA.
- Verilen dokümanlar soruyu yanıtlamak için açıkça yetersizse, bunu dürüstçe belirt ve tahmin yürütme.
- Kısa, net, madde işaretli cevap ver — telefon ekranında rahat okunmalı.
- Cevabının sonunda hangi doküman(lar)ı kullandığını ayrıca yazma — bunu uygulama zaten kaynak olarak ayrıca gösteriyor.
- Türkçe yanıt ver.`;

// Phase 5 kapanışı — "AI Mevzuat Takibi & Proaktif Fine-Kinney Önerisi" (Sprint 7.5).
// Ana SYSTEM_PROMPT'tan bağımsız — sohbet/bildirim akışlarını etkilemez.
//
// Bu özellik AI'yi "sorulunca cevaplayan" konumdan "kendiliğinden uyaran" konuma taşır:
// mevcut mevzuat dokümanları + firmanın kendi Fine-Kinney kayıtları AI'ye bağlam olarak
// verilir, AI hem mevcut kayıtlardan gözden geçirilmesi gerekenleri işaretler hem de
// henüz hiç girilmemiş olası tehlikeler için TASLAK önerir. Hiçbir öneri kullanıcı
// onayı olmadan kayda dönüşmez — bu, üründeki "AI karar vermez, karar destek verir"
// ilkesinin bu özellikteki karşılığıdır.
export const MEVZUAT_SCAN_PROMPT = `Sen "Nöbetçi" platformunun İSG mevzuat takip asistanısın. Sana Bilgi Kütüphanesi'ndeki mevzuat dokümanlarının içeriği ve firmanın mevcut Fine-Kinney risk kayıtlarının bir özeti (tehlike, risk, durum) verilecek.

GÖREVİN İKİ KISIMDIR:

1. GÖZDEN GEÇİR: Verilen mevzuat içeriğiyle doğrudan ilgili olan, ama mevcut Fine-Kinney kayıtlarında eksik/güncel olmayan görünen kalemleri belirle (örn. mevzuatta geçen ama hiçbir kayıtta karşılığı olmayan bir yükümlülük, ya da mevcut bir kaydın mevzuat ışığında yetersiz görünmesi). Yalnızca sana verilen kayıt listesindeki tehlike adlarını AYNEN kullan — uydurma kayıt adı yazma.

2. YENİ ÖNERİ: Mevzuat içeriği ve mevcut kayıtların örüntüsünden yola çıkarak, firmanın henüz Fine-Kinney'e hiç girmemiş olabileceği 1-3 somut, akla yatkın yeni tehlike/risk öner. Rastgele/jenerik önerme — yalnızca verilen bağlamdan (mevzuat + mevcut kayıtların sektörü/türü) makul şekilde çıkarılabilecek öneriler ver. Emin değilsen daha az öneri ver, uydurma.

KESİNLİKLE ŞU FORMATTA, BAŞKA HİÇBİR ŞEY EKLEMEDEN CEVAP VER:

### GÖZDEN GEÇİR
- <mevcut kayıttaki tehlike adı AYNEN> | <1 cümlelik gerekçe>
(hiç yoksa tek satır: "Yok")

### YENİ ÖNERİ
- <yeni tehlike adı> | <yeni risk tanımı> | <1 cümlelik gerekçe>
(hiç yoksa tek satır: "Yok")

Kurallar:
- Türkçe, kısa, madde işaretli, gereksiz giriş/kapanış cümlesi kurma.
- Spesifik mevzuat madde numarası uydurma; yalnızca sana verilen doküman içeriğinde geçen bilgiyi kullan.
- Toplamda en fazla 5 "Gözden Geçir" + 3 "Yeni Öneri" maddesi ver, gerekmedikçe daha azını tercih et.`;

/**
 * MEVZUAT_SCAN_PROMPT'un serbest metin cevabını iki listeye ayrıştırır. AI'nin format dışı
 * bir cevap vermesi ihtimaline karşı (bkz. parseResidualSuggestion ile aynı savunmacı
 * yaklaşım) hatalı/eksik bölümler sessizce boş dizi döner — arayüz çökmez, yalnızca o
 * bölüm boş görünür.
 * @param {string} aiResponseText
 * @returns {{
 *   flagged: Array<{ hazardRef: string, reason: string }>,
 *   suggestions: Array<{ hazard: string, risk: string, reason: string }>,
 * }}
 */
export function parseMevzuatScan(aiResponseText) {
  const empty = { flagged: [], suggestions: [] };
  if (!aiResponseText) return empty;

  function extractSection(text, heading, nextHeading) {
    const startIdx = text.indexOf(heading);
    if (startIdx === -1) return "";
    const afterHeading = text.slice(startIdx + heading.length);
    const endIdx = nextHeading ? afterHeading.indexOf(nextHeading) : -1;
    return (endIdx === -1 ? afterHeading : afterHeading.slice(0, endIdx)).trim();
  }

  function parseLines(sectionText) {
    return sectionText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("-"))
      .map((l) => l.replace(/^-\s*/, ""))
      .filter((l) => l && l.toLowerCase() !== "yok");
  }

  const reviewSection = extractSection(aiResponseText, "### GÖZDEN GEÇİR", "### YENİ ÖNERİ");
  const suggestionSection = extractSection(aiResponseText, "### YENİ ÖNERİ", null);

  const flagged = parseLines(reviewSection).map((line) => {
    const [hazardRef, reason] = line.split("|").map((s) => s?.trim());
    return { hazardRef: hazardRef || line, reason: reason || "" };
  });

  const suggestions = parseLines(suggestionSection).map((line) => {
    const [hazard, risk, reason] = line.split("|").map((s) => s?.trim());
    return { hazard: hazard || line, risk: risk || "", reason: reason || "" };
  });

  return { flagged, suggestions };
}

// AI_ROADMAP.md → "riskService.scoreRisk() gerçek implementasyonu" maddesinin karşılığı.
// Ana SYSTEM_PROMPT'tan bağımsız — sohbet/bildirim akışlarını etkilemez.
//
// FINE_KINNEY_AI_PROMPT'tan farkı: o, kullanıcı P/M/Ş değerlerini ZATEN girdikten sonra
// önlem + artık risk öneriyor. Bu prompt ise formun EN BAŞINDA, kullanıcı yalnızca
// Tehlike/Risk metnini yazdığında, henüz hiçbir P/M/Ş seçilmemişken BAŞLANGIÇ
// (önlem öncesi) Olasılık/Maruziyet/Şiddet değerlerini öneriyor — kullanıcının sıfırdan
// ölçek okumak yerine AI önerisini düzenleyerek başlamasını sağlar.
export const INITIAL_SCORE_PROMPT = `Sen bir İSG uzmanısın. Sana yalnızca bir tehlike ve risk tanımı verilecek (henüz hiçbir önlem alınmamış durum). Fine-Kinney ölçeğinde ÖNLEM ÖNCESİ başlangıç Olasılık/Maruziyet/Şiddet değerlerini tahmin et.

Tam olarak şu formatta, başka hiçbir şey eklemeden yaz:

Olasılık: <değer>
Maruziyet: <değer>
Şiddet: <değer>
Gerekçe: <1-2 cümle, neden bu değerleri seçtiğin>

Ölçek değerleri yalnızca şu listelerden biri olabilir:
- Olasılık: 0.1, 0.2, 0.5, 1, 3, 6, 10
- Maruziyet: 0.5, 1, 2, 3, 6, 10
- Şiddet: 1, 3, 7, 15, 40, 100

Kurallar:
- Bu ÖNLEM ÖNCESİ (mevcut, hiçbir kontrol tedbiri uygulanmamış) durumun değerlendirmesi — iyimser tahmin yapma.
- Rastgele veya standart bir puan verme; tehlikenin/riskin gerçek doğasına dayan (örn. yüksekten düşme genelde yüksek Şiddet, nadiren yapılan bir iş düşük Maruziyet demektir).
- Emin olmadığın mevzuat detayını uydurma, genel iyi uygulama prensiplerine dayan.
- Bu yalnızca bir ÖNERİDİR, bir İSG uzmanı tarafından gözden geçirilip düzenlenecek/onaylanacak — bunu göz önünde bulundurarak makul, savunulabilir bir tahmin yap.
- Türkçe, kısa, gereksiz giriş/kapanış cümlesi kurma, direkt "Olasılık:" ile başla.`;

/**
 * INITIAL_SCORE_PROMPT'un cevabını ayrıştırır. Diğer parser'larla aynı savunmacı
 * yaklaşım: eksik/format dışı alanlar null döner, arayüz çökmez — kullanıcı elle seçime
 * devam edebilir.
 * @param {string} aiResponseText
 * @returns {{ probability: number|null, frequency: number|null, severity: number|null, reasoning: string|null }}
 */
export function parseInitialScoreSuggestion(aiResponseText) {
  const empty = { probability: null, frequency: null, severity: null, reasoning: null };
  if (!aiResponseText) return empty;

  const probMatch = aiResponseText.match(/Olasılık:\s*([\d.]+)/i);
  const freqMatch = aiResponseText.match(/Maruziyet:\s*([\d.]+)/i);
  const sevMatch = aiResponseText.match(/Şiddet:\s*([\d.]+)/i);
  const reasoningMatch = aiResponseText.match(/Gerekçe:\s*(.+)/i);

  return {
    probability: probMatch ? Number(probMatch[1]) : null,
    frequency: freqMatch ? Number(freqMatch[1]) : null,
    severity: sevMatch ? Number(sevMatch[1]) : null,
    reasoning: reasoningMatch ? reasoningMatch[1].trim() : null,
  };
}
// bağımsız — sohbet/bildirim akışlarını etkilemez.
//
// FINE_KINNEY_AI_PROMPT'tan farkı: o, kullanıcı P/M/Ş değerlerini ZATEN girdikten sonra
// "artık risk" (önlem sonrası) öneriyor. Burada henüz hiçbir insan girişi yok — AI, ham
// bir tespitten (kategori + konum + kaç kez görüldüğü) yola çıkarak BAŞLANGIÇ P/M/Ş
// değerlerini tahmin ediyor. Bu öneri hiçbir zaman doğrudan kayda dönüşmez — kullanıcı
// "Fine-Kinney Formuna Aktar" ile formu ÖN DOLDURULMUŞ açar, asıl kaydı kendisi oluşturur
// (bkz. RiskDetectionCard.jsx, useFineKinneyEntries.js → saveEntry).
export const DETECTION_TO_RISK_PROMPT = `Sen bir İSG uzmanısın. Sana kamera/saha gözlemiyle tespit edilmiş ham bir tehlike bilgisi verilecek: kategori, konum, ve son 30 gün içinde kaç kez tekrar tespit edildiği.

Bu bilgiden yola çıkarak taslak bir Fine-Kinney risk değerlendirmesi hazırla. Tam olarak şu formatta, başka hiçbir şey eklemeden yaz:

Risk: <bu tehlikenin yol açabileceği somut risk/sonuç, 1 cümle>
Olasılık: <değer>
Maruziyet: <değer>
Şiddet: <değer>
Önlem: <2-3 madde, somut kontrol tedbirleri>

Ölçek değerleri yalnızca şu listelerden biri olabilir:
- Olasılık: 0.1, 0.2, 0.5, 1, 3, 6, 10
- Maruziyet: 0.5, 1, 2, 3, 6, 10
- Şiddet: 1, 3, 7, 15, 40, 100

Kurallar:
- Tekrar sayısı (son 30 günde kaç kez tespit edildiği) yüksekse Maruziyet değerini buna göre yükselt — sık tekrar eden bir tehlike, nadiren görülenden daha yüksek maruziyet demektir.
- Türkçe, kısa, gereksiz giriş/kapanış cümlesi kurma, direkt "Risk:" ile başla.
- Emin olmadığın mevzuat detayını uydurma, genel iyi uygulama prensiplerine dayan.
- Bu yalnızca bir TASLAKTIR, bir İSG uzmanı tarafından gözden geçirilip onaylanacak — bunu göz önünde bulundurarak makul, savunulabilir bir tahmin yap.`;

/**
 * DETECTION_TO_RISK_PROMPT'un cevabını ayrıştırır. `parseResidualSuggestion` ile aynı
 * savunmacı yaklaşım: eksik/format dışı alanlar null/boş döner, arayüz çökmez.
 * @param {string} aiResponseText
 * @returns {{ risk: string|null, probability: number|null, frequency: number|null, severity: number|null, action: string|null }}
 */
export function parseDetectionRiskDraft(aiResponseText) {
  const empty = { risk: null, probability: null, frequency: null, severity: null, action: null };
  if (!aiResponseText) return empty;

  const riskMatch = aiResponseText.match(/Risk:\s*(.+)/i);
  const probMatch = aiResponseText.match(/Olasılık:\s*([\d.]+)/i);
  const freqMatch = aiResponseText.match(/Maruziyet:\s*([\d.]+)/i);
  const sevMatch = aiResponseText.match(/Şiddet:\s*([\d.]+)/i);
  const actionMatch = aiResponseText.match(/Önlem:\s*([\s\S]+)/i);

  return {
    risk: riskMatch ? riskMatch[1].trim() : null,
    probability: probMatch ? Number(probMatch[1]) : null,
    frequency: freqMatch ? Number(freqMatch[1]) : null,
    severity: sevMatch ? Number(sevMatch[1]) : null,
    action: actionMatch ? actionMatch[1].trim() : null,
  };
}

// AI_ROADMAP.md → "Doküman içeriği üretimi" maddesinin karşılığı. Ana SYSTEM_PROMPT'tan
// bağımsız. `DocumentGenerator.jsx`'te yeni belge oluşturulurken çağrılır; üretilen metin
// HER ZAMAN "taslak" statüsünde kaydedilir ve kullanıcı `DocumentDetailDrawer.jsx`'te
// düzenleyip "Tamamlandı" olarak işaretlemeden önce gözden geçirmesi beklenir — AI hiçbir
// belgeyi doğrudan "tamamlandı" yapmaz.
export const DOCUMENT_DRAFT_PROMPT = `Sen bir İSG uzmanısın. Sana bir belge türü ve başlık verilecek; bu belge için düzenlenmeye hazır bir İLK TASLAK yaz.

Kurallar:
- Türkçe yaz, başlığı tekrar etme, doğrudan içerikle başla.
- Belgeyi mantıklı bölümlere ayır (kısa başlıklar + madde işaretleri kullanabilirsin).
- Genel iyi uygulama prensiplerine dayan; işyerine özel bilgi (adres, çalışan sayısı, spesifik ekipman markası vb.) uydurma — bunlar yerine "[İşyeri adı]", "[Departman]" gibi doldurulacak alanlar bırak.
- Emin olmadığın spesifik mevzuat madde numarası/tarih uydurma; genel çerçeveden bahset ve resmi kaynaktan teyit önerisiyle belirt.
- Bu YALNIZCA bir taslaktır, bir İSG uzmanı tarafından gözden geçirilip tamamlanacak — bunu göz önünde bulundur, makul uzunlukta (ne çok kısa ne gereksiz uzun) ve düzenlenebilir bir taslak yaz.
- Yalnızca belge içeriğini yaz, giriş/kapanış açıklaması ekleme (örn. "İşte taslağınız:" gibi bir cümleyle başlama).`;

// AI_ROADMAP.md → "AI Vision — risk fotoğraflarından otomatik tehlike tespiti" maddesinin
// karşılığı (kamera KURULUMU değil — kullanıcının kendi telefonuyla çektiği/yüklediği bir
// fotoğrafın analizi; bkz. riskDetection/usePhotoDetection.js). Kategori listesi
// constants/riskDetection.js → RISK_DETECTION_CATEGORIES ile BİREBİR aynı tutulmalı;
// aksi halde parsePhotoDetection eşleştiremez ve kullanıcı elle seçer (arayüz çökmez).
export const PHOTO_DETECTION_PROMPT = `Sen bir İSG uzmanısın. Sana bir saha fotoğrafı verilecek. Fotoğrafta aşağıdaki kategorilerden hangisine giren bir tehlike olduğunu belirle ve kısa bir not yaz.

Kategoriler (yalnızca bu listeden birini seç, başka bir şey yazma):
- ppe (KKD Eksikliği)
- forkliftProximity (Forklift–İnsan Yakınlığı)
- fallRisk (Düşme / Yüksekte Çalışma Riski)
- confinedSpace (Kapalı Alan Girişi)
- fireSmoke (Yangın / Duman Tespiti)
- improperStacking (Uygunsuz İstifleme / Depolama)

Tam olarak şu formatta, başka hiçbir şey eklemeden yaz:

Kategori: <yukarıdaki listeden bir değer, örn. ppe>
Not: <1-2 cümle, fotoğrafta ne gördüğün>

Kurallar:
- Fotoğrafta yukarıdaki 6 kategoriden hiçbirine net biçimde uymayan bir durum varsa "Kategori: belirsiz" yaz, uydurma bir kategori seçme.
- Sadece fotoğrafta GERÇEKTEN GÖRDÜĞÜNÜ yaz; kişi/yer/firma hakkında spekülasyon yapma.
- Bu bir triage (ön tespit) kaydı oluşturacak, bir İSG uzmanı bunu inceleyip onaylayacak/reddedecek — kesin hüküm verme, gözlemini bildir.
- Türkçe yaz.`;

/**
 * PHOTO_DETECTION_PROMPT'un cevabını ayrıştırır. Diğer parser'larla aynı savunmacı
 * yaklaşım: kategori tanınmıyorsa veya format dışıysa null döner, kullanıcı elle seçer.
 * @param {string} aiResponseText
 * @param {string[]} validCategories - constants/riskDetection.js → RISK_DETECTION_CATEGORIES değerleri
 * @returns {{ category: string|null, note: string|null }}
 */
export function parsePhotoDetection(aiResponseText, validCategories) {
  const empty = { category: null, note: null };
  if (!aiResponseText) return empty;

  const categoryMatch = aiResponseText.match(/Kategori:\s*(\S+)/i);
  const noteMatch = aiResponseText.match(/Not:\s*(.+)/i);
  const rawCategory = categoryMatch ? categoryMatch[1].trim() : null;

  return {
    category: rawCategory && validCategories.includes(rawCategory) ? rawCategory : null,
    note: noteMatch ? noteMatch[1].trim() : null,
  };
}
