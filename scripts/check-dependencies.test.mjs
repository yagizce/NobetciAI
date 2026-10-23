import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateAudit } from "./check-dependencies.mjs";

const advisory = { url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc", severity: "high", range: "<2" };
function fixture() {
  return {
    report: { auditReportVersion: 2, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } }, vulnerabilities: {
      example: { severity: "high", nodes: ["node_modules/example"], via: [{ ...advisory }] },
    } },
    policy: { packages: { example: { versions: ["1.0.0"], severity: "high", expires: "2026-11-22",
      reason: "İncelendi", issue: "https://github.com/yagizce/NobetciAI/issues/8",
      via: [advisory.url + "|high|<2"] } } },
    lock: { packages: { "node_modules/example": { version: "1.0.0" } } },
  };
}
test("incelenmiş risk görünür kalır; yeni paket engellenir", () => {
  const { report, policy, lock } = fixture();
  assert.deepEqual(evaluateAudit(report, policy, lock, "2026-10-23"), []);
  report.vulnerabilities.newPackage = report.vulnerabilities.example;
  report.metadata.vulnerabilities.high = 2;
  report.metadata.vulnerabilities.total = 2;
  assert.match(evaluateAudit(report, policy, lock, "2026-10-23").join(), /yeni paket/);
});
test("yeni duyuru veya değişen önem derecesi kabul edilmez", () => {
  const { report, policy, lock } = fixture();
  report.vulnerabilities.example.via.push({ ...advisory, url: "https://github.com/advisories/GHSA-dddd-eeee-ffff" });
  report.vulnerabilities.example.severity = "critical";
  report.metadata.vulnerabilities.high = 0;
  report.metadata.vulnerabilities.critical = 1;
  const errors = evaluateAudit(report, policy, lock, "2026-10-23").join();
  assert.match(errors, /duyuru/);
  assert.match(errors, /önem derecesi/);
});
test("süresi dolan inceleme ve incelenmemiş sürüm engellenir", () => {
  const { report, policy, lock } = fixture();
  lock.packages["node_modules/example"].version = "1.1.0";
  const errors = evaluateAudit(report, policy, lock, "2026-11-22").join();
  assert.match(errors, /inceleme süresi/);
  assert.match(errors, /incelenmemiş sürüm/);
});
test("bozuk veya hata içeren audit sıfır bulgu sayılmaz", () => {
  const { report, policy, lock } = fixture();
  assert.throws(() => evaluateAudit({ ...report, error: { code: "ENET" } }, policy, lock), /geçersiz/);
  assert.throws(() => evaluateAudit({}, policy, lock), /geçersiz/);
});
test("audit bağımlılık grafiği eksikse kontrol başarısız olur", () => {
  const { report, policy, lock } = fixture();
  report.vulnerabilities.example.via = ["missing"];
  assert.throws(() => evaluateAudit(report, policy, lock, "2026-10-23"), /Eksik/);
});
test("düzeltilmiş bulgu tekrar izin gerektirmez", () => {
  const { report, policy, lock } = fixture();
  report.vulnerabilities = {};
  report.metadata.vulnerabilities.high = 0;
  report.metadata.vulnerabilities.total = 0;
  assert.deepEqual(evaluateAudit(report, policy, lock, "2026-10-23"), []);
});

test("boş paket listesiyle çelişen audit özeti başarı sayılmaz", () => {
  const { report, policy, lock } = fixture();
  report.vulnerabilities = {};
  assert.throws(() => evaluateAudit(report, policy, lock, "2026-10-23"), /Tutarsız/);
});

test("duyuru zinciri boş audit kaydı başarı sayılmaz", () => {
  const { report, policy, lock } = fixture();
  report.vulnerabilities.example.via = [];
  assert.throws(() => evaluateAudit(report, policy, lock, "2026-10-23"), /paket yapısı/);
});
test("takvimde geçersiz bitiş tarihi istisnayı uzatamaz", () => {
  const { report, policy, lock } = fixture();
  for (const expires of ["2026-99-99", "2027-02-30"]) {
    policy.packages.example.expires = expires;
    assert.match(evaluateAudit(report, policy, lock, "2026-10-23").join(), /inceleme süresi/);
  }
});
