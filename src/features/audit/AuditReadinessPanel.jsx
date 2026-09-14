import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { buildAuditReadinessBreakdown, getTopPriorityActions } from "../../utils/auditReadinessBreakdown.js";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { CheckCircle2, ClipboardList, ShieldAlert, Scale, AlertTriangle, ChevronRight } from "../../components/icons/index.jsx";

/**
 * Bir kriter/DİF satırı — istenen sabit format:
 *   Kriter başlığı
 *   Kategori · mevcut durum · varsa mevzuat
 *   → (aksiyon)
 * `actionLabel`/`onAction` bu bileşende ASLA sabitlenmez — çağıran taraf her zaman
 * `resolveAction()` ile `pickPrimaryAction()`'ın (auditReadinessBreakdown.js) sonucunu
 * okuyup geçirir; böylece aynı kriter, "Denetim Öncesi" birleşik satırıyla kendi
 * kategori bölümünde HER ZAMAN aynı aksiyonu gösterir.
 */
function ReadinessRow({ theme, title, sectionLabel, statusLabel, legislationName, article, badge, actionLabel, onAction }) {
  const subtitle = [sectionLabel, statusLabel, legislationName ? `${legislationName}${article ? ` ${article}` : ""}` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="rounded-lg px-3 py-2 flex items-center justify-between gap-2" style={{ background: theme.surfaceAlt }}>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: theme.textPrimary }}>{title}</p>
        {subtitle && <p className="text-[10.5px] truncate" style={{ color: theme.textFaint }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        <button onClick={onAction} className="flex items-center gap-0.5 text-[10.5px] font-semibold px-2 py-1 rounded-full" style={{ background: theme.surface, color: theme.accent }}>
          {actionLabel} <ChevronRight style={{ fontSize: "11px" }} />
        </button>
      </div>
    </div>
  );
}

/**
 * Birleşik aksiyon satırı — "Denetim Öncesi Tamamlanması Gerekenler" listesi için.
 * Aynı kriterin TÜM sorunları burada küçük rozetler olarak yan yana gösterilir
 * (istek → madde 1/3), TEK bir ana aksiyon butonuyla (madde 2).
 */
function MergedActionRow({ theme, title, badges, overdue, actionLabel, onAction }) {
  return (
    <div className="rounded-lg px-3 py-2 flex items-center justify-between gap-2" style={{ background: theme.surfaceAlt }}>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate mb-1" style={{ color: theme.textPrimary }}>{title}</p>
        <div className="flex flex-wrap gap-1">
          {badges.map((b) => (
            <span key={b} className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: (overdue && b === "DİF Gecikmiş") ? theme.highRiskBg : theme.surface, color: (overdue && b === "DİF Gecikmiş") ? theme.highRiskText : theme.textFaint }}>
              {b}
            </span>
          ))}
        </div>
      </div>
      <button onClick={onAction} className="shrink-0 flex items-center gap-0.5 text-[10.5px] font-semibold px-2 py-1 rounded-full" style={{ background: theme.surface, color: theme.accent }}>
        {actionLabel} <ChevronRight style={{ fontSize: "11px" }} />
      </button>
    </div>
  );
}

/**
 * Kurallar (bkz. çağıran kod): items boşsa bölüm HİÇ RENDER EDİLMEZ (bu bileşen
 * çağrılmaz) — "bölüm gizli" kuralı burada değil, çağıran tarafta uygulanır ki
 * "boş liste" ile "bölüm yok" arasında bileşen içinde belirsizlik oluşmasın.
 */
function ReadinessSection({ theme, icon: Icon, title, tone = "neutral", items, children }) {
  const toneColor = tone === "danger" ? theme.highRiskText : tone === "warning" ? theme.warnText : theme.textMuted;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon style={{ fontSize: "13px", color: toneColor }} />
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: toneColor }}>{title}</p>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: theme.surfaceAlt, color: toneColor }}>{items.length}</span>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function actionHandlerFor(row, onOpenAudit, onOpenDif) {
  return row.actionKind === "dif" ? () => onOpenDif(row.difId) : () => onOpenAudit(row.auditId);
}

/**
 * Kategori bölümlerindeki bir satırın aksiyonunu, "Denetim Öncesi Tamamlanması
 * Gerekenler" listesiyle AYNI kaynaktan (pickPrimaryAction sonucu, bkz.
 * auditReadinessBreakdown.js → preAuditActions) okur — burada YENİ bir aksiyon
 * mantığı YOKTUR, yalnızca preAuditActions'ın o kritere ait satırı bulunur. Bu
 * sayede aynı kriter, birleşik satırda ve kendi kategori bölümünde HER ZAMAN aynı
 * aksiyonu gösterir (ör. bir "Uygunsuzluk" aynı zamanda açık bir DİF'e sahipse ve
 * pickPrimaryAction "İncele"yi seçtiyse, Aksiyonlar bölümündeki o DİF satırı da
 * "Yönet" değil "İncele" gösterir — kriter bazında TEK doğru vardır).
 * @param {Map<string, object>} actionByCriterion
 * @param {string|number} auditId
 * @param {string} criterionId
 * @param {{ actionLabel: string, actionKind: string, auditId: string|number, difId: string|number|null }} fallback
 */
function resolveAction(actionByCriterion, auditId, criterionId, fallback) {
  return actionByCriterion.get(`${auditId}::${criterionId}`) || fallback;
}

/**
 * Denetime Hazırlık ekranı — SADECE İSG Mevzuat Denetimi için (bkz. AuditPage.jsx →
 * `config.standard === "mevzuat" &&`, ISO 45001 bu bileşeni hiç render etmez).
 * Mevcut "Hazırlık Skoru" kartından (auditPreparedness.js, "kaç puan" sorusu) FARKLI
 * ve onu TAMAMLAYICI: burası "hangi kayıt, hangi aksiyon" sorusuna cevap verir. İkisi
 * de AYNI ham veriden beslenir, biri diğerini DEĞİŞTİRMEZ.
 *
 * TAM OLARAK 6 kategori, SABİT sırayla: Uygunsuzluklar, Kısmen Uygunlar, Eksik
 * Kanıtlar, Değerlendirilmemişler, Aksiyonlar (Açık+Gecikmiş DİF birlikte),
 * Mevzuat Doğrulaması (bkz. auditReadinessBreakdown.js).
 *
 * Durum sırası: Yükleniyor → Hata → (denetim yoksa hiç render edilmez) →
 * "Şimdi Yapılmalı" (en fazla 5, öncelik sıralı hızlı özet) → Denetime Hazır
 * (sorun yoksa) → 6 kategori bölümü (tam liste, kapsız).
 *
 * @param {{ loaded: boolean, loadError: string|null, onRetry: () => void,
 *   audits: object[], findings: object[], getCategoryTitle?: (code: string) => string,
 *   onOpenAudit: (auditId: string|number) => void, onOpenDif: (difId: string|number) => void }} props
 */
export default function AuditReadinessPanel({ loaded, loadError, onRetry, audits, findings, getCategoryTitle, onOpenAudit, onOpenDif }) {
  const { theme } = useTheme();

  const breakdown = useMemo(
    () => buildAuditReadinessBreakdown({ audits, findings, getCategoryTitle }),
    [audits, findings, getCategoryTitle]
  );

  // Yükleniyor: veri gelene kadar SADECE loading — yanlışlıkla %0/"veri yok"/
  // "denetime hazır" gösterilmez.
  if (!loaded) return <Loading label="Denetime hazırlık verileri yükleniyor..." />;

  // Hata: veri alınamadıysa hata + Tekrar Dene — boş/hazır durum ASLA gösterilmez.
  if (loadError) {
    return <ErrorState title="Denetime hazırlık verileri yüklenemedi" description={loadError} onRetry={onRetry} />;
  }

  // Denetim hiç yoksa bu panel hiç render edilmez — AuditPage.jsx zaten kendi
  // "Henüz denetim planlanmadı" boş durumunu gösteriyor, burada onu TEKRARLAMAYIZ.
  if (!breakdown.hasAnyAudits) return null;

  const {
    hasAnyEvaluatedCriteria, nonconformities, partiallyCompliant, missingEvidence,
    unevaluated, actions, unverifiedLegislation, preAuditActions, preAuditSummary, isFullyReady,
  } = breakdown;

  // TEK kaynak: preAuditActions zaten pickPrimaryAction() ile hesaplanmış aksiyonu
  // taşıyor (bkz. auditReadinessBreakdown.js). Kategori bölümleri kendi aksiyon
  // mantığını ÜRETMEZ, yalnızca bu haritadan okur — bkz. resolveAction().
  const actionByCriterion = new Map();
  preAuditActions.forEach((row) => {
    if (row.criterionId != null) actionByCriterion.set(`${row.auditId}::${row.criterionId}`, row);
  });

  return (
    <div className="rounded-lg border px-3 py-3 mb-4" style={{ borderColor: theme.border, background: theme.surface }}>
      <div className="flex items-center gap-1.5 mb-3">
        <ClipboardList style={{ fontSize: "14px", color: theme.textMuted }} />
        <p className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.textPrimary }}>Denetime Hazırlık</p>
      </div>

      {/* Hiç değerlendirilmiş kriter yoksa: skor/olumlu/olumsuz durum GÖSTERİLMEZ,
          yalnızca bunun nedenini gösteren Değerlendirilmemişler bölümü render edilir. */}
      {!hasAnyEvaluatedCriteria && (
        <p className="text-xs mb-3" style={{ color: theme.textFaint }}>
          Henüz değerlendirilemedi — hiçbir kriter için sonuç girilmedi.
        </p>
      )}

      {/* Şimdi Yapılmalı — "Ne eksik?" değil "Şimdi ne yapmalıyım?" sorusuna cevap
          veren, EN FAZLA 5 satırlık hızlı özet. Aynı preAuditActions dizisinden
          (zaten pickPrimaryAction() ile merkezi önceliğe göre sıralanmış — bkz.
          auditReadinessBreakdown.js) yalnızca İLK 5 kaydı gösterir; yeni bir
          sıralama/skor/hesaplama YOKTUR, yalnızca görüntüleme sınırı. Sayaç
          (preAuditSummary) da aynı şekilde HİÇ değiştirilmeden, olduğu gibi
          kullanılır — gerçek toplam kriter/konu sayısını gösterir (yalnızca 5'i
          render edilse bile, kullanıcı gerçek toplamı görür; tüm liste aşağıdaki
          6 kategori bölümünde zaten eksiksiz mevcuttur). */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1.5 mb-2">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.textPrimary }}>Şimdi Yapılmalı</p>
          {preAuditActions.length > 0 && (
            <span className="text-[10.5px]" style={{ color: theme.textFaint }}>
              {preAuditSummary.criterionCount} önemli aksiyon / {preAuditSummary.issueCount} açık konu
            </span>
          )}
        </div>
        {preAuditActions.length === 0 ? (
          <p className="text-xs" style={{ color: theme.successText }}>Denetime hazırlık için açık aksiyon bulunmuyor.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {getTopPriorityActions(preAuditActions).map((row, i) => (
              <MergedActionRow
                key={`${row.kind}-${row.criterionId || row.difId}-${row.auditId}-${i}`}
                theme={theme}
                title={row.criterionTitle}
                badges={row.badges}
                overdue={row.overdue}
                actionLabel={row.actionLabel}
                onAction={actionHandlerFor(row, onOpenAudit, onOpenDif)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Başarılı + sorun yok: olumlu durum. verified:false gibi gerçek bir veri
          doğrulama uyarısı varsa isFullyReady zaten false'tur (auditReadinessBreakdown.js),
          bu yüzden bu banner o durumda hiç görünmez — uyarı yok sayılmaz. */}
      {isFullyReady && (
        <div className="rounded-lg px-3 py-4 flex items-center gap-2.5" style={{ background: theme.successBg }}>
          <CheckCircle2 style={{ fontSize: "20px", color: theme.successText }} />
          <div>
            <p className="text-sm font-bold" style={{ color: theme.successText }}>Denetime hazır</p>
            <p className="text-[10.5px]" style={{ color: theme.successText, opacity: 0.85 }}>Açık uygunsuzluk, eksik kanıt veya bekleyen DİF bulunmuyor.</p>
          </div>
        </div>
      )}

      {/* 1. Uygunsuzluklar — yoksa "Uygunsuzluk bulunmuyor" (gizlenmez, olumlu not verilir). */}
      {nonconformities.length === 0 ? (
        hasAnyEvaluatedCriteria && !isFullyReady && (
          <p className="text-[10.5px] mb-3" style={{ color: theme.successText }}>✓ Uygunsuzluk bulunmuyor.</p>
        )
      ) : (
        <ReadinessSection theme={theme} icon={AlertTriangle} tone="danger" title="Uygunsuzluklar" items={nonconformities}>
          {nonconformities.map((r) => {
            const action = resolveAction(actionByCriterion, r.auditId, r.criterionId, { actionLabel: "İncele", actionKind: "criterion", auditId: r.auditId });
            return (
              <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
                sectionLabel="Uygunsuzluk" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
                actionLabel={action.actionLabel} onAction={actionHandlerFor(action, onOpenAudit, onOpenDif)} />
            );
          })}
        </ReadinessSection>
      )}

      {/* 2. Kısmen Uygunlar — yoksa bölüm tamamen GİZLİ (istek gereği). */}
      {partiallyCompliant.length > 0 && (
        <ReadinessSection theme={theme} icon={AlertTriangle} tone="warning" title="Kısmen Uygunlar" items={partiallyCompliant}>
          {partiallyCompliant.map((r) => {
            const action = resolveAction(actionByCriterion, r.auditId, r.criterionId, { actionLabel: "İncele", actionKind: "criterion", auditId: r.auditId });
            return (
              <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
                sectionLabel="Kısmen Uygun" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
                actionLabel={action.actionLabel} onAction={actionHandlerFor(action, onOpenAudit, onOpenDif)} />
            );
          })}
        </ReadinessSection>
      )}

      {/* 3. Eksik Kanıtlar (Kanıt Yok + Eksik Kanıt birlikte) — yoksa "Eksik kanıt bulunmuyor". */}
      {missingEvidence.length === 0 ? (
        hasAnyEvaluatedCriteria && !isFullyReady && (
          <p className="text-[10.5px] mb-3" style={{ color: theme.successText }}>✓ Eksik kanıt bulunmuyor.</p>
        )
      ) : (
        <ReadinessSection theme={theme} icon={ClipboardList} tone="warning" title="Eksik Kanıtlar" items={missingEvidence}>
          {missingEvidence.map((r) => {
            const action = resolveAction(actionByCriterion, r.auditId, r.criterionId, { actionLabel: "Kanıt Ekle", actionKind: "criterion", auditId: r.auditId });
            return (
              <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
                sectionLabel="Eksik Kanıt" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
                actionLabel={action.actionLabel} onAction={actionHandlerFor(action, onOpenAudit, onOpenDif)} />
            );
          })}
        </ReadinessSection>
      )}

      {/* 4. Değerlendirilmemişler — yoksa bölüm tamamen GİZLİ. */}
      {unevaluated.length > 0 && (
        <ReadinessSection theme={theme} icon={ClipboardList} title="Değerlendirilmemişler" items={unevaluated}>
          {unevaluated.map((r) => {
            const action = resolveAction(actionByCriterion, r.auditId, r.criterionId, { actionLabel: "Değerlendir", actionKind: "criterion", auditId: r.auditId });
            return (
              <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
                sectionLabel="Değerlendirilmemiş" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
                actionLabel={action.actionLabel} onAction={actionHandlerFor(action, onOpenAudit, onOpenDif)} />
            );
          })}
        </ReadinessSection>
      )}

      {/* 5. Aksiyonlar — Açık + Gecikmiş DİF TEK kategori, gecikmiş olanlar önce
          (auditReadinessBreakdown.js zaten bu sırayla döner) ve rozetle vurgulanır.
          Yoksa bölüm tamamen GİZLİ. */}
      {actions.length > 0 && (
        <ReadinessSection theme={theme} icon={ShieldAlert} tone="danger" title="Aksiyonlar" items={actions}>
          {actions.map((f) => {
            const action = resolveAction(actionByCriterion, f.auditId, f.checklistItemId, { actionLabel: "DİF'i Yönet", actionKind: "dif", difId: f.id });
            return (
              <ReadinessRow key={f.id} theme={theme} title={f.criterionTitle}
                sectionLabel={f.overdue ? "Gecikmiş DİF" : "Açık DİF"} statusLabel={f.responsible ? `Sorumlu: ${f.responsible}` : f.stageLabel}
                badge={f.overdue ? <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: theme.highRiskBg, color: theme.highRiskText }}>Gecikti</span> : undefined}
                actionLabel={action.actionLabel} onAction={actionHandlerFor(action, onOpenAudit, onOpenDif)} />
            );
          })}
        </ReadinessSection>
      )}

      {/* 6. Mevzuat Doğrulaması — gerekmiyorsa (liste boş) HİÇBİR UYARI gösterilmez. */}
      {unverifiedLegislation.length > 0 && (
        <ReadinessSection theme={theme} icon={Scale} tone="warning" title="Mevzuat Doğrulaması" items={unverifiedLegislation}>
          {unverifiedLegislation.map((r) => {
            const action = resolveAction(actionByCriterion, r.auditId, r.criterionId, { actionLabel: "Doğrulamayı İncele", actionKind: "criterion", auditId: r.auditId });
            return (
              <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
                sectionLabel="Mevzuat Doğrulaması" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
                actionLabel={action.actionLabel} onAction={actionHandlerFor(action, onOpenAudit, onOpenDif)} />
            );
          })}
        </ReadinessSection>
      )}
    </div>
  );
}
