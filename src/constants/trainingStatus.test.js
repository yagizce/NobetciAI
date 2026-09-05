import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getUpcomingTrainingDueReminders, computeRemainingSeconds, formatRemainingDuration } from "./trainingStatus.js";

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

describe("computeRemainingSeconds", () => {
  test("ilerleme yoksa 0 döner", () => {
    assert.equal(computeRemainingSeconds(null), 0);
  });

  test("kalan süreyi doğru hesaplar", () => {
    assert.equal(computeRemainingSeconds({ positionSeconds: 300, durationSeconds: 900 }), 600);
  });

  test("bozuk veriyle negatife düşmez (izlenen süre toplam süreyi aşarsa)", () => {
    assert.equal(computeRemainingSeconds({ positionSeconds: 1000, durationSeconds: 900 }), 0);
  });
});

describe("formatRemainingDuration", () => {
  test("saat içermeyen süreleri 'X dk' olarak gösterir", () => {
    assert.equal(formatRemainingDuration(600), "10 dk");
  });

  test("1 saati aşan süreleri 'X sa Y dk' olarak gösterir", () => {
    assert.equal(formatRemainingDuration(3900), "1 sa 5 dk");
  });

  test("0 veya negatif için '0 dk' döner", () => {
    assert.equal(formatRemainingDuration(0), "0 dk");
    assert.equal(formatRemainingDuration(-30), "0 dk");
  });

  test("1 dakikadan az kalan süreyi de en az '1 dk' gösterir (kaybolmaz)", () => {
    assert.equal(formatRemainingDuration(20), "1 dk");
  });
});
