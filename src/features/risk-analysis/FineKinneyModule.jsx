import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useSubmitGuard } from "../../hooks/useSubmitGuard.js";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { Plus, BarChart3 } from "../../components/icons/index.jsx";

import { useFineKinneyEntries } from "./fineKinney/useFineKinneyEntries.js";
import FineKinneyForm, { EMPTY_FINE_KINNEY_FORM } from "./fineKinney/FineKinneyForm.jsx";
import FineKinneyCard from "./fineKinney/FineKinneyCard.jsx";
import FineKinneyFilters from "./fineKinney/FineKinneyFilters.jsx";
import FineKinneyExportButtons from "./fineKinney/FineKinneyExportButtons.jsx";
import FineKinneyDetailDrawer from "./fineKinney/detail/FineKinneyDetailDrawer.jsx";
import MevzuatScanPanel from "./fineKinney/MevzuatScanPanel.jsx";
import { saveClosureEvidencePhoto } from "../../services/closureEvidenceService.js";

// Orchestrator only — all real logic lives in ./fineKinney/*. This keeps the module the
// rest of the app imports (RiskAnalysisPage.jsx) unchanged while the internals stay modular.
//
// Phase 9.1: `pendingDraft`/`onDraftConsumed` — Risk Tespiti sekmesinden "AI ile Taslak
// Oluştur" veya "Sahaya İn" ile bu sekmeye köprülenen bir taslak varsa formu ön
// doldurulmuş açar. RiskAnalysisPage.jsx bu köprüyü yönetir; FineKinneyModule kendi
// başına Risk Tespiti'nden HABERSİZDİR — yalnızca hazır bir taslak objesi alır.
export default function FineKinneyModule({ pendingDraft, onDraftConsumed, initialSearch }) {
  const { theme, mode } = useTheme();
  const { showToast } = useToast();
  const {
    entries, allEntries, totalCount, loaded, loadError,
    search, setSearch,
    levelFilter, setLevelFilter,
    departmentFilter, setDepartmentFilter,
    branchFilter, setBranchFilter,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    saveEntry, removeEntry, applyPatchedEntry,
  } = useFineKinneyEntries(initialSearch);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FINE_KINNEY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [detailEntryId, setDetailEntryId] = useState(null);

  function resetForm() {
    setForm(EMPTY_FINE_KINNEY_FORM);
    setEditingId(null);
    setFormOpen(false);
  }

  function openNewForm() {
    setForm(EMPTY_FINE_KINNEY_FORM);
    setEditingId(null);
    setFormOpen(true);
  }

  // Sprint 7.5 — AI Mevzuat Taraması'nın "Taslak Oluştur" butonu; Sprint 9.1 — Risk
  // Tespiti'nin "AI ile Taslak Oluştur" / "Sahaya İn" butonları da buraya bağlanır.
  // Bilinçli olarak `saveEntry` çağırmıyor — form yalnızca ÖN DOLDURULMUŞ açılır,
  // kaydetme kararı ve olasılık/maruziyet/şiddet gibi kritik alanların doldurulması
  // tamamen kullanıcıya bırakılır (AI hiçbir zaman doğrudan kayıt oluşturmaz).
  function openDraftForm(hazard, risk, extra = {}) {
    setForm({
      ...EMPTY_FINE_KINNEY_FORM,
      hazard: hazard || "",
      risk: risk || "",
      probability: extra.probability ?? EMPTY_FINE_KINNEY_FORM.probability,
      frequency: extra.frequency ?? EMPTY_FINE_KINNEY_FORM.frequency,
      severity: extra.severity ?? EMPTY_FINE_KINNEY_FORM.severity,
      action: extra.action || "",
      // Phase 6: Vision AI bulgusundan köprülenen "etkilenenler" alanı (bkz.
      // RiskDetectionCard.jsx handleSendManual → detection.affected).
      affected: extra.affected || EMPTY_FINE_KINNEY_FORM.affected,
      // BUG FIX: Risk Tespiti'nden köprülenen departmentId artık forma taşınıyor
      // (bkz. RiskDetectionCard.jsx handleSendManual/handleSendAiDraft).
      departmentId: extra.departmentId || EMPTY_FINE_KINNEY_FORM.departmentId,
      // BUG FIX: aynı şekilde kanıt fotoğrafı referansı da forma taşınıyor —
      // Denetim Dosyası fotoğraf kanıtı özelliği bu alana bağlı (bkz. auditPackageExport.js).
      photoId: extra.photoId ?? null,
      photoDataUrl: extra.photoDataUrl ?? null,
    });
    setEditingId(null);
    setFormOpen(true);
  }

  // Risk Tespiti'nden bir taslak köprülendiğinde formu otomatik aç. `onDraftConsumed`
  // hemen çağrılır ki kullanıcı sekmeler arasında geri/ileri gidip gelirse aynı taslak
  // tekrar tekrar açılmasın.
  useEffect(() => {
    if (pendingDraft) {
      openDraftForm(pendingDraft.hazard, pendingDraft.risk, pendingDraft);
      onDraftConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDraft]);

  function openEditForm(entry) {
    setForm({
      hazard: entry.hazard, risk: entry.risk, probability: entry.probability, frequency: entry.frequency,
      severity: entry.severity, action: entry.action, responsible: entry.responsible, dueDate: entry.dueDate,
      status: entry.status, date: entry.date,
      residualProbability: entry.residualProbability ?? entry.probability,
      residualFrequency: entry.residualFrequency ?? entry.frequency,
      residualSeverity: entry.residualSeverity ?? entry.severity,
      residualSuggested: false,
      priority: entry.priority || "medium",
      completionPercent: entry.completionPercent || 0,
      departmentId: entry.departmentId ?? "",
      branchId: entry.branchId ?? "",
      closureNote: entry.closureNote || "",
      closurePhotoId: entry.closurePhotoId ?? null,
      pendingClosurePhotoDataUrl: null,
    });
    setEditingId(entry.id);
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.hazard.trim() || !form.risk.trim()) return;
    try {
      let toSave = form;
      // Düzeltici Faaliyet Kanıt Zorunluluğu: yeni seçilmiş bir kapanış fotoğrafı varsa
      // (henüz store'a yazılmadı, bkz. FineKinneyForm.jsx), submit anında kalıcı hale
      // getir. FineKinneyForm zaten not/fotoğraftan en az birini zorunlu kılıyor, bu
      // yüzden burada tekrar doğrulamıyoruz — yalnızca varsa yüklüyoruz.
      if (form.pendingClosurePhotoDataUrl) {
        const saved = await saveClosureEvidencePhoto(form.pendingClosurePhotoDataUrl);
        toSave = { ...form, closurePhotoId: saved.id, pendingClosurePhotoDataUrl: null };
      }
      await saveEntry(toSave, editingId);
      showToast(editingId ? "Değerlendirme güncellendi." : "Yeni risk değerlendirmesi eklendi.", "success");
      resetForm();
    } catch (err) {
      console.error("Risk değerlendirmesi kaydedilemedi:", err);
      showToast("Risk değerlendirmesi kaydedilemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }
  // HARDENING: çift tıklama/hızlı ardışık tetiklemede aynı kaydın iki kez oluşturulmasını
  // önler (bkz. hooks/useSubmitGuard.js).
  const [guardedHandleSubmit, isSubmitting] = useSubmitGuard(handleSubmit);

  async function handleConfirmDelete() {
    try {
      await removeEntry(confirmDeleteId);
      if (detailEntryId === confirmDeleteId) setDetailEntryId(null);
      setConfirmDeleteId(null);
      showToast("Değerlendirme silindi.", "neutral");
    } catch (err) {
      console.error("Değerlendirme silinemedi:", err);
      showToast("Değerlendirme silinemedi, lütfen tekrar deneyin.", "error");
    }
  }

  // Sprint 7.5: allEntries kullanılıyor — AI Mevzuat Taraması'ndan "Kayda Git" ile
  // gelen bir kayıt, o anki arama/filtre kriterlerinin dışında kalmış olsa bile açılabilsin.
  const detailEntry = detailEntryId != null ? allEntries.find((e) => e.id === detailEntryId) : null;

  if (!loaded) return <Loading label="Risk değerlendirmeleri yükleniyor..." />;
  // UX FIX (loading/empty state cilası): bu bir GERÇEK hata durumu — önceden EmptyState
  // ile gösteriliyordu, kullanıcı bunu "henüz veri yok" ile karıştırabiliyor ve "Tekrar
  // Dene" imkanı hiç sunulmuyordu. Diğer modüllerle (Belgeler, Eğitim, Aktivite Geçmişi)
  // tutarlı olacak şekilde ErrorState'e alındı.
  if (loadError) return <ErrorState title="Risk değerlendirmeleri yüklenemedi" description={loadError} onRetry={() => window.location.reload()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs" style={{ color: theme.textFaint }}>
          Fine-Kinney yöntemi: Risk = Olasılık × Maruziyet × Şiddet
        </p>
        <div className="flex items-center gap-2">
          <FineKinneyExportButtons theme={theme} entries={entries} />
          <Button size="sm" onClick={openNewForm} className="flex items-center gap-1.5 shrink-0">
            <Plus style={{ fontSize: "13px" }} sw={2.5} /> Yeni Değerlendirme
          </Button>
        </div>
      </div>

      <MevzuatScanPanel
        theme={theme}
        fineKinneyEntries={allEntries}
        onGoToEntry={(id) => setDetailEntryId(id)}
        onCreateDraft={openDraftForm}
      />

      {formOpen && (
        <FineKinneyForm
          theme={theme}
          mode={mode}
          form={form}
          setForm={setForm}
          editingId={editingId}
          onSubmit={guardedHandleSubmit}
          isSubmitting={isSubmitting}
          onCancel={resetForm}
        />
      )}

      {totalCount > 0 && (
        <FineKinneyFilters
          theme={theme}
          search={search}
          onSearchChange={setSearch}
          levelFilter={levelFilter}
          onLevelFilterChange={setLevelFilter}
          departmentFilter={departmentFilter}
          onDepartmentFilterChange={setDepartmentFilter}
          branchFilter={branchFilter}
          onBranchFilterChange={setBranchFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
        />
      )}

      {totalCount === 0 ? (
        <EmptyState icon={BarChart3} title="Henüz risk değerlendirmesi yok" description="Fine-Kinney yöntemiyle ilk değerlendirmeni ekle." />
      ) : entries.length === 0 ? (
        <EmptyState icon={BarChart3} title="Eşleşen sonuç yok" description="Arama veya filtre kriterlerini değiştirmeyi deneyin." />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {entries.map((e) => (
            <FineKinneyCard
              key={e.id}
              entry={e}
              theme={theme}
              mode={mode}
              onEdit={openEditForm}
              onDelete={setConfirmDeleteId}
              onOpenDetail={(entry) => setDetailEntryId(entry.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Değerlendirmeyi sil"
        message="Bu risk değerlendirmesini silmek istediğine emin misin? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <FineKinneyDetailDrawer
        entry={detailEntry}
        theme={theme}
        mode={mode}
        onClose={() => setDetailEntryId(null)}
        onEntryUpdated={applyPatchedEntry}
      />
    </div>
  );
}
