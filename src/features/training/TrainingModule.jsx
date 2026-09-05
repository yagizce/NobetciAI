import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext.jsx";
import { TRAINING_COURSES } from "../../constants/trainingCourses.js";
import { MOCK_USERS } from "../../constants/mockUsers.js";
import { useTrainingCompletions } from "./useTrainingCompletions.js";
import { getTrainingCourseSettings, saveTrainingCourseDueDate } from "../../services/trainingCourseSettingsService.js";
import CourseCard from "./CourseCard.jsx";
import CoursePlayer from "./CoursePlayer.jsx";
import ParticipantListPanel from "./ParticipantListPanel.jsx";
import DashboardWidget from "../../components/DashboardWidget.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { Calendar } from "../../components/icons/index.jsx";

/**
 * Uzaktan Eğitim Modülü — DocumentsPage.jsx'teki "Eğitim Modülleri" sekmesinin içeriği.
 * Video (yer tutucu) → ileri sarma kapalı izleme → sınav → otomatik puanlama →
 * tamamlama kaydı akışı. Sertifika/PDF üretmez; tamamlama kaydının kendisi "uzaktan
 * eğitimin verildiğinin belgesi" işlevi görür.
 *
 * Katılımcı listesi yalnızca `role === "expert" || "employer"` iken gösterilir —
 * çalışanlar yalnızca kendi tamamlama durumlarını görür. Aynı roller, her kurs için
 * ŞİRKET ÇAPINDA bir son tarih belirleyebilir (bkz. trainingCourseSettingsService.js);
 * bu tarih hem burada bir "Son Tarih" rozeti olarak gösterilir hem de
 * useReminderScheduler.js tarafından hatırlatma bildirimi tetiklemek için kullanılır.
 *
 * @param {{ theme: object, role: "expert"|"employer"|"employee" }} props
 */
export default function TrainingModule({ theme, role }) {
  const { showToast } = useToast();
  const { completions, progress, loaded, error, recordCompletion, recordProgress } = useTrainingCompletions();
  const [activeCourse, setActiveCourse] = useState(null);
  const [expandedParticipants, setExpandedParticipants] = useState(null);
  const [courseSettings, setCourseSettings] = useState([]);

  useEffect(() => {
    getTrainingCourseSettings().then(setCourseSettings).catch((err) => console.error("Eğitim son tarihleri yüklenemedi:", err));
  }, []);

  const dueDateFor = (courseId) => courseSettings.find((s) => String(s.courseId || s.id) === String(courseId))?.dueDate || "";

  async function handleDueDateChange(courseId, dueDate) {
    // UX FIX (hata yönetimi cilası): önceden try/catch yoktu — kayıt başarısız olursa
    // kullanıcı tarihi değiştirmiş gibi görünüyor ama hiçbir geri bildirim almıyordu.
    try {
      const saved = await saveTrainingCourseDueDate(courseId, dueDate || null);
      setCourseSettings((prev) => {
        const rest = prev.filter((s) => String(s.courseId || s.id) !== String(courseId));
        return dueDate ? [...rest, saved] : rest;
      });
    } catch (err) {
      console.error("Eğitim son tarihi kaydedilemedi:", err);
      showToast("Son tarih kaydedilemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }

  const employeeName = MOCK_USERS[role]?.name || MOCK_USERS.employee.name;
  const canSeeParticipants = role === "expert" || role === "employer";

  const myCompletionsFor = (courseId) => completions.filter((c) => c.courseId === courseId && c.employeeName === employeeName);
  const myProgressFor = (courseId) => progress.find((p) => p.courseId === courseId && p.employeeName === employeeName) || null;

  if (!loaded) return <Loading label="Eğitimler yükleniyor..." />;
  if (error) return <ErrorState title="Eğitim verileri yüklenemedi" description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin." onRetry={() => window.location.reload()} />;

  return (
    <div>
      <div className="grid gap-2 md:grid-cols-2 mb-2">
        {TRAINING_COURSES.map((course) => (
          <CourseCard
            key={course.id}
            theme={theme}
            course={course}
            dueDate={dueDateFor(course.id)}
            myProgress={myProgressFor(course.id)}
            myCompletions={myCompletionsFor(course.id)}
            onStart={() => setActiveCourse(course)}
          />
        ))}
      </div>

      {canSeeParticipants && (
        <div className="mt-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2">
            {TRAINING_COURSES.map((course) => (
              <button
                key={course.id}
                onClick={() => setExpandedParticipants((cur) => (cur === course.id ? null : course.id))}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
                style={
                  expandedParticipants === course.id
                    ? { background: theme.accent, color: theme.onAccent }
                    : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }
                }
              >
                {course.title} Katılımcıları
              </button>
            ))}
          </div>

          {expandedParticipants && (
            <DashboardWidget theme={theme} title={`${TRAINING_COURSES.find((c) => c.id === expandedParticipants)?.title} — Katılımcılar`}>
              <label className="flex items-center gap-2 mb-3 text-xs" style={{ color: theme.textMuted }}>
                <Calendar style={{ fontSize: "14px" }} />
                Son Tarih (hatırlatma bildirimi için):
                <input
                  type="date"
                  value={dueDateFor(expandedParticipants)}
                  onChange={(e) => handleDueDateChange(expandedParticipants, e.target.value)}
                  className="text-xs rounded-md px-2 py-1 border"
                  style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
                />
              </label>
              <ParticipantListPanel theme={theme} course={TRAINING_COURSES.find((c) => c.id === expandedParticipants)} progress={progress} completions={completions} />
            </DashboardWidget>
          )}
        </div>
      )}

      {activeCourse && (
        <CoursePlayer
          theme={theme}
          course={activeCourse}
          employeeName={employeeName}
          myProgress={myProgressFor(activeCourse.id)}
          onClose={() => setActiveCourse(null)}
          onComplete={recordCompletion}
          onProgress={recordProgress}
        />
      )}
    </div>
  );
}
