import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuditReadinessChecklist, getReadinessItemTarget, AUDIT_READINESS_CATEGORY_LABELS } from "../../../utils/auditReadiness.js";
import Badge from "../../../components/ui/Badge.jsx";
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle } from "../../../components/icons/index.jsx";

/**
 * Denetim Öncesi Hazırlık Checklist'i — "müfettiş gelmeden önce eksik sayılabilecek
 * her şeyi tek ekranda özetle" isteğine cevap. AuditPackageButton içinde, dosya
 * oluşturma alanının ÜSTÜNDE gösterilir — işveren dosyayı oluşturmadan önce eksikleri
 * görüp kapatma şansı bulsun diye. Varsayılan olarak KAPALI (yalnızca özet satırı
 * görünür) — her açılışta uzun bir liste dayatmamak için, bkz. DEVELOPMENT_RULES.md
 * → "gereksiz karmaşıklık ekleme".
 *
 * Her madde tıklanabilir — ilgili sekmeye/kayda götürür (bkz. getReadinessItemTarget).
 * Sprint 8 polish: önceden bu maddeler düz metindi, tıklamanın hiçbir etkisi yoktu.
 *
 * @param {{ theme: object, documents: object[], fineKinneyEntries: object[], periodicChecks: object[] }} props
 */
export default function AuditReadinessChecklist({ theme, documents, fineKinneyEntries, periodicChecks }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const items = getAuditReadinessChecklist({ documents, fineKinneyEntries, periodicChecks });
  const highCount = items.filter((i) => i.severity === "high").length;
  const ready = items.length === 0;

  function handleItemClick(item) {
    const target = getReadinessItemTarget(item);
    navigate(target.path, target.state ? { state: target.state } : undefined);
  }

  return (
    <div className="rounded-lg mb-3 overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
      <button
        onClick={() => !ready && setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5"
        style={{ background: ready ? theme.successBg : theme.warnBg, cursor: ready ? "default" : "pointer" }}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: ready ? theme.successText : theme.warnText }}>
          {ready ? <CheckCircle2 style={{ fontSize: "14px" }} /> : <AlertTriangle style={{ fontSize: "14px" }} />}
          {ready ? "Denetime Hazırsınız" : `${items.length} eksik bulundu${highCount > 0 ? ` (${highCount} öncelikli)` : ""}`}
        </span>
        {/* UX FIX (Audit Readiness cilası): "Denetime Hazırsınız" durumunda açılacak
            hiçbir şey yok (aşağıdaki panel `!ready` şartına bağlı) — önceden buton yine
            de tıklanabiliyor, ok işareti döndürüyor ama hiçbir panel açılmıyordu; kullanıcı
            "bir şey bozuk mu" diye kafası karışabiliyordu. Artık hazır durumdayken ok
            işareti hiç gösterilmiyor ve tıklama bir etki yaratmıyor. */}
        {!ready && (expanded
          ? <ChevronDown style={{ fontSize: "14px", color: theme.textFaint, transform: "rotate(180deg)" }} />
          : <ChevronDown style={{ fontSize: "14px", color: theme.textFaint }} />)}
      </button>

      {expanded && !ready && (
        <div className="px-3 py-2.5 flex flex-col gap-1.5" style={{ background: theme.surface }}>
          {items.map((item) => (
            <button key={item.id} onClick={() => handleItemClick(item)} className="flex items-start gap-2 text-[11px] text-left w-full">
              <span className="shrink-0 mt-0.5">
                <Badge tone={item.severity === "high" ? "danger" : "warning"}>{AUDIT_READINESS_CATEGORY_LABELS[item.category]}</Badge>
              </span>
              <span className="flex-1 min-w-0 break-words" style={{ color: theme.textMuted }}>{item.label}</span>
              <ChevronRight style={{ fontSize: "12px", color: theme.textFaint }} className="shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
