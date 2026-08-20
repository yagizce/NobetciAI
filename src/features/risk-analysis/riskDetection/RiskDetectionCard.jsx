import { useState } from "react";
import { getDetectionCategoryLabel, getDetectionStatusStyle } from "../../../constants/riskDetection.js";
import { useDetectionAIDraft } from "./useDetectionAIDraft.js";
import { useRiskDetectionPhotoUrl } from "./useRiskDetectionPhotoUrl.js";
import Button from "../../../components/ui/Button.jsx";
import { Camera, Sparkles, ChevronRight, Trash2 } from "../../../components/icons/index.jsx";

function timeAgoShort(iso) {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  return `${Math.round(diffHour / 24)} gün önce`;
}

/**
 * Tek bir Risk Tespiti kaydı. Durum akışı bilinçli olarak insan-yönlendirmeli:
 * Yeni → (İncele) → İncelemede → (AI ile Taslak / Sahaya İn) → Fine-Kinney formu açılır
 * → kullanıcı orada kaydeder → buraya dönüp "Dönüştürüldü Olarak İşaretle" ile kapatır.
 * Sistem hiçbir adımı otomatik/sessizce yapmaz.
 *
 * @param {{
 *   detection: import("../../../types/index.js").RiskDetection, theme: object, departmentName?: string,
 *   onUpdateStatus: (id: number, status: string, extra?: object) => void,
 *   onDelete: (id: number) => void,
 *   onSendToFineKinney: (hazard: string, risk: string, extra?: object) => void,
 * }} props
 */
export default function RiskDetectionCard({ detection, theme, departmentName, onUpdateStatus, onDelete, onSendToFineKinney }) {
  const [aiExpanded, setAiExpanded] = useState(false);
  const { loading: aiLoading, error: aiError, draft, generateDraft } = useDetectionAIDraft(detection);
  // Phase 6 depolama optimizasyonu: fotoğraf artık her zaman detection.photoDataUrl
  // içinde gömülü olmayabilir (bkz. useRiskDetectionPhotoUrl.js) — çoklu bulgu akışında
  // yalnızca photoId taşınır, gerçek data URL burada IndexedDB'den (önbellekli) çözülür.
  const photoUrl = useRiskDetectionPhotoUrl(detection.photoDataUrl, detection.photoId);
  const statusStyle = getDetectionStatusStyle(detection.status, theme);
  const isOpen = detection.status === "new" || detection.status === "reviewing";

  // BUG FIX: her iki köprü de tespitin departmentId'sini Fine-Kinney taslağına
  // TAŞIMIYORDU — tespit bir departmana bağlıysa (kart üstünde departmentName olarak
  // gösteriliyor), dönüştürülen Fine-Kinney kaydı departmansız açılıyordu. Kullanıcı
  // fark etmezse o kayıt Departman Isı Haritası'nda ve departman bazlı filtrelerde hiç
  // görünmüyordu — dashboard'un "gerçek kayıtlarla doğru çalışması" beklentisini bozan
  // sessiz bir veri kaybıydı. departmentId artık `extra` içinde taşınıyor.
  //
  // Phase 6: kaynak "photo" ise (Vision AI v1 — bkz. VisionFindingsPanel.jsx) tespit
  // artık recommendedAction/affected gibi yapılandırılmış alanlara da sahip olabilir;
  // bunlar da mevcut Fine-Kinney köprüsü üzerinden formun action/affected alanlarına
  // ÖN DOLDURMA olarak taşınır (yine yalnızca öneri — kaydetme kararı kullanıcıya ait).
  function handleSendManual() {
    const hazard = `${getDetectionCategoryLabel(detection.category)} — ${detection.location}`;
    const risk = detection.description || detection.hazardNote || "";
    onSendToFineKinney(hazard, risk, {
      departmentId: detection.departmentId ?? "",
      action: detection.recommendedAction || "",
      affected: detection.affected || "",
    });
  }

  function handleSendAiDraft() {
    if (!draft) return;
    onSendToFineKinney(draft.hazard, draft.risk || "", {
      probability: draft.probability, frequency: draft.frequency, severity: draft.severity, action: draft.action,
      departmentId: detection.departmentId ?? "",
    });
  }

  const sourceLabel = detection.source === "simulated" ? "Demo Simülasyonu" : detection.source === "photo" ? "Fotoğraf (AI)" : "Manuel Giriş";

  return (
    <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: theme.border, background: theme.surface }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-2 min-w-0">
          {photoUrl && (
            <img src={photoUrl} alt="Tespit fotoğrafı" className="w-9 h-9 rounded-md object-cover shrink-0" />
          )}
          <p className="text-sm font-semibold leading-snug" style={{ color: theme.textPrimary }}>{getDetectionCategoryLabel(detection.category)}</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0" style={{ background: statusStyle.bg, color: statusStyle.text }}>
          {statusStyle.label}
        </span>
      </div>

      <p className="text-xs mb-1.5" style={{ color: theme.textMuted }}>
        {detection.location}{departmentName ? ` • ${departmentName}` : ""}
      </p>

      {detection.hazardNote && (
        <p className="text-[11.5px] mb-1.5 italic" style={{ color: theme.textMuted }}>🤖 {detection.hazardNote}</p>
      )}

      {/* Phase 6 — Vision AI v1 yapılandırılmış alanları, yalnızca doluysa gösterilir
          (eski/manuel/simüle kayıtlarda bu alanlar yok — geriye dönük uyumlu). */}
      {detection.recommendedAction && (
        <p className="text-[11px] mb-1" style={{ color: theme.textMuted }}><span className="font-semibold">Önerilen önlem:</span> {detection.recommendedAction}</p>
      )}
      {detection.affected && (
        <p className="text-[11px] mb-1" style={{ color: theme.textMuted }}><span className="font-semibold">Etkilenenler:</span> {detection.affected}</p>
      )}
      {detection.legislationRef && (
        <p className="text-[10.5px] mb-1.5" style={{ color: theme.textFaint }}><span className="font-semibold">Kaynak:</span> {detection.legislationRef}</p>
      )}

      <div className="text-[11px] flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-1.5" style={{ color: theme.textFaint }}>
        <span className="flex items-center gap-1"><Camera style={{ fontSize: "11px" }} /> {sourceLabel}</span>
        <span>Son görülme: {timeAgoShort(detection.lastSeenAt)}</span>
        {typeof detection.confidenceScore === "number" && (
          <span>AI güveni: %{detection.confidenceScore}</span>
        )}
        {detection.occurrenceCount > 1 && (
          <span className="font-semibold" style={{ color: theme.warnText }}>Son 30 günde {detection.occurrenceCount} kez tespit edildi</span>
        )}
      </div>

      {detection.status === "dismissed" && detection.dismissReason && (
        <p className="text-[11px] italic mb-1.5" style={{ color: theme.textFaint }}>Gerekçe: {detection.dismissReason}</p>
      )}

      {/* Aksiyon satırı — duruma göre değişir */}
      {detection.status === "new" && (
        <div className="flex items-center gap-2 mt-2 flex-wrap -mx-2 -mb-1">
          <button onClick={() => onUpdateStatus(detection.id, "reviewing")} className="text-[11px] font-semibold px-2 py-1.5" style={{ color: theme.accent }}>İncele</button>
          <button onClick={() => onUpdateStatus(detection.id, "dismissed", { dismissReason: "Yanlış pozitif" })} className="text-[11px] font-semibold px-2 py-1.5 ml-auto" style={{ color: theme.textFaint }}>Reddet</button>
        </div>
      )}

      {detection.status === "reviewing" && (
        <div className="mt-2">
          <div className="flex items-center gap-2 flex-wrap -mx-2 -mb-1">
            <button onClick={() => setAiExpanded((v) => !v)} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5" style={{ color: theme.accent }}>
              <Sparkles style={{ fontSize: "11px" }} /> AI ile Taslak Oluştur
            </button>
            <button onClick={handleSendManual} className="text-[11px] font-semibold px-2 py-1.5" style={{ color: theme.textMuted }}>Sahaya İn (Manuel)</button>
            <button onClick={() => onUpdateStatus(detection.id, "dismissed", { dismissReason: "Uzman incelemesi sonucu reddedildi" })} className="text-[11px] font-semibold px-2 py-1.5 ml-auto" style={{ color: theme.textFaint }}>Reddet</button>
          </div>

          {aiExpanded && (
            <div className="rounded-lg border px-3 py-2.5 mt-2" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
              {!draft && !aiLoading && (
                <Button size="sm" onClick={generateDraft}>Taslağı Üret</Button>
              )}
              {aiLoading && <p className="text-xs" style={{ color: theme.textMuted }}>AI taslak hazırlıyor...</p>}
              {aiError && <p className="text-xs" style={{ color: theme.highRiskText }}>{aiError}</p>}
              {draft && !aiLoading && (
                <div>
                  {draft.risk && <p className="text-[11.5px] mb-1.5" style={{ color: theme.textPrimary }}>{draft.risk}</p>}
                  {(draft.probability || draft.frequency || draft.severity) && (
                    <p className="text-[10.5px] mb-1.5" style={{ color: theme.textFaint }}>
                      Olasılık: {draft.probability ?? "—"} · Maruziyet: {draft.frequency ?? "—"} · Şiddet: {draft.severity ?? "—"}
                    </p>
                  )}
                  {draft.action && <p className="text-[11px] whitespace-pre-line mb-2" style={{ color: theme.textMuted }}>{draft.action}</p>}
                  <button onClick={handleSendAiDraft} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: theme.accent }}>
                    Fine-Kinney Formuna Aktar <ChevronRight style={{ fontSize: "11px" }} />
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={() => onUpdateStatus(detection.id, "converted")} className="text-[11px] font-semibold px-2 py-1.5 mt-1" style={{ color: theme.successText }}>
            Dönüştürüldü Olarak İşaretle
          </button>
        </div>
      )}

      {!isOpen && (
        <div className="flex justify-end mt-2 -mx-2 -mb-1">
          <button onClick={() => onDelete(detection.id)} className="flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1.5" style={{ color: theme.textFaint }}>
            <Trash2 style={{ fontSize: "11px" }} /> Kaydı Sil
          </button>
        </div>
      )}
    </div>
  );
}
