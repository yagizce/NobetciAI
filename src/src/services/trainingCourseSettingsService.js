// Eğitim son tarihleri şirket çapındadır; aynı kurs farklı firmalarda farklı tarihe sahip olabilir.
// Eski sürümde id=courseId idi. Yeni kayıtlar UUID id + courseId alanı kullanır;
// migration/okuma fallback'i eski kayıtları bozmadan çalışır.

import { createCrudService } from "./createCrudService.js";
import { createId } from "../utils/id.js";

const { getAll: getAllScoped, save } = createCrudService("trainingCourseSettings", { companyScoped: true });

/**
 * @returns {Promise<Array<{id: string|number, companyId: string|number, courseId: string, dueDate: string|null}>>}
 */
export async function getTrainingCourseSettings() {
  const records = await getAllScoped();
  return records.map((record) => ({ ...record, courseId: record.courseId || String(record.id) }));
}

/**
 * @param {string} courseId
 * @param {string|null} dueDate
 */
export async function saveTrainingCourseDueDate(courseId, dueDate) {
  const existing = (await getAllScoped()).find((record) => String(record.courseId || record.id) === String(courseId));
  return save({
    ...(existing || {}),
    id: existing?.id ?? createId(),
    courseId: String(courseId),
    dueDate,
  });
}
