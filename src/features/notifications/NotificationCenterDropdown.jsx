import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { getSystemNotifications, markNotificationRead, markAllNotificationsRead } from "../../services/systemNotificationService.js";
import { getNotificationMeta } from "../../constants/systemNotifications.js";
import { timeAgo } from "../../utils/dateUtils.js";
import EmptyState from "../../components/EmptyState.jsx";
import { Bell } from "../../components/icons/index.jsx";

/**
 * @param {{ theme: object, pendingReportsCount?: number }} props
 */
export default function NotificationCenterDropdown({ pendingReportsCount = 0 }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // BUG FIX (demo veri temizliği): önceden burada ensureSampleTrainingReminders()
    // çağrılıyordu — yeni bir firma ilk açıldığında UYDURULMUŞ, gerçek olmayan bir
    // "Yangın Söndürme eğitiminin tekrarına 5 gün kaldı" bildirimi enjekte ediyordu.
    // Bu hem projenin kendi "sessiz/sahte veri yok" ilkesini ihlal ediyordu hem de
    // artık GEREKSİZDİ — useReminderScheduler.js zaten gerçek trainingCourseSettings
    // verisinden aynı türde (trainingDue) bildirimi üretiyor. Kaldırıldı.
    getSystemNotifications()
      .then((data) => { setNotifications(data); setLoaded(true); })
      .catch((err) => {
        // BUG FIX (Sprint 8 polish): .catch() yoktu — hata durumunda `loaded` hiç
        // true olmuyor, dropdown SONSUZA KADAR "Yükleniyor..." gösteriyordu.
        console.error("Bildirimler yüklenemedi:", err);
        setLoadError(true);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalBadge = unreadCount + pendingReportsCount;

  async function handleItemClick(notif) {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: theme.surfaceAlt }}
        aria-label="Bildirim Merkezi"
      >
        <Bell style={{ fontSize: "16px", color: theme.textMuted }} />
        {totalBadge > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: theme.emergencyBorder, color: "white" }}
          >
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl shadow-lg overflow-hidden z-40"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Bildirimler</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-[11px] font-semibold" style={{ color: theme.accent }}>
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!loaded ? (
              <div className="px-3.5 py-6 text-center text-xs" style={{ color: theme.textFaint }}>Yükleniyor...</div>
            ) : loadError ? (
              <div className="px-3.5 py-6 text-center text-xs" style={{ color: theme.warnText }}>Bildirimler yüklenemedi.</div>
            ) : notifications.length === 0 ? (
              <EmptyState icon={Bell} title="Henüz bildirim yok" />
            ) : (
              notifications.map((n) => {
                const meta = getNotificationMeta(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="w-full text-left px-3.5 py-2.5 flex items-start gap-2.5"
                    style={{ borderBottom: `1px solid ${theme.border}`, background: n.read ? "transparent" : theme.surfaceAlt }}
                  >
                    <span className="text-sm shrink-0 mt-0.5">{meta.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug" style={{ color: theme.textPrimary, fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                      <p className="text-[11.5px] mt-0.5 truncate" style={{ color: theme.textMuted }}>{n.message}</p>
                      <p className="text-[10px] mt-1" style={{ color: theme.textFaint }}>{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: theme.accent }} />}
                  </button>
                );
              })
            )}
          </div>

          {pendingReportsCount > 0 && (
            <Link
              to="/risk-analysis"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2.5 text-xs font-semibold text-center"
              style={{ color: theme.accent, borderTop: `1px solid ${theme.border}` }}
            >
              {pendingReportsCount} bekleyen bildirim incelemesi → Bildirim Merkezi'ne git
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
