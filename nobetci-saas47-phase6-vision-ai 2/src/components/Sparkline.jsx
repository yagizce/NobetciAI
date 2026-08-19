/**
 * Basit, bağımlılıksız SVG sparkline — bir çizgi grafik kütüphanesi eklemeden
 * (proje kuralı: yeni bağımlılık yok) trend göstermek için.
 * @param {{ data: number[], theme: object, width?: number, height?: number }} props
 */
export default function Sparkline({ data, theme, width = 240, height = 56 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <path d={areaPath} fill={theme.accent} opacity={0.12} />
      <path d={linePath} fill="none" stroke={theme.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const [x, y] = p.split(",");
        return <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 3 : 0} fill={theme.accent} />;
      })}
    </svg>
  );
}
