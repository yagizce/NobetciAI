// Denetim Modülü — Denetim Raporu veri üretici. TEK merkezi, SAF (I/O yapmayan)
// fonksiyon — AuditReportView.jsx (UI) burada HİÇBİR sayım/skor hesaplamaz, yalnızca
// bu dosyanın döndürdüğü hazır veriyi gösterir (auditPreparedness.js'teki AYNI desen).
//
// UYDURMA VERİ YASAĞI (DEVELOPMENT_RULES.md → General Rules): bu dosya YALNIZCA
// kendisine geçirilen gerçek audit/findings/company verisinden okuma yapar. Hiçbir
// alan tahmin/enterpolasyon ile doldurulmaz:
//   - Mevzuat adı/madde numarası checklist maddesinden AYNEN kopyalanır, asla üretilmez
//     (bkz. constants/mevzuatChecklist.js dosya başı notu — `verified:false` ise
//     `article` zaten `null`, burada da null olarak KALIR).
//   - "Kanıt Yok" sonucu KESİNLİKLE "Uygun Değil" olarak yorumlanmaz — ikisi checklist
//     `result` alanında zaten ayrı değerlerdir (bkz. constants/auditScoring.js), bu
//     dosya onları OLDUĞU GİBİ ayrı ayrı sayar/listeler.
//   - Kapatılmış (`stage === "closed"`) bir DİF hiçbir bölümde "açık" olarak gösterilmez.
//   - "Denetçi" alanı — çağıran taraf (AuditReportView.jsx) bunu authService.js →
//     getCurrentUser()'dan gelen GERÇEK kullanıcı adından (`auditorName`) doldurur.
//     Bu dosya kendisine verilen değeri OLDUĞU GİBİ aktarır; boşsa "" döner, rol
//     etiketini ("İSG Uzmanı" vb.) ismin yerine KOYMAZ, isim uydurmaz.
//   - Sistemde bir "Uygulanamaz" sonuç değeri YOK (bkz. CHECKLIST_RESULTS — yalnızca
//     Uygun/Kısmen Uygun/Uygun Değil/Kanıt Yok/Değerlendirilmedi). Rapor özeti bu 5
//     GERÇEK durumu sayar, var olmayan bir 6. kategori eklenmez.
//   - checklist maddelerinde/DİF'te GERÇEK bir öncelik/risk seviyesi ALANI YOK.
//     `weight` (bkz. auditScoring.js → CHECKLIST_RESULTS) SADECE skor ortalaması
//     içindir — "Uygun Değil" (weight 0) ile "Kanıt Yok" (weight 0) skor açısından
//     eşit ağırlıklandırılır ama bunlar FARKLI durumlardır, birbirine ya da bir
//     "risk seviyesi"ne eşitlenemez. Bu dosya `weight`'ten öncelik/risk TÜRETMEZ —
//     rapor yalnızca gerçek `result` değerini gösterir, uydurma bir öncelik alanı
//     eklemez.
//
// SKORLAMA İLE İLİŞKİ: computeOverallScore/computeProgressPercent/computeCategoryScores
// DIŞARIDAN (config'ten) gelir — bu dosya kendi skor formülünü ÜRETMEZ, mevcut
// constants/auditScoring.js motorunu olduğu gibi çağırır ve HİÇ değiştirmez. Hazırlık
// skoru da aynı şekilde dışarıdan (auditPreparedness.js'in sonucu) parametre olarak alınır.

import { isDifOverdue, getDifStageMeta } from "../constants/auditWorkflow.js";
import { computeEvidenceStatus, getEvidenceTypeLabel } from "./criterionEvidence.js";
import { getDangerClassLabel } from "../constants/company.js";
import { getSafetyScoreLevel } from "./safetyScore.js";

// Skor formülünde (auditScoring.js) "olumsuz" sayılan sonuçlar — Tespitler ve
// Mevzuat bölümlerinde hangi kriterlerin "bulgu" sayılacağını belirler. Bilinçli
// olarak "uygun" ve "degerlendirilmedi" HARİÇ TUTULUR: biri zaten sorunsuz, diğeri
// henüz değerlendirilmemiş (bulgu değil, eksik veri).
const NONCONFORMITY_RESULTS = ["uygun_degil", "kismen_uygun", "kanit_yok"];

/**
 * Denetime ait TÜM DİF'leri (bu auditId'ye bağlı) döner — kapanmış olanlar dahil,
 * hiçbiri filtrelenmez (kapalı/açık ayrımı çağıran tarafta yapılır).
 * @param {object[]} findings
 * @param {string|number} auditId
 */
function findingsForAudit(findings, auditId) {
  return (findings || []).filter((f) => String(f.auditId) === String(auditId));
}

/**
 * Bir denetim için TAM rapor veri modelini üretir — 9 bölümün (Kapak, Yönetici
 * Özeti, Denetim Sonuçları, Tespitler, Kanıtlar, Düzeltici Faaliyetler, Öncelikli
 * Aksiyonlar, Mevzuat Bulguları, Sonuç) ihtiyaç duyduğu her şey burada, tek yerde
 * hazırlanır — AuditReportView.jsx yalnızca bu objeyi render eder.
 *
 * @param {{
 *   audit: import("../types/index.js").Audit,
 *   findings?: import("../types/index.js").AuditFinding[],
 *   company?: import("../types/index.js").Company|null,
 *   standardLabel: string,
 *   checklistResults: Array<{ value: string, label: string, tone: string, weight: number|null }>,
 *   getResultMeta: (value: string) => object,
 *   computeOverallScore: (checklist: object[]) => number|null,
 *   computeProgressPercent: (checklist: object[]) => number,
 *   computeCategoryScores: (checklist: object[]) => Array<object>,
 *   getCategoryTitle?: (code: string) => string,
 *   auditorName?: string,
 *   preparednessScore?: number|null,
 * }} input
 * @returns {object|null} audit yoksa null
 */
export function buildAuditReportData({
  audit, findings = [], company = null, standardLabel,
  checklistResults, getResultMeta, computeOverallScore, computeProgressPercent, computeCategoryScores, getCategoryTitle,
  auditorName = "", preparednessScore = null,
}) {
  if (!audit) return null;

  const checklist = audit.checklist || [];
  const auditFindings = findingsForAudit(findings, audit.id);

  // ── Bölüm 1: Kapak ──────────────────────────────────────────────────────
  const cover = {
    companyName: company?.name || "",
    sector: company?.sector || "",
    dangerClassLabel: getDangerClassLabel(company?.dangerClass || null) || "",
    auditName: audit.scopeDescription || "",
    plannedDate: audit.plannedDate || "",
    completedAt: audit.completedAt || null,
    auditorLabel: auditorName || "",
    standardLabel: standardLabel || "",
  };

  // ── Bölüm 2: Yönetici Özeti ─────────────────────────────────────────────
  // Yalnızca GERÇEKTEN var olan 5 sonuç kategorisi sayılır (bkz. dosya başı notu
  // — "Uygulanamaz" sistemde tanımlı değil, uydurulmaz).
  const resultCounts = {};
  checklistResults.forEach((r) => { resultCounts[r.value] = 0; });
  checklist.forEach((item) => {
    if (item.result in resultCounts) resultCounts[item.result] += 1;
  });

  const overallScore = computeOverallScore(checklist);
  const scoreLevel = overallScore !== null ? getSafetyScoreLevel(overallScore) : null;

  const summary = {
    overallScore,
    scoreLevel, // { label, tone } | null — mevcut utils/safetyScore.js eşiklerinden, yeni eşik uydurulmadı
    preparednessScore, // dışarıdan gelir (auditPreparedness.js) — bu dosya hesaplamaz
    progressPercent: computeProgressPercent(checklist),
    totalCriteria: checklist.length,
    resultCounts,
    criticalFindingsCount: checklist.filter((item) => item.result === "uygun_degil").length,
    openDifCount: auditFindings.filter((f) => f.stage !== "closed").length,
    overdueDifCount: auditFindings.filter((f) => isDifOverdue(f)).length,
  };

  // ── Bölüm 3: Denetim Sonuçları (kategori bazlı) ────────────────────────
  // computeCategoryScores dışarıdan gelir — auditScoring.js'teki motoru aynen kullanır.
  const categoryResults = computeCategoryScores(checklist);

  // ── Bölüm 4: Tespitler ve Uygunsuzluklar ───────────────────────────────
  const nonconformities = checklist
    .filter((item) => NONCONFORMITY_RESULTS.includes(item.result))
    .map((item) => {
      const dif = auditFindings.find((f) => f.checklistItemId === item.id);
      return {
        criterionId: item.id,
        criterionTitle: item.title,
        categoryCode: item.categoryCode,
        categoryTitle: getCategoryTitle ? getCategoryTitle(item.categoryCode) : item.categoryCode,
        result: item.result,
        resultLabel: getResultMeta(item.result).label,
        note: item.note || "",
        legislationName: item.legislationName || null,
        article: item.article || null,
        verified: item.verified ?? null,
        evidenceStatus: computeEvidenceStatus(item.evidence, item),
        dif: dif
          ? {
              id: dif.id,
              stage: dif.stage,
              stageLabel: getDifStageMeta(dif.stage).label,
              overdue: isDifOverdue(dif),
              dueDate: dif.dueDate || "",
              responsible: dif.responsible || "",
            }
          : null,
      };
    });

  // ── Bölüm 5: Kanıtlar (kriter bazlı, sonuca bakılmaksızın — kanıt eklenmiş HER madde) ──
  const evidenceByCriterion = checklist
    .filter((item) => (item.evidence || []).length > 0)
    .map((item) => ({
      criterionId: item.id,
      criterionTitle: item.title,
      categoryCode: item.categoryCode,
      categoryTitle: getCategoryTitle ? getCategoryTitle(item.categoryCode) : item.categoryCode,
      resultLabel: getResultMeta(item.result).label,
      evidenceStatus: computeEvidenceStatus(item.evidence, item),
      entries: (item.evidence || []).map((e) => ({
        id: e.id,
        typeLabel: getEvidenceTypeLabel(e.type),
        description: e.description || "",
        createdAt: e.createdAt || "",
      })),
    }));

  // ── Bölüm 6: Düzeltici Faaliyetler (bu denetime bağlı TÜM DİF'ler) ─────
  const correctiveActions = auditFindings.map((f) => ({
    id: f.id,
    criterionTitle: f.criterionTitle || f.description,
    description: f.description || "",
    stage: f.stage,
    stageLabel: getDifStageMeta(f.stage).label,
    overdue: isDifOverdue(f),
    responsible: f.responsible || "",
    dueDate: f.dueDate || "",
    openedAt: f.openedAt || "",
    closedAt: f.closedAt || null,
  }));
  const correctiveActionsByStage = {
    open: correctiveActions.filter((f) => f.stage === "open"),
    awaitingAction: correctiveActions.filter((f) => f.stage === "awaitingAction"),
    pendingReview: correctiveActions.filter((f) => f.stage === "pendingReview"),
    closed: correctiveActions.filter((f) => f.stage === "closed"),
  };
  const overdueActions = correctiveActions.filter((f) => f.overdue);

  // ── Bölüm 7: Öncelikli Aksiyonlar — kapanmamış, gecikmiş önce sıralı ───
  const priorityActions = correctiveActions
    .filter((f) => f.stage !== "closed")
    .slice()
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return (a.dueDate || "").localeCompare(b.dueDate || "");
    });

  // ── Bölüm 8: Mevzuat Bulguları — mevzuat dayanağı OLAN tüm kriterler ───
  // ISO 45001 kriterlerinde legislationName hiç yok — bu bölüm o standartta
  // doğal olarak boş döner (uydurma yapılmaz, boş liste gösterilir).
  const legislationFindings = checklist
    .filter((item) => item.legislationName)
    .map((item) => ({
      criterionId: item.id,
      criterionTitle: item.title,
      legislationName: item.legislationName,
      article: item.article || null,
      verified: item.verified ?? null,
      result: item.result,
      resultLabel: getResultMeta(item.result).label,
    }));

  return {
    cover,
    summary,
    categoryResults,
    nonconformities,
    evidenceByCriterion,
    correctiveActions,
    correctiveActionsByStage,
    overdueActions,
    priorityActions,
    legislationFindings,
    generatedAt: new Date().toISOString(),
  };
}
