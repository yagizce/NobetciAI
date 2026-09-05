import { useState, useEffect, useCallback } from "react";
import { getTrainingCompletions, saveTrainingCompletion, getTrainingProgress, saveTrainingProgressRecord } from "../../services/trainingService.js";
import { logActivity } from "../../services/auditService.js";
import { useToast } from "../../contexts/ToastContext.jsx";

/**
 * Sprint 7.2.1: mevcut `completions`/`recordCompletion` sözleşmesi AYNEN korunuyor —
 * yalnızca yanına `progress`/`recordProgress` eklendi. Hiçbir mevcut tüketici
 * (TrainingModule.jsx) bu değişiklikle kırılmaz.
 *
 * @returns {{
 *   completions: import("../../types/index.js").TrainingCompletion[],
 *   progress: import("../../types/index.js").TrainingProgress[],
 *   loaded: boolean,
 *   error: Error|null,
 *   recordCompletion: (data: { courseId: string, employeeName: string, watchedFullVideo: boolean, quizScore: number, passed: boolean }) => Promise<void>,
 *   recordProgress: (data: { courseId: string, employeeName: string, positionSeconds: number, durationSeconds: number }) => Promise<void>,
 * }}
 */
export function useTrainingCompletions() {
  const [completions, setCompletions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTrainingCompletions(), getTrainingProgress()])
      .then(([completionData, progressData]) => {
        if (cancelled) return;
        setCompletions(completionData);
        setProgress(progressData);
        setLoaded(true);
      })
      .catch((err) => {
        // BUG FIX (Sprint 8 polish): önceden burada .catch() yoktu — bir okuma hatası
        // olursa `loaded` hiç true olmuyor, TrainingModule.jsx SONSUZA KADAR "Eğitimler
        // yükleniyor..." gösteriyordu. Kullanıcının yeniden deneme/hata görme şansı yoktu.
        console.error("Eğitim verileri yüklenemedi:", err);
        if (!cancelled) { setError(err); setLoaded(true); }
      });
    return () => { cancelled = true; };
  }, []);

  // UX FIX (Eğitim cilası — yanıltıcı "başarılı" durumu): CoursePlayer.jsx'in
  // `handleQuizSubmit`'i bu fonksiyonu ("onComplete") ÇAĞIRDIKTAN HEMEN SONRA, sonucunu
  // beklemeden "Tamamlandı" ekranını gösteriyor (akış hızını korumak için kasıtlı — bkz.
  // orada). Ama önceden burada hiç try/catch yoktu: kayıt IndexedDB'ye yazılamazsa
  // (örn. depolama alanı erişilemez), kullanıcı ekranda "Başarılı — Eğitim Tamamlandı"
  // görüyor ve hatta Tamamlama Belgesi'ni yazdırabiliyor, ama arkadaki asıl
  // TrainingCompletion kaydı (uzaktan eğitimin verildiğinin belgesi — bkz. CoursePlayer.jsx
  // dosya başı yorumu) SESSİZCE hiç oluşmamış oluyordu. Artık hata konsola yazılıyor ve
  // kullanıcıya net bir toast ile bildiriliyor.
  const recordCompletion = useCallback(async (data) => {
    try {
      const saved = await saveTrainingCompletion(data);
      setCompletions((prev) => [...prev, saved]);
      logActivity({
        actor: data.employeeName,
        action: data.passed ? "Eğitim tamamlandı" : "Eğitim sınavı geçilemedi",
        details: `${data.courseId} — %${data.quizScore}`,
        entityType: "training",
      });
    } catch (err) {
      console.error("Eğitim tamamlama kaydı oluşturulamadı:", err);
      showToast("Sınav sonucu kaydedilemedi. Lütfen sınavı tekrar tamamlayın.", "error");
    }
  }, [showToast]);

  const recordProgress = useCallback(async (data) => {
    try {
      const saved = await saveTrainingProgressRecord(data);
      setProgress((prev) => [...prev.filter((p) => p.id !== saved.id), saved]);
    } catch (err) {
      // Video izleme ilerlemesi periyodik olarak (throttle'lı) sessizce kaydedilir —
      // burada bir toast göstermek her birkaç saniyede bir kullanıcıyı rahatsız eder.
      // Teknik iz için konsola yazmak yeterli; nihai "tamamlandı" kaydı zaten
      // recordCompletion'da ayrıca ve görünür şekilde korunuyor.
      console.error("Video izleme ilerlemesi kaydedilemedi:", err);
    }
  }, []);

  return { completions, progress, loaded, error, recordCompletion, recordProgress };
}
