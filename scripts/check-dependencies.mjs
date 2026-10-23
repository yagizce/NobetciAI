import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Audit sonuçları görünür kalır; yalnızca incelenmiş sürüm/duyuru birleşimleri kabul edilir.
function fingerprint(via) {
  if (typeof via === "string") return "dependency:" + via;
  if (!via || typeof via.url !== "string" || !via.url.startsWith("https://github.com/advisories/GHSA-")) {
    throw new Error("Tanınmayan audit duyurusu.");
  }
  return [via.url, via.severity, via.range].join("|");
}

export function evaluateAudit(report, policy, lock, today = new Date().toISOString().slice(0, 10)) {
  if (report.auditReportVersion !== 2 || report.error || !report.vulnerabilities ||
      !report.metadata?.vulnerabilities || !policy.packages || !lock.packages) {
    throw new Error("Audit/politika/kilit dosyası geçersiz veya desteklenmiyor.");
  }
  const counts = Object.values(report.vulnerabilities).reduce((all, v) => {
    if (!["info", "low", "moderate", "high", "critical"].includes(v.severity)) throw new Error("Tanınmayan önem derecesi.");
    all[v.severity] = (all[v.severity] || 0) + 1;
    return all;
  }, {});
  for (const level of ["info", "low", "moderate", "high", "critical"]) {
    if ((counts[level] || 0) !== report.metadata.vulnerabilities[level]) throw new Error("Tutarsız audit özeti.");
  }
  if (Object.keys(report.vulnerabilities).length !== report.metadata.vulnerabilities.total) throw new Error("Tutarsız audit toplamı.");
  const failures = [];
  for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
    const approved = policy.packages[name];
    if (!approved) { failures.push(name + ": yeni paket bulgusu"); continue; }
    const expiresAt = Date.parse(approved.expires + "T00:00:00Z");
    const validExpiry = /^\d{4}-\d{2}-\d{2}$/.test(approved.expires) && Number.isFinite(expiresAt) &&
      new Date(expiresAt).toISOString().slice(0, 10) === approved.expires;
    if (!validExpiry || approved.expires <= today ||
        !approved.reason || !approved.issue) failures.push(name + ": inceleme süresi/gerekçesi geçersiz");
    if (approved.severity !== vulnerability.severity) failures.push(name + ": önem derecesi değişti");
    if (!Array.isArray(vulnerability.via) || !vulnerability.via.length ||
        !Array.isArray(vulnerability.nodes) || !vulnerability.nodes.length) {
      throw new Error("Audit paket yapısı geçersiz: " + name);
    }
    for (const via of vulnerability.via) {
      if (!approved.via.includes(fingerprint(via))) failures.push(name + ": yeni/değişmiş duyuru");
      if (typeof via === "string" && !report.vulnerabilities[via]) throw new Error("Eksik audit bağımlılığı.");
    }
    for (const node of vulnerability.nodes) {
      if (!approved.versions.includes(lock.packages[node]?.version)) failures.push(name + ": incelenmemiş sürüm");
    }
  }
  return failures;
}

function main() {
  if (!process.env.npm_execpath) throw new Error("npm run audit:security kullanın.");
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "audit", "--json", "--ignore-scripts"], {
    encoding: "utf8", timeout: 120_000, maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || ![0, 1].includes(result.status)) throw new Error("npm audit çalışmadı: " + (result.error?.message || result.stderr));
  const report = JSON.parse(result.stdout);
  writeFileSync("dependency-audit.json", JSON.stringify(report, null, 2) + "\n");
  const failures = evaluateAudit(report, JSON.parse(readFileSync("security/audit-policy.json", "utf8")),
    JSON.parse(readFileSync("package-lock.json", "utf8")));
  console.log("npm audit (istisnalar dahil):", report.metadata.vulnerabilities);
  for (const name of Object.keys(report.vulnerabilities)) console.log("İncelenmiş açık bulgu:", name);
  if (failures.length) throw new Error(failures.join("\n"));
  console.log("Yeni bulgu yok; mevcut riskler docs/DEPENDENCY_SECURITY.md ve #8 ile izleniyor. Bu sonuç sıfır zafiyet demek değildir.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
