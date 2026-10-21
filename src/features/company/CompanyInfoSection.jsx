import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { useSubmitGuard } from "../../hooks/useSubmitGuard.js";
import { getRoleLabel } from "../../constants/allRoles.js";
import { getPrimaryCompany, saveCompany, setActiveCompany } from "../../services/companyService.js";
import { logActivity } from "../../services/auditService.js";
import { createId } from "../../utils/id.js";
import { SECTOR_OPTIONS, DANGER_CLASS_OPTIONS } from "../../constants/company.js";
import { validateImageFile } from "../../utils/fileValidation.js";
import Button from "../../components/ui/Button.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { Building2 } from "../../components/icons/index.jsx";
import { buildCompanyUpdate } from "./companyForm.js";
import { isRoleEnabled, isFeatureEnabled } from "../../constants/releaseProfile.js";

const EMPTY_COMPANY = { name: "", taxNumber: "", sector: SECTOR_OPTIONS[0], employeeCount: "", logo: null, address: "", phone: "", email: "", expertIsEmployer: false, dangerClass: "" };

/**
 * @param {{ theme: object, onCompanyLoaded: (company: object|null) => void }} props
 */
export default function CompanyInfoSection({ theme, onCompanyLoaded = () => {}, createNew = false }) {
  const { showToast } = useToast();
  const { role } = useRole();
  const showAdminFields = isFeatureEnabled("companyAdminFields");
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(EMPTY_COMPANY);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadCompany = useCallback(() => {
    setLoaded(false);
    setLoadError(false);
    if (createNew) { setLoaded(true); return; }
    getPrimaryCompany()
      .then((c) => {
        setCompany(c);
        if (c) setForm({ ...EMPTY_COMPANY, ...c });
        onCompanyLoaded(c);
        setLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const { valid, error } = await validateImageFile(file);
    if (!valid) {
      showToast(error, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const count = Number(form.employeeCount);
    if (!Number.isSafeInteger(count) || count < 0) {
      showToast("Çalışan sayısı sıfır veya pozitif bir tam sayı olmalı.", "error");
      return;
    }
    const saved = {
      ...buildCompanyUpdate(form, company, showAdminFields),
      id: company?.id || createId(),
    };
    // UX FIX (hata yönetimi cilası): önceden try/catch yoktu — kayıt başarısız olursa
    // (örn. depolama alanı erişilemez) kullanıcıya hiçbir geri bildirim verilmiyordu,
    // buton tekrar aktif oluyordu ama hiçbir açıklama yoktu. Diğer form modülleriyle
    // (Çalışanlar, Şubeler, Departmanlar) tutarlı hale getirildi.
    try {
      const persisted = await saveCompany(saved);
      if (createNew) {
        await setActiveCompany(persisted.id);
        window.location.reload();
        return;
      }
      setCompany(persisted);
      onCompanyLoaded(persisted);
      showToast(company ? "Firma bilgileri güncellendi." : "Firma oluşturuldu.", "success");
      logActivity({
        actor: getRoleLabel(role) || role,
        action: company ? "Firma bilgileri güncellendi" : "Firma oluşturuldu",
        details: saved.name,
        entityType: "company",
      });
    } catch (err) {
      console.error("Firma bilgileri kaydedilemedi:", err);
      showToast(err.message || "Firma bilgileri kaydedilemedi.", "error");
    }
  }
  // HARDENING: özellikle burada önemli — çift tıklama korunmazsa iki AYRI firma kaydı
  // oluşabilir (uygulamanın geri kalanı tek-firma varsayımıyla çalışıyor, bkz.
  // companyService.getPrimaryCompanyId → companies[0]). Bkz. hooks/useSubmitGuard.js.
  const [guardedHandleSave, isSubmitting] = useSubmitGuard(handleSave);

  if (!loaded) return <Loading label="Firma bilgileri yükleniyor..." />;
  if (loadError) return <ErrorState title="Firma bilgileri yüklenemedi" description="Bir sorun oluştu, tekrar deneyebilirsiniz." onRetry={loadCompany} />;

  return (
    <div>
      {!company && (
        <div className="rounded-lg px-3 py-2.5 mb-3 text-xs" style={{ background: theme.warnBg, color: theme.warnText }}>
          Çalışma alanınızı oluşturmak için firma bilgilerini kaydedin.
        </div>
      )}

      {showAdminFields && <div className="flex items-center gap-3 mb-4">
        <div className="w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden shrink-0" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          {form.logo ? <img src={form.logo} alt="Firma logosu" className="w-full h-full object-cover" /> : <Building2 style={{ fontSize: "24px", color: theme.textFaint }} />}
        </div>
        <label className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer" style={{ background: theme.surfaceAlt, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>
          Logo Yükle
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </label>
      </div>}

      <div className="grid gap-3 mb-4">
        {[
          { key: "name", label: "Firma adı", required: true },
          { key: "sector", label: "Sektör", options: SECTOR_OPTIONS.map((value) => ({ value, label: value })) },
          { key: "dangerClass", label: "Tehlike sınıfı", options: [{ value: "", label: "Seçiniz" }, ...DANGER_CLASS_OPTIONS] },
          { key: "employeeCount", label: "Çalışan sayısı", type: "number" },
          ...(showAdminFields ? [
            { key: "address", label: "İşyeri adresi" },
            { key: "taxNumber", label: "Vergi numarası" },
            { key: "phone", label: "Telefon", type: "tel" },
            { key: "email", label: "E-posta", type: "email" },
          ] : []),
        ].map(({ key, label, options, type = "text", required }) => {
          const props = {
            value: form[key],
            onChange: (e) => setForm((previous) => ({ ...previous, [key]: e.target.value })),
            className: "w-full text-sm rounded-lg px-3 py-2 border",
            style: { background: theme.surface, borderColor: theme.border, color: theme.textPrimary },
            required,
          };
          return (
            <label key={key} className="block text-xs font-medium" style={{ color: theme.textMuted }}>
              <span className="block mb-1">{label}{required ? " *" : ""}</span>
              {options ? <select {...props}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                : <input {...props} type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "1" : undefined} />}
            </label>
          );
        })}
      </div>

      {isRoleEnabled("employer") && <label className="flex items-start gap-2.5 rounded-lg border px-3 py-2.5 mb-3 cursor-pointer" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
        <input type="checkbox" checked={Boolean(form.expertIsEmployer)} onChange={(e) => setForm({ ...form, expertIsEmployer: e.target.checked })}
          className="mt-0.5" style={{ accentColor: theme.accent }} />
        <span>
          <span className="block text-sm font-medium" style={{ color: theme.textPrimary }}>İSG Uzmanı ve İşveren aynı kişi mi?</span>
          <span className="block text-[11px] mt-0.5" style={{ color: theme.textFaint }}>
            İşaretlenirse İşveren rolü de Fine-Kinney risk
            değerlendirmesi oluşturabilir/düzenleyebilir. Aksi halde İşveren risk değerlendirmelerini
            yalnızca görüntüler — ekleme/düzenleme/kapatma İSG Uzmanı'na özgü kalır.
          </span>
        </span>
      </label>}

      <Button onClick={guardedHandleSave} disabled={!form.name.trim() || isSubmitting}>{isSubmitting ? "Kaydediliyor..." : company ? "Güncelle" : "Firma Oluştur"}</Button>
    </div>
  );
}
