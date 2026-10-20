import { useState, useMemo, useEffect, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { BookOpen, FileText, ListChecks } from "../../components/icons/index.jsx";
import DocumentGenerator from "./DocumentGenerator.jsx";
import PeriodicChecksPanel from "./periodicChecks/PeriodicChecksPanel.jsx";
import AskAiButton from "../../components/AskAiButton.jsx";
import { getReleaseTabs, resolveReleaseTab } from "../../constants/releaseProfile.js";

const TrainingModule = lazy(() => import("../training/TrainingModule.jsx"));

// QR Kod → Periyodik Kontrol entegrasyonu: "Ekipman Kayıtları" sekmesi (QR tarama +
// ayrı equipment listesi) buradan KALDIRILDI, aynı işlev artık Periyodik Kontroller
// sekmesinin içinde ve o modülün gerçek verisiyle konuşarak çalışıyor (bkz.
// PeriodicChecksPanel.jsx → "QR Okut"). Eski equipmentList/addEquipment
// (IsgDataContext.jsx) hiç kullanılmadığı doğrulandıktan sonra tamamen temizlendi.
const ALL_TABS = [
  { key: "education", label: "Eğitim Modülleri", icon: BookOpen, roles: ["employee", "expert", "employer"], feature: "training" },
  { key: "generator", label: "Belge Oluştur", icon: FileText, roles: ["expert", "employer"] },
  { key: "periodicChecks", label: "Periyodik Kontroller", icon: ListChecks, roles: ["expert", "employer"] },
];

export default function DocumentsPage() {
  const { theme } = useTheme();
  const { role } = useRole();
  const visibleTabs = useMemo(() => getReleaseTabs(ALL_TABS, role), [role]);
  const [searchParams] = useSearchParams();
  // Sprint 7.4: Dashboard kartlarından (Yaklaşan Periyodik Kontroller / Devam Eden
  // Eğitimler) "?tab=periodicChecks" gibi derin bağlantı ile doğrudan ilgili sekmeye
  // gelinebilir. Geçersiz/eksik bir değer varsa ilk görünür sekmeye düşülür.
  const requestedTab = searchParams.get("tab");
  const prefillSearch = searchParams.get("q") || undefined; // Genel arama (GlobalSearchBar.jsx) buradan gelir
  const [selectedTab, setTab] = useState(requestedTab);
  const tab = resolveReleaseTab(visibleTabs, selectedTab);

  // URL değişimleri takip edilir; kapalı sekme ilk render'da bile bağlanmaz.
  useEffect(() => {
    setTab(requestedTab);
  }, [requestedTab]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <p className="font-[Oswald] text-xl uppercase tracking-wide mb-3" style={{ color: theme.textPrimary }}>Dokümanlar</p>

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleTabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0"
              style={tab === t.key ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
              <t.icon style={{ fontSize: "13px" }} /> {t.label}
            </button>
          ))}
        </div>
        {tab === "periodicChecks" && <AskAiButton contextId="periodicChecks" />}
      </div>

      {tab === "education" && <TrainingModule theme={theme} role={role} />}

      {tab === "generator" && <DocumentGenerator initialSearch={prefillSearch} />}

      {tab === "periodicChecks" && <PeriodicChecksPanel initialSearch={prefillSearch} />}
    </div>
  );
}
