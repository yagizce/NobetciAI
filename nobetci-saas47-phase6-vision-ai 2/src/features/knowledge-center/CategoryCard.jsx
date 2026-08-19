import { Scale, BarChart3, ShieldAlert, ListChecks, HardHat, AlertTriangle, BookOpen, Building2, FileText } from "../../components/icons/index.jsx";

// Kategori sabitlerindeki `icon` string alanını gerçek ikon bileşenine eşler.
// Sabit dosyası (constants/knowledgeCenter.js) bilinçli olarak JSX içermez;
// eşleme yalnızca UI katmanında yapılır.
const ICON_MAP = { Scale, BarChart3, ShieldAlert, ListChecks, HardHat, AlertTriangle, BookOpen, Building2 };

/**
 * @param {{ category: object, count: number, active: boolean, theme: object, onClick: () => void }} props
 */
export default function CategoryCard({ category, count, active, theme, onClick }) {
  const Icon = ICON_MAP[category.icon] || FileText;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border px-3.5 py-3.5 transition-colors"
      style={
        active
          ? { background: theme.accent, borderColor: theme.accent }
          : { background: theme.surface, borderColor: theme.border }
      }
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center mb-2.5"
        style={{ background: active ? "rgba(255,255,255,0.18)" : theme.surfaceAlt }}
      >
        <Icon style={{ fontSize: "17px", color: active ? theme.onAccent : theme.textMuted }} />
      </div>
      <p className="text-sm font-semibold mb-0.5" style={{ color: active ? theme.onAccent : theme.textPrimary }}>
        {category.label}
      </p>
      <p className="text-[10.5px] leading-snug mb-1.5" style={{ color: active ? "rgba(255,255,255,0.85)" : theme.textFaint }}>
        {category.description}
      </p>
      <span className="text-[10.5px] font-semibold" style={{ color: active ? theme.onAccent : theme.textMuted }}>
        {count} doküman
      </span>
    </button>
  );
}
