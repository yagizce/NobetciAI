import { useTheme } from "../contexts/ThemeContext.jsx";

export default function Loading({ label = "Yükleniyor..." }) {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: theme.border, borderTopColor: theme.accent }}
      />
      <p className="text-xs" style={{ color: theme.textFaint }}>{label}</p>
    </div>
  );
}
