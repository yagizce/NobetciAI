import { useState, useMemo } from "react";
import { useRiskDetections } from "./useRiskDetections.js";
import { useVisionFindings } from "./useVisionFindings.js";
import { saveRiskDetectionPhoto } from "../../../services/riskDetectionPhotoService.js";
import { useCompanyOrgLists } from "../fineKinney/useCompanyOrgLists.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import { useSubmitGuard } from "../../../hooks/useSubmitGuard.js";
import { validateImageFile } from "../../../utils/fileValidation.js";
import RiskDetectionForm from "./RiskDetectionForm.jsx";
import RiskDetectionCard from "./RiskDetectionCard.jsx";
import RiskDetectionFilters from "./RiskDetectionFilters.jsx";
import VisionFindingsPanel from "./VisionFindingsPanel.jsx";
import PhotoCaptureButtons from "./PhotoCaptureButtons.jsx";
import ToggleSwitch from "../../../components/ui/ToggleSwitch.jsx";
import EmptyState from "../../../components/EmptyState.jsx";
import Loading from "../../../components/Loading.jsx";
import { ShieldAlert } from "../../../components/icons/index.jsx";

const SUMMARY_ITEMS = [
  { key: "newCount", label: "Yeni", tone: "pending" },
  { key: "reviewingCount", label: "İncelemede", tone: "warning" },
  { key: "convertedCount", label: "Dönüştürüldü", tone: "success" },
  { key: "dismissedCount", label: "Reddedildi", tone: "neutral" },
];

/**
 * Phase 9.1 — Risk Tespiti (triage havuzu). Fine-Kinney'den BİLİNÇLİ olarak ayrı bir
 * sekme: burada toplanan kayıtlar ham/doğrulanmamış tespitlerdir, resmi risk kaydı
 * değildir (bkz. types/index.js → RiskDetection). Sabit kamera entegrasyonu henüz yok
 * (Phase 9.2) — bunun yerine tespitler üç yoldan biriyle oluşur: manuel giriş, "Demo:
 * Otomatik Simülasyon" (sistem periyodik olarak örnek tespit üretir) veya kullanıcının
 * kendi telefonuyla çektiği/galeriden seçtiği fotoğrafın AI analizi (Phase 6 — bkz.
 * useVisionFindings.js/visionAnalysisService.js; AI_ROADMAP.md → "AI Vision" maddesinin
 * karşılığı, kamera KURULUMU değil — mock/adapter yapısı, bkz. visionAnalysisService.js
 * başındaki not). Üçü de aynı veri modelini kullanır; gerçek sabit kamera geldiğinde
 * yalnızca dördüncü bir "source" (`"camera"`) eklenmesi yeterli olacaktır.
 *
 * @param {{ onSendToFineKinney: (hazard: string, risk: string, extra?: object) => void }} props
 */
export default function RiskDetectionPanel({ theme, onSendToFineKinney, initialSearch }) {
  const {
    detections, allDetections, totalCount, stats, loaded, loadError,
    addDetection, updateStatus, removeDetection,
    search, setSearch, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter,
    simulating, setSimulating,
  } = useRiskDetections(initialSearch);
  const { departments } = useCompanyOrgLists();
  const { showToast } = useToast();
  const {
    analyzing, error: photoError, photoDataUrl, findings,
    analyze: analyzePhoto, updateFinding, toggleFinding, reset: resetPhoto,
  } = useVisionFindings();

  const [formOpen, setFormOpen] = useState(false);

  const departmentNameById = useMemo(() => {
    const map = {};
    for (const d of departments) map[String(d.id)] = d.name;
    return map;
  }, [departments]);

  async function handleManualAdd(category, location, departmentId, extra) {
    try {
      await addDetection(category, location, extra?.source || "manual", departmentId, extra);
      setFormOpen(false);
    } catch (err) {
      console.error("Risk tespiti kaydedilemedi:", err);
      showToast("Risk tespiti kaydedilemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }
  // HARDENING: çift tıklama koruması (bkz. hooks/useSubmitGuard.js).
  const [guardedHandleManualAdd, isSubmitting] = useSubmitGuard(handleManualAdd);

  // Phase 6 — onaylanan (approved=true) Vision AI bulgularının her biri AYRI bir Risk
  // Tespiti kaydına dönüşür (bkz. VisionFindingsPanel.jsx). Yapılandırılmış alanlar
  // (açıklama/önerilen önlem/etkilenenler/mevzuat referansı/güven skoru) her kayda
  // taşınır — bkz. types/index.js → RiskDetection için Phase 6 alanları.
  //
  // DEPOLAMA OPTİMİZASYONU: fotoğraf her bulgu kaydına AYRI AYRI gömülmez — bir kez
  // `riskDetectionPhotos` store'una kaydedilir, tüm bulgular aynı `photoId`'yi paylaşır
  // (bkz. riskDetectionPhotoService.js, RiskDetectionCard.jsx →
  // useRiskDetectionPhotoUrl.js). Önceden 3 bulgu = fotoğrafın 3 katı yer kaplıyordu.
  async function handleConfirmFindings(location, departmentId) {
    const approved = findings.filter((f) => f.approved);
    try {
      const photo = photoDataUrl ? await saveRiskDetectionPhoto(photoDataUrl) : null;
      for (const f of approved) {
        await addDetection(f.category, location, "photo", departmentId, {
          hazardNote: f.description,
          photoId: photo?.id || null,
          description: f.description,
          recommendedAction: f.recommendedAction,
          affected: f.affected,
          legislationRef: f.legislationRef,
          confidenceScore: f.confidenceScore,
        });
      }
      setFormOpen(false);
      resetPhoto();
      showToast(`${approved.length} tehlike bulgusu Risk Tespiti'ne eklendi.`, "success");
    } catch (err) {
      console.error("Vision AI bulguları kaydedilemedi:", err);
      showToast("Bulgular kaydedilemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }
  const [guardedHandleConfirmFindings, isConfirmingFindings] = useSubmitGuard(handleConfirmFindings);

  function handleCancelForm() {
    setFormOpen(false);
    resetPhoto();
  }

  async function handleUpdateStatus(id, status, extra) {
    try {
      await updateStatus(id, status, extra);
    } catch (err) {
      console.error("Risk tespiti güncellenemedi:", err);
      showToast("Risk tespiti güncellenemedi. Lütfen tekrar deneyin.", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await removeDetection(id);
    } catch (err) {
      console.error("Risk tespiti silinemedi:", err);
      showToast("Risk tespiti silinemedi. Lütfen tekrar deneyin.", "error");
    }
  }

  async function handlePhotoFile(file) {
    const { valid, error } = await validateImageFile(file);
    if (!valid) {
      showToast(error, "error");
      return;
    }

    setFormOpen(true);
    analyzePhoto(file);
  }

  function openManualForm() {
    resetPhoto();
    setFormOpen(true);
  }

  if (!loaded) return <Loading label="Risk tespitleri yükleniyor..." />;
  if (loadError) return <EmptyState icon={ShieldAlert} title="Risk tespitleri yüklenemedi" description={loadError} />;

  return (
    <div>
      <div className="rounded-xl border px-3.5 py-3 mb-4 flex items-center justify-between gap-3" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Demo: Otomatik Simülasyon</p>
          <p className="text-[10.5px]" style={{ color: theme.textFaint }}>Gerçek kamera henüz bağlı değil — açıkken sistem periyodik olarak örnek bir tespit üretir.</p>
        </div>
        <ToggleSwitch checked={simulating} onChange={setSimulating} theme={theme} />
      </div>

      {allDetections.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {SUMMARY_ITEMS.map((item) => (
            <div key={item.key} className="rounded-xl border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
              <p className="text-lg font-bold leading-none" style={{ color: theme.textPrimary }}>{stats[item.key]}</p>
              <p className="text-[10px] mt-1" style={{ color: theme.textFaint }}>{item.label}</p>
            </div>
          ))}
        </div>
      )}

      <PhotoCaptureButtons
        theme={theme}
        analyzing={analyzing}
        formOpen={formOpen}
        onPhotoFile={handlePhotoFile}
        onToggleForm={() => (formOpen ? handleCancelForm() : openManualForm())}
      />

      {formOpen && analyzing && (
        <div className="rounded-xl border px-3.5 py-4 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          <Loading label="🔍 Fotoğraf analiz ediliyor (Vision AI v1)..." />
        </div>
      )}

      {formOpen && !analyzing && photoError && (
        <div className="rounded-lg px-3 py-2 mb-2 text-xs" style={{ background: theme.emergencyBg, color: theme.emergencyText }}>
          {photoError} Tespiti manuel ekleyebilirsin.
        </div>
      )}

      {/* Fotoğraf akışı: bulgular varsa (Phase 6 çoklu tehlike inceleme paneli) */}
      {formOpen && !analyzing && findings.length > 0 && (
        <VisionFindingsPanel
          theme={theme}
          findings={findings}
          photoDataUrl={photoDataUrl}
          onUpdateFinding={updateFinding}
          onToggleFinding={toggleFinding}
          onConfirm={guardedHandleConfirmFindings}
          onCancel={handleCancelForm}
          isSubmitting={isConfirmingFindings}
        />
      )}

      {/* Manuel akış: "Yeni Tespit Ekle" butonuyla AÇILAN fotoğrafsız basit form; ya da
          fotoğraf analizi başarısız olduysa (photoError) buradan manuel devam edilir. */}
      {formOpen && !analyzing && findings.length === 0 && (
        <RiskDetectionForm
          theme={theme}
          onSubmit={guardedHandleManualAdd}
          isSubmitting={isSubmitting}
          onCancel={handleCancelForm}
        />
      )}

      {totalCount > 0 && (
        <RiskDetectionFilters
          theme={theme}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
        />
      )}

      {totalCount === 0 ? (
        <EmptyState icon={ShieldAlert} title="Henüz risk tespiti yok" description="Sahada gördüğünüz bir tehlikeyi manuel ekleyebilir, ya da demo simülasyonunu açarak sistemin nasıl çalışacağını görebilirsiniz." />
      ) : detections.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Eşleşen sonuç yok" description="Arama veya filtre kriterlerini değiştirmeyi deneyin." />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {detections.map((d) => (
            <RiskDetectionCard
              key={d.id}
              detection={d}
              theme={theme}
              departmentName={d.departmentId ? departmentNameById[String(d.departmentId)] : null}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDelete}
              onSendToFineKinney={onSendToFineKinney}
            />
          ))}
        </div>
      )}
    </div>
  );
}
