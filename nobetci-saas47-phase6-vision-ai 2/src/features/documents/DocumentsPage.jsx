import { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../constants/allRoles.js";
import { useIsgData } from "../../contexts/IsgDataContext.jsx";
import { nowLabel } from "../../utils/dateUtils.js";
import { logActivity } from "../../services/auditService.js";
import { createId } from "../../utils/id.js";
import { QrCode, BookOpen, FileText, ListChecks } from "../../components/icons/index.jsx";
import DocumentGenerator from "./DocumentGenerator.jsx";
import PeriodicChecksPanel from "./periodicChecks/PeriodicChecksPanel.jsx";
import AskAiButton from "../../components/AskAiButton.jsx";
import TrainingModule from "../training/TrainingModule.jsx";

const ALL_TABS = [
  { key: "equipment", label: "Ekipman Kayıtları", icon: QrCode, roles: ["employee", "expert", "employer"] },
  { key: "education", label: "Eğitim Modülleri", icon: BookOpen, roles: ["employee", "expert", "employer"] },
  { key: "generator", label: "Belge Oluştur", icon: FileText, roles: ["expert", "employer"] },
  { key: "periodicChecks", label: "Periyodik Kontroller", icon: ListChecks, roles: ["expert", "employer"] },
];

export default function DocumentsPage() {
  const { theme } = useTheme();
  const { role } = useRole();
  const { equipmentList, addEquipment } = useIsgData();
  const visibleTabs = useMemo(() => ALL_TABS.filter((t) => t.roles.includes(role)), [role]);
  const [searchParams] = useSearchParams();
  // Sprint 7.4: Dashboard kartlarından (Yaklaşan Periyodik Kontroller / Devam Eden
  // Eğitimler) "?tab=periodicChecks" gibi derin bağlantı ile doğrudan ilgili sekmeye
  // gelinebilir. Geçersiz/eksik bir değer varsa ilk görünür sekmeye düşülür.
  const requestedTab = searchParams.get("tab");
  const prefillSearch = searchParams.get("q") || undefined; // Genel arama (GlobalSearchBar.jsx) buradan gelir
  const [tab, setTab] = useState(
    visibleTabs.some((t) => t.key === requestedTab) ? requestedTab : (visibleTabs[0]?.key || "equipment")
  );
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Rol değişip mevcut sekme artık görünmüyorsa, görünür ilk sekmeye dön.
  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === tab)) setTab(visibleTabs[0]?.key || "equipment");
  }, [visibleTabs, tab]);

  function startQRScan() {
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            scanQRLoop();
          };
        }
      });
    }
  }

  function scanQRLoop() {
    if (canvasRef.current && videoRef.current && window.jsQR) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        setScanResult(code.data);
        videoRef.current.srcObject?.getTracks().forEach((t) => t.stop());
      } else {
        requestAnimationFrame(scanQRLoop);
      }
    }
  }

  function handleAddEquipment() {
    const newEq = { id: createId(), name: `Ekipman ${equipmentList.length + 1}`, qr: scanResult, lastCheck: nowLabel() };
    addEquipment(newEq);
    logActivity({
      actor: getRoleLabel(role),
      action: "Ekipman eklendi",
      details: newEq.name,
      entityType: "equipment",
    });
    setScanResult(null);
  }

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

      {tab === "equipment" && (
        <div>
          {!scanResult ? (
            <button onClick={startQRScan} className="w-full max-w-sm py-3 rounded-xl border-2 text-center font-semibold mb-4" style={{ borderColor: theme.accent, background: theme.surfaceAlt, color: theme.accent }}>
              QR Kod Tarayıcı Başlat
            </button>
          ) : (
            <div className="rounded-xl p-4 mb-4 max-w-sm" style={{ background: theme.successBg }}>
              <p className="text-sm" style={{ color: theme.successText }}>✓ QR Okundu</p>
              <button onClick={handleAddEquipment} className="w-full mt-2 py-2 rounded-lg font-semibold" style={{ background: theme.accent, color: theme.onAccent }}>Ekleyin</button>
            </div>
          )}
          <video ref={videoRef} style={{ display: "none" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <p className="font-[Oswald] text-sm uppercase tracking-wide mb-2" style={{ color: theme.textPrimary }}>Kayıtlı Ekipmanlar</p>
          <div className="grid gap-2 md:grid-cols-2">
            {equipmentList.map((eq) => (
              <div key={eq.id} className="rounded-lg border px-3 py-2" style={{ borderColor: theme.border, background: theme.surface }}>
                <p className="text-sm" style={{ color: theme.textPrimary }}>{eq.name}</p>
                <p className="text-xs" style={{ color: theme.textFaint }}>Son: {eq.lastCheck}</p>
              </div>
            ))}
            {equipmentList.length === 0 && <p className="text-xs" style={{ color: theme.textFaint }}>Henüz kayıtlı ekipman yok.</p>}
          </div>
        </div>
      )}

      {tab === "education" && <TrainingModule theme={theme} role={role} />}

      {tab === "generator" && <DocumentGenerator />}

      {tab === "periodicChecks" && <PeriodicChecksPanel initialSearch={prefillSearch} />}
    </div>
  );
}
