import { useState } from "react";
import { RISK_DETECTION_CATEGORIES, MOCK_DETECTION_LOCATIONS } from "../../../constants/riskDetection.js";
import { useCompanyOrgLists } from "../fineKinney/useCompanyOrgLists.js";
import { VISION_ADAPTER_NAME } from "../../../services/visionAnalysisService.js";
import Button from "../../../components/ui/Button.jsx";
import { Info } from "../../../components/icons/index.jsx";

const MAX_LOCATION_LENGTH = 300;

function ConfidenceBadge({ score, theme }) {
  const tone = score >= 70 ? { bg: theme.successBg, text: theme.successText } : score >= 45 ? { bg: theme.warnBg, text: theme.warnText } : { bg: theme.surfaceAlt, text: theme.textFaint };
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: tone.bg, color: tone.text }}>
      AI güveni: %{score}
    </span>
  );
}

/**
 * Tek bir bulgunun düzenlenebilir kartı. Kullanıcı onay kutusunu kapatarak bu bulguyu
 * dışarıda bırakabilir; kapalıyken alanlar salt-okunur/soluk gösterilir ama veri kaybolmaz
 * (tekrar işaretlenirse son düzenlenmiş hali geri gelir).
 */
function FindingCard({ finding, theme, onUpdate, onToggle }) {
  const disabled = !finding.approved;
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: disabled ? theme.surfaceAlt : theme.surface, opacity: disabled ? 0.65 : 1 }}>
      <label className="flex items-start gap-2 mb-2 cursor-pointer">
        <input type="checkbox" checked={finding.approved} onChange={() => onToggle(finding.id)} className="mt-0.5 shrink-0" />
        <input
          value={finding.hazard}
          onChange={(e) => onUpdate(finding.id, { hazard: e.target.value })}
          disabled={disabled}
          className="flex-1 text-sm font-semibold rounded-lg px-2 py-1 outline-none border bg-transparent"
          style={{ borderColor: theme.border, color: theme.textPrimary }}
        />
        <ConfidenceBadge score={finding.confidenceScore} theme={theme} />
      </label>

      <select
        value={finding.category}
        onChange={(e) => onUpdate(finding.id, { category: e.target.value })}
        disabled={disabled}
        className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none border mb-1.5"
        style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
      >
        {RISK_DETECTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <label className="block mb-1.5">
        <span className="block text-[10px] mb-0.5" style={{ color: theme.textFaint }}>Açıklama</span>
        <textarea
          value={finding.description}
          onChange={(e) => onUpdate(finding.id, { description: e.target.value })}
          disabled={disabled}
          rows={2}
          className="w-full text-[12.5px] rounded-lg px-2.5 py-1.5 outline-none border resize-y"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        />
      </label>

      <label className="block mb-1.5">
        <span className="block text-[10px] mb-0.5" style={{ color: theme.textFaint }}>Önerilen Önlem</span>
        <textarea
          value={finding.recommendedAction}
          onChange={(e) => onUpdate(finding.id, { recommendedAction: e.target.value })}
          disabled={disabled}
          rows={2}
          className="w-full text-[12.5px] rounded-lg px-2.5 py-1.5 outline-none border resize-y"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        />
      </label>

      <div className="grid gap-1.5 sm:grid-cols-2 mb-1">
        <label className="block">
          <span className="block text-[10px] mb-0.5" style={{ color: theme.textFaint }}>Etkilenenler</span>
          <input
            value={finding.affected}
            onChange={(e) => onUpdate(finding.id, { affected: e.target.value })}
            disabled={disabled}
            className="w-full text-[12.5px] rounded-lg px-2.5 py-1.5 outline-none border"
            style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
          />
        </label>
        <label className="block">
          <span className="block text-[10px] mb-0.5" style={{ color: theme.textFaint }}>Mevzuat/Kaynak Referansı</span>
          <input
            value={finding.legislationRef}
            onChange={(e) => onUpdate(finding.id, { legislationRef: e.target.value })}
            disabled={disabled}
            className="w-full text-[12.5px] rounded-lg px-2.5 py-1.5 outline-none border"
            style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Phase 6 / Vision AI v1 — bir fotoğraftan üretilen ÇOKLU tehlike bulgusunun inceleme
 * paneli. AI sonucu asla doğrudan kaydedilmez: kullanıcı her bulguyu tek tek gözden
 * geçirir, alanları düzenleyebilir, istemediğini işaretinden çıkarabilir; ardından ortak
 * konum/departman bilgisini girip "Seçilenleri Risk Tespiti'ne Ekle" ile onaylanan
 * bulguları (birden fazla olabilir) Risk Tespiti havuzuna aktarır. Konum AI tarafından
 * bilinemediği için (fiziksel yer adı) her zaman elle girilir — RiskDetectionForm.jsx
 * ile aynı ilke.
 *
 * @param {{
 *   theme: object,
 *   findings: Array<object>,
 *   photoDataUrl: string|null,
 *   onUpdateFinding: (id: string, patch: object) => void,
 *   onToggleFinding: (id: string) => void,
 *   onConfirm: (location: string, departmentId: string|null) => void,
 *   onCancel: () => void,
 *   isSubmitting?: boolean,
 * }} props
 */
export default function VisionFindingsPanel({ theme, findings, photoDataUrl, onUpdateFinding, onToggleFinding, onConfirm, onCancel, isSubmitting = false }) {
  const { departments } = useCompanyOrgLists();
  const [location, setLocation] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const approvedCount = findings.filter((f) => f.approved).length;

  return (
    <div className="rounded-xl border px-3.5 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      <div className="flex items-start gap-2.5 mb-3">
        {photoDataUrl && <img src={photoDataUrl} alt="Analiz edilen fotoğraf" className="w-14 h-14 rounded-md object-cover shrink-0" />}
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
            {findings.length} tehlike bulgusu tespit edildi
          </p>
          <p className="flex items-start gap-1 text-[10.5px] mt-0.5" style={{ color: theme.textFaint }}>
            <Info style={{ fontSize: "11px", marginTop: "1px" }} className="shrink-0" />
            Bu bulgular yapay zeka ({VISION_ADAPTER_NAME}) tarafından fotoğraftan üretildi — hatalı veya eksik olabilir, uzman onayı gerekir. Gözden geçirip düzenleyebilir, istemediğini işaretinden çıkarabilirsin.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {findings.map((f) => (
          <FindingCard key={f.id} finding={f} theme={theme} onUpdate={onUpdateFinding} onToggle={onToggleFinding} />
        ))}
      </div>

      <div className="grid gap-2 mb-3 sm:grid-cols-2">
        <input
          list="vision-findings-locations"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Konum (örn. Depo B — Giriş)"
          maxLength={MAX_LOCATION_LENGTH}
          className="text-sm rounded-lg px-3 py-2 outline-none border"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        />
        <datalist id="vision-findings-locations">
          {MOCK_DETECTION_LOCATIONS.map((loc) => <option key={loc} value={loc} />)}
        </datalist>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="text-sm rounded-lg px-3 py-2 outline-none border"
          style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}
        >
          <option value="">Departman belirtilmedi</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1">Vazgeç</Button>
        <Button onClick={() => onConfirm(location.trim(), departmentId || null)} disabled={!location.trim() || approvedCount === 0 || isSubmitting} className="flex-1">
          {isSubmitting ? "Ekleniyor..." : `Seçilenleri Ekle (${approvedCount})`}
        </Button>
      </div>
    </div>
  );
}
