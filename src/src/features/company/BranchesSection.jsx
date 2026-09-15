import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { useSubmitGuard } from "../../hooks/useSubmitGuard.js";
import { getRoleLabel } from "../../constants/allRoles.js";
import { getBranches, saveBranch, deleteBranch } from "../../services/branchService.js";
import { logActivity } from "../../services/auditService.js";
import { createId } from "../../utils/id.js";
import CsvImportButton from "../../components/CsvImportButton.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { Plus, Building2, Trash2 } from "../../components/icons/index.jsx";

const EMPTY_FORM = { name: "", address: "", responsible: "" };

/**
 * @param {{ theme: object, companyId: string }} props
 */
export default function BranchesSection({ theme, companyId }) {
  const { showToast } = useToast();
  const { role } = useRole();
  const [branches, setBranches] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    getBranches(companyId)
      .then((data) => { setBranches(data); setLoaded(true); })
      .catch((err) => {
        // BUG FIX (Sprint 8 polish): .catch() yoktu — hata durumunda `loaded` hiç
        // true olmuyor, bölüm SONSUZA KADAR yükleniyor görünüyordu.
        console.error("Şubeler yüklenemedi:", err);
        setLoadError(err);
        setLoaded(true);
      });
  }, [companyId]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(false);
  }

  function openEditForm(branch) {
    setForm({ name: branch.name, address: branch.address, responsible: branch.responsible });
    setEditingId(branch.id);
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    const entry = { id: editingId || createId(), companyId, name: form.name.trim(), address: form.address.trim(), responsible: form.responsible.trim() };
    // UX FIX (hata yönetimi cilası): önceden try/catch yoktu — kayıt başarısız olursa
    // kullanıcıya hiçbir geri bildirim verilmiyordu.
    try {
      await saveBranch(entry);
      setBranches((prev) => (editingId ? prev.map((b) => (b.id === entry.id ? entry : b)) : [entry, ...prev]));
      showToast(editingId ? "Şube güncellendi." : "Yeni şube eklendi.", "success");
      logActivity({ actor: getRoleLabel(role) || role, action: editingId ? "Şube güncellendi" : "Şube eklendi", details: entry.name, entityType: "branch" });
      resetForm();
    } catch (err) {
      console.error("Şube kaydedilemedi:", err);
      showToast("Şube kaydedilemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }
  // HARDENING: çift tıklama koruması (bkz. hooks/useSubmitGuard.js).
  const [guardedHandleSubmit, isSubmitting] = useSubmitGuard(handleSubmit);


  async function handleConfirmDelete() {
    const branch = branches.find((b) => b.id === confirmDeleteId);
    try {
      await deleteBranch(confirmDeleteId);
      setBranches((prev) => prev.filter((b) => b.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      showToast("Şube silindi.", "neutral");
      logActivity({ actor: getRoleLabel(role) || role, action: "Şube silindi", details: branch?.name || "", entityType: "branch" });
    } catch (err) {
      console.error("Şube silinemedi:", err);
      showToast("Şube silinemedi, lütfen tekrar deneyin.", "error");
    }
  }

  function mapBranchRow(row, alreadyStaged = [], rowIndex = 0) {
    const name = row["Şube Adı"] || row["Ad"];
    if (!name) return { error: "Şube adı boş olamaz" };
    return { id: createId(), companyId, name, address: row["Adres"] || "", responsible: row["Sorumlu"] || "" };
  }

  async function handleBulkImport(entities) {
    // UX FIX (hata yönetimi cilası): önceden try/catch yoktu.
    try {
      for (const entity of entities) {
        await saveBranch(entity);
      }
      setBranches((prev) => [...entities, ...prev]);
      showToast(`${entities.length} şube içe aktarıldı.`, "success");
      logActivity({ actor: getRoleLabel(role) || role, action: "Toplu şube içe aktarma", details: `${entities.length} kayıt`, entityType: "branch" });
    } catch (err) {
      console.error("Toplu şube içe aktarma başarısız:", err);
      showToast("Toplu içe aktarma tamamlanamadı. Başarılı kayıtlar korunmuş olabilir; sayfayı yenileyip kontrol edin.", "error");
    }
  }

  if (!loaded) return <Loading label="Şubeler yükleniyor..." />;
  if (loadError) return <ErrorState title="Şubeler yüklenemedi" description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin." onRetry={() => window.location.reload()} />;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setFormOpen(true); }} className="flex items-center gap-1.5">
          <Plus style={{ fontSize: "13px" }} sw={2.5} /> Yeni Şube
        </Button>
        <CsvImportButton
          templateHeaders={["Şube Adı", "Adres", "Sorumlu"]}
          templateExampleRow={["Merkez Şube", "Örnek Mah. No:1, İstanbul", "Ahmet Yılmaz"]}
          mapRow={mapBranchRow}
          onConfirm={handleBulkImport}
        />
      </div>

      {formOpen && (
        <div className="rounded-xl border px-3.5 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Şube adı *"
            className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adres"
            className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Sorumlu kişi"
            className="w-full text-sm rounded-lg px-3 py-2 mb-3 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={resetForm} disabled={isSubmitting} className="flex-1">Vazgeç</Button>
            <Button onClick={guardedHandleSubmit} disabled={!form.name.trim() || isSubmitting} className="flex-1">{isSubmitting ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}</Button>
          </div>
        </div>
      )}

      {branches.length === 0 ? (
        <EmptyState icon={Building2} title="Henüz şube yok" description="İlk şubenizi ekleyin." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {branches.map((b) => (
            <div key={b.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
              <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{b.name}</p>
              {b.address && <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{b.address}</p>}
              {b.responsible && <p className="text-xs" style={{ color: theme.textFaint }}>Sorumlu: {b.responsible}</p>}
              <div className="flex gap-2 mt-2 -mx-2 -mb-1">
                <button onClick={() => openEditForm(b)} className="text-[11px] font-semibold px-2 py-1.5" style={{ color: theme.accent }}>Düzenle</button>
                <button onClick={() => setConfirmDeleteId(b.id)} className="text-[11px] font-semibold flex items-center gap-0.5 px-2 py-1.5" style={{ color: theme.emergencyText }}>
                  <Trash2 style={{ fontSize: "11px" }} /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={confirmDeleteId !== null} title="Şubeyi sil" message="Bu şubeyi silmek istediğinize emin misiniz?" confirmLabel="Sil" danger
        onConfirm={handleConfirmDelete} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
}
