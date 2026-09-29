import { memo } from "react";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";

const TYPE_LABELS = { ramakKala: "Ramak Kala", tehlike: "Tehlike", kaza: "İş Kazası" };

function statusTone(status) {
  if (status === "pending") return "pending";
  if (status === "ai_analyzed") return "warning";
  if (status === "approved") return "success";
  return "neutral";
}

function statusLabel(status) {
  if (status === "pending") return "AI Analiz Ediyor…";
  if (status === "ai_analyzed") return "Uzman İncelemesinde";
  if (status === "approved") return "Onaylandı — Görev Oluştu";
  return status;
}

function NotificationCard({ notification, theme, showApprove, onApprove }) {
  return (
    <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: theme.border, background: theme.surface }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold leading-snug" style={{ color: theme.textPrimary }}>{notification.desc}</p>
        <Badge tone={statusTone(notification.status)}>{statusLabel(notification.status)}</Badge>
      </div>
      <p className="text-[11px]" style={{ color: theme.textFaint }}>
        {notification.worker} • {notification.date} • {TYPE_LABELS[notification.type]}
      </p>
      {notification.aiAnalysis && (
        <div className="mt-2 rounded-lg px-2.5 py-2 text-[11.5px] whitespace-pre-wrap" style={{ background: theme.surfaceAlt, color: theme.textMuted }}>
          <span className="font-semibold" style={{ color: theme.textPrimary }}>AI Ön Analiz:</span>{"\n"}{notification.aiAnalysis}
        </div>
      )}
      {showApprove && (
        <Button size="sm" className="w-full mt-2" onClick={() => onApprove(notification.id)}>
          Onayla ve Göreve Dönüştür
        </Button>
      )}
      {notification.expertNote && <p className="text-[11px] mt-1.5" style={{ color: theme.successText }}>✓ {notification.expertNote}</p>}
    </div>
  );
}

// Only re-renders when this specific notification's data (or the approve-eligibility) changes.
export default memo(NotificationCard);
