import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage, LANGUAGES } from "../contexts/LanguageContext.jsx";
import { useRole } from "../contexts/RoleContext.jsx";
import { SWITCHABLE_ROLES } from "../constants/allRoles.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { NOTIFICATION_PREFS_STORAGE_KEY, DEFAULT_NOTIFICATION_PREFS, NOTIFICATION_PREF_LABELS } from "../constants/notificationPrefs.js";
import { isNotificationSupported, getNotificationPermission, requestNotificationPermission } from "../services/notificationService.js";
import { UserRound, Bell, Building2 } from "../components/icons/index.jsx";
import Badge from "../components/ui/Badge.jsx";
import CompanyManagementPanel from "../features/company/CompanyManagementPanel.jsx";
import BackupSection from "../features/settings/BackupSection.jsx";
import DemoDataSection from "../features/settings/DemoDataSection.jsx";
import StorageUsageIndicator from "../features/settings/StorageUsageIndicator.jsx";
import RouteGuard from "../components/RouteGuard.jsx";
import ToggleSwitch from "../components/ui/ToggleSwitch.jsx";

function permissionBadge(permission) {
  if (permission === "granted") return <Badge tone="success">Verildi</Badge>;
  if (permission === "denied") return <Badge tone="danger">Reddedildi</Badge>;
  if (permission === "unsupported") return <Badge tone="neutral">Desteklenmiyor</Badge>;
  return <Badge tone="warning">İstenmedi</Badge>;
}

export default function Settings() {
  useDocumentTitle("Ayarlar");
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { role, setRole } = useRole();
  const [notifPrefs, setNotifPrefs] = useLocalStorage(NOTIFICATION_PREFS_STORAGE_KEY, DEFAULT_NOTIFICATION_PREFS);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <p className="font-[Oswald] text-xl uppercase tracking-wide mb-4" style={{ color: theme.textPrimary }}>Ayarlar</p>

      <div className="flex flex-col gap-4">
        {/* Firma Yönetimi — yalnızca İşveren rolü görür/yönetir */}
        <RouteGuard allowedRoles={["employer"]} fallback={null}>
          <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
            <p className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
              <Building2 style={{ fontSize: "14px" }} /> Firma Yönetimi
            </p>
            <CompanyManagementPanel />
          </div>
        </RouteGuard>

        {/* Dil */}
        <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
          <p className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>Dil</p>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => l.enabled && setLanguage(l.id)}
                disabled={!l.enabled}
                className="flex-1 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-40"
                style={language === l.id ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
              >
                {l.label}
                {!l.enabled && <Badge tone="neutral">Yakında</Badge>}
              </button>
            ))}
          </div>
        </div>

        {/* Bildirimler */}
        <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
          <p className="text-sm font-semibold mb-1 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
            <Bell style={{ fontSize: "14px" }} /> Bildirimler
          </p>

          <div className="flex items-center justify-between gap-3 py-2 mb-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div>
              <p className="text-sm" style={{ color: theme.textPrimary }}>Tarayıcı Bildirimleri</p>
              <p className="text-[11px]" style={{ color: theme.textFaint }}>Uygulama arka plandayken de gerçek bildirim alın.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {permissionBadge(permission)}
              {permission !== "granted" && permission !== "unsupported" && (
                <button onClick={handleEnableNotifications} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: theme.accent, color: theme.onAccent }}>
                  Etkinleştir
                </button>
              )}
            </div>
          </div>
          {!isNotificationSupported() && (
            <p className="text-[11px] mb-2" style={{ color: theme.textFaint }}>Bu tarayıcı bildirim özelliğini desteklemiyor.</p>
          )}

          <div className="flex flex-col gap-3 pt-1">
            {Object.entries(NOTIFICATION_PREF_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: theme.textMuted }}>{label}</span>
                <ToggleSwitch
                  checked={notifPrefs[key]}
                  onChange={(val) => setNotifPrefs({ ...notifPrefs, [key]: val })}
                  theme={theme}
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: theme.textFaint }}>
            Bu anahtarlar, hangi olaylarda tarayıcı bildirimi gönderileceğini belirler (yukarıdaki izin verildiyse).
          </p>
        </div>

        {/* Profil */}
        <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
            <UserRound style={{ fontSize: "14px" }} /> Profil
          </p>
          <Link to="/profile" className="text-sm font-medium" style={{ color: theme.accent }}>
            Profil bilgilerini görüntüle →
          </Link>
        </div>

        {/* Depolama */}
        <StorageUsageIndicator />

        {/* Yedekleme */}
        <BackupSection />

        {/* Örnek Veri */}
        <DemoDataSection />

        {/* Rol (Demo) */}
        <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
          <p className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>Rol (Demo)</p>
          <div className="flex gap-2">
            {SWITCHABLE_ROLES.map((r) => (
              <button key={r.id} onClick={() => setRole(r.id)} className="flex-1 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1"
                style={role === r.id ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                <span>{r.emoji}</span>{r.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: theme.textFaint }}>
            Farklı kullanıcı rollerinin arayüzü nasıl gördüğünü göstermek için bir demo seçicidir; gerçek kimlik doğrulama değildir.
          </p>
        </div>

      </div>
    </div>
  );
}
