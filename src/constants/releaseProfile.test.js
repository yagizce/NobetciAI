import { test } from "node:test";
import assert from "node:assert/strict";
import { isRoleEnabled, resolveReleaseRole, isFeatureEnabled, canEditCompany, getReleaseTabs, resolveReleaseTab, isNotificationEnabled } from "./releaseProfile.js";
import { ALL_ROLES, SWITCHABLE_ROLES } from "./allRoles.js";
import { normalizeNotificationPrefs } from "./notificationPrefs.js";

test("uzman sürümü eski, geçersiz ve değiştirilmiş rol tercihlerinde uzman olarak açılır", () => {
  for (const role of ["employer", "employee", "admin", null, {}, "expert"]) {
    assert.equal(resolveReleaseRole(role, "expert"), "expert");
  }
  assert.deepEqual(SWITCHABLE_ROLES.map((role) => role.id), ["expert"]);
  assert.equal(ALL_ROLES.length, 3); // Geçmiş kayıtlardaki rol etiketleri korunur.
  assert.equal(isRoleEnabled("employee", "expert"), false);
  assert.equal(canEditCompany("expert", "expert"), true);
});

test("kapalı veya bilinmeyen sekme ilk gösterimde açık sekmeye döner", () => {
  const tabs = [
    { key: "education", feature: "training" },
    { key: "notifications", feature: "employeeReports" },
    { key: "generator", roles: ["expert"] },
  ];
  const visible = getReleaseTabs(tabs, "expert", "expert");
  assert.deepEqual(visible.map((tab) => tab.key), ["generator"]);
  assert.equal(resolveReleaseTab(visible, "education"), "generator");
  assert.equal(resolveReleaseTab(visible, "notifications"), "generator");
  assert.deepEqual(getReleaseTabs(tabs, "employee", "expert"), []);
  assert.equal(resolveReleaseTab([], "education"), null);
  assert.equal(isFeatureEnabled("unrecognized", "expert"), false);
});

test("çok rollü demo profili eski modülleri geri açabilir", () => {
  for (const role of ["expert", "employer", "employee"]) assert.equal(isRoleEnabled(role, "multiRoleDemo"), true);
  for (const feature of ["training", "employeeReports", "employeeDirectory", "demoData", "companyAdminFields", "companyOrgManagement"]) {
    assert.equal(isFeatureEnabled(feature, "expert"), false);
    assert.equal(isFeatureEnabled(feature, "multiRoleDemo"), true);
  }
  assert.equal(canEditCompany("employer", "multiRoleDemo"), true);
  assert.equal(canEditCompany("expert", "multiRoleDemo"), false);
});

test("eğitim ve ekip bildirimleri kapalıyken uzman hatırlatmaları açık kalır", () => {
  for (const type of ["trainingDue", "taskAssigned", "employeeAdded", "newNotification", "aiAnalysisComplete"]) {
    assert.equal(isNotificationEnabled(type, "expert"), false);
    assert.equal(isNotificationEnabled(type, "multiRoleDemo"), true);
  }
  for (const type of ["riskCreated", "criticalRisk", "riskDetection", "difDue", "periodicCheckDue", "backupStale"]) {
    assert.equal(isNotificationEnabled(type, "expert"), true);
  }
  assert.equal(isNotificationEnabled("unknown", "expert"), false);
});

test("kritik risk tercihi eski kullanıcının bildirim kapatma kararını korur", () => {
  assert.equal(normalizeNotificationPrefs({ newNotification: false }).criticalRisk, false);
  assert.equal(normalizeNotificationPrefs({ newNotification: false, criticalRisk: true }).criticalRisk, true);
  assert.equal(normalizeNotificationPrefs(null).criticalRisk, true);
});
