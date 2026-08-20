import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeName, matchEmployeeByName, getDepartmentEmployeeNameSet, filterRecordsByDepartment } from "./employeeNameMatch.js";

const EMPLOYEES = [
  { id: 1, fullName: "Ahmet Yılmaz", departmentId: "dep-1" },
  { id: 2, fullName: "Ayşe İpek", departmentId: "dep-1" },
  { id: 3, fullName: "Mehmet Öztürk", departmentId: "dep-2" },
  { id: 4, fullName: "ahmet yılmaz", departmentId: "dep-2" }, // kasıtlı: aynı isim farklı departman
];

describe("normalizeName", () => {
  test("Türkçe büyük İ/I harflerini doğru küçültür (turkishLower deseni)", () => {
    assert.equal(normalizeName("İPEK"), "ipek");
    assert.equal(normalizeName("Işık"), "ışık");
  });

  test("baş/son boşlukları kırpar, aradaki fazla boşlukları tek boşluğa indirir", () => {
    assert.equal(normalizeName("  Ahmet   Yılmaz  "), "ahmet yılmaz");
  });

  test("null/undefined/boş string için çökmez, boş string döner", () => {
    assert.equal(normalizeName(null), "");
    assert.equal(normalizeName(undefined), "");
    assert.equal(normalizeName(""), "");
  });
});

describe("matchEmployeeByName", () => {
  test("tam eşleşmede çalışanı bulur", () => {
    const { employee, ambiguous } = matchEmployeeByName("Mehmet Öztürk", EMPLOYEES);
    assert.equal(employee.id, 3);
    assert.equal(ambiguous, false);
  });

  test("büyük/küçük harf ve boşluk farklarına duyarsızdır", () => {
    const { employee } = matchEmployeeByName("  MEHMET ÖZTÜRK  ", EMPLOYEES);
    assert.equal(employee.id, 3);
  });

  test("eşleşme yoksa employee: null, ambiguous: false döner", () => {
    assert.deepEqual(matchEmployeeByName("Olmayan Kişi", EMPLOYEES), { employee: null, ambiguous: false });
  });

  test("boş/null isimde eşleşme aranmaz", () => {
    assert.deepEqual(matchEmployeeByName("", EMPLOYEES), { employee: null, ambiguous: false });
    assert.deepEqual(matchEmployeeByName(null, EMPLOYEES), { employee: null, ambiguous: false });
  });

  test("aynı isimde birden fazla çalışan varsa ambiguous: true, ilk bulunanı döner", () => {
    const { employee, ambiguous } = matchEmployeeByName("Ahmet Yılmaz", EMPLOYEES);
    assert.equal(ambiguous, true);
    assert.equal(employee.id, 1); // listede önce gelen
  });

  test("employees listesi boş/undefined ise çökmez", () => {
    assert.deepEqual(matchEmployeeByName("Ahmet Yılmaz", []), { employee: null, ambiguous: false });
    assert.deepEqual(matchEmployeeByName("Ahmet Yılmaz", undefined), { employee: null, ambiguous: false });
  });
});

describe("getDepartmentEmployeeNameSet", () => {
  test("yalnızca ilgili departmandaki çalışanların normalize edilmiş isimlerini döner", () => {
    const set = getDepartmentEmployeeNameSet("dep-1", EMPLOYEES);
    assert.equal(set.size, 2);
    assert.ok(set.has("ahmet yılmaz"));
    assert.ok(set.has("ayşe ipek"));
    assert.ok(!set.has("mehmet öztürk"));
  });

  test("departmentId sayı/string karışsa da eşleşir (String() karşılaştırması)", () => {
    const employees = [{ id: 1, fullName: "Test Kişi", departmentId: 5 }];
    const set = getDepartmentEmployeeNameSet("5", employees);
    assert.ok(set.has("test kişi"));
  });

  test("eşleşen çalışan yoksa boş Set döner", () => {
    assert.equal(getDepartmentEmployeeNameSet("dep-yok", EMPLOYEES).size, 0);
  });
});

describe("filterRecordsByDepartment", () => {
  const nameSet = getDepartmentEmployeeNameSet("dep-1", EMPLOYEES); // ahmet yılmaz, ayşe ipek

  test("yalnızca isim seti içindeki kayıtları döner", () => {
    const records = [
      { worker: "Ahmet Yılmaz", note: "a" },
      { worker: "Mehmet Öztürk", note: "b" },
      { worker: "Ayşe İpek", note: "c" },
    ];
    const result = filterRecordsByDepartment(records, "worker", nameSet);
    assert.equal(result.length, 2);
    assert.deepEqual(result.map((r) => r.note).sort(), ["a", "c"]);
  });

  test("records boş/undefined ise çökmez, boş dizi döner", () => {
    assert.deepEqual(filterRecordsByDepartment([], "worker", nameSet), []);
    assert.deepEqual(filterRecordsByDepartment(undefined, "worker", nameSet), []);
  });
});
