import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { buildAuditReadinessBreakdown } from "../../utils/auditReadinessBreakdown.js";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { CheckCircle2, ClipboardList, ShieldAlert, Scale, AlertTriangle, ChevronRight } from "../../components/icons/index.jsx";

/**
 * Bir kriter/DİF satırı — istenen sabit format:
 *   Kriter başlığı
 *   Kategori · mevcut durum · varsa mevzuat
 *   → İncele / Düzenle / Yönet
 * `actionLabel` YALNIZCA bu 3 sabit kelimeden biridir (yeni bir aksiyon türü İCAT
 * EDİLMEZ) — hangi kelimenin kullanılacağı auditReadinessBreakdown.js'te (ACTION_LABEL)
 * kategoriye göre SABİTLENMİŞTİR, burada yeniden yorumlanmaz.
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
  return row.kind === "dif" ? () => onOpenDif(row.id) : () => onOpenAudit(row.auditId);
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
 * "Denetim Öncesi Tamamlanması Gerekenler" özet listesi → Denetime Hazır (sorun
 * yoksa) → 6 kategori bölümü.
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
    unevaluated, actions, unverifiedLegislation, preAuditActions, isFullyReady,
  } = breakdown;

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

      {/* Denetim Öncesi Tamamlanması Gerekenler — kullanıcıya YALNIZCA sorunları değil,
          hangi işi yapması gerektiğini hızlıca gösteren, 6 kategoriyi sabit sırayla
          düzleştiren özet liste. Aşağıdaki kategorili bölümlerle AYNI veriyi kullanır,
          yeni bir hesaplama YOKTUR — yalnızca aksiyon fiiliyle öne çıkarılmış hâlidir. */}
      {preAuditActions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: theme.textPrimary }}>
            Denetim Öncesi Tamamlanması Gerekenler
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: theme.surfaceAlt, color: theme.textMuted }}>{preAuditActions.length}</span>
          </p>
          <div className="flex flex-col gap-1.5">
            {preAuditActions.map((row, i) => (
              <ReadinessRow
                key={`${row.kind}-${row.id || row.criterionId}-${row.auditId}-${row.sectionLabel}-${i}`}
                theme={theme}
                title={row.criterionTitle}
                sectionLabel={row.sectionLabel}
                statusLabel={row.statusLabel}
                legislationName={row.legislationName}
                article={row.article}
                badge={row.overdue ? <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: theme.highRiskBg, color: theme.highRiskText }}>Gecikti</span> : undefined}
                actionLabel={row.actionLabel}
                onAction={actionHandlerFor(row, onOpenAudit, onOpenDif)}
              />
            ))}
          </div>
        </div>
      )}

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
          {nonconformities.map((r) => (
            <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
              sectionLabel="Uygunsuzluk" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
              actionLabel="İncele" onAction={() => onOpenAudit(r.auditId)} />
          ))}
        </ReadinessSection>
      )}

      {/* 2. Kısmen Uygunlar — yoksa bölüm tamamen GİZLİ (istek gereği). */}
      {partiallyCompliant.length > 0 && (
        <ReadinessSection theme={theme} icon={AlertTriangle} tone="warning" title="Kısmen Uygunlar" items={partiallyCompliant}>
          {partiallyCompliant.map((r) => (
            <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
              sectionLabel="Kısmen Uygun" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
              actionLabel="Düzenle" onAction={() => onOpenAudit(r.auditId)} />
          ))}
        </ReadinessSection>
      )}

      {/* 3. Eksik Kanıtlar (Kanıt Yok + Eksik Kanıt birlikte) — yoksa "Eksik kanıt bulunmuyor". */}
      {missingEvidence.length === 0 ? (
        hasAnyEvaluatedCriteria && !isFullyReady && (
          <p className="text-[10.5px] mb-3" style={{ color: theme.successText }}>✓ Eksik kanıt bulunmuyor.</p>
        )
      ) : (
        <ReadinessSection theme={theme} icon={ClipboardList} tone="warning" title="Eksik Kanıtlar" items={missingEvidence}>
          {missingEvidence.map((r) => (
            <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
              sectionLabel="Eksik Kanıt" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
              actionLabel="Düzenle" onAction={() => onOpenAudit(r.auditId)} />
          ))}
        </ReadinessSection>
      )}

      {/* 4. Değerlendirilmemişler — yoksa bölüm tamamen GİZLİ. */}
      {unevaluated.length > 0 && (
        <ReadinessSection theme={theme} icon={ClipboardList} title="Değerlendirilmemişler" items={unevaluated}>
          {unevaluated.map((r) => (
            <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
              sectionLabel="Değerlendirilmemiş" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
              actionLabel="Düzenle" onAction={() => onOpenAudit(r.auditId)} />
          ))}
        </ReadinessSection>
      )}

      {/* 5. Aksiyonlar — Açık + Gecikmiş DİF TEK kategori, gecikmiş olanlar önce
          (auditReadinessBreakdown.js zaten bu sırayla döner) ve rozetle vurgulanır.
          Yoksa bölüm tamamen GİZLİ. */}
      {actions.length > 0 && (
        <ReadinessSection theme={theme} icon={ShieldAlert} tone="danger" title="Aksiyonlar" items={actions}>
          {actions.map((f) => (
            <ReadinessRow key={f.id} theme={theme} title={f.criterionTitle}
              sectionLabel={f.overdue ? "Gecikmiş DİF" : "Açık DİF"} statusLabel={f.responsible ? `Sorumlu: ${f.responsible}` : f.stageLabel}
              badge={f.overdue ? <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: theme.highRiskBg, color: theme.highRiskText }}>Gecikti</span> : undefined}
              actionLabel="Yönet" onAction={() => onOpenDif(f.id)} />
          ))}
        </ReadinessSection>
      )}

      {/* 6. Mevzuat Doğrulaması — gerekmiyorsa (liste boş) HİÇBİR UYARI gösterilmez. */}
      {unverifiedLegislation.length > 0 && (
        <ReadinessSection theme={theme} icon={Scale} tone="warning" title="Mevzuat Doğrulaması" items={unverifiedLegislation}>
          {unverifiedLegislation.map((r) => (
            <ReadinessRow key={`${r.auditId}-${r.criterionId}`} theme={theme} title={r.criterionTitle}
              sectionLabel="Mevzuat Doğrulaması" statusLabel={r.statusLabel} legislationName={r.legislationName} article={r.article}
              actionLabel="İncele" onAction={() => onOpenAudit(r.auditId)} />
          ))}
        </ReadinessSection>
      )}
    </div>
  );
}
