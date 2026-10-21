// Ürün kapsamı; kimlik doğrulama/yetkilendirme değildir. Yeniden açma: docs/RELEASE_SCOPE.md.
// URL, localStorage veya kullanıcı tercihi bu seçimi değiştiremez.
export const RELEASE_PROFILE = "expert";

const PROFILES = Object.freeze({
  expert: Object.freeze({
    roles: Object.freeze(["expert"]),
    companyEditorRoles: Object.freeze(["expert"]),
    features: Object.freeze([]),
  }),
  // Önceki üç rollü DEMO kapsamı. Gerçek yayına hazır olduğu anlamına gelmez.
  multiRoleDemo: Object.freeze({
    roles: Object.freeze(["employer", "expert", "employee"]),
    companyEditorRoles: Object.freeze(["employer"]),
    features: Object.freeze(["training", "employeeReports", "employeeDirectory", "demoData", "companyAdminFields", "companyOrgManagement"]),
  }),
});

export function isRoleEnabled(role, profile = RELEASE_PROFILE) {
  return PROFILES[profile]?.roles.includes(role) ?? false;
}

export function resolveReleaseRole(role, profile = RELEASE_PROFILE) {
  return isRoleEnabled(role, profile) ? role : "expert";
}

export function isFeatureEnabled(feature, profile = RELEASE_PROFILE) {
  return PROFILES[profile]?.features.includes(feature) ?? false;
}

export function requireFeature(feature) {
  if (!isFeatureEnabled(feature)) throw new Error("Bu özellik mevcut sürümde kullanıma açık değil.");
}

export function canEditCompany(role, profile = RELEASE_PROFILE) {
  return PROFILES[profile]?.companyEditorRoles.includes(role) ?? false;
}

export function getReleaseTabs(tabs, role, profile = RELEASE_PROFILE) {
  if (!isRoleEnabled(role, profile)) return [];
  return tabs.filter((tab) => (!tab.roles || tab.roles.includes(role)) &&
    (!tab.feature || isFeatureEnabled(tab.feature, profile)));
}

export function resolveReleaseTab(tabs, requested) {
  return tabs.some((tab) => tab.key === requested) ? requested : tabs[0]?.key ?? null;
}

const NOTIFICATION_FEATURES = {
  newNotification: "employeeReports",
  aiAnalysisComplete: "employeeReports",
  taskAssigned: "employeeReports",
  trainingDue: "training",
  employeeAdded: "employeeDirectory",
};

export function isNotificationEnabled(type, profile = RELEASE_PROFILE) {
  const feature = NOTIFICATION_FEATURES[type];
  return feature ? isFeatureEnabled(feature, profile)
    : ["riskCreated", "criticalRisk", "riskDetection", "difDue", "periodicCheckDue", "backupStale"].includes(type);
}

export function isActivityEnabled(entityType, profile = RELEASE_PROFILE) {
  const feature = { notification: "employeeReports", training: "training", employee: "employeeDirectory" }[entityType];
  return !feature || isFeatureEnabled(feature, profile);
}
