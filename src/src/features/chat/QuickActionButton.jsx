import { memo } from "react";
import * as Icons from "../../components/icons/index.jsx";
import { HardHat } from "../../components/icons/index.jsx";

function QuickActionButton({ qa, onSelect, disabled, theme }) {
  const QaIcon = Icons[qa.iconKey] || HardHat;
  return (
    <button
      onClick={() => onSelect(qa)}
      disabled={disabled}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] shrink-0 disabled:opacity-50"
      style={{ border: `1px solid ${theme.border}`, background: theme.surfaceAlt, color: theme.textPrimary }}
    >
      <QaIcon style={{ fontSize: "13px", color: theme.accent }} /> {qa.label}
    </button>
  );
}

export default memo(QuickActionButton);
