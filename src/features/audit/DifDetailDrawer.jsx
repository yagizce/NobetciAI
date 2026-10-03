import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { useCompany } from "../../hooks/useCompany.js";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { DIF_STAGES, getDifStageIndex, isDifOverdue, canTransitionDifStage, pickDifEditableFields, mergeDifEditableFields } from "../../constants/auditWorkflow.js";
import { getResultMeta } from "../../constants/auditScoring.js";
import { X, Paperclip, ImageIcon, FileText, Trash2, CheckCircle2, RotateCcw, AlertTriangle } from "../../components/icons/index.jsx";

const EVIDENCE_TYPES = [
  { value: "photo", label: "Fotoğraf" },
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Word" },
];
const TYPE_ICON = { photo: ImageIcon, pdf: FileText, word: FileText };

/**
 * DİF yaşam döngüsü: Açık → Aksiyon Bekliyor → İnceleme Bekliyor → Kapatıldı
 * (İnceleme Bekliyor'dan Aksiyon Bekliyor'a geri dönülebilir; Kapatıldı'dan
 * yalnızca "Yeniden Aç" ile çıkılabilir). TEK KAYNAK: constants/auditWorkflow.js
 * → `canTransitionDifStage`. Bu bileşen her geçiş denemesinden ÖNCE aynı
 * fonksiyonu çağırarak butonu pasifleştirir (UX) — ama gerçek engelleme her
 * zaman servis katmanında (bkz. useAudits.js → setDifStage → updateDifStage)
 * olur; bu yüzden burada "hile" ile bir geçiş zorlanmaya çalışılsa bile servis
 * reddedip anlamlı bir hata döner, biz de onu ekranda gösteririz.
 *
 * @param {{ dif: object|null, onClose: () => void, canManage: boolean,
 *   onStageChange: (dif, stage, options?: { patch?: object, isReopenAction?: boolean, reason?: string }) => Promise<void>,
 *   onSaveFields: (dif) => Promise<void>,
 *   onAddEvidence: (dif, file) => Promise<void>, onRemoveEvidence: (dif, id) => Promise<void> }} props
 */
export default function DifDetailDrawer({ dif, onClose, canManage, onStageChange, onSaveFields, onAddEvidence, onRemoveEvidence }) {
  const { theme } = useTheme();
  const { role } = useRole();
  const { company } = useCompany();
  const [fields, setFields] = useState(dif);
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceType, setEvidenceType] = useState("photo");
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopening, setReopening] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [busy, setBusy] = useState(false);

  // dif prop her açılışta değişir — controlled input state'ini yeniden senkronlar.
  if (dif && fields?.id !== dif.id) {
    setFields(dif);
    if (transitionError) setTransitionError(null);
    if (reopening) setReopening(false);
  }

  // Çekmece sayfayla birlikte dif=null iken monte olur; ilk açılışta `fields` (yukarıdaki
  // render-içi setFields ile) henüz bu DİF'e eşitlenmemiş olabilir. Bu geçişte aşağıdaki
  // `fields.*` okumaları null'a çarpıp ErrorBoundary'ye düşüyordu. React, setFields sonrası
  // hemen yeniden çizeceği için bu tur boş dönmek yeterli — kullanıcı bir şey görmez.
  if (!dif || fields?.id !== dif.id) return null;
  // BUG FIX: önceden isoStandards.js'teki ISO'ya özgü getFindingTypeMeta/getStandardLabel
  // kullanılıyordu — Mevzuat kaynaklı bir DİF'te dif.type "uygun_degil"/"kismen_uygun"
  // olduğu ve dif.standard/clauseCode hiç set edilmediği için rozet "undefined —
  // undefined" gösteriyordu. Artık jenerik auditScoring.js'teki getResultMeta kullanılıyor
  // (aynı 5 durumlu skala, bkz. mevzuatChecklist.js) ve mevzuat dayanağı doğrudan
  // dif.legislationName/dif.article'dan okunuyor.
  const typeMeta = getResultMeta(dif.type);
  const overdue = isDifOverdue(dif);
  const currentIndex = getDifStageIndex(dif.stage);

  function commitFields(next = fields) {
    // `fields` bayat olabilir (aşama geçişinden sonra stage/history/closedAt eski kalır) —
    // yalnızca düzenlenebilir alanlar TAZE `dif` üzerine yazılır (bkz. auditWorkflow.js).
    onSaveFields(mergeDifEditableFields(dif, next));
  }

  function checkTransition(toStage, patch = {}, isReopenAction = false) {
    return canTransitionDifStage({ fromStage: dif.stage, toStage, dif: fields, patch, actorRole: role, company, isReopenAction });
  }

  async function attemptTransition(toStage, options = {}) {
    setTransitionError(null);
    setBusy(true);
    try {
      // Geçişle birlikte tüm düzenlenebilir alanlar da yazılır: az önce odağı kaybeden bir
      // alanın (henüz tamamlanmamış) kaydı, bayat `dif` tabanlı bu yazımla ezilmesin.
      await onStageChange(dif, toStage, { ...options, patch: { ...pickDifEditableFields(fields), ...options.patch } });
    } catch (err) {
      setTransitionError(err.message || "Bu durum geçişine izin verilmiyor.");
    } finally {
      setBusy(false);
    }
  }

  function addEvidence() {
    if (!evidenceName.trim()) return;
    onAddEvidence(dif, { name: evidenceName.trim(), type: evidenceType });
    setEvidenceName("");
  }

  const inputStyle = { background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary };

  // Her aşama için ilgili "ileri" geçiş — stepper'daki her adım BİR SONRAKİ
  // aşamayı temsil eder, rastgele bir aşamaya atlanamaz (bkz. dosya başı notu).
  const toAwaitingActionCheck = dif.stage === "open" ? checkTransition("awaitingAction", { correctiveAction: fields.correctiveAction }) : null;
  const toPendingReviewCheck = dif.stage === "awaitingAction"
    ? checkTransition("pendingReview", { actionCompleted: fields.actionCompleted, actionEvidence: fields.actionEvidence })
    : null;
  const toClosedCheck = dif.stage === "pendingReview" ? checkTransition("closed", { closureNote: fields.closureNote }) : null;
  const toAwaitingFromReviewCheck = dif.stage === "pendingReview" ? checkTransition("awaitingAction") : null;
  const reopenCheck = dif.stage === "closed" ? checkTransition("awaitingAction", { reopenReason }, true) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg h-full overflow-y-auto p-4" style={{ background: theme.surface }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
              {dif.legislationName && (
                <Badge tone="neutral">{dif.legislationName}{dif.article ? ` — ${dif.article}` : ""}</Badge>
              )}
              {overdue && <Badge tone="danger">Gecikti</Badge>}
            </div>
            <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{dif.criterionTitle || dif.description}</p>
          </div>
          <button onClick={onClose} aria-label="Kapat"><X style={{ fontSize: "18px", color: theme.textMuted }} /></button>
        </div>

        <div className="flex items-center justify-between mb-4 mt-3">
          {DIF_STAGES.map((s, i) => (
            <div key={s.value} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={i <= currentIndex ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textFaint }}>
                {i + 1}
              </div>
              <span className="text-[9px] text-center" style={{ color: i === currentIndex ? theme.textPrimary : theme.textFaint }}>{s.label}</span>
            </div>
          ))}
        </div>

        {transitionError && (
          <div className="rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2" style={{ background: theme.highRiskBg }}>
            <AlertTriangle style={{ fontSize: "13px", color: theme.highRiskText, marginTop: "1px" }} />
            <p className="text-xs" style={{ color: theme.highRiskText }}>{transitionError}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Sorumlu</label>
            <input disabled={!canManage} value={fields.responsible} onChange={(e) => setFields({ ...fields, responsible: e.target.value })}
              onBlur={() => commitFields()} className="w-full text-sm rounded-lg px-3 py-2 border outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Termin</label>
            <input disabled={!canManage} type="date" value={fields.dueDate || ""} onChange={(e) => setFields({ ...fields, dueDate: e.target.value })}
              onBlur={() => commitFields()} className="w-full text-sm rounded-lg px-3 py-2 border outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>Kök Neden</label>
            <textarea disabled={!canManage} value={fields.rootCause} onChange={(e) => setFields({ ...fields, rootCause: e.target.value })}
              onBlur={() => commitFields()} rows={2} className="w-full text-sm rounded-lg px-3 py-2 border outline-none resize-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>
              Düzeltici Faaliyet {dif.stage === "open" && <span style={{ color: theme.highRiskText }}>*</span>}
            </label>
            <textarea disabled={!canManage} value={fields.correctiveAction} onChange={(e) => setFields({ ...fields, correctiveAction: e.target.value })}
              onBlur={() => commitFields()} rows={2} className="w-full text-sm rounded-lg px-3 py-2 border outline-none resize-none" style={inputStyle} />
          </div>
        </div>

        {/* Aşamaya özel geçiş alanı — yalnızca ilgili "zorunlu koşullar" burada girilir. */}
        {canManage && dif.stage === "open" && (
          <div className="rounded-lg border px-3 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
            <Button onClick={() => attemptTransition("awaitingAction", { patch: { correctiveAction: fields.correctiveAction } })}
              disabled={busy || !toAwaitingActionCheck?.allowed} className="w-full">
              Aksiyon Bekliyor'a Taşı
            </Button>
            {!toAwaitingActionCheck?.allowed && <p className="text-[10.5px] mt-1.5" style={{ color: theme.textFaint }}>{toAwaitingActionCheck?.reason}</p>}
          </div>
        )}

        {canManage && dif.stage === "awaitingAction" && (
          <div className="rounded-lg border px-3 py-3 mb-4 flex flex-col gap-2.5" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
            <label className="flex items-center gap-2 text-sm" style={{ color: theme.textPrimary }}>
              <input type="checkbox" checked={Boolean(fields.actionCompleted)}
                onChange={(e) => { const next = { ...fields, actionCompleted: e.target.checked }; setFields(next); commitFields(next); }} />
              Aksiyon tamamlandı
            </label>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>
                Aksiyon açıklaması / kanıtı <span style={{ color: theme.highRiskText }}>*</span>
              </label>
              <textarea value={fields.actionEvidence} onChange={(e) => setFields({ ...fields, actionEvidence: e.target.value })}
                onBlur={() => commitFields()} rows={2} className="w-full text-sm rounded-lg px-3 py-2 border outline-none resize-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
            </div>
            <Button onClick={() => attemptTransition("pendingReview", { patch: { actionCompleted: fields.actionCompleted, actionEvidence: fields.actionEvidence } })}
              disabled={busy || !toPendingReviewCheck?.allowed}>
              İnceleme Bekliyor'a Taşı
            </Button>
            {!toPendingReviewCheck?.allowed && <p className="text-[10.5px]" style={{ color: theme.textFaint }}>{toPendingReviewCheck?.reason}</p>}
          </div>
        )}

        {canManage && dif.stage === "pendingReview" && (
          <div className="rounded-lg border px-3 py-3 mb-4 flex flex-col gap-2.5" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: theme.textPrimary }}>
                Kapanış açıklaması <span style={{ color: theme.highRiskText }}>*</span>
              </label>
              <textarea value={fields.closureNote} onChange={(e) => setFields({ ...fields, closureNote: e.target.value })}
                onBlur={() => commitFields()} rows={2} className="w-full text-sm rounded-lg px-3 py-2 border outline-none resize-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => attemptTransition("awaitingAction")} disabled={busy || !toAwaitingFromReviewCheck?.allowed} className="flex-1">
                Aksiyon Bekliyor'a Geri Gönder
              </Button>
              <Button onClick={() => attemptTransition("closed", { patch: { closureNote: fields.closureNote } })} disabled={busy || !toClosedCheck?.allowed} className="flex-1 flex items-center justify-center gap-1.5">
                <CheckCircle2 style={{ fontSize: "14px" }} /> Kapat
              </Button>
            </div>
            {!toClosedCheck?.allowed && <p className="text-[10.5px]" style={{ color: theme.textFaint }}>{toClosedCheck?.reason}</p>}
          </div>
        )}

        {canManage && dif.stage === "closed" && (
          <div className="rounded-lg border px-3 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
            {!reopening ? (
              <Button variant="secondary" onClick={() => setReopening(true)} className="w-full flex items-center justify-center gap-1.5">
                <RotateCcw style={{ fontSize: "13px" }} /> Yeniden Aç
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
                  Yeniden açma nedeni <span style={{ color: theme.highRiskText }}>*</span>
                </label>
                <textarea value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} rows={2}
                  className="w-full text-sm rounded-lg px-3 py-2 border outline-none resize-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => { setReopening(false); setReopenReason(""); }} className="flex-1">Vazgeç</Button>
                  <Button onClick={() => attemptTransition("awaitingAction", { patch: { reopenReason }, isReopenAction: true, reason: reopenReason })}
                    disabled={busy || !reopenCheck?.allowed} className="flex-1">
                    Yeniden Aç
                  </Button>
                </div>
                {!reopenCheck?.allowed && <p className="text-[10.5px]" style={{ color: theme.textFaint }}>{reopenCheck?.reason}</p>}
              </div>
            )}
          </div>
        )}

        <p className="text-xs font-semibold mb-2" style={{ color: theme.textPrimary }}>Kanıt Dosyaları</p>
        {canManage && (
          <div className="flex gap-2 mb-2">
            <input value={evidenceName} onChange={(e) => setEvidenceName(e.target.value)} placeholder="Dosya adı"
              className="flex-1 text-sm rounded-lg px-3 py-2 border outline-none" style={inputStyle} />
            <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} className="text-sm rounded-lg px-2 py-2 border outline-none" style={inputStyle}>
              {EVIDENCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button size="sm" onClick={addEvidence} disabled={!evidenceName.trim()}>Ekle</Button>
          </div>
        )}
        {(dif.evidence || []).length === 0 ? (
          <EmptyState icon={Paperclip} title="Henüz kanıt dosyası yok" />
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {dif.evidence.map((e) => {
              const Icon = TYPE_ICON[e.type] || FileText;
              return (
                <div key={e.id} className="rounded-lg border px-3 py-2 flex items-center gap-2" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
                  <Icon style={{ fontSize: "14px", color: theme.textMuted }} />
                  <span className="text-sm flex-1 truncate" style={{ color: theme.textPrimary }}>{e.name}</span>
                  {canManage && <button onClick={() => setConfirmRemoveId(e.id)} aria-label="Sil"><Trash2 style={{ fontSize: "13px", color: theme.emergencyText }} /></button>}
                </div>
              );
            })}
          </div>
        )}

        {(dif.history || []).length > 0 && (
          <>
            <p className="text-xs font-semibold mb-2 mt-2" style={{ color: theme.textPrimary }}>Durum Geçmişi</p>
            <div className="flex flex-col gap-1.5 mb-2">
              {[...dif.history].reverse().map((h) => (
                <div key={h.id} className="rounded-lg px-3 py-2 text-xs" style={{ background: theme.surfaceAlt }}>
                  <p style={{ color: theme.textPrimary }}>
                    <strong>{getDifStageIndex(h.from) >= 0 ? DIF_STAGES.find((s) => s.value === h.from)?.label : h.from}</strong> → <strong>{DIF_STAGES.find((s) => s.value === h.to)?.label}</strong>
                  </p>
                  <p style={{ color: theme.textFaint }}>{h.actor} • {new Date(h.at).toLocaleString("tr-TR")}</p>
                  {h.reason && <p className="mt-0.5" style={{ color: theme.textMuted }}>{h.reason}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        <ConfirmDialog
          open={confirmRemoveId !== null}
          title="Kanıt dosyasını sil"
          message="Bu kanıt dosyasını kaldırmak istediğine emin misin?"
          confirmLabel="Sil"
          danger
          onConfirm={() => { onRemoveEvidence(dif, confirmRemoveId); setConfirmRemoveId(null); }}
          onCancel={() => setConfirmRemoveId(null)}
        />
      </div>
    </div>
  );
}
