import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { useSubmitGuard } from "../../hooks/useSubmitGuard.js";
import { getRoleLabel } from "../../constants/allRoles.js";
import { getDepartments, saveDepartment, deleteDepartment, ensureDefaultDepartments } from "../../services/departmentService.js";
import { logActivity } from "../../services/auditService.js";
import { createId } from "../../utils/id.js";
import { turkishLower } from "../../utils/text.js";
import CsvImportButton from "../../components/CsvImportButton.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { Plus, Trash2 } from "../../components/icons/index.jsx";

/**
 * @param {{ theme: object, companyId: string }} props
 */
export default function DepartmentsSection({ theme, companyId }) {
  const { showToast } = useToast();
  const { role } = useRole();
  const [departments, setDepartments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [newName, setNewName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    ensureDefaultDepartments(companyId)
      .then(() => getDepartments(companyId).then((data) => { setDepartments(data); setLoaded(true); }))
      .catch((err) => {
        // BUG FIX (Sprint 8 polish): iç içe .then zincirinde hiç .catch() yoktu — hata
        // durumunda `loaded` hiç true olmuyor, bölüm SONSUZA KADAR yükleniyor görünüyordu.
        console.error("Departmanlar yüklenemedi:", err);
        setLoadError(err);
        setLoaded(true);
      });
  }, [companyId]);

  async function handleAdd() {
    if (!newName.trim()) return;
    // BUG FIX: CSV toplu içe aktarma (mapDepartmentRow, aşağıda) aynı isimde departman
    // eklenmesini zaten engelliyordu ama bu manuel "Ekle" yolu bu kontrolü hiç yapmıyordu
    // — kullanıcı "Üretim" yazıp Ekle'ye basarak zaten var olan "Üretim" departmanının
    // birebir kopyasını (aynı ada sahip, ayrı id'li ikinci bir kayıt) oluşturabiliyordu.
    if (departments.some((d) => turkishLower(d.name) === turkishLower(newName.trim()))) {
      showToast(`"${newName.trim()}" adında bir departman zaten var.`, "error");
      return;
    }
    const entry = { id: createId(), companyId, name: newName.trim(), isCustom: true };
    // UX FIX (hata yönetimi cilası): önceden try/catch yoktu — kayıt başarısız olursa
    // (aynı bölümdeki `handleConfirmDelete`'in aksine) kullanıcıya hiçbir geri bildirim
    // verilmiyordu.
    try {
      await saveDepartment(entry);
      setDepartments((prev) => [...prev, entry]);
      setNewName("");
      showToast("Departman eklendi.", "success");
      logActivity({ actor: getRoleLabel(role) || role, action: "Departman eklendi", details: entry.name, entityType: "department" });
    } catch (err) {
      console.error("Departman eklenemedi:", err);
      showToast("Departman eklenemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }
  // HARDENING: çift tıklama/Enter tuşuna basılı tutma koruması (bkz. hooks/useSubmitGuard.js).
  const [guardedHandleAdd, isSubmitting] = useSubmitGuard(handleAdd);

  async function handleConfirmDelete() {
    const dept = departments.find((d) => d.id === confirmDeleteId);
    try {
      await deleteDepartment(confirmDeleteId);
      setDepartments((prev) => prev.filter((d) => d.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      showToast("Departman silindi.", "neutral");
      logActivity({ actor: getRoleLabel(role) || role, action: "Departman silindi", details: dept?.name || "", entityType: "department" });
    } catch (err) {
      console.error("Departman silinemedi:", err);
      showToast("Departman silinemedi, lütfen tekrar deneyin.", "error");
    }
  }

  // CSV'de aynı isimde birden fazla satır olabilir (elle hata) veya isim zaten mevcut
  // departmanlardan biriyle çakışabilir — ikisi de sessizce yinelenen kayıt oluşturmak
  // yerine "hata" olarak işaretlenip önizlemede kullanıcıya gösterilir.
  function mapDepartmentRow(row, alreadyStaged = [], rowIndex = 0) {
    const name = row["Departman Adı"] || row["Ad"];
    if (!name) return { error: "Departman adı boş olamaz" };
    const nameLower = turkishLower(name);
    // BUG FIX: önceden yalnızca zaten KAYITLI departmanlara (state) karşı kontrol
    // ediliyordu — aynı CSV dosyasında adı iki kez geçen bir departman (örn. "Üretim"
    // iki satırda) hiç yakalanmıyor, ikisi de eklenip aynı isimde iki ayrı kayıt
    // oluşuyordu. `alreadyStaged` bu dosyada şimdiye kadar kabul edilmiş satırları
    // taşır (bkz. CsvImportButton.jsx).
    if (departments.some((d) => turkishLower(d.name) === nameLower) || alreadyStaged.some((d) => turkishLower(d.name) === nameLower)) {
      return { error: `"${name}" zaten mevcut, atlandı` };
    }
    return { id: createId(), companyId, name, isCustom: true };
  }

  async function handleBulkImport(entities) {
    // UX FIX (hata yönetimi cilası): önceden try/catch yoktu — döngü ortasında bir kayıt
    // başarısız olursa hata yakalanmadan fırlıyor, kullanıcıya kaç kaydın gerçekten
    // eklendiği hiç bildirilmiyordu (bkz. PeriodicChecksPanel.jsx'teki toplu güncelleme
    // hatasıyla aynı, zaten kurulu ifade kalıbı).
    try {
      for (const entity of entities) {
        await saveDepartment(entity);
      }
      setDepartments((prev) => [...prev, ...entities]);
      showToast(`${entities.length} departman içe aktarıldı.`, "success");
      logActivity({ actor: getRoleLabel(role) || role, action: "Toplu departman içe aktarma", details: `${entities.length} kayıt`, entityType: "department" });
    } catch (err) {
      console.error("Toplu departman içe aktarma başarısız:", err);
      showToast("Toplu içe aktarma tamamlanamadı. Başarılı kayıtlar korunmuş olabilir; sayfayı yenileyip kontrol edin.", "error");
    }
  }

  if (!loaded) return <Loading label="Departmanlar yükleniyor..." />;
  if (loadError) return <ErrorState title="Departmanlar yüklenemedi" description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin." onRetry={() => window.location.reload()} />;

  return (
    <div>
      <div className="flex gap-2 mb-3 max-w-sm">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guardedHandleAdd()} placeholder="Yeni departman adı"
          className="flex-1 text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }} />
        <Button size="sm" onClick={guardedHandleAdd} disabled={!newName.trim() || isSubmitting} className="flex items-center gap-1">
          <Plus style={{ fontSize: "13px" }} sw={2.5} /> {isSubmitting ? "Ekleniyor..." : "Ekle"}
        </Button>
      </div>

      <div className="mb-4">
        <CsvImportButton
          templateHeaders={["Departman Adı"]}
          templateExampleRow={["Üretim"]}
          mapRow={mapDepartmentRow}
          onConfirm={handleBulkImport}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {departments.map((d) => (
          <div key={d.id} className="flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5" style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
            <span className="text-sm" style={{ color: theme.textPrimary }}>{d.name}</span>
            {!d.isCustom && <Badge tone="neutral">Varsayılan</Badge>}
            <button onClick={() => setConfirmDeleteId(d.id)} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ color: theme.emergencyText }} aria-label="Departmanı sil">
              <Trash2 style={{ fontSize: "12px" }} />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog open={confirmDeleteId !== null} title="Departmanı sil" message="Bu departmanı silmek istediğinize emin misiniz?" confirmLabel="Sil" danger
        onConfirm={handleConfirmDelete} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
}
