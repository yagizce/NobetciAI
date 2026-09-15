import { useState, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../constants/allRoles.js";
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
import AuditReadinessPanel from "./AuditReadinessPanel.jsx";
import AuditDetailDrawer from "./AuditDetailDrawer.jsx";
import DifDetailDrawer from "./DifDetailDrawer.jsx";
import AuditReportView from "./AuditReportView.jsx";
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
 * FAZ NOTU: çoklu standart seçimi (tek denetimde) bu fazda BİLİNÇLİ OLARAK devre
 * dışı. DİF (Düzeltici İyileştirici Faaliyet) takibi ise artık AKTİF — İSG Mevzuat
 * Denetimi'nde "Uygun Değil" çıkan bir kriterden uzman isterse manuel "Uygunsuzluk
 * Oluştur" ile DİF açabilir (bkz. AuditDetailDrawer.jsx). ISO 45001 kriterlerinde
 * mevzuat dayanağı (legislationName/article) YOK, bu yüzden bu buton ISO 45001
 * akışında hiç görünmez/etkilenmez — ISO 45001'e dokunulmadı.
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
  const [selectedDifId, setSelectedDifId] = useState(null);
  const [reportAuditId, setReportAuditId] = useState(null);

  const { audits, findings, loaded, loadError, addAudit, setChecklistResult, finishAudit, openFinding, setDifStage, addEvidence, removeEvidence, updateDif } = useAudits({
    standard: config.standard,
    standardLabel: config.standardLabel,
  });

  const selectedAudit = audits.find((a) => a.id === selectedAuditId) || null;
  const selectedDif = findings.find((f) => f.id === selectedDifId) || null;
  const reportAudit = audits.find((a) => a.id === reportAuditId) || null;

  function switchStandard(standard) {
    setActiveStandard(standard);
    setSelectedAuditId(null);
    setSelectedDifId(null);
    setReportAuditId(null);
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

          {/* Denetime Hazırlık — "eksikler" ekranı. YALNIZCA İSG Mevzuat Denetimi'nde
              gösterilir (istek → kapsam maddesi); ISO 45001 sekmesi bu paneli hiç
              render etmez, ISO 45001 akışına dokunulmaz. `loaded`/`loadError` burada
              zaten garanti true/null olduğu için bileşenin kendi yükleniyor/hata
              dalları bu kullanımda tetiklenmez (audit listesiyle ikinci bir spinner
              göstermemek için) — ama bileşen kendi başına da doğru/bağımsız çalışacak
              şekilde yazıldı (bkz. AuditReadinessPanel.jsx). */}
          {config.standard === "mevzuat" && (
            <AuditReadinessPanel
              loaded={loaded}
              loadError={loadError}
              onRetry={() => window.location.reload()}
              audits={audits}
              findings={findings}
              getCategoryTitle={config.getCategoryTitle}
              onOpenAudit={(auditId) => setSelectedAuditId(auditId)}
              onOpenDif={(difId) => setSelectedDifId(difId)}
            />
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
        getCategoryTitle={config.getCategoryTitle}
        findings={findings}
        allAudits={audits}
        company={company}
        onCreateDif={openFinding}
        onOpenDif={(dif) => setSelectedDifId(dif.id)}
        currentUserLabel={getRoleLabel(role)}
        onViewReport={(a) => setReportAuditId(a.id)}
      />

      <DifDetailDrawer
        dif={selectedDif}
        onClose={() => setSelectedDifId(null)}
        canManage={canManage}
        onStageChange={setDifStage}
        onSaveFields={updateDif}
        onAddEvidence={addEvidence}
        onRemoveEvidence={removeEvidence}
      />

      <AuditReportView
        audit={reportAudit}
        onClose={() => setReportAuditId(null)}
        findings={findings}
        allAudits={audits}
        company={company}
        standardLabel={config.standardLabel}
        checklistResults={config.checklistResults}
        getResultMeta={config.getResultMeta}
        computeOverallScore={config.computeOverallScore}
        computeProgressPercent={config.computeProgressPercent}
        computeCategoryScores={config.computeCategoryScores}
        getCategoryTitle={config.getCategoryTitle}
      />
    </div>
  );
}
