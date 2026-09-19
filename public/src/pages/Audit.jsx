import AuditPage from "../features/audit/AuditPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import * as iso45001 from "../constants/iso45001Checklist.js";
import * as mevzuat from "../constants/mevzuatChecklist.js";

// Denetim Modülü — desteklenen tüm türler tek yerde listelenir. Yeni bir standart
// (Faz 3: 9001/14001/27001) eklendiğinde tek yapılması gereken kendi
// `constants/isoXXXXChecklist.js` dosyasını yazıp burada bir CONFIGS girdisi
// eklemek — AuditPage.jsx ve alt bileşenler DEĞİŞMEDEN çalışır.
// SIRALAMA NOTU: dizideki sıra hem sekme sırasını hem de varsayılan aktif standardı
// belirler (bkz. AuditPage.jsx → `useState(configs[0].standard)`) — İSG Mevzuat
// Denetimi ilk, ISO 45001 ikinci sırada görünsün diye buradaki sıra değiştirildi.
const CONFIGS = [
  {
    standard: "mevzuat",
    standardLabel: "İSG Mevzuat",
    generateChecklist: mevzuat.generateChecklist,
    checklistResults: mevzuat.CHECKLIST_RESULTS,
    getResultMeta: mevzuat.getResultMeta,
    computeOverallScore: mevzuat.computeOverallScore,
    computeProgressPercent: mevzuat.computeProgressPercent,
    computeCategoryScores: mevzuat.computeCategoryScores,
    getCategoryTitle: mevzuat.getCategoryTitle,
  },
  {
    standard: "45001",
    standardLabel: "ISO 45001",
    generateChecklist: iso45001.generateChecklist,
    checklistResults: iso45001.CHECKLIST_RESULTS,
    getResultMeta: iso45001.getResultMeta,
    computeOverallScore: iso45001.computeOverallScore,
    computeProgressPercent: iso45001.computeProgressPercent,
    computeCategoryScores: iso45001.computeCategoryScores,
    getCategoryTitle: iso45001.getCategoryTitle,
  },
];

export default function Audit() {
  useDocumentTitle("Denetim");
  return <AuditPage configs={CONFIGS} />;
}
