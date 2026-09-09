import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import { getAuditStatusMeta, getDifStageMeta } from "../../constants/auditWorkflow.js";
import { X, CheckCircle2, AlertTriangle, ChevronRight } from "../../components/icons/index.jsx";

/**
 * Denetim detay çekmecesi — kriterler kategoriye göre gruplanır, her kategori
 * kendi ilerleme/skor özetiyle gösterilir ("Kategori bazlı skor"). Denetim
 * tamamlandıysa (status === "completed") tüm alanlar salt-okunur olur ve üstte
 * net bir "sonuçlar" özeti gösterilir. Denetim TÜRÜNDEN bağımsız, jenerik
 * bileşen — kategori/kriter/skor mantığı dışarıdan gelir (bkz. AuditPage.jsx'teki
 * `config` prop'u), ISO 45001 ve İSG Mevzuat Denetimi AYNI çekmeceyi kullanır.
 *
 * DİF KÖPRÜSÜ (yalnızca İSG Mevzuat): "Uygunsuzluk Oluştur" butonu SADECE
 * `item.legislationName` dolu (yani Mevzuat kriteri) VE sonuç "Uygun Değil" iken
 * görünür — ISO 45001'in checklist maddelerinde `legislationName` hiç yok, bu
 * yüzden bu blok ISO 45001 akışını hiç etkilemez/göstermez. DİF OTOMATİK
 * AÇILMAZ — yalnızca uzman butona basarsa `onCreateDif` çağrılır. Zaten bir DİF
 * varsa (bkz. `findings`), buton yerine durum rozeti + "Yönet →" gösterilir
 * (mükerrer oluşturmayı engellemenin gerçek yeri auditManagementService.js →
 * openDifFromFinding'deki idempotent kontrol; burası yalnızca UX).
 *
 * @param {{ audit: object|null, onClose: () => void, canManage: boolean, departments: object[],
 *   onUpdateItem: (audit, itemId, patch) => Promise<void>, onComplete: (audit) => Promise<void>,
 *   standardLabel: string, checklistResults: Array<{value:string,label:string,tone:string}>,
 *   getResultMeta: (value: string) => object, computeOverallScore: (c: object[]) => number|null,
 *   computeProgressPercent: (c: object[]) => number, computeCategoryScores: (c: object[]) => Array<object>,
 *   findings?: object[], onCreateDif?: (audit, item) => Promise<void>, onOpenDif?: (dif) => void }} props
 */
export default function AuditDetailDrawer({
  audit, onClose, canManage, departments, onUpdateItem, onComplete,
  standardLabel, checklistResults, getResultMeta, computeOverallScore, computeProgressPercent, computeCategoryScores,
  findings = [], onCreateDif, onOpenDif,
}) {
  const { theme } = useTheme();

  const categoryScores = useMemo(() => (audit ? computeCategoryScores(audit.checklist) : []), [audit, computeCategoryScores]);

  if (!audit) return null;
  const statusMeta = getAuditStatusMeta(audit.status);
  const overallScore = computeOverallScore(audit.checklist);
  const progress = computeProgressPercent(audit.checklist);
  const editable = canManage && audit.status !== "completed";

  function findDifFor(item) {
    return findings.find((f) => String(f.auditId) === String(audit.id) && f.checklistItemId === item.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg h-full overflow-y-auto p-4"
        style={{ background: theme.surface }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="font-[Oswald] text-base uppercase tracking-wide" style={{ color: theme.textPrimary }}>{audit.scopeDescription}</p>
            <p className="text-xs" style={{ color: theme.textFaint }}>{standardLabel} • {audit.plannedDate}</p>
          </div>
          <button onClick={onClose} aria-label="Kapat"><X style={{ fontSize: "18px", color: theme.textMuted }} /></button>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
        </div>

        <div className="rounded-lg px-3 py-3 mb-4" style={{ background: theme.surfaceAlt }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px]" style={{ color: theme.textFaint }}>{audit.status === "completed" ? "Denetim Sonucu — Toplam Skor" : "Toplam Skor (canlı)"}</p>
            <p className="text-2xl font-bold leading-none" style={{ color: theme.textPrimary }}>{overallScore !== null ? `%${overallScore}` : "—"}</p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: theme.border }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: theme.accent }} />
          </div>
          <p className="text-[10.5px] mt-1" style={{ color: theme.textFaint }}>%{progress} değerlendirildi</p>
        </div>

        <div className="flex flex-col gap-4 mb-4">
          {categoryScores.map((cat) => (
            <div key={cat.code}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.textMuted }}>{cat.code} — {cat.title}</p>
                <span className="text-xs font-semibold" style={{ color: theme.textFaint }}>
                  {cat.score !== null ? `%${cat.score}` : "—"} · {cat.evaluatedCount}/{cat.total}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {audit.checklist.filter((item) => item.categoryCode === cat.code).map((item) => (
                  <div key={item.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
                    <p className="text-sm mb-1.5" style={{ color: theme.textPrimary }}>{item.title}</p>

                    {/* Mevzuat dayanağı — YALNIZCA bu alanlara sahip checklist'lerde (İSG Mevzuat
                        Denetimi) görünür. ISO 45001'in checklist maddelerinde bu alanlar YOK,
                        bu yüzden koşullu render ISO 45001'i hiç etkilemez. */}
                    {item.legislationName && (
                      <div className="rounded-md px-2.5 py-2 mb-2" style={{ background: theme.surface, border: `1px dashed ${theme.border}` }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-[11px] font-semibold" style={{ color: theme.textMuted }}>
                            {item.legislationName}{item.article ? ` — ${item.article}` : ""}
                          </p>
                          {item.verified ? (
                            <Badge tone="success">Doğrulandı</Badge>
                          ) : (
                            <Badge tone="warning">⚠️ DOĞRULAMA GEREKLİ</Badge>
                          )}
                        </div>
                        {item.controlPurpose && (
                          <p className="text-[10.5px] mb-0.5" style={{ color: theme.textFaint }}>
                            <strong style={{ color: theme.textMuted }}>Kontrol amacı:</strong> {item.controlPurpose}
                          </p>
                        )}
                        {item.expectedEvidence && (
                          <p className="text-[10.5px]" style={{ color: theme.textFaint }}>
                            <strong style={{ color: theme.textMuted }}>Beklenen kanıt:</strong> {item.expectedEvidence}
                          </p>
                        )}

                        {/* DİF köprüsü — yalnızca "Uygun Değil" sonucunda, yalnızca uzman
                            elle tetiklerse. DİF kapandığında bu sonuç OTOMATİK değişmez
                            (bilerek) — denetim kaydı, o anki bulguyu göstermeye devam eder. */}
                        {item.result === "uygun_degil" && (() => {
                          const dif = findDifFor(item);
                          if (dif) {
                            const stageMeta = getDifStageMeta(dif.stage);
                            return (
                              <button onClick={() => onOpenDif?.(dif)} disabled={!onOpenDif}
                                className="w-full mt-1.5 flex items-center justify-between gap-2 rounded-md px-2 py-1.5" style={{ background: theme.surfaceAlt }}>
                                <span className="text-[10.5px] font-semibold flex items-center gap-1" style={{ color: theme.textMuted }}>
                                  <AlertTriangle style={{ fontSize: "10px", color: theme.highRiskText }} /> Uygunsuzluk (DİF): {stageMeta.label}
                                </span>
                                <span className="flex items-center gap-0.5 text-[10.5px] font-semibold" style={{ color: theme.accent }}>
                                  Yönet <ChevronRight style={{ fontSize: "11px" }} />
                                </span>
                              </button>
                            );
                          }
                          if (canManage && onCreateDif) {
                            return (
                              <button onClick={() => onCreateDif(audit, item).catch((err) => console.error("Uygunsuzluk oluşturulamadı:", err))}
                                className="w-full mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-md px-2 py-1.5"
                                style={{ background: theme.highRiskBg, color: theme.highRiskText }}>
                                <AlertTriangle style={{ fontSize: "11px" }} /> Uygunsuzluk Oluştur
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    {editable ? (
                      <>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {checklistResults.map((r) => (
                            <button key={r.value} onClick={() => onUpdateItem(audit, item.id, { result: r.value })}
                              className="text-[10.5px] font-semibold px-2 py-1 rounded-full border"
                              style={item.result === r.value ? { background: theme.accent, color: theme.onAccent, borderColor: theme.accent } : { borderColor: theme.border, color: theme.textMuted }}>
                              {r.label}
                            </button>
                          ))}
                        </div>
                        <input value={item.note} onChange={(e) => onUpdateItem(audit, item.id, { note: e.target.value })} placeholder="Not ekle..."
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 border outline-none mb-2" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
                        {departments.length > 0 && (
                          <select value={item.departmentId || ""} onChange={(e) => onUpdateItem(audit, item.id, { departmentId: e.target.value || null })}
                            className="w-full text-xs rounded-lg px-2.5 py-1.5 border outline-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
                            <option value="">Departman seç (opsiyonel)</option>
                            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={getResultMeta(item.result).tone}>{getResultMeta(item.result).label}</Badge>
                        {item.note && <span className="text-xs truncate" style={{ color: theme.textFaint }}>{item.note}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {editable && (
          <Button onClick={() => onComplete(audit)} className="w-full flex items-center justify-center gap-1.5">
            <CheckCircle2 style={{ fontSize: "14px" }} /> Denetimi Tamamla ve Sonuçları Kilitle
          </Button>
        )}
      </div>
    </div>
  );
}
