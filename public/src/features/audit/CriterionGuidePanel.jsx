import { useTheme } from "../../contexts/ThemeContext.jsx";
import Badge from "../../components/ui/Badge.jsx";
import CriterionEvidenceSection from "./CriterionEvidenceSection.jsx";
import { getDifStageMeta } from "../../constants/auditWorkflow.js";
import { AlertTriangle, ChevronRight, Search, Scale, Paperclip, StickyNote, CheckCircle2 } from "../../components/icons/index.jsx";

function GuideLabel({ icon: Icon, children }) {
  const { theme } = useTheme();
  return (
    <div className="flex items-center gap-1.5 mb-1">
      {Icon && <Icon style={{ fontSize: "11px", color: theme.textFaint }} />}
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: theme.textFaint }}>{children}</p>
    </div>
  );
}

/**
 * Kriter Bazlı Kontrol Rehberi — İSG Mevzuat Denetimi'nde bir kriter kartını
 * "Kontrol et → Kanıtı incele/ekle → Tespitini yaz → Sonucu belirle → (gerekirse)
 * DİF oluştur" akışıyla, aynı ekranda AÇIKÇA bölümlenmiş şekilde sunar.
 *
 * BU BİLEŞEN HİÇBİR YENİ VERİ/HESAPLAMA ÜRETMEZ — yalnızca AuditDetailDrawer.jsx'in
 * zaten sahip olduğu checklist maddesi alanlarını (`controlPurpose`, `legislationName`,
 * `article`, `verified`, `expectedEvidence`, `evidence`, `note`, `result`) ve mevcut
 * aksiyonları (kanıt ekle/sil, sonuç seç, DİF oluştur/yönet) GÖRÜNÜR şekilde yeniden
 * düzenler. "Tespit / Denetçi Notu" alanı YENİ bir veri alanı DEĞİLDİR — checklist
 * maddesinde zaten var olan `note` alanının kendisidir (bkz. mevzuatChecklist.js →
 * generateChecklist, iso45001Checklist.js ile PAYLAŞILAN aynı şekil); burada yalnızca
 * "Tespit / Denetçi Notu" olarak ETİKETLENİR, mükerrer bir alan EKLENMEZ.
 *
 * Yalnızca `item.legislationName` dolu kriterlerde (İSG Mevzuat) kullanılır —
 * ISO 45001'in checklist maddelerinde bu alanlar hiç yok, dolayısıyla ISO 45001
 * akışı bu bileşene hiç girmez, AuditDetailDrawer.jsx'teki eski/sade kart
 * görünümünü DEĞİŞMEDEN kullanmaya devam eder (bkz. AuditDetailDrawer.jsx'teki
 * `item.legislationName ? <CriterionGuidePanel/> : <eski sade görünüm>` dalı).
 *
 * @param {{
 *   item: object, editable: boolean, canManage: boolean,
 *   checklistResults: Array<{value:string,label:string,tone:string}>, getResultMeta: (value:string)=>object,
 *   departments: object[], onChangeResult: (value:string)=>void, onChangeNote: (value:string)=>void,
 *   onChangeDepartment: (id:string|null)=>void, onAddEvidence: (type:string, description:string)=>void,
 *   onRemoveEvidence: (evidenceId:string)=>void, dif?: object|null,
 *   onCreateDif?: () => void, onOpenDif?: (dif:object) => void,
 * }} props
 */
export default function CriterionGuidePanel({
  item, editable, canManage, checklistResults, getResultMeta, departments,
  onChangeResult, onChangeNote, onChangeDepartment, onAddEvidence, onRemoveEvidence,
  dif = null, onCreateDif, onOpenDif,
}) {
  const { theme } = useTheme();
  const resultMeta = getResultMeta(item.result);

  return (
    <div className="rounded-md overflow-hidden" style={{ background: theme.surface, border: `1px dashed ${theme.border}` }}>
      {/* 1) NE KONTROL EDİLMELİ? — mevcut controlPurpose, olduğu gibi */}
      {item.controlPurpose && (
        <div className="px-2.5 py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <GuideLabel icon={Search}>Ne kontrol edilmeli?</GuideLabel>
          <p className="text-xs" style={{ color: theme.textPrimary }}>{item.controlPurpose}</p>
        </div>
      )}

      {/* 2) MEVZUAT DAYANAĞI — legislationName/article checklist'ten AYNEN, verified:false
          asla doğrulanmış gibi gösterilmez (mevcut uyarı korunur). */}
      <div className="px-2.5 py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <GuideLabel icon={Scale}>Mevzuat dayanağı</GuideLabel>
          {item.verified ? <Badge tone="success">Doğrulandı</Badge> : <Badge tone="warning">⚠️ DOĞRULAMA GEREKLİ</Badge>}
        </div>
        <p className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
          {item.legislationName}{item.article ? ` — ${item.article}` : ""}
        </p>
      </div>

      {/* 3) BEKLENEN KANIT — mevcut expectedEvidence, olduğu gibi */}
      {item.expectedEvidence && (
        <div className="px-2.5 py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <GuideLabel icon={Paperclip}>Beklenen kanıt</GuideLabel>
          <p className="text-xs" style={{ color: theme.textPrimary }}>{item.expectedEvidence}</p>
        </div>
      )}

      {/* 4) MEVCUT KANIT — mevcut kanıt bileşeni AYNEN yeniden kullanılır */}
      <div className="px-2.5 py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <GuideLabel icon={Paperclip}>Mevcut kanıt</GuideLabel>
        <CriterionEvidenceSection item={item} editable={editable} onAdd={onAddEvidence} onRemove={onRemoveEvidence} />
      </div>

      {/* 5) TESPİT / DENETÇİ NOTU — mevcut `item.note` alanı, yeni akışta sonuçtan ÖNCE
          (saha gözlemi önce yazılır, sonuç ondan sonra verilir). */}
      <div className="px-2.5 py-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <GuideLabel icon={StickyNote}>Tespit / Denetçi notu</GuideLabel>
        {editable ? (
          <textarea value={item.note} onChange={(e) => onChangeNote(e.target.value)} placeholder="Saha gözleminizi/tespitinizi yazın..." rows={2}
            className="w-full text-xs rounded-lg px-2.5 py-1.5 border outline-none resize-none" style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }} />
        ) : (
          <p className="text-xs" style={{ color: item.note ? theme.textPrimary : theme.textFaint }}>{item.note || "Tespit girilmemiş."}</p>
        )}
      </div>

      {/* 6) SONUÇ — mevcut sonuç sistemi (5 değer) AYNEN, "Kanıt Yok" ayrı bir seçenek
          olarak durur, otomatik "Uygun Değil"e dönüştürülmez. */}
      <div className="px-2.5 py-2">
        <GuideLabel icon={CheckCircle2}>Sonuç</GuideLabel>
        {editable ? (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {checklistResults.map((r) => (
              <button key={r.value} onClick={() => onChangeResult(r.value)}
                className="text-[10.5px] font-semibold px-2 py-1 rounded-full border"
                style={item.result === r.value ? { background: theme.accent, color: theme.onAccent, borderColor: theme.accent } : { borderColor: theme.border, color: theme.textMuted }}>
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <Badge tone={resultMeta.tone}>{resultMeta.label}</Badge>
        )}

        {editable && departments.length > 0 && (
          <select value={item.departmentId || ""} onChange={(e) => onChangeDepartment(e.target.value || null)}
            className="w-full text-xs rounded-lg px-2.5 py-1.5 border outline-none mb-2" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
            <option value="">Departman seç (opsiyonel)</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}

        {/* UYGUNSUZLUK — yalnızca sonuç "Uygun Değil" iken, mevcut DİF akışı AYNEN. */}
        {item.result === "uygun_degil" && (
          dif ? (
            <button onClick={() => onOpenDif?.(dif)} disabled={!onOpenDif}
              className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5" style={{ background: theme.surfaceAlt }}>
              <span className="text-[10.5px] font-semibold flex items-center gap-1" style={{ color: theme.textMuted }}>
                <AlertTriangle style={{ fontSize: "10px", color: theme.highRiskText }} /> Uygunsuzluk (DİF): {getDifStageMeta(dif.stage).label}
              </span>
              <span className="flex items-center gap-0.5 text-[10.5px] font-semibold" style={{ color: theme.accent }}>
                Yönet <ChevronRight style={{ fontSize: "11px" }} />
              </span>
            </button>
          ) : canManage && onCreateDif ? (
            <button onClick={onCreateDif}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-md px-2 py-1.5"
              style={{ background: theme.highRiskBg, color: theme.highRiskText }}>
              <AlertTriangle style={{ fontSize: "11px" }} /> Uygunsuzluk Oluştur
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}
