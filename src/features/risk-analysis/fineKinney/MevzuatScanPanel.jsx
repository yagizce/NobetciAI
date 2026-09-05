import { useState } from "react";
import { useMevzuatScan } from "./useMevzuatScan.js";
import Button from "../../../components/ui/Button.jsx";
import { Sparkles, X, ChevronDown, ChevronRight, ShieldAlert } from "../../../components/icons/index.jsx";

function timeAgoShort(iso) {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  return `${Math.round(diffHour / 24)} gün önce`;
}

/**
 * Phase 5 kapanışı — "AI Mevzuat Takibi & Proaktif Fine-Kinney Önerisi" (Sprint 7.5).
 * KnowledgeAIAssistant.jsx ile AYNI kapalı/açık kart deseni (sayfa kalabalıklaşmasın
 * diye varsayılan kapalı). Hiçbir öneri otomatik kayda dönüşmez — "Taslak Oluştur"
 * yalnızca formu önceden doldurulmuş halde açar, kaydetme kararı kullanıcıdadır.
 *
 * @param {{
 *   theme: object, fineKinneyEntries: object[],
 *   onGoToEntry: (id: number) => void, onCreateDraft: (hazard: string, risk: string) => void,
 * }} props
 */
export default function MevzuatScanPanel({ theme, fineKinneyEntries, onGoToEntry, onCreateDraft }) {
  const [expanded, setExpanded] = useState(false);
  const { scanning, scanError, flagged, suggestions, lastRunAt, truncated, runScan } = useMevzuatScan(fineKinneyEntries);
  const hasResults = flagged.length > 0 || suggestions.length > 0;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2 rounded-xl border px-3.5 py-3 mb-4 text-left"
        style={{ borderColor: theme.accent, background: theme.surfaceAlt }}
      >
        <Sparkles style={{ fontSize: "16px", color: theme.accent }} />
        <span className="text-sm font-semibold flex-1" style={{ color: theme.textPrimary }}>
          AI Mevzuat &amp; Risk Taraması
        </span>
        {lastRunAt && <span className="text-[10.5px]" style={{ color: theme.textFaint }}>Son tarama: {timeAgoShort(lastRunAt)}</span>}
        <ChevronDown style={{ fontSize: "14px", color: theme.textFaint }} />
      </button>
    );
  }

  return (
    <div className="rounded-xl border px-3.5 py-3.5 mb-4" style={{ borderColor: theme.accent, background: theme.surfaceAlt }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles style={{ fontSize: "15px", color: theme.accent }} />
          <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>AI Mevzuat &amp; Risk Taraması</span>
        </div>
        <button onClick={() => setExpanded(false)} aria-label="Kapat" className="p-1.5 -m-1.5 rounded-lg shrink-0"><X style={{ fontSize: "16px", color: theme.textMuted }} /></button>
      </div>

      <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
        Bilgi Kütüphanesi'ndeki mevzuat dokümanlarını ve mevcut Fine-Kinney kayıtlarınızı
        birlikte tarar; gözden geçirilmesi gerekebilecek kayıtları işaretler ve henüz
        girilmemiş olası tehlikeler için taslak önerir. Hiçbir öneri otomatik kaydedilmez.
      </p>

      <Button size="sm" onClick={runScan} disabled={scanning} className="mb-3">
        {scanning ? "Taranıyor..." : lastRunAt ? "Yeniden Tara" : "Taramayı Başlat"}
      </Button>

      {scanError && <p className="text-xs mb-3" style={{ color: theme.highRiskText }}>{scanError}</p>}

      {truncated && (
        <p className="text-[10.5px] mb-3" style={{ color: theme.textFaint }}>
          Not: {fineKinneyEntries.length} kayıttan ilk 30 tanesi tarandı (kapsam sınırı).
        </p>
      )}

      {lastRunAt && !hasResults && !scanning && (
        <p className="text-xs" style={{ color: theme.successText }}>Tarama tamamlandı — gözden geçirilmesi gereken kayıt veya yeni öneri bulunamadı.</p>
      )}

      {flagged.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold mb-1.5" style={{ color: theme.textFaint }}>GÖZDEN GEÇİRİLMESİ ÖNERİLEN KAYITLAR</p>
          <div className="flex flex-col gap-1.5">
            {flagged.map((item, i) => (
              <div key={i} className="rounded-lg border px-3 py-2" style={{ borderColor: theme.border, background: theme.surface }}>
                <p className="text-sm" style={{ color: theme.textPrimary }}>{item.hazardRef}</p>
                {item.reason && <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{item.reason}</p>}
                {item.matchedEntryId != null && (
                  <button onClick={() => onGoToEntry(item.matchedEntryId)} className="flex items-center gap-0.5 text-[11px] font-semibold mt-1.5" style={{ color: theme.accent }}>
                    Kayda Git <ChevronRight style={{ fontSize: "11px" }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold mb-1.5" style={{ color: theme.textFaint }}>YENİ RİSK ÖNERİLERİ</p>
          <div className="flex flex-col gap-1.5">
            {suggestions.map((item, i) => (
              <div key={i} className="rounded-lg border px-3 py-2" style={{ borderColor: theme.border, background: theme.surface }}>
                <div className="flex items-start gap-1.5">
                  <ShieldAlert style={{ fontSize: "13px", color: theme.warnText, marginTop: "2px" }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{item.hazard}</p>
                    {item.risk && <p className="text-[11.5px] mt-0.5" style={{ color: theme.textMuted }}>{item.risk}</p>}
                    {item.reason && <p className="text-[11px] mt-0.5" style={{ color: theme.textFaint }}>{item.reason}</p>}
                  </div>
                </div>
                {onCreateDraft && (
                  <button onClick={() => onCreateDraft(item.hazard, item.risk)} className="text-[11px] font-semibold mt-1.5" style={{ color: theme.accent }}>
                    Taslak Oluştur →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
