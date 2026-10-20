import { test } from "node:test";
import assert from "node:assert/strict";
import { dataProvider } from "./dataProvider.js";
import { getTrainingProgress, getTrainingCompletions, saveTrainingCompletion, saveTrainingProgressRecord } from "./trainingService.js";
import { getTrainingCourseSettings, saveTrainingCourseDueDate } from "./trainingCourseSettingsService.js";
import { getEmployees, saveEmployee, deleteEmployee } from "./employeeService.js";
import { getNotificationRecords, saveNotificationRecord } from "./notificationRecordService.js";
import { seedDemoData, resetAndSeedDemoData } from "./demoSeedService.js";
import { pushSystemNotification } from "./systemNotificationService.js";
import { showLocalNotification } from "./notificationService.js";
import { buildFullBackup, validateBackup } from "./backupService.js";

test("kapalı modüllerin okuma/yazmaları depolamaya ulaşmaz, demo sıfırlaması başlamaz", async (t) => {
  for (const method of ["getAll", "getById", "upsert", "remove"]) {
    t.mock.method(dataProvider, method, () => { throw new Error("Depolamaya erişilmemeliydi"); });
  }
  for (const read of [getTrainingProgress, getTrainingCompletions, getTrainingCourseSettings, getEmployees, getNotificationRecords]) {
    assert.deepEqual(await read(), []);
  }
  for (const write of [
    () => saveTrainingCompletion({}), () => saveTrainingProgressRecord({}),
    () => saveTrainingCourseDueDate("course", "2026-12-01"),
    () => saveEmployee({}), () => deleteEmployee("old-id"),
    () => saveNotificationRecord({}), seedDemoData, resetAndSeedDemoData,
  ]) {
    await assert.rejects(write, /mevcut sürümde kullanıma açık değil/);
  }
  assert.equal(await pushSystemNotification({ type: "trainingDue", title: "Kapalı", message: "" }), null);
  // Tarayıcı API'si olmadan da önce kapsam kontrolüne takılmalı.
  await showLocalNotification("taskAssigned", "Kapalı", "");
  for (const method of ["getAll", "getById", "upsert", "remove"]) assert.equal(dataProvider[method].mock.callCount(), 0);
});

test("uzman sürümünün tam yedeği kapalı modüllerin mevcut kayıtlarını da korur", async (t) => {
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
