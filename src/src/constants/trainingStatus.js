// Sprint 7.2.1 — Eğitim durumu modeli. constants/riskWorkflow.js ile AYNI desen:
// durum listesi + saf bir "resolve" fonksiyonu. Hiçbir yerde kalıcı olarak saklanmaz —
// TrainingProgress (izleme) ve TrainingCompletion (sınav sonucu) kayıtlarından HER
// render'da anlık hesaplanır, tıpkı resolveEntryWorkflowState gibi.

export const TRAINING_STATUSES = [
  { id: "assigned", label: "Atandı", tone: "neutral" },
  { id: "inProgress", label: "Devam Ediyor", tone: "warning" },
  { id: "completed", label: "Tamamlandı", tone: "success" },
  { id: "failed", label: "Kaldı", tone: "danger" },
];

export function getTrainingStatus(statusId) {
  return TRAINING_STATUSES.find((s) => s.id === statusId) || TRAINING_STATUSES[0];
}

/**
 * Bir çalışanın bir kurstaki durumunu, ilerleme ve sınav denemesi kayıtlarından
 * hesaplar. Öncelik sırası: Completed (kalıcı — bir kez geçildiyse, sonradan tekrar
 * izlense bile durum düşürülmez) > yeniden izleniyorsa In Progress > Failed >
 * ilerleme varsa In Progress > Assigned.
 * @param {{ progress: import("../types/index.js").TrainingProgress|null, completions: import("../types/index.js").TrainingCompletion[] }} args
 * @returns {typeof TRAINING_STATUSES[number]}
 */
export function resolveTrainingStatus({ progress, completions }) {
  const latestCompletion = completions.length > 0
    ? [...completions].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
    : null;

  if (latestCompletion?.passed) return getTrainingStatus("completed");

  // Son sınav denemesi başarısızdı ama çalışan o denemeden SONRA yeniden izlemeye
  // başladıysa (yeni bir deneme sürecinde), "Kaldı" yerine "Devam Ediyor" gösterilir.
  const isRewatchingAfterFailure = Boolean(
    progress && latestCompletion && new Date(progress.updatedAt) > new Date(latestCompletion.completedAt)
  );

  if (latestCompletion && !isRewatchingAfterFailure) return getTrainingStatus("failed");
  if (progress && progress.positionSeconds > 0) return getTrainingStatus("inProgress");
  return getTrainingStatus("assigned");
}

/**
 * @param {import("../types/index.js").TrainingProgress|null} progress
 * @returns {number} 0-100
 */
export function computeProgressPercent(progress) {
  if (!progress || !progress.durationSeconds) return 0;
  return Math.min(100, Math.round((progress.positionSeconds / progress.durationSeconds) * 100));
}

/**
 * Yarım kalmış bir eğitimde kalan süreyi saniye cinsinden döner (negatife düşmez).
 * Çalışan Paneli'nde "Devam Eden Eğitim" kartının kalan süre göstergesi için —
 * bkz. EmployeeDashboard.jsx.
 * @param {import("../types/index.js").TrainingProgress|null} progress
 * @returns {number}
 */
export function computeRemainingSeconds(progress) {
  if (!progress || !progress.durationSeconds) return 0;
  return Math.max(0, progress.durationSeconds - (progress.positionSeconds || 0));
}

/**
 * Saniyeyi "12 dk" / "1 sa 5 dk" gibi kısa, okunabilir bir Türkçe süreye çevirir.
 * 60 saniyenin altındaki kalan süreler "1 dk"dan az kaybolmasın diye en az 1 dk gösterir.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatRemainingDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  if (seconds === 0) return "0 dk";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.max(1, Math.round((seconds % 3600) / 60));
  if (hours === 0) return `${minutes} dk`;
  return `${hours} sa ${minutes} dk`;
}

/**
 * Dashboard'un kullanacağı eğitim istatistikleri. Yalnızca en az bir ilerleme/tamamlama
 * kaydı bulunan çalışanlar üzerinden hesaplanır — gerçek veri yoksa sahte bir yüzde
 * UYDURULMAZ, 0 döner (bkz. DEVELOPMENT_RULES.md → General Rules).
 * @param {object[]} courses - constants/trainingCourses.js → TRAINING_COURSES
 * @param {import("../types/index.js").TrainingProgress[]} progressRecords
 * @param {import("../types/index.js").TrainingCompletion[]} completionRecords
 * @returns {{ participantCount: number, assignedCount: number, inProgressCount: number, completedCount: number, failedCount: number, completionRatePercent: number }}
 */
export function computeTrainingStats(courses, progressRecords, completionRecords) {
  const employeeNames = new Set([
    ...progressRecords.map((p) => p.employeeName),
    ...completionRecords.map((c) => c.employeeName),
  ]);

  if (employeeNames.size === 0 || courses.length === 0) {
    return { participantCount: 0, assignedCount: courses.length, inProgressCount: 0, completedCount: 0, failedCount: 0, completionRatePercent: 0 };
  }

  let completedCount = 0, inProgressCount = 0, failedCount = 0, assignedCount = 0;

  for (const course of courses) {
    for (const employeeName of employeeNames) {
      const progress = progressRecords.find((p) => p.courseId === course.id && p.employeeName === employeeName) || null;
      const completions = completionRecords.filter((c) => c.courseId === course.id && c.employeeName === employeeName);
      const status = resolveTrainingStatus({ progress, completions });
      if (status.id === "completed") completedCount += 1;
      else if (status.id === "inProgress") inProgressCount += 1;
      else if (status.id === "failed") failedCount += 1;
      else assignedCount += 1;
    }
  }

  const totalSlots = courses.length * employeeNames.size;
  return {
    participantCount: employeeNames.size,
    assignedCount,
    inProgressCount,
    completedCount,
    failedCount,
    completionRatePercent: totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0,
  };
}

/**
 * Sprint 7.4 — Dashboard'daki "Devam Eden Eğitimler" kartı için: hâlâ izlemekte olan
 * (status === "inProgress") katılımcıların en son aktiviteye göre sıralanmış listesi.
 * `computeTrainingStats` yalnızca toplam sayıları verir, bu fonksiyon isim/kurs bazında
 * somut satırlar üretir — mock veri UYDURULMAZ, gerçek `trainingProgress` kayıtlarından
 * türetilir (bkz. DEVELOPMENT_RULES.md → General Rules).
 * @param {object[]} courses - constants/trainingCourses.js → TRAINING_COURSES
 * @param {import("../types/index.js").TrainingProgress[]} progressRecords
 * @param {import("../types/index.js").TrainingCompletion[]} completionRecords
 * @param {number} [limit]
 * @returns {Array<{ employeeName: string, courseTitle: string, progressPercent: number, updatedAt: string }>}
 */
export function getOngoingTrainingItems(courses, progressRecords, completionRecords, limit = 5) {
  const items = [];
  for (const progress of progressRecords) {
    const course = courses.find((c) => c.id === progress.courseId);
    if (!course) continue;
    const myCompletions = completionRecords.filter(
      (c) => c.courseId === progress.courseId && c.employeeName === progress.employeeName
    );
    const status = resolveTrainingStatus({ progress, completions: myCompletions });
    if (status.id !== "inProgress") continue;
    items.push({
      employeeName: progress.employeeName,
      courseTitle: course.title,
      progressPercent: computeProgressPercent(progress),
      updatedAt: progress.updatedAt,
    });
  }
  return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, limit);
}

// Hatırlatma bildirimleri için, periyodik kontrollerdeki REMINDER_THRESHOLD_DAYS (3 gün)
// ile TUTARLI aynı eşik. Bilinçli olarak burada AYRI bir sabit olarak tutuluyor (iki dosya
// birbirini import ETMİYOR) — ikisi kavramsal olarak bağımsız modüller, sayısal değerin
// aynı olması tesadüf değil ama kod bağımlılığı gerektirmiyor.
const TRAINING_REMINDER_THRESHOLD_DAYS = 3;

/**
 * Bildirim/Hatırlatma sistemi (useReminderScheduler.js) için: belirli bir çalışanın,
 * son tarihi geçmiş VEYA yaklaşan (≤3 gün) VE henüz TAMAMLAMADIĞI kursları döner.
 * Son tarihi olmayan (dueDate: null) kurslar hiçbir zaman hatırlatma üretmez.
 *
 * @param {object[]} courses - constants/trainingCourses.js → TRAINING_COURSES
 * @param {Array<{id: string|number, courseId: string, dueDate: string|null}>} courseSettings - services/trainingCourseSettingsService.js
 * @param {import("../types/index.js").TrainingProgress[]} progressRecords
 * @param {import("../types/index.js").TrainingCompletion[]} completionRecords
 * @param {string} employeeName
 * @returns {Array<{ courseId: string, courseTitle: string, dueDate: string, status: "overdue"|"dueSoon" }>}
 */
export function getUpcomingTrainingDueReminders(courses, courseSettings, progressRecords, completionRecords, employeeName) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reminders = [];

  for (const course of courses) {
    const setting = courseSettings.find((s) => String(s.courseId || s.id) === String(course.id));
    if (!setting?.dueDate) continue;

    const myProgress = progressRecords.find((p) => p.courseId === course.id && p.employeeName === employeeName) || null;
    const myCompletions = completionRecords.filter((c) => c.courseId === course.id && c.employeeName === employeeName);
    const status = resolveTrainingStatus({ progress: myProgress, completions: myCompletions });
    if (status.id === "completed") continue; // tamamlandıysa hiçbir zaman hatırlatma üretilmez

    const due = new Date(setting.dueDate);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) reminders.push({ courseId: course.id, courseTitle: course.title, dueDate: setting.dueDate, status: "overdue" });
    else if (diffDays <= TRAINING_REMINDER_THRESHOLD_DAYS) reminders.push({ courseId: course.id, courseTitle: course.title, dueDate: setting.dueDate, status: "dueSoon" });
  }

  return reminders;
}
