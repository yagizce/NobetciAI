import Modal from "../../../components/ui/Modal.jsx";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { computeDepartmentDetail } from "../../../utils/departmentDetail.js";
import { TRAINING_COURSES } from "../../../constants/trainingCourses.js";
import { Flame, AlertTriangle, BookOpen, Info } from "../../../components/icons/index.jsx";

/**
 * Sprint: Risk Isı Haritası'na tıklanınca açılan Departman Detay Paneli. 5 alan:
 * açık riskler, son ramak kala, son iş kazası, eğitim oranı, periyodik kontrol
 * durumu. İlk alan (+ periyodik kontrol) doğrudan departmentId'den, son 2
 * (ramak kala/kaza) + eğitim oranı isim eşleştirmesinden (best-effort) gelir —
 * ikisi ayrı görsel bölümlerde, best-effort olan açıkça etiketlenmiş.
 *
 * NOT: "Ortalama Risk Puanı" istatistiği kaldırıldı — İşveren için soyut/teknik
 * bir Fine-Kinney sayısıydı, doğrudan aksiyon alınabilir bir anlam taşımıyordu.
 * Altyapıdaki hesaplama (utils/departmentDetail.js → avgRiskScore/riskLevel)
 * bilerek DOKUNULMADAN bırakıldı, yalnızca burada gösterimi kaldırıldı.
 *
 * @param {{ department: {id: string|number, name: string}|null, onClose: () => void,
 *   fineKinneyEntries: object[], periodicChecks: object[], notifications: object[],
 *   employees: object[], trainingProgressRecords: object[], trainingCompletionRecords: object[] }} props
 */
export default function DepartmentDetailPanel({ department, onClose, fineKinneyEntries, periodicChecks, notifications, employees, trainingProgressRecords, trainingCompletionRecords }) {
  const { theme } = useTheme();
  if (!department) return null;

  const detail = computeDepartmentDetail(department.id, {
    fineKinneyEntries, periodicChecks, notifications, employees,
    trainingProgressRecords, trainingCompletionRecords, courses: TRAINING_COURSES,
  });

  const dateLabel = (d) => (d ? new Date(d._comparableDate).toLocaleDateString("tr-TR") : null);

  return (
    <Modal open={Boolean(department)} onClose={onClose} title={department.name}>
      <div className="flex flex-col gap-4">
        {/* Güvenilir bölüm */}
        <StatCell theme={theme} icon={Flame} label="Açık Risk" value={detail.openRiskCount} unit="kayıt" />

        <div>
          <p className="text-[11px] font-semibold mb-1.5" style={{ color: theme.textMuted }}>Periyodik Kontrol Durumu</p>
          <div className="flex gap-2 flex-wrap">
            <MiniBadge theme={theme} label="Güncel" value={detail.periodicCheckStats.okCount} tone="success" />
            <MiniBadge theme={theme} label="Yaklaşıyor" value={detail.periodicCheckStats.upcomingCount} tone="warning" />
            <MiniBadge theme={theme} label="Süresi Geçti" value={detail.periodicCheckStats.overdueCount} tone="danger" />
          </div>
          {detail.periodicCheckStats.totalCount === 0 && (
            <p className="text-[10.5px] mt-1" style={{ color: theme.textFaint }}>Bu departmana bağlı periyodik kontrol kaydı yok.</p>
          )}
        </div>

        <div className="h-px" style={{ background: theme.border }} />

        {/* Best-effort bölüm — isim eşleştirmeli */}
        <div className="flex items-start gap-1.5 rounded-lg px-2.5 py-2" style={{ background: theme.surfaceAlt }}>
          <Info style={{ fontSize: "13px", color: theme.textFaint, marginTop: "1px" }} />
          <p className="text-[10.5px]" style={{ color: theme.textFaint }}>
            Aşağıdaki 3 alan, kayıtlardaki isimle çalışan listesi eşleştirilerek hesaplanır — kesin değil, en iyi eşleşmedir. Departmanda kayıtlı {detail.departmentEmployeeCount} çalışan üzerinden hesaplandı.
          </p>
        </div>

        <StatRow theme={theme} icon={AlertTriangle} label="Son Ramak Kala"
          value={detail.lastNearMiss ? `${dateLabel(detail.lastNearMiss)} — ${detail.lastNearMiss.desc || ""}` : "Kayıt yok"} />
        <StatRow theme={theme} icon={AlertTriangle} label="Son İş Kazası"
          value={detail.lastAccident ? `${dateLabel(detail.lastAccident)} — ${detail.lastAccident.desc || ""}` : "Kayıt yok"}
          tone={detail.lastAccident ? "danger" : "neutral"} />
        <StatRow theme={theme} icon={BookOpen} label="Eğitim Tamamlama"
          value={detail.trainingParticipantCount > 0 ? `%${detail.trainingCompletionRatePercent} (${detail.trainingParticipantCount} çalışan)` : "Henüz kayıt yok"} />
      </div>
    </Modal>
  );
}

function StatCell({ theme, icon: Icon, label, value, unit, valueColor }) {
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      <div className="flex items-center gap-1 mb-1">
        <Icon style={{ fontSize: "12px", color: theme.textFaint }} />
        <span className="text-[10.5px] font-semibold" style={{ color: theme.textMuted }}>{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: valueColor || theme.textPrimary }}>{value}</p>
      {unit && <p className="text-[10px]" style={{ color: theme.textFaint }}>{unit}</p>}
    </div>
  );
}

function MiniBadge({ theme, label, value, tone }) {
  const colors = { success: theme.successBg, warning: theme.warnBg, danger: theme.highRiskBg }[tone];
  const textColors = { success: theme.successText, warning: theme.warnText, danger: theme.highRiskText }[tone];
  return (
    <span className="text-[10.5px] font-semibold px-2 py-1 rounded-full" style={{ background: colors, color: textColors }}>
      {value} {label}
    </span>
  );
}

function StatRow({ theme, icon: Icon, label, value, tone = "neutral" }) {
  const textColor = tone === "danger" ? theme.highRiskText : theme.textPrimary;
  return (
    <div className="flex items-start gap-2">
      <Icon style={{ fontSize: "13px", color: theme.textFaint, marginTop: "2px" }} />
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold" style={{ color: theme.textMuted }}>{label}</p>
        <p className="text-xs" style={{ color: textColor }}>{value}</p>
      </div>
    </div>
  );
}
