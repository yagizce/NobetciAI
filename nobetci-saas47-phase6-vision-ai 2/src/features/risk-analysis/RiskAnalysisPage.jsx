import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../constants/allRoles.js";
import { MOCK_USERS } from "../../constants/mockUsers.js";
import { useIsgData } from "../../contexts/IsgDataContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { SYSTEM_PROMPT } from "../../constants/systemPrompt.js";
import { sendChatMessage } from "../../services/chatService.js";
import { todayLabel } from "../../utils/dateUtils.js";
import { logActivity } from "../../services/auditService.js";
import { createId } from "../../utils/id.js";
import { showLocalNotification } from "../../services/notificationService.js";
import { Plus, ShieldAlert, BarChart3, Bell, ClipboardList, Camera } from "../../components/icons/index.jsx";
import Button from "../../components/ui/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import NotificationCard from "./NotificationCard.jsx";
import FineKinneyModule from "./FineKinneyModule.jsx";
import AuditLogPanel from "./AuditLogPanel.jsx";
import RiskDetectionPanel from "./riskDetection/RiskDetectionPanel.jsx";
import AskAiButton from "../../components/AskAiButton.jsx";

const TYPE_LABELS = { ramakKala: "Ramak Kala", tehlike: "Tehlike", kaza: "İş Kazası" };

function roleLabel(role) {
  return getRoleLabel(role);
}

function NotificationCenterTab({ theme, role }) {
  const { notifications, addNotification, updateNotification } = useIsgData();
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("ramakKala");

  const submitNotification = useCallback(async () => {
    if (!desc.trim()) return;
    // BUG FIX (demo veri temizliği): "Ahmet Yıldız" önceden literal string olarak
    // hardcoded'du — MOCK_USERS.employee.name ile bugün AYNI değere denk geliyor
    // ama üç ayrı dosyada (bkz. EmployeeDashboard.jsx, DocumentGenerator.jsx)
    // bağımsız olarak tekrarlanmıştı. Mock kullanıcı adı değişirse bu üçü
    // senkronize kalmıyordu. Artık MOCK_USERS'tan dinamik okunuyor.
    const currentEmployeeName = MOCK_USERS.employee?.name || "Çalışan";
    const notif = { id: createId(), type, desc: desc.trim(), status: "pending", worker: currentEmployeeName, date: todayLabel(), aiAnalysis: null, expertNote: null };
    addNotification(notif);
    setDesc("");
    setFormOpen(false);
    showToast("Bildirim gönderildi, AI analiz ediyor...", "neutral");
    logActivity({ actor: roleLabel(role), action: "Bildirim oluşturuldu", details: `${TYPE_LABELS[type]}: ${notif.desc}`, entityType: "notification" });

    try {
      const reply = await sendChatMessage({
        system: SYSTEM_PROMPT,
        max_tokens: 600,
        messages: [{ role: "user", content: `Bildirim türü: ${TYPE_LABELS[type]}. Açıklama: "${notif.desc}". Bu bildirime kısa bir ön analiz yap: olası risk seviyesi (gerekçeli) ve İSG uzmanının dikkat etmesi gereken noktalar. 3-4 madde, kısa.` }],
      });
      updateNotification(notif.id, { status: "ai_analyzed", aiAnalysis: reply || "AI analizi alınamadı." });
      showToast("AI analizi tamamlandı, uzman incelemesine düştü.", "success");
      showLocalNotification("aiAnalysisComplete", "AI Analizi Tamamlandı", `"${notif.desc}" için ön analiz hazır, uzman incelemesine düştü.`);
    } catch {
      updateNotification(notif.id, { status: "ai_analyzed", aiAnalysis: "AI analizine şu an ulaşılamadı, uzman manuel değerlendirebilir." });
      showToast("AI analizine ulaşılamadı, uzman manuel değerlendirecek.", "error");
    }
  }, [desc, type, addNotification, updateNotification, showToast, role]);

  const expertApprove = useCallback((id, entry) => {
    updateNotification(id, { status: "approved", expertNote: "Uzman tarafından onaylandı, göreve dönüştürüldü." });
    showToast("Bildirim onaylandı ve göreve dönüştürüldü.", "success");
    logActivity({ actor: roleLabel(role), action: "Bildirim onaylandı", details: entry?.desc || `#${id}`, entityType: "notification" });
    showLocalNotification("taskAssigned", "Yeni Görev Atandı", entry?.desc ? `"${entry.desc}" onaylandı ve göreve dönüştürüldü.` : "Bir bildirim onaylandı ve göreve dönüştürüldü.");
  }, [updateNotification, showToast, role]);

  const visibleNotifications = useMemo(() => notifications.filter((n) =>
    role === "employee" ? n.worker === (MOCK_USERS.employee?.name || "Çalışan") : role === "expert" ? true : n.status === "approved"
  ), [notifications, role]);

  return (
    <div>
      {role === "employee" && (
        <Button onClick={() => setFormOpen((v) => !v)} className="mb-3 flex items-center gap-1.5">
          <Plus style={{ fontSize: "14px" }} sw={2.5} /> Yeni Bildirim
        </Button>
      )}

      {formOpen && role === "employee" && (
        <div className="rounded-xl border px-3.5 py-3 mb-4 max-w-md" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          <div className="flex gap-2 mb-2">
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <button key={val} onClick={() => setType(val)} className="flex-1 text-[11px] py-1.5 rounded-lg font-semibold"
                style={type === val ? { background: theme.accent, color: theme.onAccent } : { background: theme.surface, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                {label}
              </button>
            ))}
          </div>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ne oldu, nerede? Kısaca açıklayın..." rows={3}
            className="w-full text-sm rounded-lg px-3 py-2 mb-2 outline-none border resize-none" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <Button onClick={submitNotification} disabled={!desc.trim()} className="w-full">Gönder</Button>
        </div>
      )}

      {visibleNotifications.length === 0 && (
        <EmptyState icon={ShieldAlert} title="Henüz bildirim yok" description="Yeni bir bildirim oluşturduğunuzda burada görünecek." />
      )}

      <div className="grid gap-2.5 md:grid-cols-2">
        {visibleNotifications.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            theme={theme}
            showApprove={role === "expert" && n.status === "ai_analyzed"}
            onApprove={(id) => expertApprove(id, n)}
          />
        ))}
      </div>
    </div>
  );
}

const ALL_TABS = [
  { key: "notifications", label: "Bildirim Merkezi", icon: Bell, roles: ["employee", "expert", "employer"] },
  { key: "riskDetection", label: "Risk Tespiti", icon: Camera, roles: ["expert", "employer"] },
  { key: "fineKinney", label: "Fine-Kinney Değerlendirmesi", icon: BarChart3, roles: ["expert", "employer"] },
  { key: "auditLog", label: "Aktivite Geçmişi", icon: ClipboardList, roles: ["expert", "employer"] },
];

export default function RiskAnalysisPage() {
  const { theme } = useTheme();
  const { role } = useRole();
  const visibleTabs = useMemo(() => ALL_TABS.filter((t) => t.roles.includes(role)), [role]);
  // Genel arama (bkz. GlobalSearchBar.jsx) buraya `state: { targetTab, prefillSearch }`
  // ile yönlendirebilir — dolu ise ilgili sekme + arama metni ile açılır. Doğrudan
  // menüden girişte (state yok) davranış tamamen eskisi gibi.
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.targetTab || visibleTabs[0]?.key || "notifications");

  // Phase 9.1 — Risk Tespiti'nden Fine-Kinney'e "köprü": bir tespit için "AI ile Taslak
  // Oluştur" veya "Sahaya İn" tıklanınca burada bir taslak objesi tutulur ve sekme
  // Fine-Kinney'e geçirilir; FineKinneyModule bunu tükettiğinde temizlenir (bkz.
  // FineKinneyModule.jsx → pendingDraft/onDraftConsumed). Kasıtlı olarak basit tutuldu:
  // dönüştürülen tespit ile oluşan Fine-Kinney kaydı arasında otomatik bir id bağlantısı
  // KURULMUYOR — kullanıcı Risk Tespiti sekmesine dönüp "Dönüştürüldü Olarak İşaretle"
  // ile bunu kendisi onaylıyor (bkz. dev report → "Sonraki Öneriler").
  const [pendingDraft, setPendingDraft] = useState(null);

  function sendDetectionToFineKinney(hazard, risk, extra = {}) {
    setPendingDraft({ hazard, risk, ...extra });
    setTab("fineKinney");
  }

  // Rol değişip mevcut sekme artık görünmüyorsa (örn. Uzman'dan Çalışan'a geçildiğinde),
  // otomatik olarak görünür ilk sekmeye dön.
  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === tab)) setTab(visibleTabs[0]?.key || "notifications");
  }, [visibleTabs, tab]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <p className="font-[Oswald] text-xl uppercase tracking-wide mb-1" style={{ color: theme.textPrimary }}>Risk Analizi</p>
      <p className="text-xs mb-4" style={{ color: theme.textFaint }}>
        {role === "employee" ? "Ramak kala, tehlike ve iş kazası bildirimlerini buradan yapabilirsin" : "Bildirim Merkezi, Risk Tespiti, Fine-Kinney değerlendirmesi ve aktivite geçmişi bir arada"}
      </p>

      <div className="flex items-center justify-between gap-2 mb-4">
        {visibleTabs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visibleTabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0"
                style={tab === t.key ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                <t.icon style={{ fontSize: "13px" }} /> {t.label}
              </button>
            ))}
          </div>
        )}
        {(tab === "fineKinney" || tab === "riskDetection") && <AskAiButton contextId={tab} />}
      </div>

      {tab === "notifications" && <NotificationCenterTab theme={theme} role={role} />}
      {tab === "riskDetection" && <RiskDetectionPanel theme={theme} onSendToFineKinney={sendDetectionToFineKinney} initialSearch={location.state?.prefillSearch} />}
      {tab === "fineKinney" && <FineKinneyModule pendingDraft={pendingDraft} onDraftConsumed={() => setPendingDraft(null)} initialSearch={location.state?.prefillSearch} />}
      {tab === "auditLog" && <AuditLogPanel />}
    </div>
  );
}
