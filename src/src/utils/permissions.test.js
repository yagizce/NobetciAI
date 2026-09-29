import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hasRole, hasPermission, canManageRiskAssessments } from "./permissions.js";

describe("hasRole", () => {
  test("izin verilen roller listesinde bulunan rol için true döner", () => {
    assert.equal(hasRole("expert", ["expert", "employer"]), true);
  });

  test("izin verilen roller listesinde olmayan rol için false döner", () => {
    assert.equal(hasRole("employee", ["expert", "employer"]), false);
  });

  test("allowedRoles boş veya tanımsızsa herkese izin verir", () => {
    assert.equal(hasRole("employee", []), true);
    assert.equal(hasRole("employee", undefined), true);
  });
});

describe("hasPermission", () => {
  test("employer firma yönetim izinlerine sahiptir", () => {
    assert.equal(hasPermission("employer", "manage_company"), true);
    assert.equal(hasPermission("employer", "manage_employees"), true);
  });

  test("expert yalnızca kendi kapsamındaki izinlere sahiptir", () => {
    assert.equal(hasPermission("expert", "approve_risk"), true);
    assert.equal(hasPermission("expert", "manage_company"), false);
  });

  test("employee yalnızca bildirim gönderme iznine sahiptir", () => {
    assert.equal(hasPermission("employee", "submit_notification"), true);
    assert.equal(hasPermission("employee", "manage_employees"), false);
  });

  test("tanımsız/kaldırılmış bir rol için hiçbir izin döndürmez", () => {
    // Not: companyAdmin/superAdmin bilinçli olarak kaldırıldı (bkz. allRoles.js);
    // bu test, kaldırılan rollerin sessizce yetki KAZANMADIĞINI doğrular.
    assert.equal(hasPermission("companyAdmin", "manage_company"), false);
    assert.equal(hasPermission("superAdmin", "manage_all_companies"), false);
  });
});

describe("canManageRiskAssessments", () => {
  test("İSG Uzmanı her zaman yetkilidir — firma ayarından bağımsız", () => {
    assert.equal(canManageRiskAssessments("expert", null), true);
    assert.equal(canManageRiskAssessments("expert", { expertIsEmployer: false }), true);
  });

  test("İşveren, İSG Uzmanı ile aynı kişi DEĞİLSE salt-görüntüler (yetkisiz)", () => {
    assert.equal(canManageRiskAssessments("employer", null), false);
    assert.equal(canManageRiskAssessments("employer", { expertIsEmployer: false }), false);
    assert.equal(canManageRiskAssessments("employer", undefined), false);
  });

  test("İşveren, İSG Uzmanı ile aynı kişiyse tam yetkilidir", () => {
    assert.equal(canManageRiskAssessments("employer", { expertIsEmployer: true }), true);
  });

  test("Çalışan hiçbir zaman yetkili değildir", () => {
    assert.equal(canManageRiskAssessments("employee", { expertIsEmployer: true }), false);
  });
});
