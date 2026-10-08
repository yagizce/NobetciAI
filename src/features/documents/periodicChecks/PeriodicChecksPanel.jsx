import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { useSubmitGuard } from "../../../hooks/useSubmitGuard.js";
import { useQrScanner } from "../../../hooks/useQrScanner.js";
import { usePeriodicChecks } from "./usePeriodicChecks.js";
import { useCompanyOrgLists } from "../../risk-analysis/fineKinney/useCompanyOrgLists.js";
import { todayISO } from "../../../utils/dateUtils.js";
import { savePeriodicCheckPhoto } from "../../../services/periodicCheckPhotoService.js";
import PeriodicCheckForm, { EMPTY_PERIODIC_CHECK_FORM } from "./PeriodicCheckForm.jsx";
import PeriodicCheckCard from "./PeriodicCheckCard.jsx";
import PeriodicCheckFilters from "./PeriodicCheckFilters.jsx";
import PeriodicCheckCalendar from "./PeriodicCheckCalendar.jsx";
import PeriodicCheckSummaryCards from "./PeriodicCheckSummaryCards.jsx";
import PeriodicCheckDetailDrawer from "./PeriodicCheckDetailDrawer.jsx";
import Button from "../../../components/ui/Button.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import Loading from "../../../components/Loading.jsx";
import ErrorState from "../../../components/ErrorState.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import { Plus, ListChecks, Calendar, QrCode } from "../../../components/icons/index.jsx";

const STATUS_ORDER = { overdue: 0, upcoming: 1, ok: 2 };

export default function PeriodicChecksPanel({ initialSearch } = {}) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const {
    checks, allChecks, totalCount, stats, loaded, loadError, saveCheck, removeCheck, markCheckedToday,
    bulkMarkCheckedToday, bulkUpdateDepartment,
    search, setSearch, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter,
    departmentFilter, setDepartmentFilter, dateFrom, setDateFrom, dateTo, setDateTo,
  } = usePeriodicChecks(initialSearch);
  const { departments } = useCompanyOrgLists();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PERIODIC_CHECK_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [view, setView] = useState("list"); // list | calendar
  const [detailCheck, setDetailCheck] = useState(null); // Sprint 7.2.3 — Kontrol Detayı
  // Toplu işlem (bulk actions) — AI_ROADMAP.md'nin karşılığı. Yalnızca "list" görünümünde
  // anlamlı; görünüm/filtre değişince seçim bilinçli olarak sıfırlanır (aşağıdaki useEffect)
  // — kullanıcının artık ekranda görmediği kayıtları yanlışlıkla toplu güncellemesini önler.
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // QR Kod → Periyodik Kontrol entegrasyonu. Önceden DocumentsPage.jsx'teki ayrı
  // "Ekipman Kayıtları" sekmesindeydi, Periyodik Kontroller'le hiç konuşmuyordu —
  // taranan QR verisi bir yerde duruyordu ama hiçbir zaman kontrol geçmişiyle
  // eşleşmiyordu. Artık tarama SONUCU doğrudan bu modülün kendi akışına giriyor:
  // aynı QR daha önce bir kayda bağlandıysa o kaydın detayı açılır; ilk kez
  // okutuluyorsa yeni kayıt formu QR'a önceden bağlanmış olarak açılır (isim yine de
  // serbestçe değiştirilebilir — bkz. openNewFormFromQr).
  const [qrPanelOpen, setQrPanelOpen] = useState(false);
  const { videoRef, canvasRef, scanResult, startScan, resetScan } = useQrScanner({
    onError: (msg) => showToast(msg, "error"),
  });

  const sortedChecks = useMemo(
    () => [...checks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [checks]
  );

  const departmentNameById = useMemo(() => {
    const map = {};
    for (const d of departments) map[String(d.id)] = d.name;
    return map;
  }, [departments]);

  // Görünen liste değişince (arama/filtre/görünüm) eski seçim ekranda olmayan
  // kayıtlara işaret edebilir — güvenlik için sıfırlanır.
  useEffect(() => { setSelectedIds([]); }, [search, statusFilter, categoryFilter, departmentFilter, dateFrom, dateTo, view]);

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.length === sortedChecks.length ? [] : sortedChecks.map((c) => c.id)));
  }

  async function handleBulkMarkChecked() {
    setBulkUpdating(true);
    try {
      await bulkMarkCheckedToday(selectedIds);
      showToast(`${selectedIds.length} kayıt bugün kontrol edildi olarak işaretlendi.`, "success");
      setSelectedIds([]);
    } catch (err) {
      console.error("Toplu kontrol güncellemesi başarısız:", err);
      showToast("Toplu kontrol güncellemesi tamamlanamadı. Başarılı kayıtlar korunmuş olabilir; tekrar deneyin.", "error");
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleBulkDepartmentChange(e) {
    if (e.target.value === "__placeholder__") return;
    const departmentId = e.target.value === "__none__" ? null : Number(e.target.value);
    setBulkUpdating(true);
    try {
      await bulkUpdateDepartment(selectedIds, departmentId);
      showToast(`${selectedIds.length} kaydın departmanı güncellendi.`, "success");
      setSelectedIds([]);
    } catch (err) {
      console.error("Toplu departman güncellemesi başarısız:", err);
      showToast("Toplu departman güncellemesi tamamlanamadı. Başarılı kayıtlar korunmuş olabilir; tekrar deneyin.", "error");
    } finally {
      setBulkUpdating(false);
      e.target.value = "__placeholder__";
    }
  }

  function resetForm() {
    setForm(EMPTY_PERIODIC_CHECK_FORM);
    setEditingId(null);
    setFormOpen(false);
  }

  function openNewForm() {
    setForm(EMPTY_PERIODIC_CHECK_FORM);
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(check) {
    setForm({
      itemName: check.itemName, category: check.category, departmentId: check.departmentId ? String(check.departmentId) : "",
      lastCheckDate: check.lastCheckDate, intervalDays: check.intervalDays, responsible: check.responsible, notes: check.notes,
      qrCode: check.qrCode ?? null, photoId: check.photoId ?? null, pendingPhotoDataUrl: null,
    });
    setEditingId(check.id);
    setFormOpen(true);
    setDetailCheck(null);
  }

  // QR Kod → Periyodik Kontrol: tarama sonucu geldiğinde ya var olan kayda git ya da
  // QR'a önceden bağlanmış yeni bir form aç. `allChecks` (filtrelenmemiş TÜM kayıtlar)
  // kullanılıyor — kullanıcı bir filtre uygulamışken taradığı ekipman o an ekranda
  // görünmeyebilir, yine de eşleşmeli.
  useEffect(() => {
    if (!scanResult) return;
    setQrPanelOpen(false);
    const existing = allChecks.find((c) => c.qrCode === scanResult);
    if (existing) {
      setDetailCheck(existing);
      showToast("Bu QR zaten kayıtlı — kontrol detayı açıldı.", "success");
    } else {
      setForm({
        ...EMPTY_PERIODIC_CHECK_FORM,
        itemName: `Ekipman ${allChecks.length + 1}`,
        lastCheckDate: todayISO(),
        qrCode: scanResult,
      });
      setEditingId(null);
      setFormOpen(true);
      showToast("Yeni QR okundu — kaydı tamamlamak için formu doldurun.", "success");
    }
    resetScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetScan/showToast/allChecks
    // her render'da yeniden oluşabilir; yalnızca scanResult DEĞİŞTİĞİNDE tetiklenmeli.
  }, [scanResult]);

  async function handleSubmit() {
    if (!form.itemName.trim() || !form.lastCheckDate) return;
    try {
      let toSave = form;
      // Kapanış Kanıtı'ndaki (Fine-Kinney) AYNI desen: yeni seçilmiş bir fotoğraf varsa
      // (henüz store'a yazılmadı) submit anında kalıcı hale getir.
      if (form.pendingPhotoDataUrl) {
        const saved = await savePeriodicCheckPhoto(form.pendingPhotoDataUrl);
        toSave = { ...form, photoId: saved.id, pendingPhotoDataUrl: null };
      }
      await saveCheck(toSave, editingId);
      showToast(editingId ? "Kontrol güncellendi." : "Yeni periyodik kontrol eklendi.", "success");
      resetForm();
    } catch (err) {
      console.error("Periyodik kontrol kaydedilemedi:", err);
      showToast("Periyodik kontrol kaydedilemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }
  // HARDENING: çift tıklama koruması (bkz. hooks/useSubmitGuard.js).
  const [guardedHandleSubmit, isSubmitting] = useSubmitGuard(handleSubmit);
  const [guardedHandleBulkMarkChecked, isBulkMarkSubmitting] = useSubmitGuard(handleBulkMarkChecked);
  const [guardedHandleBulkDepartmentChange, isBulkDepartmentSubmitting] = useSubmitGuard(handleBulkDepartmentChange);
  const isBulkBusy = bulkUpdating || isBulkMarkSubmitting || isBulkDepartmentSubmitting;

  async function handleConfirmDelete() {
    try {
      await removeCheck(confirmDeleteId);
      setConfirmDeleteId(null);
      setDetailCheck(null);
      showToast("Kontrol kaydı silindi.", "neutral");
    } catch (err) {
      console.error("Kontrol kaydı silinemedi:", err);
      showToast("Kontrol kaydı silinemedi, lütfen tekrar deneyin.", "error");
    }
  }

  async function handleMarkChecked(id) {
    // Kayıt başarısız olursa önceden hata yakalanmıyordu: kullanıcı hiçbir mesaj görmüyor,
    // pencere açık kalıyordu. Başarı mesajı yalnızca kayıt gerçekten yazıldıysa gösterilir.
    try {
      await markCheckedToday(id);
      showToast("Kontrol bugün yapıldı olarak işaretlendi.", "success");
      setDetailCheck(null);
    } catch (err) {
      console.error("Kontrol işaretlenemedi:", err);
      showToast("Kontrol kaydı güncellenemedi. Lütfen tekrar deneyin.", "error");
    }
  }
  // Çift tıklama koruması (bkz. hooks/useSubmitGuard.js): "Bugün Kontrol Edildi" ve "Sil"
  // aynı işlemi iki kez çalıştırıp etkinlik günlüğüne/bildirime çift kayıt düşürüyordu.
  const [guardedHandleMarkChecked] = useSubmitGuard(handleMarkChecked);
  const [guardedHandleConfirmDelete] = useSubmitGuard(handleConfirmDelete);

  if (!loaded) return <Loading label="Periyodik kontroller yükleniyor..." />;
  // UX FIX (loading/empty state cilası): gerçek hata durumu, "henüz veri yok" ile
  // karıştırılmasın ve kullanıcıya "Tekrar Dene" imkanı sunulsun diye ErrorState'e alındı.
  if (loadError) return <ErrorState title="Periyodik kontroller yüklenemedi" description={loadError} onRetry={() => window.location.reload()} />;

  return (
    <div>
      {allChecks.length > 0 && <PeriodicCheckSummaryCards theme={theme} stats={stats} />}

      <div className="flex items-center justify-end gap-2 mb-3">
        <Button size="sm" variant="secondary" onClick={() => setQrPanelOpen((v) => !v)} className="flex items-center gap-1.5">
          <QrCode style={{ fontSize: "13px" }} /> QR Okut
        </Button>
        <Button size="sm" onClick={openNewForm} className="flex items-center gap-1.5">
          <Plus style={{ fontSize: "13px" }} sw={2.5} /> Yeni Kontrol Kaydı
        </Button>
      </div>

      {qrPanelOpen && (
        <div className="rounded-xl border px-3.5 py-3 mb-4 text-center" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          <p className="text-xs mb-2" style={{ color: theme.textMuted }}>
            Ekipman üzerindeki QR etiketini kameraya gösterin. Daha önce kaydedilmiş bir QR ise doğrudan kaydına gidilir; yeni bir QR ise kayıt formu QR'a bağlı olarak açılır.
          </p>
          <button onClick={startScan} className="w-full max-w-sm py-2.5 rounded-lg border-2 font-semibold text-sm mx-auto block" style={{ borderColor: theme.accent, color: theme.accent }}>
            Taramayı Başlat
          </button>
          <video ref={videoRef} style={{ display: "none" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      {formOpen && (
        <PeriodicCheckForm theme={theme} form={form} setForm={setForm} editingId={editingId} onSubmit={guardedHandleSubmit} submitting={isSubmitting} onCancel={resetForm} />
      )}

      {totalCount > 0 && (
        <>
          <PeriodicCheckFilters
            theme={theme}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            departmentFilter={departmentFilter}
            onDepartmentFilterChange={setDepartmentFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
          />

          <div className="flex gap-1.5 mb-3">
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
              style={view === "list" ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
            >
              <ListChecks style={{ fontSize: "12px" }} /> Liste
            </button>
            <button
              onClick={() => setView("calendar")}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
              style={view === "calendar" ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
            >
              <Calendar style={{ fontSize: "12px" }} /> Takvim
            </button>
          </div>
        </>
      )}

      {totalCount === 0 ? (
        <EmptyState icon={ListChecks} title="Henüz periyodik kontrol kaydı yok" description="Yangın tüpü, ekipman veya elektrik tesisatı gibi düzenli kontrol gerektiren kalemleri ekleyin." />
      ) : sortedChecks.length === 0 ? (
        <EmptyState icon={ListChecks} title="Eşleşen kayıt yok" description="Arama veya filtre kriterlerini değiştirmeyi deneyin." />
      ) : view === "calendar" ? (
        <PeriodicCheckCalendar theme={theme} checks={sortedChecks} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: theme.textMuted }}>
              <input type="checkbox" checked={selectedIds.length === sortedChecks.length} onChange={toggleSelectAll} />
              Tümünü Seç ({sortedChecks.length})
            </label>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap rounded-xl px-3 py-2.5 mb-3" style={{ background: theme.accent, color: theme.onAccent }}>
              <span className="text-xs font-semibold">{selectedIds.length} seçili</span>
              <button
                onClick={guardedHandleBulkMarkChecked}
                disabled={isBulkBusy}
                className="text-xs font-semibold px-2.5 py-1 rounded-full disabled:opacity-50"
                style={{ background: theme.onAccent, color: theme.accent }}
              >
                Bugün Kontrol Edildi
              </button>
              <select
                onChange={guardedHandleBulkDepartmentChange}
                disabled={isBulkBusy}
                defaultValue="__placeholder__"
                className="text-xs font-semibold px-2.5 py-1 rounded-full outline-none disabled:opacity-50"
                style={{ background: theme.onAccent, color: theme.accent }}
              >
                <option value="__placeholder__" disabled>Departman Değiştir...</option>
                <option value="__none__">Belirtilmedi</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button onClick={() => setSelectedIds([])} className="text-xs font-semibold ml-auto underline">Vazgeç</button>
            </div>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2">
            {sortedChecks.map((c) => (
              <PeriodicCheckCard
                key={c.id}
                check={c}
                theme={theme}
                departmentName={c.departmentId ? departmentNameById[String(c.departmentId)] : null}
                onOpenDetail={setDetailCheck}
                onEdit={openEditForm}
                onDelete={setConfirmDeleteId}
                onMarkChecked={guardedHandleMarkChecked}
                selected={selectedIds.includes(c.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        </>
      )}

      <PeriodicCheckDetailDrawer
        theme={theme}
        check={detailCheck}
        departmentName={detailCheck?.departmentId ? departmentNameById[String(detailCheck.departmentId)] : null}
        onClose={() => setDetailCheck(null)}
        onEdit={openEditForm}
        onDelete={setConfirmDeleteId}
        onMarkChecked={guardedHandleMarkChecked}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Kontrol kaydını sil"
        message="Bu periyodik kontrol kaydını silmek istediğine emin misin?"
        confirmLabel="Sil"
        danger
        onConfirm={guardedHandleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
