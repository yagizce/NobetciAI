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

// "Denetim Öncesi Tamamlanması Gerekenler" alanı için sabit, 3 değerli aksiyon
// kelime dağarcığı (bkz. istek → satır formatı "İncele / Düzenle / Yönet"). Yeni
// bir öncelik/aksiyon TÜRÜ İCAT EDİLMEZ — yalnızca bu 3 kelime kullanılır.
const ACTION_LABEL = { review: "İncele", edit: "Düzenle", manage: "Yönet" };

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
  // 6 kategoriyi SABİT sırayla (istek → madde 4) tek bir aksiyon-odaklı listeye
  // düzleştirir — YENİ bir hesaplama/veri değil, yukarıdaki listelerin aynı
  // kayıtlarının aksiyon fiiliyle yeniden etiketlenmiş hâli. Bir kriter birden
  // fazla kategoriye giriyorsa (ör. hem Uygunsuzluk hem Eksik Kanıt), BURADA da
  // ayrı ayrı iki satır olarak görünür — bu bilinçlidir, ikisi farklı iştir.
  const preAuditActions = [
    ...nonconformities.map((r) => ({ kind: "criterion", actionLabel: ACTION_LABEL.review, sectionLabel: "Uygunsuzluk", ...r })),
    ...partiallyCompliant.map((r) => ({ kind: "criterion", actionLabel: ACTION_LABEL.edit, sectionLabel: "Kısmen Uygun", ...r })),
    ...missingEvidence.map((r) => ({ kind: "criterion", actionLabel: ACTION_LABEL.edit, sectionLabel: "Eksik Kanıt", ...r })),
    ...unevaluated.map((r) => ({ kind: "criterion", actionLabel: ACTION_LABEL.edit, sectionLabel: "Değerlendirilmemiş", ...r })),
    ...actions.map((f) => ({
      kind: "dif", actionLabel: ACTION_LABEL.manage, sectionLabel: f.overdue ? "Gecikmiş DİF" : "Açık DİF",
      id: f.id, auditId: f.auditId, criterionTitle: f.criterionTitle, statusLabel: f.stageLabel, overdue: f.overdue,
    })),
    ...unverifiedLegislation.map((r) => ({ kind: "criterion", actionLabel: ACTION_LABEL.review, sectionLabel: "Mevzuat Doğrulaması", ...r })),
  ];

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
    isFullyReady,
  };
}
