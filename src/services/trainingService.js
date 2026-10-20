import { dataProvider } from "./dataProvider.js";
import { createId } from "../utils/id.js";
import { getActiveCompanyId } from "./companyService.js";
import { isFeatureEnabled, requireFeature } from "../constants/releaseProfile.js";

async function requireActiveCompanyId() {
  requireFeature("training");
  const companyId = await getActiveCompanyId();
  if (companyId == null) throw new Error("Eğitim kaydı için aktif firma seçilmelidir.");
  return companyId;
}

/**
 * @returns {Promise<import("../types/index.js").TrainingCompletion[]>}
 */
export async function getTrainingCompletions() {
  if (!isFeatureEnabled("training")) return [];
  const companyId = await getActiveCompanyId();
  return companyId == null ? [] : dataProvider.getAll("trainingCompletions", { companyId });
}

/**
 * @param {{ courseId: string, employeeName: string, watchedFullVideo: boolean, quizScore: number, passed: boolean }} completion
 * @returns {Promise<import("../types/index.js").TrainingCompletion>}
 */
export async function saveTrainingCompletion(completion) {
  const companyId = await requireActiveCompanyId();
  const record = {
    ...completion,
    id: createId(),
    companyId,
    completedAt: new Date().toISOString(),
  };
  return dataProvider.upsert("trainingCompletions", record);
}

/**
 * @returns {Promise<import("../types/index.js").TrainingProgress[]>}
 */
export async function getTrainingProgress() {
  if (!isFeatureEnabled("training")) return [];
  const companyId = await getActiveCompanyId();
  return companyId == null ? [] : dataProvider.getAll("trainingProgress", { companyId });
}

/**
 * Bir (kurs, çalışan) çifti için tek ilerleme kaydını günceller. Legacy
 * `courseId::employeeName` id'leri mevcut kayıt bulunduğunda korunur; yeni çiftler UUID alır.
 * @param {{ courseId: string, employeeName: string, positionSeconds: number, durationSeconds: number }} progress
 * @returns {Promise<import("../types/index.js").TrainingProgress>}
 */
export async function saveTrainingProgressRecord(progress) {
  const companyId = await requireActiveCompanyId();
  const existing = (await dataProvider.getAll("trainingProgress", { companyId })).find(
    (record) => record.courseId === progress.courseId && record.employeeName === progress.employeeName
  );
  const record = {
    ...progress,
    id: existing?.id ?? createId(),
    companyId,
    updatedAt: new Date().toISOString(),
  };
  return dataProvider.upsert("trainingProgress", record);
}
