import { useState, useEffect } from "react";
import { PROBABILITY_SCALE, FREQUENCY_SCALE, SEVERITY_SCALE, STATUS_OPTIONS, PRIORITY_OPTIONS, computeFineKinneyScore } from "../../../constants/fineKinney.js";
import Button from "../../../components/ui/Button.jsx";
import RiskLevelChip from "./RiskLevelChip.jsx";
import ScaleSelectField from "./ScaleSelectField.jsx";
import ClosureEvidenceFields from "./ClosureEvidenceFields.jsx";
import MarkdownLite from "../../../components/MarkdownLite.jsx";
import { useCompanyOrgLists } from "./useCompanyOrgLists.js";
import { useAIRiskAnalysis } from "./useAIRiskAnalysis.js";
import { useInitialRiskScore } from "./useInitialRiskScore.js";
import { validateImageFile } from "../../../utils/fileValidation.js";
import { compressImageToDataUrl } from "../../../utils/imageCompression.js";
import { getClosureEvidencePhoto } from "../../../services/closureEvidenceService.js";

export const EMPTY_FINE_KINNEY_FORM = {
  hazard: "", risk: "", affected: "", probability: 1, frequency: 1, severity: 1, action: "", responsible: "", dueDate: "", status: "open",
  residualProbability: 1, residualFrequency: 1, residualSeverity: 1, residualSuggested: false,
  priority: "medium", completionPercent: 0, departmentId: "", branchId: "",
  photoId: null, photoDataUrl: null,
  // Düzeltici Faaliyet Kanıt Zorunluluğu: closureNote/closurePhotoId kalıcı alanlardır
  // (bkz. types/index.js). pendingClosurePhotoDataUrl GEÇİCİDİR — yalnızca form
  // açıkken, henüz closureEvidenceService'e yazılmamış seçili fotoğrafı tutar; submit
  // anında FineKinneyModule.jsx bunu closurePhotoId'ye çevirir, kayda hiç gitmez.
  closureNote: "", closurePhotoId: null, pendingClosurePhotoDataUrl: null,
};

// HARDENING: bu serbest metin alanları hem AI çağrısına (getAiSuggestion/getInitialScore
// — maliyet/istek boyutu riski) hem de Excel/PDF export hücrelerine ve kart düzenine
// gönderiliyor. Önceden hiçbir maxLength yoktu — biri (yanlışlıkla veya kasıtlı) devasa
// bir metin yapıştırırsa hem AI isteği hem de export/kart görünümü bozulabilirdi.
// Değerler cömert tutuldu (gerçek İSG kayıtları için yeterince geniş, ama sınırsız değil).
const MAX_SHORT_FIELD_LENGTH = 300; // Tehlike/Risk/Etkilenenler
const MAX_ACTION_LENGTH = 2000; // Alınacak Önlemler — AI önerileri de dahil, daha uzun olabilir

/**
 * @param {{ theme: object, mode: "light"|"dark", form: object, setForm: (f: object) => void, editingId: number|null, onSubmit: () => void, isSubmitting?: boolean, onCancel: () => void }} props
 */
export default function FineKinneyForm({ theme, mode, form, setForm, editingId, onSubmit, isSubmitting = false, onCancel }) {
  const { departments, branches, hasMultipleBranches } = useCompanyOrgLists();
  const { aiLoading, aiSuggestion, aiError, getAiSuggestion, applySuggestionToAction } = useAIRiskAnalysis(form, setForm);
  const { scoreLoading, scoreError, scoreReasoning, getInitialScore } = useInitialRiskScore(form, setForm);
  const [existingClosurePhotoPreview, setExistingClosurePhotoPreview] = useState(null);
  const [closurePhotoCompressing, setClosurePhotoCompressing] = useState(false);
  const [closurePhotoError, setClosurePhotoError] = useState(null);

  // Kayıt daha önce kapanmışsa (editingId ile açılan formda closurePhotoId zaten
  // varsa) kanıt fotoğrafını önizleme için çözümle. Yeni seçilen bir fotoğraf
  // (pendingClosurePhotoDataUrl) varsa buna gerek yok — o zaten data URL olarak elde.
  useEffect(() => {
    let cancelled = false;
    if (form.closurePhotoId && !form.pendingClosurePhotoDataUrl) {
      getClosureEvidencePhoto(form.closurePhotoId).then((p) => {
        if (!cancelled) setExistingClosurePhotoPreview(p?.dataUrl || null);
      });
    } else {
      setExistingClosurePhotoPreview(null);
    }
    return () => { cancelled = true; };
  }, [form.closurePhotoId, form.pendingClosurePhotoDataUrl]);

  async function handleClosurePhotoFile(file) {
    setClosurePhotoError(null);
    const { valid, error } = await validateImageFile(file);
    if (!valid) { setClosurePhotoError(error); return; }
    setClosurePhotoCompressing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setForm({ ...form, pendingClosurePhotoDataUrl: dataUrl, closurePhotoId: null });
    } catch {
      setClosurePhotoError("Fotoğraf işlenemedi, tekrar deneyin.");
    } finally {
      setClosurePhotoCompressing(false);
    }
  }

  function handleRemoveClosurePhoto() {
    setForm({ ...form, pendingClosurePhotoDataUrl: null, closurePhotoId: null });
  }

  const liveScore = computeFineKinneyScore(Number(form.probability), Number(form.frequency), Number(form.severity));
  const liveResidualScore = computeFineKinneyScore(Number(form.residualProbability), Number(form.residualFrequency), Number(form.residualSeverity));
  const showResidual = form.action.trim().length > 0;

  // Düzeltici Faaliyet Kanıt Zorunluluğu: "Kapandı" seçiliyken not VEYA fotoğraftan
  // en az biri gerekir (var olan kayıtlı fotoğraf da sayılır — düzenlemede tekrar
  // fotoğraf istenmez, kanıt zaten mevcut demektir).
  const closureEvidencePresent = Boolean(form.closureNote?.trim()) || Boolean(form.pendingClosurePhotoDataUrl) || Boolean(form.closurePhotoId);
  const missingClosureEvidence = form.status === "done" && !closureEvidencePresent;

  return (
    <div className="rounded-xl border px-3.5 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      <div className="grid gap-2 mb-2 sm:grid-cols-2">
        <input
          value={form.hazard}
          onChange={(e) => setForm({ ...form, hazard: e.target.value })}
          placeholder="Tehlike * (örn. Yüksekte korkuluksuz çalışma)"
          maxLength={MAX_SHORT_FIELD_LENGTH}
          className="text-sm rounded-lg px-3 py-2 outline-none border"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        />
        <input
          value={form.risk}
          onChange={(e) => setForm({ ...form, risk: e.target.value })}
          placeholder="Risk * (örn. Yüksekten düşme)"
          maxLength={MAX_SHORT_FIELD_LENGTH}
          className="text-sm rounded-lg px-3 py-2 outline-none border"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        />
      </div>

      <input
        value={form.affected}
        onChange={(e) => setForm({ ...form, affected: e.target.value })}
        placeholder="Etkilenenler (örn. Çalışanlar ve çevre)"
        maxLength={MAX_SHORT_FIELD_LENGTH}
        className="w-full text-sm rounded-lg px-3 py-2 outline-none border mb-2"
        style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
      />

      <button
        onClick={getInitialScore}
        disabled={!form.hazard.trim() || scoreLoading}
        className="text-xs font-semibold mb-2 px-3 py-1.5 rounded-full border disabled:opacity-40"
        style={{ borderColor: theme.accent, color: theme.accent }}
      >
        {scoreLoading ? "AI puanlıyor..." : "🤖 AI ile Puanla (Olasılık/Maruziyet/Şiddet)"}
      </button>

      {scoreError && (
        <div className="rounded-lg px-3 py-2 mb-2 text-xs" style={{ background: theme.emergencyBg, color: theme.emergencyText }}>
          {scoreError}
        </div>
      )}

      {scoreReasoning && (
        <p className="text-[10.5px] mb-2" style={{ color: theme.textFaint }}>
          🤖 {scoreReasoning} — değerler aşağıda dolduruldu, gerekirse elle düzeltebilirsiniz.
          Bu bir AI tahminidir; nihai puanlama sorumluluğu değerlendirmeyi yapan İSG uzmanına aittir.
        </p>
      )}

      <div className="grid gap-2 mb-2 sm:grid-cols-3">
        <ScaleSelectField theme={theme} label="Olasılık" value={form.probability} onChange={(v) => setForm({ ...form, probability: v })} scale={PROBABILITY_SCALE} />
        <ScaleSelectField theme={theme} label="Maruziyet" value={form.frequency} onChange={(v) => setForm({ ...form, frequency: v })} scale={FREQUENCY_SCALE} />
        <ScaleSelectField theme={theme} label="Şiddet" value={form.severity} onChange={(v) => setForm({ ...form, severity: v })} scale={SEVERITY_SCALE} />
      </div>

      <div className="rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between flex-wrap gap-2" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
        <span className="text-xs" style={{ color: theme.textFaint }}>Mevcut Risk Puanı</span>
        <RiskLevelChip score={liveScore} mode={mode} showDescription />
      </div>

      <button
        onClick={getAiSuggestion}
        disabled={!form.hazard.trim() || aiLoading}
        className="text-xs font-semibold mb-3 px-3 py-1.5 rounded-full disabled:opacity-40"
        style={{ background: theme.accent, color: theme.onAccent }}
      >
        {aiLoading ? "AI düşünüyor..." : "🤖 AI Önerisi Al (önlem + artık risk)"}
      </button>

      {aiError && (
        <div className="rounded-lg px-3 py-2 mb-3 text-xs" style={{ background: theme.emergencyBg, color: theme.emergencyText }}>
          {aiError}
        </div>
      )}

      {aiSuggestion && (
        <div className="rounded-lg px-3 py-2.5 mb-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          {/* BUG FIX (Sprint 10): FINE_KINNEY_AI_PROMPT modele `**Kontrol Tedbirleri:**`
              gibi kalın başlıklar kullanmasını söylüyor (bkz. constants/systemPrompt.js),
              ama burada düz metin (whitespace-pre-wrap) olarak basılıyordu — kullanıcı
              ekranda gerçek yıldız işaretlerini görüyordu. MarkdownLite ile düzeltildi. */}
          <div className="text-[11px] mb-2" style={{ color: theme.textMuted }}>
            <MarkdownLite text={aiSuggestion} theme={theme} />
          </div>
          <button onClick={applySuggestionToAction} className="text-[11px] font-semibold" style={{ color: theme.accent }}>
            + Önlem/KKD önerisini "Alınacak Önlem" alanına ekle
          </button>
          {form.residualSuggested && (
            <p className="text-[10.5px] mt-1.5" style={{ color: theme.successText }}>
              ✓ Artık risk değerleri aşağıda AI önerisiyle dolduruldu — gerekirse elle düzeltebilirsiniz.
            </p>
          )}
          {/* HARDENING (AI uyarı konumlandırması): bu, doğrudan risk skorunu/önlemi
              etkileyen en yüksek riskli AI çıktısı — "elle düzeltebilirsiniz" (editability)
              ile "uzman onayı gerekir" (compliance) farklı şeyler; önceden yalnızca
              birincisi vardı. Mevzuat sayfasındaki/LegislationImpactCard'daki dille
              tutarlı hale getirildi. */}
          <p className="text-[10.5px] mt-1.5" style={{ color: theme.textFaint }}>
            Bu bir AI önerisidir, otomatik uygulanmaz — bir İSG uzmanının onayı ve nihai kararı yerine geçmez.
          </p>
        </div>
      )}

      <textarea
        value={form.action}
        onChange={(e) => setForm({ ...form, action: e.target.value })}
        placeholder="Alınacak önlem"
        rows={3}
        maxLength={MAX_ACTION_LENGTH}
        className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border resize-none"
        style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
      />

      {showResidual && (
        <div className="rounded-lg px-3 py-3 mb-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <p className="text-xs font-semibold mb-2" style={{ color: theme.textPrimary }}>Artık Risk (Önlem Sonrası)</p>
          <p className="text-[10.5px] mb-2" style={{ color: theme.textFaint }}>Yukarıdaki önlem uygulandığında beklenen değerleri seçin — Şiddet genelde değişmez.</p>
          <div className="grid gap-2 mb-2 sm:grid-cols-3">
            <ScaleSelectField theme={theme} label="Artık Olasılık" value={form.residualProbability} onChange={(v) => setForm({ ...form, residualProbability: v })} scale={PROBABILITY_SCALE} background={theme.surfaceAlt} />
            <ScaleSelectField theme={theme} label="Artık Maruziyet" value={form.residualFrequency} onChange={(v) => setForm({ ...form, residualFrequency: v })} scale={FREQUENCY_SCALE} background={theme.surfaceAlt} />
            <ScaleSelectField theme={theme} label="Artık Şiddet" value={form.residualSeverity} onChange={(v) => setForm({ ...form, residualSeverity: v })} scale={SEVERITY_SCALE} background={theme.surfaceAlt} />
          </div>
          <div className="rounded-lg px-3 py-2 flex items-center justify-between flex-wrap gap-2" style={{ background: theme.surfaceAlt }}>
            <span className="text-xs" style={{ color: theme.textFaint }}>Artık Risk Puanı</span>
            <RiskLevelChip score={liveResidualScore} mode={mode} showDescription />
          </div>
        </div>
      )}

      <div className="grid gap-2 mb-2 sm:grid-cols-3">
        <input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Sorumlu kişi" maxLength={MAX_SHORT_FIELD_LENGTH}
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {form.status === "done" && (
        <ClosureEvidenceFields
          theme={theme}
          note={form.closureNote || ""}
          onNoteChange={(v) => setForm({ ...form, closureNote: v })}
          photoPreviewUrl={form.pendingClosurePhotoDataUrl || existingClosurePhotoPreview}
          onPhotoFile={handleClosurePhotoFile}
          onRemovePhoto={handleRemoveClosurePhoto}
          compressing={closurePhotoCompressing}
          photoError={closurePhotoError}
          showRequiredHint={missingClosureEvidence}
        />
      )}

      {(departments.length > 0 || hasMultipleBranches) && (
        <div className={`grid gap-2 mb-2 ${hasMultipleBranches ? "sm:grid-cols-2" : ""}`}>
          <label className="block">
            <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Departman</span>
            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className="w-full text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
              <option value="">Belirtilmedi</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          {hasMultipleBranches && (
            <label className="block">
              <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Şube</span>
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
                <option value="">Belirtilmedi</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      <div className="grid gap-2 mb-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Öncelik</span>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Tamamlanma Yüzdesi: %{form.completionPercent}</span>
          <input type="range" min="0" max="100" step="5" value={form.completionPercent}
            onChange={(e) => setForm({ ...form, completionPercent: Number(e.target.value) })}
            className="w-full" style={{ accentColor: theme.accent }} />
        </label>
      </div>

      <p className="text-[10px] mb-1.5" style={{ color: theme.textFaint }}>* zorunlu alan</p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">Vazgeç</Button>
        <Button onClick={onSubmit} disabled={!form.hazard.trim() || !form.risk.trim() || isSubmitting || missingClosureEvidence} className="flex-1">
          {isSubmitting ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}
