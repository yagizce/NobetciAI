import { useState } from "react";
import { exportAuditPackage } from "./auditPackageExport.js";
import { todayISO, isoDateNDaysAgo } from "../../../utils/dateUtils.js";
import { FileText, AlertTriangle } from "../../../components/icons/index.jsx";

/**
 * Sprint: Tek Tık Denetim Dosyası. Varsayılan aralık son 30 gündür, kullanıcı
 * müfettişin istediği herhangi bir aralığa değiştirebilir. Popup engellenirse
 * (`opened: false`) sessizce başarısız olmak yerine kullanıcıya açıkça bildirilir.
 *
 * @param {{ theme: object, fineKinneyEntries: object[], periodicChecks: object[], trainingStats: object, companyName: string|null }} props
 */
export default function AuditPackageButton({ theme, fineKinneyEntries, periodicChecks, trainingStats, companyName }) {
  const [startDate, setStartDate] = useState(isoDateNDaysAgo(30));
  const [endDate, setEndDate] = useState(todayISO());
  const [popupBlocked, setPopupBlocked] = useState(false);

  function handleGenerate() {
    setPopupBlocked(false);
    const result = exportAuditPackage({ fineKinneyEntries, periodicChecks, trainingStats, companyName, startDate, endDate });
    if (!result.opened) setPopupBlocked(true);
  }

  const rangeInvalid = startDate > endDate;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px]" style={{ color: theme.textFaint }}>
        Seçilen aralıktaki tüm risk kayıtları + yapılan periyodik kontroller + genel eğitim durumunu tek dosyada birleştirir. Denetimde ibraz için hazır.
      </p>
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
