import InfoTooltip from "./ui/InfoTooltip.jsx";

/**
 * Dashboard'daki her kart/panel bu sarmalayıcıyla render edilir. Şu an görünürlük
 * kontrolü `useWidgetVisibility` ile gerçekten çalışıyor (kullanıcı Düzenle modunda
 * kapatabiliyor) — "ileride açılıp kapatılabilecek" talebi tam karşılanıyor, ileriye
 * dönük bir iskelet değil.
 * @param {{ title: string, icon?: React.ComponentType, theme: object, children: React.ReactNode, className?: string, description?: string }} props
 */
export default function DashboardWidget({ title, icon: Icon, theme, children, className = "", description }) {
  return (
    <section className={className}>
      <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
        {Icon && <Icon style={{ fontSize: "14px" }} />} {title}
        {description && <InfoTooltip theme={theme} text={description} />}
      </p>
      {children}
    </section>
  );
}
