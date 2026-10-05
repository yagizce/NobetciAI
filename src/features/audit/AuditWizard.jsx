import { useState } from "react";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { todayISO } from "../../utils/dateUtils.js";
import { ChevronLeft } from "../../components/icons/index.jsx";

const STEP_LABELS = ["Kapsam", "Özet"];

/**
 * Yeni denetim oluşturma sihirbazı — denetim TÜRÜNDEN bağımsız, jenerik bileşen.
 * ISO 45001 ve İSG Mevzuat Denetimi (ve ileride 9001/14001/27001) AYNI bileşeni,
 * yalnızca `standardLabel`/`generateChecklist` prop'ları farklı geçirerek kullanır.
 *
 * FAZ 1 KAPSAM NOTU: standart seçimi ve denetçi/adam-gün ataması adımları
 * BİLİNÇLİ OLARAK YOK — her sayfa zaten kendi türünü sabit kullanıyor, adam-gün
 * ataması da istek listesinde yok. `constants/isoStandards.js`'teki çoklu-standart
 * + adam-gün/denetçi mantığı SİLİNMEDİ, sadece bu sihirbaza bağlanmadı.
 *
 * @param {{ open: boolean, onClose: () => void, onCreate: (input: object) => Promise<void>,
 *   companyName: string, departments: Array<{id, name}>, standardLabel: string,
 *   generateChecklist: () => object[] }} props
 */
export default function AuditWizard({ open, onClose, onCreate, companyName, departments, standardLabel, generateChecklist }) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [scopeDescription, setScopeDescription] = useState("");
  const [scopeDepartmentIds, setScopeDepartmentIds] = useState([]);
  const [plannedDate, setPlannedDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setStep(0); setScopeDescription(""); setScopeDepartmentIds([]); setPlannedDate(todayISO());
  }

  function close() { reset(); onClose(); }

  function toggleDepartment(id) {
    setScopeDepartmentIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function handleCreate() {
    setSubmitting(true);
    try {
      await onCreate({
        scopeDescription: scopeDescription.trim() || "Tüm firma",
        scopeDepartmentIds,
        plannedDate,
        checklist: generateChecklist(),
      });
      close();
    } catch (err) {
      // Kayıt başarısız olursa pencere AÇIK kalır (girilen kapsam kaybolmaz) ve kullanıcıya
      // anlaşılır bir mesaj gösterilir — önceden hata yakalanmıyor, hiçbir şey olmuyordu.
      console.error("Denetim oluşturulamadı:", err);
      const noCompany = /aktif firma/.test(err?.message || "");
      showToast(
        noCompany
          ? "Denetim oluşturulamadı: aktif firma bulunamadı. Önce firma bilgilerinizi oluşturun."
          : "Denetim oluşturulamadı. Lütfen tekrar deneyin.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary };

  return (
    <Modal open={open} onClose={close} title={`Yeni Denetim — ${standardLabel}`}>
      <div className="flex items-center gap-1.5 mb-4">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-1 rounded-full" style={{ background: i <= step ? theme.accent : theme.border }} />
            <span className="text-[9.5px] text-center" style={{ color: theme.textFaint }}>{label}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs" style={{ color: theme.textFaint }}>Müşteri: <strong style={{ color: theme.textPrimary }}>{companyName || "Aktif Firma"}</strong></p>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Kapsam açıklaması</label>
            <input value={scopeDescription} onChange={(e) => setScopeDescription(e.target.value)} placeholder="Örn. Üretim sahası ve depo"
              className="w-full text-sm rounded-lg px-3 py-2 border outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Departmanlar (boş = tüm firma)</label>
            <div className="flex flex-wrap gap-1.5">
              {departments.length === 0 && <span className="text-xs" style={{ color: theme.textFaint }}>Firmaya departman eklenmemiş.</span>}
              {departments.map((d) => (
                <button key={d.id} type="button" onClick={() => toggleDepartment(d.id)}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full border"
                  style={scopeDepartmentIds.includes(d.id) ? { background: theme.accent, color: theme.onAccent, borderColor: theme.accent } : { borderColor: theme.border, color: theme.textMuted }}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Planlanan sahaya çıkış tarihi</label>
            <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2 border outline-none" style={inputStyle} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-2 text-sm" style={{ color: theme.textPrimary }}>
          <p><strong>Müşteri:</strong> {companyName}</p>
          <p><strong>Standart:</strong> {standardLabel}</p>
          <p><strong>Kapsam:</strong> {scopeDescription.trim() || "Tüm firma"}{scopeDepartmentIds.length > 0 ? ` (${scopeDepartmentIds.length} departman)` : ""}</p>
          <p><strong>Tarih:</strong> {plannedDate}</p>
          <p className="text-xs mt-2" style={{ color: theme.textFaint }}>
            Oluştur'a bastığında, {standardLabel} kriter listesi otomatik hazırlanacak.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-5">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1">
            <ChevronLeft style={{ fontSize: "13px" }} /> Geri
          </Button>
        )}
        <div className="flex-1" />
        {step < 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>İleri</Button>
        ) : (
          <Button onClick={handleCreate} disabled={submitting}>{submitting ? "Oluşturuluyor..." : "Denetimi Oluştur"}</Button>
        )}
      </div>
    </Modal>
  );
}
