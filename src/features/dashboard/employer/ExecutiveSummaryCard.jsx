/**
 * @param {{ theme: object, weeklySummary: { sentence: string, newRisksThisWeek: number, closedRisksThisWeek: number, ongoingCriticalRisks: number, upcomingChecks: number } }} props
 */
export default function ExecutiveSummaryCard({ theme, weeklySummary }) {
  return (
    <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
      <p className="text-sm leading-relaxed" style={{ color: theme.textPrimary }}>{weeklySummary.sentence}</p>
      <p className="text-[10.5px] mt-2" style={{ color: theme.textFaint }}>
        Bu özet, son 7 güne ait risk ve periyodik kontrol kayıtlarından otomatik oluşturuldu.
      </p>
    </div>
  );
}
