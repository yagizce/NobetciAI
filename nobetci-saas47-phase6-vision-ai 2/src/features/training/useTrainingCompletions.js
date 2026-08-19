import { useState, useEffect, useCallback } from "react";
import { getTrainingCompletions, saveTrainingCompletion, getTrainingProgress, saveTrainingProgressRecord } from "../../services/trainingService.js";
import { logActivity } from "../../services/auditService.js";

/**
 * Sprint 7.2.1: mevcut `completions`/`recordCompletion` sözleşmesi AYNEN korunuyor —
 * yalnızca yanına `progress`/`recordProgress` eklendi. Hiçbir mevcut tüketici
 * (TrainingModule.jsx) bu değişiklikle kırılmaz.
 *
 * @returns {{
 *   completions: import("../../types/index.js").TrainingCompletion[],
 *   progress: import("../../types/index.js").TrainingProgress[],
 *   loaded: boolean,
 *   recordCompletion: (data: { courseId: string, employeeName: string, watchedFullVideo: boolean, quizScore: number, passed: boolean }) => Promise<void>,
 *   recordProgress: (data: { courseId: string, employeeName: string, positionSeconds: number, durationSeconds: number }) => Promise<void>,
 * }}
 */
export function useTrainingCompletions() {
  const [completions, setCompletions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getTrainingCompletions(), getTrainingProgress()]).then(([completionData, progressData]) => {
      setCompletions(completionData);
      setProgress(progressData);
      setLoaded(true);
    });
  }, []);

  const recordCompletion = useCallback(async (data) => {
    const saved = await saveTrainingCompletion(data);
    setCompletions((prev) => [...prev, saved]);
    logActivity({
      actor: data.employeeName,
      action: data.passed ? "Eğitim tamamlandı" : "Eğitim sınavı geçilemedi",
      details: `${data.courseId} — %${data.quizScore}`,
      entityType: "training",
    });
  }, []);

  const recordProgress = useCallback(async (data) => {
    const saved = await saveTrainingProgressRecord(data);
    setProgress((prev) => [...prev.filter((p) => p.id !== saved.id), saved]);
  }, []);

  return { completions, progress, loaded, recordCompletion, recordProgress };
}
