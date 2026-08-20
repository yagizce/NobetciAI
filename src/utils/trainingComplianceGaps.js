// trainingComplianceGaps — Sprint: "kim hangi eğitimi almadı" net listesi. Mevcut
// ParticipantListPanel.jsx KURS bazlıdır (bir kursa girip o kursun katılımcılarını
// görürsünüz) VE yalnızca en az bir progress/completion kaydı olan çalışanları
// listeler — hiç başlamamış (Atandı) çalışan o ekranda hiç GÖRÜNMEZ. Bu dosya bunun
// tersini yapar: ÇALIŞAN merkezli, TÜM aktif çalışanları (hiç başlamamış olsa bile)
// tarar ve hangi kursları tamamlamadıklarını listeler — denetimde "şu 3 kişi şu
// eğitimi almamış" diye ibraz edilebilir somut bir liste için.
//
// employeeNameMatch.js'teki normalizeName ile eşleştirir (aynı büyük/küçük harf ve
// boşluk toleransı) — ama yine de serbest metin isim eşleştirmesidir, bkz. o dosyanın
// başındaki BİLİNÇLİ SINIRLAMA notu.

import { resolveTrainingStatus } from "../constants/trainingStatus.js";
import { normalizeName } from "./employeeNameMatch.js";

/**
 * @param {import("../types/index.js").Employee[]} employees
 * @param {object[]} courses - TRAINING_COURSES
 * @param {import("../types/index.js").TrainingProgress[]} progressRecords
 * @param {import("../types/index.js").TrainingCompletion[]} completionRecords
 * @returns {Array<{ employee: object, missingCourses: string[] }>}
 *   Yalnızca en az 1 eksik kursu olan AKTİF çalışanlar döner, en çok eksiği olandan aza sıralı.
 */
export function computeTrainingComplianceGaps(employees, courses, progressRecords, completionRecords) {
  return (employees || [])
    .filter((e) => e.status === "active")
    .map((employee) => {
      const target = normalizeName(employee.fullName);
      const myProgress = progressRecords.filter((p) => normalizeName(p.employeeName) === target);
      const myCompletions = completionRecords.filter((c) => normalizeName(c.employeeName) === target);

      const missingCourses = courses
        .filter((course) => {
          const progress = myProgress.find((p) => p.courseId === course.id) || null;
          const completions = myCompletions.filter((c) => c.courseId === course.id);
          return resolveTrainingStatus({ progress, completions }).id !== "completed";
        })
        .map((c) => c.title);

      return { employee, missingCourses };
    })
    .filter((r) => r.missingCourses.length > 0)
    .sort((a, b) => b.missingCourses.length - a.missingCourses.length);
}
