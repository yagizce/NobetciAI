import { useState, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { useCompany } from "../../hooks/useCompany.js";
import { canManageAudits } from "../../utils/permissions.js";
import { useCompanyOrgLists } from "../risk-analysis/fineKinney/useCompanyOrgLists.js";
import { useAudits } from "./useAudits.js";
import EmptyState from "../../components/EmptyState.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import Button from "../../components/ui/Button.jsx";
import AuditWizard from "./AuditWizard.jsx";
import AuditListPanel from "./AuditListPanel.jsx";
import AuditDetailDrawer from "./AuditDetailDrawer.jsx";
import { Plus, ClipboardList, ShieldAlert } from "../../components/icons/index.jsx";

/**
 * Denetim Modülü — TÜM denetim türlerinin (ISO 45001, İSG Mevzuat Denetimi, ileride
 * 9001/14001/27001) paylaştığı JENERİK sayfa. Artık TEK route (/audit) altında,
 * üstteki segment kontrolüyle tür değiştirilir — önceden ayrı sekme/route'ta duran
 * ISO 45001 ve İSG Mevzuat Denetimi burada birleşti (bkz. pages/Audit.jsx'teki
 * `CONFIGS` listesi). Alt bileşenler (AuditWizard/AuditListPanel/AuditDetailDrawer)
 * hâlâ tek bir `config` nesnesiyle çalışıyor, DEĞİŞMEDİ — bu sayfa yalnızca hangi
 * config'in aktif olduğunu tutuyor.
 *
 * FAZ NOTU: DİF (Düzeltici İyileştirici Faaliyet) takibi ve çoklu standart seçimi
 * (tek denetimde) bu fazda BİLİNÇLİ OLARAK devre dışı — altyapıları SİLİNMEDİ,
 * yalnızca bu sayfaya bağlanmadı.
 *
 * Fine-Kinney ile AYNI yetki kuralını paylaşır (bkz. utils/permissions.js):
 * İSG Uzmanı yönetir, İşveren yalnızca görüntüler (aynı kişi değillerse),
 * Çalışan hiç erişemez.
 *
 * @param {{ configs: Array<{ standard: string, standardLabel: string,
 *   generateChecklist: () => object[], checklistResults: object[],
 *   getResultMeta: (v: string) => object, computeOverallScore: (c: object[]) => number|null,
 *   computeProgressPercent: (c: object[]) => number, computeCategoryScores: (c: object[]) => object[] }> }} props
 */
export default function AuditPage({ configs }) {
  const { theme } = useTheme();
  const { role } = useRole();
  const { company } = useCompany();
  const { departments } = useCompanyOrgLists();
  const canManage = useMemo(() => canManageAudits(role, company), [role, company]);

  const [activeStandard, setActiveStandard] = useState(configs[0].standard);
  const config = configs.find((c) => c.standard === activeStandard) || configs[0];

  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState(null);

  const { audits, loaded, loadError, addAudit, setChecklistResult, finishAudit } = useAudits({
    standard: config.standard,
    standardLabel: config.standardLabel,
  });

  const selectedAudit = audits.find((a) => a.id === selectedAuditId) || null;

  function switchStandard(standard) {
    setActiveStandard(standard);
    setSelectedAuditId(null);
    setWizardOpen(false);
  }

  if (role === "employee") {
    return (
      <div className="px-4 py-10">
        <EmptyState icon={ShieldAlert} title="Bu modül İSG Uzmanı ve İşveren'e özeldir"
          description="Denetim planlama ve sonuç takibi Çalışan rolünde görüntülenemez." />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <p className="font-[Oswald] text-lg uppercase tracking-wide mb-3" style={{ color: theme.textPrimary }}>Denetim</p>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {configs.map((c) => (
          <button key={c.standard} onClick={() => switchStandard(c.standard)}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-full shrink-0"
            style={activeStandard === c.standard
              ? { background: theme.accent, color: theme.onAccent }
              : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
            {c.standardLabel}
          </button>
        ))}
      </div>

      {!loaded ? (
        <Loading label="Denetimler yükleniyor..." />
      ) : loadError ? (
        <ErrorState title="Denetimler yüklenemedi" description={loadError} onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="flex items-center justify-end gap-2 mb-3">
            {canManage && (
              <Button size="sm" onClick={() => setWizardOpen(true)} className="flex items-center gap-1.5 shrink-0">
                <Plus style={{ fontSize: "13px" }} sw={2.5} /> Yeni Denetim
              </Button>
            )}
          </div>

          {!canManage && (
            <p className="text-xs mb-3" style={{ color: theme.textFaint }}>
              Görüntüleme modu — denetim planlama ve yürütme İSG Uzmanı'na özgüdür.
            </p>
          )}

          {audits.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Henüz denetim planlanmadı"
              description={canManage ? `Yeni Denetim ile ilk ${config.standardLabel} denetiminizi planlayın.` : "İSG Uzmanı henüz bir denetim planlamadı."}
              action={canManage ? <Button size="sm" onClick={() => setWizardOpen(true)}>Yeni Denetim</Button> : undefined} />
          ) : (
            <AuditListPanel audits={audits} onOpen={(a) => setSelectedAuditId(a.id)}
              standardLabel={config.standardLabel} computeOverallScore={config.computeOverallScore} computeProgressPercent={config.computeProgressPercent} />
          )}
        </>
      )}

      <AuditWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={(input) => addAudit({ ...input, companyId: company?.id })}
        companyName={company?.name}
        departments={departments}
        standardLabel={config.standardLabel}
        generateChecklist={config.generateChecklist}
      />

      <AuditDetailDrawer
        audit={selectedAudit}
        onClose={() => setSelectedAuditId(null)}
        canManage={canManage}
        departments={departments}
        onUpdateItem={setChecklistResult}
        onComplete={(audit) => { finishAudit(audit); }}
        standardLabel={config.standardLabel}
        checklistResults={config.checklistResults}
        getResultMeta={config.getResultMeta}
        computeOverallScore={config.computeOverallScore}
        computeProgressPercent={config.computeProgressPercent}
        computeCategoryScores={config.computeCategoryScores}
      />
    </div>
  );
}
