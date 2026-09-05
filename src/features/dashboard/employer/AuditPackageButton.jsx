import { useState } from "react";
import { exportAuditPackage } from "./auditPackageExport.js";
import { todayISO, isoDateNDaysAgo } from "../../../utils/dateUtils.js";
import { FileText, AlertTriangle } from "../../../components/icons/index.jsx";
import AuditReadinessChecklist from "./AuditReadinessChecklist.jsx";
import { useToast } from "../../../contexts/ToastContext.jsx";

/**
 * Sprint: Tek Tık Denetim Dosyası. Varsayılan aralık son 30 gündür, kullanıcı
 * müfettişin istediği herhangi bir aralığa değiştirebilir. Popup engellenirse
 * (`opened: false`) sessizce başarısız olmak yerine kullanıcıya açıkça bildirilir.
 *
 * Denetim Öncesi Hazırlık Checklist'i (bkz. AuditReadinessChecklist.jsx) dosya
 * oluşturulmadan ÖNCE gösterilir — zorunlu belge eksikleri, termini geçmiş açık
 * kayıtlar, termini geçmiş periyodik kontroller ve kanıtsız kapatılmış kayıtları TEK
 * ekranda özetler. Eskiden burada yalnızca dar kapsamlı bir "eksik belge" uyarısı
 * vardı — checklist bunu da kapsadığı için o uyarı kaldırıldı, tekrar önlendi.
 *
 * @param {{ theme: object, fineKinneyEntries: object[], periodicChecks: object[], trainingStats: object, companyName: string|null, documents?: object[] }} props
 */
export default function AuditPackageButton({ theme, fineKinneyEntries, periodicChecks, trainingStats, companyName, documents = [] }) {
  const [startDate, setStartDate] = useState(isoDateNDaysAgo(30));
  const [endDate, setEndDate] = useState(todayISO());
  const [popupBlocked, setPopupBlocked] = useState(false);
  const { showToast } = useToast();

  async function handleGenerate() {
    setPopupBlocked(false);
    // exportAuditPackage artık kanıt fotoğraflarını popup açılmadan önce çözümlüyor
    // (bkz. auditPackageExport.js → resolveEntryPhoto), bu yüzden async.
    // UX FIX (hata yönetimi cilası): bu çağrının etrafında hiç try/catch yoktu — beklenmedik
    // bir hata (örn. IndexedDB'ye erişilemedi) düğmeye basıldıktan sonra hiçbir görsel geri
    // bildirim vermeden sessizce başarısız oluyordu, kullanıcı hiçbir şey olmamış gibi kalıyordu.
    try {
      const result = await exportAuditPackage({ fineKinneyEntries, periodicChecks, trainingStats, companyName, startDate, endDate, documents });
      if (!result.opened) setPopupBlocked(true);
    } catch (err) {
      console.error("Denetim dosyası oluşturulamadı:", err);
      showToast("Denetim dosyası oluşturulamadı. Lütfen tekrar deneyin.", "error");
    }
  }

  const rangeInvalid = startDate > endDate;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px]" style={{ color: theme.textFaint }}>
        Seçilen aralıktaki tüm risk kayıtları + yapılan periyodik kontroller + genel eğitim durumunu tek dosyada birleştirir. Denetimde ibraz için hazır.
      </p>
      <AuditReadinessChecklist theme={theme} documents={documents} fineKinneyEntries={fineKinneyEntries} periodicChecks={periodicChecks} />
      <div className="flex items-center gap-2 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs" style={{ color: theme.textMuted }}>
          Başlangıç
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: theme.border, background: theme.surface, color: theme.textPrimary }} />
        </label>
        <label className="flex items-center gap-1.5 text-xs" style={{ color: theme.textMuted }}>
          Bitiş
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: theme.border, background: theme.surface, color: theme.textPrimary }} />
        </label>
        <button
          onClick={handleGenerate}
          disabled={rangeInvalid}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
          style={{ background: theme.accent, color: theme.onAccent }}
        >
          <FileText style={{ fontSize: "13px" }} /> Denetim Dosyası Oluştur
        </button>
      </div>
      {rangeInvalid && (
        <p className="text-[10.5px]" style={{ color: theme.highRiskText }}>Başlangıç tarihi, bitiş tarihinden sonra olamaz.</p>
      )}
      {popupBlocked && (
        <div className="flex items-center gap-1.5 text-[10.5px] rounded-lg px-2.5 py-1.5" style={{ background: theme.warnBg, color: theme.warnText }}>
          <AlertTriangle style={{ fontSize: "12px" }} /> Tarayıcı popup'ı engelledi — bu site için popup izni verip tekrar deneyin.
        </div>
      )}
    </div>
  );
}
