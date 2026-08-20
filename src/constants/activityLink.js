// Sprint 7.2.4 — "Kartlara tıklayınca ilgili modüle yönlendirme". auditService.js'e
// kaydedilen her olayın bir `entityType`'ı var (bkz. services/auditService.js
// çağrıldığı yerler); bu, o olayın ait olduğu modülün rotasına eşlenir. Eşleşme
// bulunamazsa (örn. "notification", "company") null döner ve o satır tıklanamaz
// kalır — var olmayan bir sayfaya yönlendirmektense hiç yönlendirmemek tercih edilir.

const ENTITY_ROUTES = {
  fineKinney: "/risk-analysis",
  riskDetection: "/risk-analysis", // Phase 9.1 — Risk Tespiti sekmesi de aynı sayfada; en azından doğru sayfaya yönlendirir
  periodicCheck: "/documents?tab=periodicChecks",
  training: "/documents?tab=education",
  equipment: "/documents?tab=equipment",
  document: "/documents?tab=generator",
  employee: "/settings",
  department: "/settings",
  branch: "/settings",
  company: "/settings",
};

/**
 * @param {string} entityType
 * @returns {string|null}
 */
export function getActivityLink(entityType) {
  return ENTITY_ROUTES[entityType] || null;
}
