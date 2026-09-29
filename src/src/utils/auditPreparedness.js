// Denetim Modülü — Faz 5: Denetime Hazırlık.
// TEK merkezi, SAF (I/O yapmayan) hesaplama fonksiyonu — UI hiçbir yerde kendi
// skor/uyarı mantığını tekrar üretmez, yalnızca bu dosyanın döndürdüğü sayıları
// gösterir (bkz. AuditDetailDrawer.jsx → "Denetime Hazırlık" kartı).
//
// UYDURMA VERİ YASAĞI: bu fonksiyon YALNIZCA kendisine geçirilen gerçek company/
// audits/findings verisinden sayım yapar. Hiçbir alan tahmin/enterpolasyon ile
// doldurulmaz — bir bilgi (ör. dangerClass) yoksa o bilgi yalnızca "eksik" olarak
// işaretlenir, skor formülüne rastgele bir varsayılan değerle DAHİL EDİLMEZ.
// Aynı şekilde denetim/DİF geçmişi hiç yoksa (audits=[], findings=[]) bu sinyaller
// skoru hiç etkilemez.
//
// SKORLAMA SİSTEMİYLE İLİŞKİSİ: bu, checklist "Uygun/Uygun Değil" sonuçlarından
// hesaplanan denetim UYGUNLUK skorundan (bkz. constants/auditScoring.js →
// computeOverallScore) TAMAMEN AYRI bir hesaplamadır — biri "bu denetimin sonucu
// ne kadar uygun", diğeri "bir sonraki denetime ne kadar hazırız" sorusuna cevap
// verir. Birbirini hiç çağırmaz, karıştırılmaz; auditScoring.js'e HİÇ dokunulmaz.
//
// EKSİK VERİ İLE OLUMSUZ SONUÇ AYNI ŞEY DEĞİLDİR — bu dosyanın merkezi kuralı:
//   - "Değerlendirilmedi" (item.result) → ana skora hiç GİRMEZ (paydaya dahil
//     edilmez), ama ayrı bir sayaçla ("unevaluatedCriterionCount") kullanıcıya
//     gösterilir. Bu, "Uygun Değil" (0 puan) ile KARIŞTIRILMAZ.
//   - "Kanıt Yok" (evidence durumu, bkz. criterionEvidence.js → computeEvidenceStatus)
//     asla otomatik "Uygun Değil" sonucuna DÖNÜŞTÜRÜLMEZ — `item.result` bu
//     fonksiyon tarafından ASLA yazılmaz/değiştirilmez, yalnızca OKUNUR.
//   - Hiç değerlendirilmiş kriter yoksa (evaluatedCriterionCount === 0), `score`
//     `null` döner — "%0 hazır" gibi YANILTICI bir sayı ASLA üretilmez; UI bunu
//     "Henüz değerlendirilemedi" olarak göstermelidir.

import { isDifOverdue } from "../constants/auditWorkflow.js";
import { computeEvidenceStatus } from "./criterionEvidence.js";

// Kriter Bazlı Hazırlık Skoru — her DEĞERLENDİRİLMİŞ kriter için 3 bağımsız
// bileşenin (Sonuç / Kanıt / DİF) EŞİT AĞIRLIKLI ortalaması. Üçü de 0-100
// arası, tek bir kritere ait üç FARKLI sinyal — biri diğerini gizlemez veya
// yerine geçmez (ör. "Uygun" + kanıtsız kriter, kanıt bileşeninde 0 alır ama
// SONUÇ "Uygun" olarak kalır, otomatik değişmez).

// SONUÇ bileşeni — yalnızca checklist'in kendi 5 gerçek `result` değerinden.
// "kanit_yok" burada "uygun_degil" ile AYNI SAYISAL katkıya (0) sahiptir — bu,
// auditScoring.js'in KENDİ ağırlık tablosundaki (weight:0 hem "uygun_degil" hem
// "kanit_yok" için) ZATEN VAR OLAN eşdeğerliğin buraya yansımasıdır. Bu SAYISAL
// bir eşdeğerliktir — "Kanıt Yok" sonucu bu yüzden hiçbir yerde "Uygun Değil"
// olarak YENİDEN ETİKETLENMEZ/DÖNÜŞTÜRÜLMEZ, `item.result` alanı ne ise o kalır.
// "degerlendirilmedi" bilerek burada YOK — o zaten ayrı ele alınır (paydaya hiç
// girmez, bkz. aşağıdaki computeAuditPreparedness döngüsü).
const RESULT_COMPONENT = { uygun: 100, kismen_uygun: 50, uygun_degil: 0, kanit_yok: 0 };

// KANIT bileşeni — computeEvidenceStatus'ün ("present"/"incomplete"/"none")
// BİREBİR karşılığı; bu dosya kendi kanıt mantığını YENİDEN ÜRETMEZ, mevcut
// criterionEvidence.js'i olduğu gibi çağırır.
const EVIDENCE_COMPONENT = { present: 100, incomplete: 50, none: 0 };

// DİF bileşeni — mevcut auditWorkflow.js → DIF_STAGES değerlerinin (open/
// awaitingAction/pendingReview/closed) birebir karşılığı. Kriterde DİF YOKSA
// bileşen 100 kabul edilir (aşağıda ayrıca ele alınır). Gecikme (isDifOverdue)
// BİLEREK burada YOK — DİF durumu zaten skoru belirler, gecikmişlik AYRICA
// (overdueActionCount üzerinden) gösterilir ama puanı İKİNCİ KEZ düşürmez.
const DIF_STAGE_COMPONENT = { open: 0, awaitingAction: 25, pendingReview: 75, closed: 100 };

/**
 * Tek bir DEĞERLENDİRİLMİŞ checklist maddesinin 3 bileşenli hazırlık puanını
 * (0-100) hesaplar. SAF fonksiyon — yalnızca okur, hiçbir alanı değiştirmez.
 * @param {{ result: string, evidence?: object[] }} item
 * @param {{ stage: string }|null|undefined} dif - bu kritere bağlı DİF (varsa)
 * @returns {number}
 */
export function computeCriterionReadinessScore(item, dif) {
  const resultComponent = RESULT_COMPONENT[item.result] ?? 0;
  const evidenceComponent = EVIDENCE_COMPONENT[computeEvidenceStatus(item.evidence, item)];
  const difComponent = dif ? (DIF_STAGE_COMPONENT[dif.stage] ?? 0) : 100;
  return (resultComponent + evidenceComponent + difComponent) / 3;
}

/**
 * @param {import("../types/index.js").Company|null} company
 * @returns {string[]} eksik kritik firma bilgisi alan etiketleri
 */
function getMissingCompanyFields(company) {
  const missing = [];
  if (!company?.sector) missing.push("Sektör");
  if (!company?.employeeCount) missing.push("Çalışan sayısı");
  if (!company?.dangerClass) missing.push("Tehlike sınıfı");
  return missing;
}

/**
 * Denetime Hazırlık skorunu ve destekleyici sayıları hesaplar.
 *
 * @param {object} args
 * @param {import("../types/index.js").Company|null} args.company
 * @param {import("../types/index.js").Audit[]} [args.audits] - AYNI standardın TÜM denetimleri (geçmiş + güncel)
 * @param {import("../types/index.js").AuditFinding[]} [args.findings] - AYNI standardın TÜM DİF'leri
 * @returns {{
 *   score: number|null,
 *   scoreAvailable: boolean,
 *   evaluatedCriterionCount: number,
 *   totalCriterionCount: number,
 *   unevaluatedCriterionCount: number,
 *   missingFields: string[],
 *   criticalWarningCount: number,
 *   openActionCount: number,
 *   overdueActionCount: number,
 *   unresolvedWithoutDif: Array<{ auditId: string|number, checklistItemId: string, title: string, categoryCode: string|null }>,
 *   priorityAreas: Array<{ categoryCode: string, openCount: number, unresolvedCount: number, recurringCount: number, total: number, exampleFindingId: string|number|null }>,
 * }}
 */
export function computeAuditPreparedness({ company, audits = [], findings = [] }) {
  const missingFields = getMissingCompanyFields(company);

  // Checklist maddesi id'sinden (kategori kodu + başlık) tekrar eriş — DİF kaydı
  // kendi başına categoryCode taşımaz (bkz. auditManagementService.js →
  // buildDifFromFinding), bu yüzden kaynağı olan denetimin checklist'inden bakılır.
  const criterionMeta = {};
  (audits || []).forEach((audit) => {
    (audit.checklist || []).forEach((item) => {
      criterionMeta[item.id] = { categoryCode: item.categoryCode || null, title: item.title };
    });
  });

  const openActions = (findings || []).filter((f) => f.stage !== "closed");
  const overdueActions = (findings || []).filter(isDifOverdue);

  // "Uygun Değil" çıkmış ama hiç DİF açılmamış kriterler — Faz 5'in "eksik/uyarılı
  // alanlar" ve "önceki denetimlerdeki açık bulgular" ihtiyacını karşılar: bir
  // önceki denetimde uygunsuz çıkıp hiç takibe alınmamış bir kriter burada yakalanır.
  const unresolvedWithoutDif = [];
  (audits || []).forEach((audit) => {
    (audit.checklist || []).forEach((item) => {
      if (item.result !== "uygun_degil") return;
      const hasDif = (findings || []).some((f) => String(f.auditId) === String(audit.id) && f.checklistItemId === item.id);
      if (!hasDif) {
        unresolvedWithoutDif.push({ auditId: audit.id, checklistItemId: item.id, title: item.title, categoryCode: item.categoryCode || null });
      }
    });
  });

  // Tekrarlayan sorun: aynı kriter id'si (statik checklist kataloğu sayesinde
  // denetimler arasında AYNI anlama gelir) 2+ FARKLI denetimde DİF üretmişse.
  const auditIdsByCriterion = {};
  (findings || []).forEach((f) => {
    (auditIdsByCriterion[f.checklistItemId] ||= new Set()).add(String(f.auditId));
  });
  const recurringCriterionIds = Object.keys(auditIdsByCriterion).filter((id) => auditIdsByCriterion[id].size >= 2);

  // Öncelikli kontrol alanları — kategori bazında toplanır (yalnızca gerçek
  // sinyali olan kategoriler listelenir, sahte/boş kategori uydurulmaz).
  const categoryCounts = {};
  function bump(categoryCode, key, findingId) {
    if (!categoryCode) return;
    const entry = (categoryCounts[categoryCode] ||= { categoryCode, openCount: 0, unresolvedCount: 0, recurringCount: 0, exampleFindingId: null });
    entry[key] += 1;
    if (!entry.exampleFindingId && findingId) entry.exampleFindingId = findingId;
  }
  openActions.forEach((f) => bump(criterionMeta[f.checklistItemId]?.categoryCode, "openCount", f.id));
  unresolvedWithoutDif.forEach((u) => bump(u.categoryCode, "unresolvedCount"));
  recurringCriterionIds.forEach((id) => {
    const findingForCriterion = (findings || []).find((f) => f.checklistItemId === id);
    bump(criterionMeta[id]?.categoryCode, "recurringCount", findingForCriterion?.id);
  });

  const priorityAreas = Object.values(categoryCounts)
    .map((c) => ({ ...c, total: c.openCount + c.unresolvedCount + c.recurringCount }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Kritik uyarı — eksik firma bilgisi + DİF'siz "Uygun Değil" kriter sayısı.
  // BİLEREK yalnızca advisory (uyarı) amaçlıdır; aşağıdaki `score`'a KATILMAZ
  // (eksik firma profili metadata'sı, bir kriterin uygunluk sinyali DEĞİLDİR —
  // "eksik veri ile olumsuz sonuç aynı şey değildir" kuralı burada da geçerli).
  const criticalWarningCount = missingFields.length + unresolvedWithoutDif.length;

  // ── Kriter Bazlı Hazırlık Skoru ─────────────────────────────────────────
  // Yalnızca SONUCU DEĞERLENDİRİLMİŞ kriterler ("degerlendirilmedi" HARİÇ tüm
  // 4 gerçek sonuç: uygun/kismen_uygun/uygun_degil/kanit_yok) paydaya girer.
  let evaluatedCriterionCount = 0;
  let totalCriterionCount = 0;
  let criterionScoreSum = 0;
  (audits || []).forEach((audit) => {
    (audit.checklist || []).forEach((item) => {
      totalCriterionCount += 1;
      if (item.result === "degerlendirilmedi") return; // paydaya hiç girmez
      evaluatedCriterionCount += 1;
      const dif = (findings || []).find((f) => String(f.auditId) === String(audit.id) && f.checklistItemId === item.id);
      criterionScoreSum += computeCriterionReadinessScore(item, dif);
    });
  });
  const unevaluatedCriterionCount = totalCriterionCount - evaluatedCriterionCount;
  const scoreAvailable = evaluatedCriterionCount > 0;
  // Hiç değerlendirilmiş kriter yoksa `score` null — "%0 hazır" gibi yanıltıcı
  // bir sayı ASLA üretilmez, UI "Henüz değerlendirilemedi" göstermelidir.
  const score = scoreAvailable ? Math.round(criterionScoreSum / evaluatedCriterionCount) : null;

  return {
    score,
    scoreAvailable,
    evaluatedCriterionCount,
    totalCriterionCount,
    unevaluatedCriterionCount,
    missingFields,
    criticalWarningCount,
    openActionCount: openActions.length,
    overdueActionCount: overdueActions.length,
    unresolvedWithoutDif,
    priorityAreas,
  };
}

