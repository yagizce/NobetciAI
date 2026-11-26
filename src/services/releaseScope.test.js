import { test } from "node:test";
import assert from "node:assert/strict";
import { dataProvider } from "./dataProvider.js";
import { getTrainingProgress, getTrainingCompletions, saveTrainingCompletion, saveTrainingProgressRecord } from "./trainingService.js";
import { getTrainingCourseSettings, saveTrainingCourseDueDate } from "./trainingCourseSettingsService.js";
import { getEmployees, saveEmployee, deleteEmployee } from "./employeeService.js";
import { getNotificationRecords, saveNotificationRecord } from "./notificationRecordService.js";
import { seedDemoData, resetAndSeedDemoData } from "./demoSeedService.js";
import { pushSystemNotification } from "./systemNotificationService.js";
import { buildFullBackup, validateBackup } from "./backupService.js";

test("etkin modüller eski kayıtları okur ve yeni verileri yalnızca etkin firmaya yazar", async (t) => {
  const companyId = "firma-1";
  const scopedRecords = new Map([
    ["employees", [{ id: "e1", companyId, fullName: "Mevcut çalışan" }]],
    ["trainingProgress", [{ id: "p1", companyId, courseId: "course", employeeName: "Mevcut çalışan", positionSeconds: 42 }]],
    ["trainingCompletions", [{ id: "t1", companyId, passed: true }]],
    ["trainingCourseSettings", [{ id: "course", companyId, dueDate: "2026-12-01" }]],
    ["notifications", [{ id: "n1", companyId, status: "pending" }]],
  ]);

  t.mock.method(dataProvider, "getAll", async (store, filter) => {
    if (store === "companies") return [{ id: companyId }];
    assert.deepEqual(filter, { companyId });
    return scopedRecords.get(store) || [];
  });
  t.mock.method(dataProvider, "getById", async (store, id) =>
    scopedRecords.get(store)?.find((record) => record.id === id) || null
  );
  t.mock.method(dataProvider, "upsert", async (store, record) => record);
  t.mock.method(dataProvider, "remove", async () => {});

  assert.deepEqual(await getEmployees(companyId), scopedRecords.get("employees"));
  assert.deepEqual(await getEmployees("firma-2"), []);
  assert.deepEqual(await getTrainingProgress(), scopedRecords.get("trainingProgress"));
  assert.deepEqual(await getTrainingCompletions(), scopedRecords.get("trainingCompletions"));
  assert.equal((await getTrainingCourseSettings())[0].courseId, "course");
  assert.deepEqual(await getNotificationRecords(), scopedRecords.get("notifications"));

  assert.equal((await saveEmployee({ id: "e2", fullName: "Yeni çalışan" })).companyId, companyId);
  await assert.rejects(() => saveEmployee({ id: "e3", companyId: "firma-2" }), /farklı firmaya/);
  await deleteEmployee("e1");
  assert.deepEqual(dataProvider.remove.mock.calls[0].arguments, ["employees", "e1"]);
  assert.equal((await saveTrainingCompletion({ courseId: "course", passed: true })).companyId, companyId);
  const progress = await saveTrainingProgressRecord({
    courseId: "course", employeeName: "Mevcut çalışan", positionSeconds: 50,
  });
  assert.equal(progress.id, "p1");
  assert.equal(progress.positionSeconds, 50);
  const dueDate = await saveTrainingCourseDueDate("course", "2026-12-05");
  assert.equal(dueDate.id, "course");
  assert.equal(dueDate.companyId, companyId);
  assert.equal((await saveNotificationRecord({ id: "n1", status: "approved" })).companyId, companyId);
  assert.equal((await pushSystemNotification({ type: "trainingDue", title: "Eğitim", message: "" })).companyId, companyId);
});

test("demo veri işlemleri depolamaya erişmeden reddedilir", async (t) => {
  for (const method of ["getAll", "getById", "upsert", "remove"]) {
    t.mock.method(dataProvider, method, () => { throw new Error("Depolamaya erişilmemeliydi"); });
  }
  await assert.rejects(seedDemoData, /mevcut sürümde kullanıma açık değil/);
  await assert.rejects(resetAndSeedDemoData, /mevcut sürümde kullanıma açık değil/);
  for (const method of ["getAll", "getById", "upsert", "remove"]) assert.equal(dataProvider[method].mock.callCount(), 0);
});

test("tam yedek yeniden açılan modüllerin mevcut kayıtlarını korur", async (t) => {
  const saved = {
    employees: [{ id: "e1", fullName: "Eski çalışan" }],
    trainingProgress: [{ id: "p1", positionSeconds: 42 }],
    trainingCompletions: [{ id: "t1", passed: true }],
    trainingCourseSettings: [{ id: "s1", dueDate: "2026-12-01" }],
    notifications: [{ id: "n1", status: "pending" }],
  };
  t.mock.method(dataProvider, "getAll", async (store) => saved[store] || []);
  const backup = await buildFullBackup();
  for (const [store, records] of Object.entries(saved)) assert.deepEqual(backup.data[store], records);
  assert.deepEqual(validateBackup(backup), { valid: true });
});
