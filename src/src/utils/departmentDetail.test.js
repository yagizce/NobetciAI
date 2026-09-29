import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeDepartmentDetail } from "./departmentDetail.js";

function daysAgoTr(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

const EMPLOYEES = [
  { id: 1, fullName: "Ahmet Yılmaz", departmentId: "dep-1" },
  { id: 2, fullName: "Ayşe Kaya", departmentId: "dep-1" },
];

describe("computeDepartmentDetail", () => {
  test("sources alanları verilmezse (boş obje) çökmez, tüm sayılar 0/null döner", () => {
    const result = computeDepartmentDetail("dep-1", {});
    assert.equal(result.openRiskCount, 0);
    assert.equal(result.avgRiskScore, null);
    assert.equal(result.riskLevel, null);
    assert.equal(result.lastNearMiss, null);
    assert.equal(result.lastAccident, null);
    assert.equal(result.departmentEmployeeCount, 0);
  });

  test("GÜVENİLİR bölüm: yalnızca departmentId eşleşen Fine-Kinney kayıtları sayılır", () => {
    const fineKinneyEntries = [
      { departmentId: "dep-1", status: "open", score: 100 },
      { departmentId: "dep-1", status: "done", score: 50 },
      { departmentId: "dep-2", status: "open", score: 300 }, // farklı departman
    ];
    const result = computeDepartmentDetail("dep-1", { fineKinneyEntries });
    assert.equal(result.openRiskCount, 1); // yalnızca status !== done olan
    assert.equal(result.avgRiskScore, 75); // (100+50)/2, done olan da ortalamaya dahil
  });

  test("avgRiskScore'a göre doğru risk seviyesi (getFineKinneyRiskLevel) hesaplanır", () => {
    const fineKinneyEntries = [{ departmentId: "dep-1", status: "open", score: 300 }];
    const result = computeDepartmentDetail("dep-1", { fineKinneyEntries });
    assert.equal(result.avgRiskScore, 300);
    assert.equal(result.riskLevel.key, "high");
  });

  test("departmentId string/number karışsa da eşleşir (String() karşılaştırması)", () => {
    const fineKinneyEntries = [{ departmentId: 5, status: "open", score: 10 }];
    const result = computeDepartmentDetail("5", { fineKinneyEntries });
    assert.equal(result.openRiskCount, 1);
  });

  test("BEST-EFFORT bölüm: yalnızca departman çalışan isimleriyle eşleşen bildirimler sayılır", () => {
    const notifications = [
      { worker: "Ahmet Yılmaz", type: "ramakKala", date: daysAgoTr(2) },
      { worker: "Ahmet Yılmaz", type: "ramakKala", date: daysAgoTr(10) }, // daha eski, en yenisi seçilmeli
      { worker: "Bilinmeyen Kişi", type: "ramakKala", date: daysAgoTr(1) }, // departmanda değil
      { worker: "Ayşe Kaya", type: "kaza", date: daysAgoTr(5) },
    ];
    const result = computeDepartmentDetail("dep-1", { notifications, employees: EMPLOYEES });
    assert.equal(result.lastNearMiss.worker, "Ahmet Yılmaz");
    assert.equal(result.lastNearMiss.date, daysAgoTr(2)); // en yeni olan
    assert.equal(result.lastAccident.worker, "Ayşe Kaya");
  });

  test("departmentEmployeeCount, o departmandaki çalışan sayısını (isim seti boyutu) verir", () => {
    const result = computeDepartmentDetail("dep-1", { employees: EMPLOYEES });
    assert.equal(result.departmentEmployeeCount, 2);
  });

  test("eğitim ve periyodik kontrol istatistikleri alt fonksiyonlara doğru veriyle iletilir", () => {
    const periodicChecks = [
      { departmentId: "dep-1", status: "overdue" },
      { departmentId: "dep-2", status: "overdue" }, // farklı departman, sayılmaz
    ];
    const result = computeDepartmentDetail("dep-1", { periodicChecks });
    assert.equal(result.periodicCheckStats.overdueCount, 1);
  });
});
