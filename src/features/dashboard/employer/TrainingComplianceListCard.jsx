import { computeTrainingComplianceGaps } from "../../../utils/trainingComplianceGaps.js";
import { TRAINING_COURSES } from "../../../constants/trainingCourses.js";
import { UserRound, CheckCircle2 } from "../../../components/icons/index.jsx";

/**
 * Sprint: Eğitim Uyum Listesi — "kim hangi eğitimi almadı" sorusuna denetimde
 * ibraz edilebilir, çalışan bazlı net cevap. `trainingComplianceGaps.js`'teki
 * notu tekrarlıyoruz: isim eşleştirmesi kesin değildir.
 *
 * @param {{ theme: object, employees: object[], trainingProgressRecords: object[], trainingCompletionRecords: object[] }} props
 */
export default function TrainingComplianceListCard({ theme, employees, trainingProgressRecords, trainingCompletionRecords }) {
  const gaps = computeTrainingComplianceGaps(employees, TRAINING_COURSES, trainingProgressRecords, trainingCompletionRecords);

  if (gaps.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-3" style={{ background: theme.successBg }}>
        <CheckCircle2 style={{ fontSize: "16px", color: theme.successText }} />
        <p className="text-xs font-medium" style={{ color: theme.successText }}>Tüm aktif çalışanlar tüm eğitimleri tamamlamış görünüyor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10.5px]" style={{ color: theme.textFaint }}>İsim eşleştirmesiyle hesaplandı — kesin liste için Eğitim modülünden teyit edin.</p>
      {gaps.map(({ employee, missingCourses }) => (
        <div key={employee.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
          <div className="flex items-center gap-1.5 mb-1">
            <UserRound style={{ fontSize: "13px", color: theme.textMuted }} className="shrink-0" />
            <p className="text-sm font-semibold min-w-0 flex-1 truncate" style={{ color: theme.textPrimary }}>{employee.fullName}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0" style={{ background: theme.highRiskBg, color: theme.highRiskText }}>
              {missingCourses.length} eksik
            </span>
          </div>
          <p className="text-[11px]" style={{ color: theme.textMuted }}>{missingCourses.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}
