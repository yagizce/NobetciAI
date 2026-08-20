import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeTrainingComplianceGaps } from "./trainingComplianceGaps.js";

const COURSES = [
  { id: "c1", title: "İş Sağlığı Temel" },
  { id: "c2", title: "Yangın Güvenliği" },
];

const EMPLOYEES = [
  { id: 1, fullName: "Ahmet Yılmaz", status: "active" },
  { id: 2, fullName: "Ayşe Kaya", status: "active" },
  { id: 3, fullName: "Pasif Çalışan", status: "inactive" },
];

describe("computeTrainingComplianceGaps", () => {
  test("hiçbir ilerleme/tamamlama kaydı yoksa tüm aktif çalışanlar TÜM kurslarda eksik sayılır", () => {
    const result = computeTrainingComplianceGaps(EMPLOYEES, COURSES, [], []);
    assert.equal(result.length, 2); // yalnızca aktif olan 2 çalışan
    for (const r of result) assert.deepEqual(r.missingCourses.sort(), ["Yangın Güvenliği", "İş Sağlığı Temel"].sort());
  });

  test("pasif (status !== 'active') çalışanlar listeye hiç girmez", () => {
    const result = computeTrainingComplianceGaps(EMPLOYEES, COURSES, [], []);
    assert.ok(!result.some((r) => r.employee.fullName === "Pasif Çalışan"));
  });

  test("bir kursu geçmiş (passed: true completion) çalışan o kurs için eksik sayılmaz", () => {
    const completions = [{ employeeName: "Ahmet Yılmaz", courseId: "c1", passed: true, completedAt: "2026-01-01T00:00:00Z" }];
    const result = computeTrainingComplianceGaps(EMPLOYEES, COURSES, [], completions);
    const ahmet = result.find((r) => r.employee.fullName === "Ahmet Yılmaz");
    assert.deepEqual(ahmet.missingCourses, ["Yangın Güvenliği"]);
  });

  test("tüm kursları tamamlayan çalışan sonuç listesinde HİÇ görünmez", () => {
    const completions = [
      { employeeName: "Ahmet Yılmaz", courseId: "c1", passed: true, completedAt: "2026-01-01T00:00:00Z" },
      { employeeName: "Ahmet Yılmaz", courseId: "c2", passed: true, completedAt: "2026-01-01T00:00:00Z" },
    ];
    const result = computeTrainingComplianceGaps(EMPLOYEES, COURSES, [], completions);
    assert.ok(!result.some((r) => r.employee.fullName === "Ahmet Yılmaz"));
  });

  test("isim eşleştirmesi büyük/küçük harf ve boşluğa duyarsızdır (employeeNameMatch.normalizeName)", () => {
    const completions = [{ employeeName: "  AHMET yılmaz  ", courseId: "c1", passed: true, completedAt: "2026-01-01T00:00:00Z" }];
    const result = computeTrainingComplianceGaps(EMPLOYEES, COURSES, [], completions);
    const ahmet = result.find((r) => r.employee.fullName === "Ahmet Yılmaz");
    assert.deepEqual(ahmet.missingCourses, ["Yangın Güvenliği"]);
  });

  test("en çok eksiği olandan aza doğru sıralanır", () => {
    const completions = [{ employeeName: "Ahmet Yılmaz", courseId: "c1", passed: true, completedAt: "2026-01-01T00:00:00Z" }];
    const result = computeTrainingComplianceGaps(EMPLOYEES, COURSES, [], completions);
    // Ahmet: 1 eksik, Ayşe: 2 eksik -> Ayşe önce gelmeli
    assert.equal(result[0].employee.fullName, "Ayşe Kaya");
    assert.equal(result[0].missingCourses.length, 2);
  });

  test("employees null/undefined ise çökmez, boş dizi döner", () => {
    assert.deepEqual(computeTrainingComplianceGaps(null, COURSES, [], []), []);
    assert.deepEqual(computeTrainingComplianceGaps(undefined, COURSES, [], []), []);
  });

  test("courses boşsa hiçbir çalışan eksik sayılmaz (eksik listesi olmayan sonuçtan çıkar)", () => {
    assert.deepEqual(computeTrainingComplianceGaps(EMPLOYEES, [], [], []), []);
  });
});
