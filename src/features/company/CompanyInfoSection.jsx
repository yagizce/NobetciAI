import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { useSubmitGuard } from "../../hooks/useSubmitGuard.js";
import { getRoleLabel } from "../../constants/allRoles.js";
import { getPrimaryCompany, saveCompany } from "../../services/companyService.js";
import { logActivity } from "../../services/auditService.js";
import { createId } from "../../utils/id.js";
import { SECTOR_OPTIONS, DANGER_CLASS_OPTIONS } from "../../constants/company.js";
import { validateImageFile } from "../../utils/fileValidation.js";
import Button from "../../components/ui/Button.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { Building2 } from "../../components/icons/index.jsx";
import { isRoleEnabled } from "../../constants/releaseProfile.js";

const EMPTY_COMPANY = { name: "", taxNumber: "", sector: SECTOR_OPTIONS[0], employeeCount: "", logo: null, address: "", phone: "", email: "", expertIsEmployer: false, dangerClass: "" };

/**
 * @param {{ theme: object, onCompanyLoaded: (company: object|null) => void }} props
 */
export default function CompanyInfoSection({ theme, onCompanyLoaded }) {
  const { showToast } = useToast();
  const { role } = useRole();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(EMPTY_COMPANY);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadCompany = useCallback(() => {
    setLoaded(false);
    setLoadError(false);
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
    const saved = {
      id: company?.id || createId(),
      name: form.name.trim(),
      taxNumber: form.taxNumber.trim(),
      sector: form.sector,
      employeeCount: Number(form.employeeCount) || 0,
      logo: form.logo,
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      expertIsEmployer: Boolean(form.expertIsEmployer),
      dangerClass: form.dangerClass || "",
    };
    // UX FIX (hata yönetimi cilası): önceden try/catch yoktu — kayıt başarısız olursa
    // (örn. depolama alanı erişilemez) kullanıcıya hiçbir geri bildirim verilmiyordu,
    // buton tekrar aktif oluyordu ama hiçbir açıklama yoktu. Diğer form modülleriyle
    // (Çalışanlar, Şubeler, Departmanlar) tutarlı hale getirildi.
    try {
      const persisted = await saveCompany(saved);
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
      showToast("Firma bilgileri kaydedilemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
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
          Şube ve departman eklemek için önce firma bilgilerini kaydedin.
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden shrink-0" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          {form.logo ? <img src={form.logo} alt="Firma logosu" className="w-full h-full object-cover" /> : <Building2 style={{ fontSize: "24px", color: theme.textFaint }} />}
        </div>
        <label className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer" style={{ background: theme.surfaceAlt, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>
          Logo Yükle
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 mb-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Firma adı *"
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
        <input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} placeholder="Vergi numarası (opsiyonel)"
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 mb-2">
        <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
          {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="number" min="0" value={form.employeeCount} onChange={(e) => setForm({ ...form, employeeCount: e.target.value })} placeholder="Çalışan sayısı"
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
        <select value={form.dangerClass} onChange={(e) => setForm({ ...form, dangerClass: e.target.value })}
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
          <option value="">Tehlike sınıfı (opsiyonel)</option>
          {DANGER_CLASS_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Firma adresi"
        className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />

      <div className="grid gap-2 sm:grid-cols-2 mb-3">
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefon"
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-posta" type="email"
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
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
