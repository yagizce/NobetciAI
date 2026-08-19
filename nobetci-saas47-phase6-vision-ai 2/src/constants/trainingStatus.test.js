import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getUpcomingTrainingDueReminders } from "./trainingStatus.js";

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const courses = [{ id: "kkd", title: "KKD Kullanımı" }, { id: "yangin", title: "Yangın Söndürme" }];

describe("getUpcomingTrainingDueReminders", () => {
  test("son tarihi olmayan kurs hiçbir zaman hatırlatma üretmez", () => {
    const settings = [{ id: "kkd", dueDate: null }];
    const result = getUpcomingTrainingDueReminders(courses, settings, [], [], "Ahmet");
    assert.equal(result.length, 0);
  });

  test("son tarihi geçmiş ve tamamlanmamış kurs 'overdue' üretir", () => {
    const settings = [{ id: "kkd", dueDate: daysFromToday(-2) }];
    const result = getUpcomingTrainingDueReminders(courses, settings, [], [], "Ahmet");
    assert.equal(result.length, 1);
    assert.equal(result[0].status, "overdue");
    assert.equal(result[0].courseId, "kkd");
  });

  test("son tarihe 3 gün veya az kalan kurs 'dueSoon' üretir", () => {
    const settings = [{ id: "kkd", dueDate: daysFromToday(2) }];
    const result = getUpcomingTrainingDueReminders(courses, settings, [], [], "Ahmet");
    assert.equal(result[0].status, "dueSoon");
  });

  test("tamamlanmış kurs son tarihi geçmiş olsa bile hatırlatma ÜRETMEZ", () => {
    const settings = [{ id: "kkd", dueDate: daysFromToday(-5) }];
    const completions = [{ courseId: "kkd", employeeName: "Ahmet", passed: true, completedAt: daysFromToday(-1) }];
    const result = getUpcomingTrainingDueReminders(courses, settings, [], completions, "Ahmet");
    assert.equal(result.length, 0);
  });

  test("yalnızca ilgili çalışanın kayıtlarına bakar (başkasının tamamlaması etkilemez)", () => {
    const settings = [{ id: "kkd", dueDate: daysFromToday(-5) }];
    const completions = [{ courseId: "kkd", employeeName: "Başka Kişi", passed: true, completedAt: daysFromToday(-1) }];
    const result = getUpcomingTrainingDueReminders(courses, settings, [], completions, "Ahmet");
    assert.equal(result.length, 1); // Ahmet hâlâ tamamlamadı
  });

  test("4+ gün kalan kurs (henüz yakın değil) hatırlatma üretmez", () => {
    const settings = [{ id: "kkd", dueDate: daysFromToday(10) }];
    assert.equal(getUpcomingTrainingDueReminders(courses, settings, [], [], "Ahmet").length, 0);
  });
});
