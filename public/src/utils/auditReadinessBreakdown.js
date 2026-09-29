// Denetim Modülü — Denetime Hazırlık ekranının "eksikler" listesi. TEK merkezi,
// SAF (I/O yapmayan) fonksiyon — UI burada hiçbir filtreleme/sınıflandırma mantığını
// tekrar üretmez, yalnızca bu dosyanın döndürdüğü hazır listeleri gösterir (auditReport.js
// ve auditPreparedness.js'teki AYNI desen).
//
// TAM OLARAK 6 KATEGORİ (bkz. AuditReadinessPanel.jsx'teki sabit gösterim sırası):
//   1. Uygunsuzluklar          → result === "uygun_degil"
//   2. Kısmen Uygunlar         → result === "kismen_uygun"
//   3. Eksik Kanıtlar          → computeEvidenceStatus() !== "present" (Kanıt Yok + Eksik Kanıt BİRLEŞİK)
//   4. Değerlendirilmemişler   → result === "degerlendirilmedi"
//   5. Aksiyonlar              → açık (kapalı olmayan) TÜM DİF'ler — Açık ve Gecikmiş
//      AYRI birer kategori DEĞİLDİR, aynı `actions` listesinin içinde `overdue` bayrağıyla
//      ayrıştırılır (gecikmiş olanlar listede önce gelir, bkz. aşağıdaki sort).
//   6. Mevzuat Doğrulaması     → verified === false
//
// BU DOSYA YENİ BİR SKOR/ÖNCELİK/RİSK SİSTEMİ İCAT ETMEZ. Yalnızca mevcut, zaten
// var olan alanları (checklist[].result, checklist[].evidence + computeEvidenceStatus,
// checklist[].verified, findings[].stage + isDifOverdue) 6 kategoriye göre FİLTRELER/
// GRUPLAR. auditPreparedness.js'in skor hesaplaması BURADA TEKRAR ÜRETİLMEZ/
// DEĞİŞTİRİLMEZ — bu dosya yalnızca "hangi kayıtlar" sorusuna cevap verir, "kaç puan"
// sorusuna değil.
//
// "Denetim Öncesi Tamamlanması Gerekenler": aynı kritere ait TÜM sorunlar (Uygun
// Değil + Kanıt Eksik + Açık DİF gibi) AYRI satırlar değil, rozetli TEK satır ve
// TEK ana aksiyon olarak birleştirilir — bkz. ISSUE_PRIORITY sabit öncelik sırası.
//
// UYDURMA VERİ YASAĞI: Her liste yalnızca kendisine geçirilen gerçek audit/findings
// verisinden okunur. Boş bir kategori boş dizi döner — UI bunu "bölüm gizli" veya
// "X bulunmuyor" olarak yorumlar (bkz. AuditReadinessPanel.jsx), burada hiçbir sahte
// kayıt üretilmez.
//
// AYRIM KURALLARI:
//   - "Kısmen Uygun" ve "Uygun Değil" ayrı listelerdir, birleştirilmez.
//   - "Eksik Kanıtlar" (computeEvidenceStatus → "none" veya "incomplete") KESİNLİKLE
//     "Uygun Değil"e dönüştürülmez/eşitlenmez — yalnızca kanıt durumu okunur, `result`
//     alanına HİÇ dokunulmaz. Bir "Uygun Değil" veya "Uygun" kriterin de kanıtsız
//     olabileceği (dolayısıyla hem kendi kategorisinde hem Eksik Kanıtlar'da görünmesi)
//     BİLİNÇLİ bir kesişimdir, hata değildir.
//   - Bir DİF'in KENDİ üzerindeki kanıtı (dif.evidence, "aksiyon kanıtı" — bkz.
//     addDifEvidence/DifDetailDrawer.jsx) kriter kanıtı (checklist[].evidence,
//     computeEvidenceStatus) SAYILMAZ — Eksik Kanıtlar kategorisi YALNIZCA checklist
//     kanıtını okur, DİF'in kendi kanıt dizisine HİÇ bakmaz.
//   - Kapalı (`stage === "closed"`) DİF'ler Aksiyonlar'a hiç dahil edilmez.
//   - "Mevzuat doğrulaması gerekli" yalnızca `verified === false` (kesin false) olan
//     maddelerdir — ISO 45001 maddelerinde bu alan hiç yok (`undefined`), bu yüzden
//     bu liste ISO 45001'de her zaman doğal olarak boş kalır.
//
// KAPSAM: Bu modül standarttan bağımsız (saf/genel) yazılmıştır, ama panelin kendisi
// (AuditReadinessPanel.jsx) YALNIZCA İSG Mevzuat Denetimi'nde render edilecek şekilde
// AuditPage.jsx'ten bağlanır — ISO 45001 sekmesi bu paneli hiç çağırmaz (bkz.
// AuditPage.jsx → `config.standard === "mevzuat" &&`).

import { getDifStageMeta, isDifOverdue } from "../constants/auditWorkflow.js";
import { computeEvidenceStatus } from "./criterionEvidence.js";
import { getResultMeta } from "../constants/auditScoring.js";

// "Denetim Öncesi Tamamlanması Gerekenler" — bir kriterin sahip olabileceği TÜM
// sorun türleri, SABİT öncelik sırasıyla. Bu sıra hem (a) bir kriterde birden çok
// sorun varken TEK ana aksiyonun hangisi olacağını, hem de (b) tüm listenin genel
// sıralamasını belirler — YENİ bir risk/öncelik PUANI değildir, yalnızca kullanıcının
// "önce hangisine bakmalıyım" sorusuna cevap veren sabit bir sıra listesidir.
//
// ÖNCELİK SIRASI (istek üzerine):
//   1. Değerlendirilmedi  → Değerlendir   (henüz hiç karar verilmemiş kriter her şeyden önce gelir)
//   2. Uygun Değil        → İncele
//   3. Gecikmiş DİF       → DİF'i Yönet
//   4. Açık DİF           → DİF'i Yönet
//   5. Kısmen Uygun       → İncele
//   6. Eksik Kanıt        → Kanıt Ekle
//   7. Mevzuat Doğrulaması → Doğrulamayı İncele
const ISSUE_PRIORITY = [
  { key: "unevaluated", badge: "Değerlendirilmedi", actionLabel: "Değerlendir", actionKind: "criterion" },
  { key: "uygun_degil", badge: "Uygun Değil", actionLabel: "İncele", actionKind: "criterion" },
  { key: "difOverdue", badge: "DİF Gecikmiş", actionLabel: "DİF'i Yönet", actionKind: "dif" },
  { key: "difOpen", badge: "DİF Açık", actionLabel: "DİF'i Yönet", actionKind: "dif" },
  { key: "kismen_uygun", badge: "Kısmen Uygun", actionLabel: "İncele", actionKind: "criterion" },
  { key: "missingEvidence", badge: "Kanıt Eksik", actionLabel: "Kanıt Ekle", actionKind: "criterion" },
  { key: "unverified", badge: "Mevzuat Doğrulaması", actionLabel: "Doğrulamayı İncele", actionKind: "criterion" },
];

/**
 * TEK merkezi ana aksiyon seçim fonksiyonu — bir kriterin sahip olduğu sorun
 * anahtarlarından (issueKeys, ör. ["uygun_degil","missingEvidence","difOpen"])
 * TEK bir ana aksiyonu belirler: ISSUE_PRIORITY'de en üstte (en yüksek öncelikli)
 * olan sorun kazanır. TÜM eşleşen sorunlar `badges` içinde KORUNUR — ana aksiyon
 * değişse bile diğer sorunlar rozet olarak kaybolmaz. Testler bu fonksiyonu
 * DOĞRUDAN çağırıp davranışı doğrular (bkz. auditReadinessBreakdown.test.js).
 *
 * @param {string[]} issueKeys - ISSUE_PRIORITY'deki `key` değerlerinden biri veya birkaçı
 * @returns {{ badges: string[], actionLabel: string, actionKind: "criterion"|"dif", priorityIndex: number }|null}
 *   issueKeys boşsa (hiçbir sorun yoksa) null döner.
 */
export function pickPrimaryAction(issueKeys) {
  const matched = ISSUE_PRIORITY.filter((p) => issueKeys.includes(p.key));
  if (matched.length === 0) return null;
  const top = matched[0]; // ISSUE_PRIORITY zaten öncelik sırasında tanımlı
  return {
    badges: matched.map((p) => p.badge),
    actionLabel: top.actionLabel,
    actionKind: top.actionKind,
    priorityIndex: ISSUE_PRIORITY.indexOf(top),
  };
}

/**
 * @param {object} audit
 * @returns {string} "Kapsam — Tarih" biçiminde, birden çok denetim varken hangi
 *   denetime ait olduğunu ayırt etmek için satırlarda gösterilir.
 */
function auditLabel(audit) {
  return audit.plannedDate ? `${audit.scopeDescription} — ${audit.plannedDate}` : audit.scopeDescription;
}

/**
 * @param {object[]} audits
 * @param {(code: string) => string} [getCategoryTitle]
 * @param {(item: object) => boolean} matches - checklist maddesi filtre koşulu
 * @param {(item: object) => string} statusLabel - "mevcut durum" metni (satır alt başlığı için)
 * @returns {Array<object>}
 */
function collectCriteria(audits, getCategoryTitle, matches, statusLabel) {
  const rows = [];
  (audits || []).forEach((audit) => {
    (audit.checklist || []).forEach((item) => {
      if (!matches(item)) return;
      rows.push({
        auditId: audit.id,
        auditLabel: auditLabel(audit),
        criterionId: item.id,
        criterionTitle: item.title,
        categoryCode: item.categoryCode || null,
        categoryTitle: getCategoryTitle ? getCategoryTitle(item.categoryCode) : item.categoryCode,
        resultLabel: getResultMeta(item.result)?.label || item.result,
        statusLabel: statusLabel(item),
        legislationName: item.legislationName || null,
        article: item.article || null,
      });
    });
  });
  // En güncel denetim önce — yeni bir öncelik sistemi değil, yalnızca doğal (tarih) sıralama.
  return rows.sort((a, b) => (b.auditLabel || "").localeCompare(a.auditLabel || ""));
}

/**
 * Denetime Hazırlık ekranının TAM OLARAK 6 kategorisini + "Denetim Öncesi
 * Tamamlanması Gerekenler" aksiyon listesini + genel durumu üretir.
 *
 * @param {{ audits?: object[], findings?: object[], getCategoryTitle?: (code: string) => string }} args
 * @returns {{
 *   hasAnyAudits: boolean,
 *   hasAnyEvaluatedCriteria: boolean,
 *   nonconformities: object[],
 *   partiallyCompliant: object[],
 *   missingEvidence: object[],
 *   unevaluated: object[],
 *   actions: object[],
 *   unverifiedLegislation: object[],
 *   preAuditActions: object[],
 *   preAuditSummary: { criterionCount: number, issueCount: number },
 *   isFullyReady: boolean,
 * }}
 */
export function buildAuditReadinessBreakdown({ audits = [], findings = [], getCategoryTitle } = {}) {
  const hasAnyAudits = (audits || []).length > 0;

  const hasAnyEvaluatedCriteria = (audits || []).some((audit) =>
    (audit.checklist || []).some((item) => item.result !== "degerlendirilmedi")
  );

  // 1. Uygunsuzluklar
  const nonconformities = collectCriteria(audits, getCategoryTitle,
    (item) => item.result === "uygun_degil",
    (item) => getResultMeta(item.result)?.label || item.result);

  // 2. Kısmen Uygunlar
  const partiallyCompliant = collectCriteria(audits, getCategoryTitle,
    (item) => item.result === "kismen_uygun",
    (item) => getResultMeta(item.result)?.label || item.result);

  // 3. Eksik Kanıtlar — "Kanıt Yok" (none) VE "Eksik Kanıt" (incomplete) BİRLEŞİK
  // tek kategoridir (istek gereği). Yalnızca checklist[].evidence + computeEvidenceStatus
  // okunur — bir DİF'in kendi aksiyon kanıtına (dif.evidence) HİÇ bakılmaz.
  const missingEvidence = collectCriteria(audits, getCategoryTitle,
    (item) => computeEvidenceStatus(item.evidence, item) !== "present",
    (item) => (computeEvidenceStatus(item.evidence, item) === "none" ? "Kanıt Yok" : "Eksik Kanıt"));

  // 4. Değerlendirilmemişler
  const unevaluated = collectCriteria(audits, getCategoryTitle,
    (item) => item.result === "degerlendirilmedi",
    () => "Değerlendirilmedi");

  // 6. Mevzuat Doğrulaması (verified:false)
  const unverifiedLegislation = collectCriteria(audits, getCategoryTitle,
    (item) => item.verified === false,
    () => "Doğrulanmadı");

  // 5. Aksiyonlar — Açık DİF + Gecikmiş DİF TEK kategori, kapalı DİF'ler hiç dahil
  // edilmez. Gecikmiş olanlar listede ÖNCE gelir (yapay bir risk puanı değil, yalnızca
  // "önce hangisine bakmalıyım" sıralaması).
  const nonClosed = (findings || []).filter((f) => f.stage !== "closed");
  function toActionRow(f) {
    const stageMeta = getDifStageMeta(f.stage);
    return {
      id: f.id,
      auditId: f.auditId,
      checklistItemId: f.checklistItemId,
      criterionTitle: f.criterionTitle || f.description || "İsimsiz bulgu",
      stage: f.stage,
      stageLabel: stageMeta.label,
      overdue: isDifOverdue(f),
      dueDate: f.dueDate || "",
      responsible: f.responsible || "",
    };
  }
  const actions = nonClosed
    .map(toActionRow)
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return (a.dueDate || "").localeCompare(b.dueDate || "");
    });

  const isFullyReady =
    hasAnyAudits &&
    hasAnyEvaluatedCriteria &&
    nonconformities.length === 0 &&
    partiallyCompliant.length === 0 &&
    missingEvidence.length === 0 &&
    unevaluated.length === 0 &&
    actions.length === 0 &&
    unverifiedLegislation.length === 0;

  // ── Denetim Öncesi Tamamlanması Gerekenler ─────────────────────────────
  // Aynı kriterin BÜTÜN sorunları (bkz. ISSUE_PRIORITY) TEK satırda birleştirilir —
  // "Uygun Değil + Kanıt Eksik + Açık DİF" 3 ayrı satır DEĞİL, 3 rozetli TEK satır
  // olur. Ana aksiyon, o kriterin sahip olduğu sorunlardan ÖNCELİK SIRASINDA EN
  // ÜSTTEKİ ile belirlenir (istek → madde 2/4) — yeni bir hesaplama/veri YOKTUR,
  // yalnızca yukarıdaki 6 kategorinin AYNI kayıtlarının kritere göre gruplanmış hâli.
  const criterionRows = new Map(); // key: `${auditId}::${criterionId}`
  (audits || []).forEach((audit) => {
    (audit.checklist || []).forEach((item) => {
      const issueKeys = [];
      if (item.result === "uygun_degil") issueKeys.push("uygun_degil");
      if (item.result === "kismen_uygun") issueKeys.push("kismen_uygun");
      if (computeEvidenceStatus(item.evidence, item) !== "present") issueKeys.push("missingEvidence");
      if (item.result === "degerlendirilmedi") issueKeys.push("unevaluated");
      if (item.verified === false) issueKeys.push("unverified");

      // Kriterin kendi DİF'i (varsa) — kapalı DİF'ler zaten `actions`'ta yok,
      // bu yüzden burada da otomatik olarak hariç kalır.
      const dif = actions.find((f) => String(f.auditId) === String(audit.id) && f.checklistItemId === item.id);
      if (dif) issueKeys.push(dif.overdue ? "difOverdue" : "difOpen");

      if (issueKeys.length === 0) return; // sorun yoksa satır oluşturulmaz

      const primary = pickPrimaryAction(issueKeys);
      criterionRows.set(`${audit.id}::${item.id}`, {
        kind: "criterion",
        auditId: audit.id,
        auditLabel: auditLabel(audit),
        criterionId: item.id,
        criterionTitle: item.title,
        legislationName: item.legislationName || null,
        article: item.article || null,
        badges: primary.badges,
        actionLabel: primary.actionLabel,
        actionKind: primary.actionKind,
        difId: dif ? dif.id : null,
        overdue: issueKeys.includes("difOverdue"),
        priorityIndex: primary.priorityIndex,
      });
    });
  });

  // Savunma amaçlı: bir DİF'in checklistItemId'si (olağan dışı bir veri durumunda)
  // yukarıdaki taramada hiçbir kritere eşleşmediyse yine de kaybolmasın.
  actions.forEach((f) => {
    const key = `${f.auditId}::${f.checklistItemId}`;
    if (criterionRows.has(key)) return;
    const primary = pickPrimaryAction([f.overdue ? "difOverdue" : "difOpen"]);
    criterionRows.set(`dif::${f.id}`, {
      kind: "dif",
      auditId: f.auditId,
      auditLabel: null,
      criterionId: null,
      criterionTitle: f.criterionTitle,
      legislationName: null,
      article: null,
      badges: primary.badges,
      actionLabel: primary.actionLabel,
      actionKind: primary.actionKind,
      difId: f.id,
      overdue: f.overdue,
      priorityIndex: primary.priorityIndex,
    });
  });

  const preAuditActions = Array.from(criterionRows.values())
    .sort((a, b) => a.priorityIndex - b.priorityIndex || (a.auditLabel || "").localeCompare(b.auditLabel || ""));

  // X kriterde Y konu — kriter sayısı = preAuditActions.length (birleştirildiği için
  // aynı kriter tekrar sayılmaz), konu sayısı = tüm satırlardaki rozetlerin TOPLAMI
  // (aynı kriterde 2 sorun varsa konu sayısına 2 olarak yansır).
  const preAuditSummary = {
    criterionCount: preAuditActions.length,
    issueCount: preAuditActions.reduce((sum, r) => sum + r.badges.length, 0),
  };

  return {
    hasAnyAudits,
    hasAnyEvaluatedCriteria,
    nonconformities,
    partiallyCompliant,
    missingEvidence,
    unevaluated,
    actions,
    unverifiedLegislation,
    preAuditActions,
    preAuditSummary,
    isFullyReady,
  };
}

/**
 * "Şimdi Yapılmalı" bölümü için preAuditActions'ın İLK N kaydını döner. YENİ bir
 * sıralama/skor/öncelik sistemi DEĞİLDİR — preAuditActions zaten pickPrimaryAction()
 * önceliğine göre sıralı gelir (bkz. yukarısı); bu fonksiyon yalnızca görüntüleme
 * sınırı uygular, sırayı asla değiştirmez. Ayrı, saf ve doğrudan test edilebilir
 * tutulmasının nedeni: "en fazla 5 aksiyon gösteriliyor" ve "sıralama korunuyor"
 * davranışlarının, bileşen render'ından bağımsız olarak doğrulanabilmesidir.
 * @param {object[]} preAuditActions
 * @param {number} [limit=5]
 * @returns {object[]}
 */
export function getTopPriorityActions(preAuditActions, limit = 5) {
  return (preAuditActions || []).slice(0, limit);
}
