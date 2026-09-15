// ISO 45001 ve İSG Mevzuat Denetimi AYNI `findings` (DİF) deposunu paylaşır
// (bkz. services/auditManagementService.js → getAuditFindings, standarda göre
// filtrelemez — yalnızca AKTİF FİRMAYA göre filtreler, bkz. createCrudService.js).
// `audits` standarda göre filtrelenirken `findings` filtrelenmezse, bir standardın
// DİF'leri diğerinin sayımlarına (ör. utils/auditPreparedness.js → openActionCount/
// overdueActionCount) SIZAR. Bu SAF fonksiyon, findings'i audits ile AYNI kapsama
// (yalnızca bu standardın denetimlerinin id'leri) sınırlar — useAudits.js bunu
// `standard` filtresinden hemen sonra uygular.
//
// Ayrı bir dosyada tutulmasının nedeni: useAudits.js React hook'ları (useState/
// useEffect) ve .jsx context'lerini içe aktarır, bu yüzden düz `node:test` ile
// doğrudan çalıştırılamaz. Bu dosya hiçbir React/.jsx bağımlılığı taşımaz, SAF
// ve test edilebilir kalır.
//
// @param {object[]} findings
// @param {object[]} scopedAudits - zaten `standard`'a göre filtrelenmiş denetimler
// @returns {object[]}
export function scopeFindingsToAudits(findings, scopedAudits) {
  const scopedAuditIds = new Set((scopedAudits || []).map((audit) => String(audit.id)));
  return (findings || []).filter((finding) => scopedAuditIds.has(String(finding.auditId)));
}
