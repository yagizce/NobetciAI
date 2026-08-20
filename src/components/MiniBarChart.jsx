/**
 * Basit, bağımlılıksız SVG çubuk grafik — chart kütüphanesi eklemeden (proje kuralı)
 * aylık sayıları göstermek için.
 * @param {{ data: { label: string, value: number }[], theme: object, height?: number }} props
 */
export default function MiniBarChart({ data, theme, height = 90 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          <span className="text-[9.5px] mb-1" style={{ color: theme.textFaint }}>{d.value}</span>
          <div
            className="w-full rounded-t"
            style={{ height: `${Math.max((d.value / max) * (height - 24), 3)}px`, background: theme.accent, opacity: i === data.length - 1 ? 1 : 0.55 }}
          />
          <span className="text-[9px] mt-1" style={{ color: theme.textFaint }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
