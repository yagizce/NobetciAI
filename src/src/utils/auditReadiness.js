// auditReadiness — Denetim Öncesi Hazırlık Checklist'i. attentionItems.js'ten FARKLI
// bir amaca hizmet eder: o dashboard'daki "bugün ne yapmalıyım" widget'ı için üste
// sınırlı (slice(0,6)) kısa bir liste döner ve yalnızca entry.correctiveActions[]
// alt-listesini + periyodik kontrolleri kapsar. Burası KAPSAMLI olmak zorunda — bir
// müfettişin sorabileceği her şeyi kaçırmamak öncelik, bu yüzden ayrı bir fonksiyon.
//
// Dört kategori kontrol edilir:
//  1) Zorunlu belge eksikleri (bkz. mandatoryDocumentsCheck.js)
//  2) Termini geçmiş açık Fine-Kinney kayıtları — ÜST SEVİYE dueDate/status. Bilinçli
//     fark: attentionItems.js yalnızca entry.correctiveActions[] alt-listesini kontrol
//     eder, kaydın kendi üst seviye termini hiç kontrol edilmez — bu KAPSAM DIŞI
//     kalan bir boşluktu, burada ayrıca kapatıldı.
//  3) Termini geçmiş periyodik kontroller
//  4) Kanıtsız kapatılmış kayıtlar — closureNote/closurePhotoId'siz status==="done".
//     Düzeltici Faaliyet Kanıt Zorunluluğu özelliğinden ÖNCE kapatılmış eski kayıtlar
//     için beklenen bir durum, göz ardı edilmemesi için ayrıca listeleniyor.

import { todayISO } from "./dateUtils.js";
import { getMandatoryDocumentStatus } from "./mandatoryDocumentsCheck.js";

/**
 * @param {object} args
 * @param {import("../types/index.js").DocumentRecord[]} [args.documents]
 * @param {import("../types/index.js").FineKinneyEntry[]} [args.fineKinneyEntries]
 * @param {import("../types/index.js").PeriodicCheck[]} [args.periodicChecks]
 * @returns {Array<{ id: string, category: "document"|"openRisk"|"periodicCheck"|"unevidencedClosure", label: string, severity: "high"|"medium", searchHint?: string }>}
 */
export function getAuditReadinessChecklist({ documents = [], fineKinneyEntries = [], periodicChecks = [] }) {
  const today = todayISO();
  const items = [];

  getMandatoryDocumentStatus(documents).forEach((d) => {
    if (d.status === "missing") {
      items.push({ id: `doc-${d.type}`, category: "document", label: `${d.label} sistemde yok`, severity: "high" });
    } else if (d.status === "draftOnly") {
      items.push({ id: `doc-${d.type}`, category: "document", label: `${d.label} yalnızca taslak halinde`, severity: "medium" });
    }
  });

  fineKinneyEntries.forEach((e) => {
    if (e.status !== "done" && e.dueDate && e.dueDate < today) {
      items.push({ id: `openRisk-${e.id}`, category: "openRisk", label: `"${e.hazard}" — termini geçti (${e.dueDate})`, severity: "high", searchHint: e.hazard });
    }
    if (e.status === "done" && !e.closureNote?.trim() && !e.closurePhotoId) {
      items.push({ id: `unevidenced-${e.id}`, category: "unevidencedClosure", label: `"${e.hazard}" kanıt eklenmeden kapatılmış`, severity: "medium", searchHint: e.hazard });
    }
  });

  periodicChecks.forEach((c) => {
    if (c.status === "overdue") {
      items.push({ id: `check-${c.id}`, category: "periodicCheck", label: `${c.itemName} — kontrol süresi geçti`, severity: "high" });
    }
  });

  return items.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "high" ? -1 : 1;
  });
}

export const AUDIT_READINESS_CATEGORY_LABELS = {
  document: "Zorunlu Belge",
  openRisk: "Termini Geçmiş Risk",
  periodicCheck: "Termini Geçmiş Kontrol",
  unevidencedClosure: "Kanıtsız Kapatılmış Kayıt",
};

// Her kategori kullanıcıyı ilgili sekmeye/kayda taşır — aynı navigate+state deseni
// GlobalSearchBar.jsx/globalSearch.js'te zaten kurulu (bkz. constants/globalSearch.js
// → target: { path, state }). Yeni bir mekanizma icat ETMEDİK, var olanı kullandık.
/**
 * @param {{ category: string, searchHint?: string }} item
 * @returns {{ path: string, state?: object }}
 */
export function getReadinessItemTarget(item) {
  switch (item.category) {
    case "document":
      return { path: "/documents?tab=generator" };
    case "periodicCheck":
      return { path: "/documents?tab=periodicChecks" };
    case "openRisk":
    case "unevidencedClosure":
      return { path: "/risk-analysis", state: { targetTab: "fineKinney", prefillSearch: item.searchHint } };
    default:
      return { path: "/dashboard" };
  }
}
