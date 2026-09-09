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
// skoru hiç etkilemez — skor yalnızca gerçekten var olan eksik firma bilgisine göre
// hesaplanır (bkz. computeAuditPreparedness'in en altındaki döngü).
//
// SKORLAMA SİSTEMİYLE İLİŞKİSİ: bu, checklist "Uygun/Uygun Değil" sonuçlarından
// hesaplanan denetim UYGUNLUK skorundan (bkz. constants/auditScoring.js →
// computeOverallScore) TAMAMEN AYRI bir hesaplamadır — biri "bu denetimin sonucu
// ne kadar uygun", diğeri "bir sonraki denetime ne kadar hazırız" sorusuna cevap
// verir. Birbirini hiç çağırmaz, karıştırılmaz.

import { isDifOverdue } from "../constants/auditWorkflow.js";

const MISSING_FIELD_PENALTY = 5;
const OPEN_ACTION_PENALTY = 8;
const OPEN_ACTION_PENALTY_CAP = 40;
const OVERDUE_ACTION_PENALTY = 12;
const OVERDUE_ACTION_PENALTY_CAP = 40;
const UNRESOLVED_PENALTY = 6;
const UNRESOLVED_PENALTY_CAP = 20;

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
 *   score: number,
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

  const criticalWarningCount = missingFields.length + unresolvedWithoutDif.length;

  let score = 100;
  score -= missingFields.length * MISSING_FIELD_PENALTY;
  score -= Math.min(openActions.length * OPEN_ACTION_PENALTY, OPEN_ACTION_PENALTY_CAP);
  score -= Math.min(overdueActions.length * OVERDUE_ACTION_PENALTY, OVERDUE_ACTION_PENALTY_CAP);
  score -= Math.min(unresolvedWithoutDif.length * UNRESOLVED_PENALTY, UNRESOLVED_PENALTY_CAP);
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    missingFields,
    criticalWarningCount,
    openActionCount: openActions.length,
    overdueActionCount: overdueActions.length,
    unresolvedWithoutDif,
    priorityAreas,
  };
}
