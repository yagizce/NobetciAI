import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { getCurrentUser } from "../../services/authService.js";
import { buildAuditReportData } from "../../utils/auditReport.js";
import { computeAuditPreparedness } from "../../utils/auditPreparedness.js";
import { X, FileText, ClipboardList, AlertTriangle, Paperclip, Scale, CheckCircle2 } from "../../components/icons/index.jsx";

// Rapor, HER ZAMAN aynı sabit/açık renk paletiyle (aşağıdaki REPORT_COLORS) basılır —
// uygulamanın aktif temasından (light/dark) BİLİNÇLİ OLARAK bağımsızdır. Gerekçe:
// gerçek bir denetim raporu kağıda/PDF'e basılan resmi bir belgedir, karanlık modda
// koyu arka plan üzerine açık metinle YAZDIRILAMAZ (ya mürekkep israfı ya da tarayıcı
// "arka planları yazdır" kapalıyken okunamaz beyaz-üstü-beyaz metin olur). Renkler
// constants/theme.js'teki AÇIK temanın DEĞERLERİYLE birebir aynıdır (yeni bir renk
// icat edilmedi, yalnızca bu belge için sabitlendi) — bkz. index.css'teki
// `input:focus-visible` notunda da belirtildiği gibi accent (#F2B705) zaten
// temadan bağımsız statik bir marka rengi.
const REPORT_COLORS = {
  surface: "#FFFFFF", surfaceAlt: "#F7F5EE", border: "#E3DFD3",
  textPrimary: "#211E19", textMuted: "#726D60", textFaint: "#A39D8C",
  accent: "#F2B705", onAccent: "#211E19",
  successBg: "#E4F2E1", successText: "#3E7A34",
  warnBg: "#FBEFD2", warnText: "#8A6300",
  dangerBg: "#FCE4E4", dangerText: "#B3261E",
  pendingBg: "#EFEAF9", pendingText: "#5B3FA0",
  neutralBg: "#F3F1EA", neutralText: "#726D60",
};

const TONE_STYLE = {
  success: { background: REPORT_COLORS.successBg, color: REPORT_COLORS.successText },
  warning: { background: REPORT_COLORS.warnBg, color: REPORT_COLORS.warnText },
  danger: { background: REPORT_COLORS.dangerBg, color: REPORT_COLORS.dangerText },
  pending: { background: REPORT_COLORS.pendingBg, color: REPORT_COLORS.pendingText },
  neutral: { background: REPORT_COLORS.neutralBg, color: REPORT_COLORS.neutralText },
};

function RBadge({ tone = "neutral", children }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={TONE_STYLE[tone] || TONE_STYLE.neutral}>
      {children}
    </span>
  );
}

function SectionHeading({ index, title, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: `2px solid ${REPORT_COLORS.border}` }}>
      {Icon && <Icon style={{ fontSize: "15px", color: REPORT_COLORS.accent }} />}
      <p className="font-[Oswald] text-sm uppercase tracking-wide" style={{ color: REPORT_COLORS.textPrimary }}>
        {index}. {title}
      </p>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: REPORT_COLORS.surfaceAlt, border: `1px solid ${REPORT_COLORS.border}` }}>
      <p className="text-[10px]" style={{ color: REPORT_COLORS.textFaint }}>{label}</p>
      <p className="text-lg font-bold leading-tight" style={{ color: REPORT_COLORS.textPrimary }}>{value}</p>
      {sub && <p className="text-[10px]" style={{ color: REPORT_COLORS.textFaint }}>{sub}</p>}
    </div>
  );
}

function EmptyNote({ children }) {
  return <p className="text-xs italic" style={{ color: REPORT_COLORS.textFaint }}>{children}</p>;
}

/**
 * Denetim Raporu — "Raporu Görüntüle" ile açılan, ayrı ve profesyonel bir rapor
 * ekranı. Veri KAYDEDİLMEZ/statik bir kopya olarak tutulmaz: her açılışta/her
 * `audit`/`findings` değişiminde `buildAuditReportData` (bkz. utils/auditReport.js)
 * TEKRAR çağrılır — rapor her zaman denetimin O ANKİ gerçek durumunu yansıtır.
 *
 * Rapor body portalında açılır; uygulamanın kaydırma alanından ve yazdırma
 * sırasında gizlenen kabuktan bağımsızdır.
 *
 * @param {{ audit: object|null, onClose: () => void, findings?: object[], allAudits?: object[],
 *   company?: object|null, standardLabel: string, checklistResults: object[], getResultMeta: Function,
 *   computeOverallScore: Function, computeProgressPercent: Function, computeCategoryScores: Function,
 *   getCategoryTitle?: Function }} props
 */
export default function AuditReportView({
  audit, onClose, findings = [], allAudits = [], company = null, standardLabel,
  checklistResults, getResultMeta, computeOverallScore, computeProgressPercent, computeCategoryScores, getCategoryTitle,
}) {
  const { theme } = useTheme();
  const { role } = useRole();

  // Denetçi bilgisi — Kapak bölümü, rol ETİKETİNİ ("İSG Uzmanı" vb.) DEĞİL, gerçek
  // aktif kullanıcının adını gösterir. Uygulamada zaten var olan tek kullanıcı kaynağı
  // services/authService.js → getCurrentUser() (bkz. pages/Profile.jsx'teki AYNI desen:
  // useEffect + getCurrentUser(role)) — burada YENİ bir kullanıcı/kimlik sistemi
  // KURULMUYOR, mevcut mock auth servisinden aynı şekilde okunuyor. Servis henüz
  // yanıt vermediyse ya da isim gelmezse `auditorName` "" kalır — UI bunu "Belirtilmemiş"
  // gösterir, asla bir isim UYDURULMAZ.
  const [auditorName, setAuditorName] = useState("");
  useEffect(() => {
    let cancelled = false;
    getCurrentUser(role)
      .then((user) => { if (!cancelled) setAuditorName(user?.name || ""); })
      .catch(() => { if (!cancelled) setAuditorName(""); });
    return () => { cancelled = true; };
  }, [role]);

  useEffect(() => {
    if (!audit) return;
    function handleKeyDown(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [audit, onClose]);

  // Hazırlık skoru — AYNI merkezi fonksiyon (auditPreparedness.js), AuditDetailDrawer.jsx
  // ile BİREBİR aynı girdilerle (company/allAudits/findings) çağrılır. Skor burada
  // YENİDEN TANIMLANMAZ, yalnızca rapora aktarılır.
  const preparedness = useMemo(
    () => computeAuditPreparedness({ company, audits: allAudits, findings }),
    [company, allAudits, findings]
  );

  const report = useMemo(() => {
    if (!audit) return null;
    return buildAuditReportData({
      audit, findings, company, standardLabel, checklistResults, getResultMeta,
      computeOverallScore, computeProgressPercent, computeCategoryScores, getCategoryTitle,
      auditorName, preparednessScore: preparedness.score,
    });
  }, [audit, findings, company, standardLabel, checklistResults, getResultMeta, computeOverallScore, computeProgressPercent, computeCategoryScores, getCategoryTitle, auditorName, preparedness]);

  if (!audit || !report) return null;

  const { cover, summary, categoryResults, nonconformities, evidenceByCriterion, correctiveActionsByStage, overdueActions, priorityActions, legislationFindings } = report;

  const RESULT_LABELS = {
    uygun: "Uygun", kismen_uygun: "Kısmen Uygun", uygun_degil: "Uygun Değil", kanit_yok: "Kanıt Yok", degerlendirilmedi: "Değerlendirilmedi",
  };

  const content = (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: theme.pageBg }}>
      {/* Ekran içi araç çubuğu — yazdırılmaz (bkz. index.css → .audit-report-no-print) */}
      <div className="audit-report-no-print sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3" style={{ background: theme.header, borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2 min-w-0">
          <FileText style={{ fontSize: "16px", color: theme.textMuted }} />
          <p className="text-sm font-semibold truncate" style={{ color: theme.textPrimary }}>Denetim Raporu — {cover.auditName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => window.print()} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: theme.accent, color: theme.onAccent }}>
            Yazdır / PDF Olarak Kaydet
          </button>
          <button onClick={onClose} aria-label="Kapat" className="p-1.5 rounded-lg" style={{ background: theme.surfaceAlt }}>
            <X style={{ fontSize: "16px", color: theme.textMuted }} />
          </button>
        </div>
      </div>

      {/* Yazdırılabilir rapor gövdesi — bkz. index.css'teki @media print izolasyon kuralları */}
      <div className="audit-report-print flex justify-center py-6 px-3 sm:px-6">
        <div className="w-full max-w-[794px] rounded-lg sm:rounded-xl overflow-hidden" style={{ background: REPORT_COLORS.surface, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>

          {/* ── 1. Kapak ─────────────────────────────────────────────── */}
          <div className="px-6 sm:px-10 py-10 audit-report-page-break" style={{ borderBottom: `3px solid ${REPORT_COLORS.accent}` }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-6" style={{ color: REPORT_COLORS.textFaint }}>Nöbetçi İSG — Denetim Raporu</p>
            <p className="font-[Oswald] text-2xl sm:text-3xl uppercase tracking-wide mb-1" style={{ color: REPORT_COLORS.textPrimary }}>{cover.companyName || "Firma belirtilmemiş"}</p>
            <p className="text-base mb-8" style={{ color: REPORT_COLORS.textMuted }}>{cover.auditName || "Kapsam belirtilmemiş"}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: REPORT_COLORS.textFaint }}>Denetim Türü/Kapsamı</p>
                <p className="text-sm font-semibold" style={{ color: REPORT_COLORS.textPrimary }}>{cover.standardLabel}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: REPORT_COLORS.textFaint }}>Denetim Tarihi</p>
                <p className="text-sm font-semibold" style={{ color: REPORT_COLORS.textPrimary }}>{cover.plannedDate || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: REPORT_COLORS.textFaint }}>Denetçi</p>
                <p className="text-sm font-semibold" style={{ color: REPORT_COLORS.textPrimary }}>{cover.auditorLabel || "Belirtilmemiş"}</p>
              </div>
              {cover.sector && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: REPORT_COLORS.textFaint }}>Sektör</p>
                  <p className="text-sm font-semibold" style={{ color: REPORT_COLORS.textPrimary }}>{cover.sector}</p>
                </div>
              )}
              {cover.dangerClassLabel && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: REPORT_COLORS.textFaint }}>Tehlike Sınıfı</p>
                  <p className="text-sm font-semibold" style={{ color: REPORT_COLORS.textPrimary }}>{cover.dangerClassLabel}</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 sm:px-10 py-8 flex flex-col gap-8">

            {/* ── 2. Yönetici Özeti ─────────────────────────────────── */}
            <div>
              <SectionHeading index={2} title="Yönetici Özeti" icon={ClipboardList} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                <StatCard label="Genel Sonuç" value={summary.overallScore !== null ? `%${summary.overallScore}` : "—"} sub={summary.scoreLevel?.label} />
                {summary.preparednessScore !== null && (
                  <StatCard label="Hazırlık Skoru" value={`%${summary.preparednessScore}`} sub={`${preparedness.evaluatedCriterionCount}/${preparedness.totalCriterionCount} kriter değerlendirildi`} />
                )}
                <StatCard label="Toplam Kriter" value={summary.totalCriteria} sub={`%${summary.progressPercent} değerlendirildi`} />
                <StatCard label="Kritik Bulgu" value={summary.criticalFindingsCount} sub="Uygun Değil" />
                <StatCard label="Açık DİF" value={summary.openDifCount} />
                <StatCard label="Gecikmiş DİF" value={summary.overdueDifCount} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {Object.entries(summary.resultCounts).map(([value, count]) => (
                  <StatCard key={value} label={RESULT_LABELS[value] || value} value={count} />
                ))}
              </div>
            </div>

            {/* ── 3. Denetim Sonuçları ──────────────────────────────── */}
            <div>
              <SectionHeading index={3} title="Denetim Sonuçları (Kategori Bazlı)" icon={ClipboardList} />
              {categoryResults.length === 0 ? <EmptyNote>Kategori tanımlanmamış.</EmptyNote> : (
                <div className="flex flex-col gap-2">
                  {categoryResults.map((cat) => (
                    <div key={cat.code} className="audit-report-avoid-break rounded-lg px-3 py-2.5" style={{ border: `1px solid ${REPORT_COLORS.border}` }}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: REPORT_COLORS.textMuted }}>{cat.code} — {cat.title}</p>
                        <span className="text-xs font-semibold shrink-0" style={{ color: REPORT_COLORS.textFaint }}>
                          {cat.score !== null ? `%${cat.score}` : "—"} · {cat.evaluatedCount}/{cat.total}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: REPORT_COLORS.border }}>
                        <div className="h-full rounded-full" style={{ width: `${cat.progress}%`, background: REPORT_COLORS.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 4. Tespitler ve Uygunsuzluklar ─────────────────────── */}
            {/* Her kayıt izlenebilir tek bir zincir: Kriter → Tespit → Mevzuat Dayanağı
                → Kanıt → DİF → Güncel Durum. Her halka kendi gerçek kaynağından gelir
                (bkz. utils/auditReport.js); boş bir halka için metin UYDURULMAZ, yalnızca
                "belirtilmemiş/açılmamış" gibi nötr bir not gösterilir. */}
            <div>
              <SectionHeading index={4} title="Tespitler ve Uygunsuzluklar" icon={AlertTriangle} />
              {nonconformities.length === 0 ? <EmptyNote>Bu denetimde tespit edilen uygunsuzluk yok.</EmptyNote> : (
                <div className="flex flex-col gap-3">
                  {nonconformities.map((n) => (
                    <div key={n.criterionId} className="audit-report-avoid-break rounded-lg px-3 py-2.5" style={{ border: `1px solid ${REPORT_COLORS.border}` }}>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <RBadge tone={checklistResults.find((r) => r.value === n.result)?.tone || "neutral"}>{n.resultLabel}</RBadge>
                        {/* Not: burada bir "öncelik/risk seviyesi" rozeti YOK — checklist/DİF veri
                            modelinde gerçek bir öncelik alanı bulunmuyor; auditScoring.js'teki `weight`
                            yalnızca skor ortalaması içindir, bir risk seviyesi değildir (bkz. utils/auditReport.js
                            dosya başı notu). Uydurma bir taksonomi göstermek yerine yalnızca gerçek sonuç
                            gösterilir. */}
                        <RBadge tone={n.evidenceStatus === "present" ? "success" : n.evidenceStatus === "incomplete" ? "warning" : "neutral"}>
                          Kanıt: {n.evidenceStatus === "present" ? "Mevcut" : n.evidenceStatus === "incomplete" ? "Eksik" : "Kanıt Yok"}
                        </RBadge>
                        {n.dif && (
                          <RBadge tone={n.dif.stage === "closed" ? "success" : n.dif.overdue ? "danger" : "pending"}>
                            DİF: {n.dif.stageLabel}{n.dif.overdue ? " — Gecikti" : ""}
                          </RBadge>
                        )}
                      </div>

                      {/* 1) Kriter */}
                      <p className="text-sm font-semibold mb-0.5" style={{ color: REPORT_COLORS.textPrimary }}>{n.criterionTitle}</p>
                      <p className="text-[10.5px] mb-1.5" style={{ color: REPORT_COLORS.textFaint }}>{n.categoryTitle}</p>

                      {/* 2) Tespit — yalnızca item.note, boşsa metin uydurulmaz */}
                      <p className="text-xs mb-1.5" style={{ color: REPORT_COLORS.textMuted }}>
                        <strong>Tespit:</strong> {n.note || <span style={{ color: REPORT_COLORS.textFaint, fontStyle: "italic" }}>Denetçi notu girilmemiş.</span>}
                      </p>

                      {/* 3) Mevzuat Dayanağı — checklist'ten aynen, madde uydurulmaz */}
                      {n.legislationName && (
                        <p className="text-[10.5px] mb-1.5" style={{ color: REPORT_COLORS.textMuted }}>
                          <strong>Mevzuat Dayanağı:</strong> {n.legislationName}{n.article ? ` — ${n.article}` : ""}
                          {!n.verified && <span style={{ color: REPORT_COLORS.warnText }}> (⚠️ Mevzuat doğrulaması gerekli)</span>}
                        </p>
                      )}

                      {/* 4) Kanıt — YALNIZCA checklist[].evidence; DİF'in kendi aksiyon
                          kanıtı burada DEĞİL, aşağıdaki DİF bloğunda ayrı gösterilir. */}
                      <div className="mb-1.5">
                        <p className="text-[10.5px]" style={{ color: REPORT_COLORS.textMuted }}><strong>Kanıt:</strong></p>
                        {n.evidenceEntries.length === 0 ? (
                          <p className="text-[10.5px] pl-2" style={{ color: REPORT_COLORS.textFaint }}>Kriter için kanıt eklenmemiş.</p>
                        ) : (
                          <div className="pl-2 flex flex-col gap-0.5">
                            {n.evidenceEntries.map((e) => (
                              <p key={e.id} className="text-[10.5px]" style={{ color: REPORT_COLORS.textMuted }}>
                                • <strong>{e.typeLabel}</strong>{e.description ? `: ${e.description}` : ""}
                                {e.createdAt && <span style={{ color: REPORT_COLORS.textFaint }}> — {new Date(e.createdAt).toLocaleDateString("tr-TR")}</span>}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 5) DİF → 6) Güncel Durum — yoksa "DİF oluşturulmadı", otomatik
                          DİF ÜRETİLMEZ; kapalı bir DİF asla açık gösterilmez. */}
                      {n.dif ? (
                        <div className="rounded-md px-2.5 py-2" style={{ background: REPORT_COLORS.surfaceAlt }}>
                          <p className="text-[10.5px] mb-1" style={{ color: REPORT_COLORS.textMuted }}>
                            <strong>DİF Durumu:</strong> {n.dif.stageLabel}
                            {n.dif.stage === "closed" && n.dif.closedAt ? ` — ${new Date(n.dif.closedAt).toLocaleDateString("tr-TR")} tarihinde kapatıldı` : ""}
                            {n.dif.overdue && <span style={{ color: REPORT_COLORS.dangerText }}> (termini geçti)</span>}
                          </p>
                          {(n.dif.responsible || n.dif.dueDate) && (
                            <p className="text-[10.5px] mb-1" style={{ color: REPORT_COLORS.textFaint }}>
                              {n.dif.responsible && `Sorumlu: ${n.dif.responsible}`}{n.dif.responsible && n.dif.dueDate ? " · " : ""}{n.dif.dueDate && `Termin: ${n.dif.dueDate}`}
                            </p>
                          )}
                          <p className="text-[10.5px] mb-1" style={{ color: REPORT_COLORS.textMuted }}>
                            <strong>Düzeltici Faaliyet:</strong> {n.dif.correctiveAction || <span style={{ color: REPORT_COLORS.textFaint, fontStyle: "italic" }}>Henüz belirtilmedi.</span>}
                          </p>
                          <p className="text-[10.5px] mb-1" style={{ color: REPORT_COLORS.textMuted }}>
                            <strong>Aksiyon Kanıtı:</strong> {n.dif.actionEvidence || <span style={{ color: REPORT_COLORS.textFaint, fontStyle: "italic" }}>Henüz eklenmedi.</span>}
                          </p>
                          {n.dif.stage === "closed" && (
                            <p className="text-[10.5px]" style={{ color: REPORT_COLORS.textMuted }}>
                              <strong>Kapanış Açıklaması:</strong> {n.dif.closureNote || <span style={{ color: REPORT_COLORS.textFaint, fontStyle: "italic" }}>Belirtilmedi.</span>}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10.5px]" style={{ color: REPORT_COLORS.textFaint }}>DİF oluşturulmadı.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 5. Kanıtlar ─────────────────────────────────────────── */}
            <div>
              <SectionHeading index={5} title="Kanıtlar" icon={Paperclip} />
              {evidenceByCriterion.length === 0 ? <EmptyNote>Kriter bazlı kanıt kaydı bulunmuyor.</EmptyNote> : (
                <div className="flex flex-col gap-2.5">
                  {evidenceByCriterion.map((ev) => (
                    <div key={ev.criterionId} className="audit-report-avoid-break rounded-lg px-3 py-2.5" style={{ border: `1px solid ${REPORT_COLORS.border}` }}>
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: REPORT_COLORS.textPrimary }}>{ev.criterionTitle}</p>
                        <RBadge tone={ev.evidenceStatus === "present" ? "success" : "warning"}>{ev.evidenceStatus === "present" ? "Mevcut" : "Eksik"}</RBadge>
                      </div>
                      <p className="text-[10.5px] mb-1.5" style={{ color: REPORT_COLORS.textFaint }}>{ev.categoryTitle} · {ev.resultLabel}</p>
                      <div className="flex flex-col gap-1">
                        {ev.entries.map((e) => (
                          <p key={e.id} className="text-xs" style={{ color: REPORT_COLORS.textMuted }}>
                            <strong>{e.typeLabel}</strong>{e.description ? `: ${e.description}` : ""}
                            {e.createdAt && <span style={{ color: REPORT_COLORS.textFaint }}> — {new Date(e.createdAt).toLocaleDateString("tr-TR")}</span>}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 6. Düzeltici Faaliyetler ───────────────────────────── */}
            <div>
              <SectionHeading index={6} title="Düzeltici Faaliyetler" icon={CheckCircle2} />
              {(["open", "awaitingAction", "pendingReview", "closed"]).every((s) => correctiveActionsByStage[s].length === 0) ? (
                <EmptyNote>Bu denetime bağlı düzeltici faaliyet (DİF) kaydı yok.</EmptyNote>
              ) : (
                <div className="flex flex-col gap-4">
                  {[
                    { key: "open", label: "Açık" }, { key: "awaitingAction", label: "Aksiyon Bekliyor" },
                    { key: "pendingReview", label: "İnceleme Bekliyor" }, { key: "closed", label: "Kapatıldı" },
                  ].map(({ key, label }) => {
                    const items = correctiveActionsByStage[key];
                    if (items.length === 0) return null;
                    return (
                      <div key={key}>
                        <p className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: REPORT_COLORS.textMuted }}>{label} ({items.length})</p>
                        <div className="flex flex-col gap-2">
                          {items.map((f) => (
                            <div key={f.id} className="audit-report-avoid-break rounded-lg px-3 py-2 flex items-start justify-between gap-2" style={{ background: REPORT_COLORS.surfaceAlt }}>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: REPORT_COLORS.textPrimary }}>{f.criterionTitle}</p>
                                <p className="text-[10.5px]" style={{ color: REPORT_COLORS.textFaint }}>
                                  {f.responsible ? `Sorumlu: ${f.responsible} · ` : ""}{f.dueDate ? `Termin: ${f.dueDate}` : "Termin belirtilmemiş"}
                                  {f.closedAt ? ` · Kapanış: ${f.closedAt.slice(0, 10)}` : ""}
                                </p>
                              </div>
                              {f.overdue && <RBadge tone="danger">Gecikti</RBadge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── 7. Öncelikli Aksiyonlar ────────────────────────────── */}
            <div>
              <SectionHeading index={7} title="Öncelikli Aksiyonlar" icon={AlertTriangle} />
              {priorityActions.length === 0 ? <EmptyNote>Açık öncelikli aksiyon bulunmuyor.</EmptyNote> : (
                <div className="flex flex-col gap-2">
                  {priorityActions.map((f) => (
                    <div key={f.id} className="audit-report-avoid-break flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ border: `1px solid ${f.overdue ? REPORT_COLORS.dangerText : REPORT_COLORS.border}` }}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: REPORT_COLORS.textPrimary }}>{f.criterionTitle}</p>
                        <p className="text-[10.5px]" style={{ color: REPORT_COLORS.textFaint }}>{f.stageLabel}{f.responsible ? ` · Sorumlu: ${f.responsible}` : ""}{f.dueDate ? ` · Termin: ${f.dueDate}` : ""}</p>
                      </div>
                      {f.overdue && <RBadge tone="danger">Gecikti</RBadge>}
                    </div>
                  ))}
                </div>
              )}
              {overdueActions.length > 0 && (
                <p className="text-[10.5px] mt-2" style={{ color: REPORT_COLORS.dangerText }}>⚠️ {overdueActions.length} düzeltici faaliyet termini geçmiş durumda.</p>
              )}
            </div>

            {/* ── 8. Mevzuat Bulguları ───────────────────────────────── */}
            <div>
              <SectionHeading index={8} title="Mevzuat Bulguları" icon={Scale} />
              {legislationFindings.length === 0 ? (
                <EmptyNote>Bu denetim türünde mevzuat dayanaklı kriter bulunmuyor.</EmptyNote>
              ) : (
                <div className="flex flex-col gap-2">
                  {legislationFindings.map((lf) => (
                    <div key={lf.criterionId} className="audit-report-avoid-break rounded-lg px-3 py-2" style={{ border: `1px solid ${REPORT_COLORS.border}` }}>
                      <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                        <p className="text-xs font-semibold" style={{ color: REPORT_COLORS.textPrimary }}>{lf.criterionTitle}</p>
                        <RBadge tone={checklistResults.find((r) => r.value === lf.result)?.tone || "neutral"}>{lf.resultLabel}</RBadge>
                      </div>
                      <p className="text-[10.5px]" style={{ color: REPORT_COLORS.textMuted }}>
                        {lf.legislationName}{lf.article ? ` — ${lf.article}` : ""}
                        {!lf.verified && <span style={{ color: REPORT_COLORS.warnText }}> (⚠️ doğrulama gerekli)</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 9. Sonuç ve Değerlendirme ──────────────────────────── */}
            <div>
              <SectionHeading index={9} title="Sonuç ve Değerlendirme" icon={CheckCircle2} />
              <div className="flex flex-col gap-2 text-sm" style={{ color: REPORT_COLORS.textPrimary }}>
                <p>
                  {summary.overallScore !== null
                    ? <>Denetim genel uygunluk skoru <strong>%{summary.overallScore}</strong>{summary.scoreLevel ? ` (${summary.scoreLevel.label})` : ""} olarak gerçekleşmiştir.</>
                    : "Denetimde henüz hiçbir kriter değerlendirilmediği için genel bir skor hesaplanamamıştır."}
                </p>
                <p>
                  Toplam {summary.totalCriteria} kriterden {summary.criticalFindingsCount} tanesi "Uygun Değil" olarak değerlendirilmiş,
                  {" "}{summary.openDifCount} düzeltici faaliyet açık durumdadır{summary.overdueDifCount > 0 ? ` (${summary.overdueDifCount} tanesi termini geçmiştir)` : ""}.
                </p>
                {priorityActions.length > 0 ? (
                  <div>
                    <p className="font-semibold mb-1">Öncelikli iyileştirme alanları:</p>
                    <ul className="list-disc list-inside flex flex-col gap-0.5" style={{ color: REPORT_COLORS.textMuted }}>
                      {priorityActions.slice(0, 5).map((f) => <li key={f.id} className="text-xs">{f.criterionTitle}{f.overdue ? " (gecikmiş)" : ""}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p style={{ color: REPORT_COLORS.successText }}>Açık öncelikli iyileştirme alanı bulunmamaktadır.</p>
                )}
              </div>
            </div>

            <p className="text-[9.5px] text-center pt-2" style={{ color: REPORT_COLORS.textFaint, borderTop: `1px solid ${REPORT_COLORS.border}` }}>
              Bu rapor {new Date(report.generatedAt).toLocaleString("tr-TR")} tarihinde, denetimin o anki güncel verilerinden otomatik olarak oluşturulmuştur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
