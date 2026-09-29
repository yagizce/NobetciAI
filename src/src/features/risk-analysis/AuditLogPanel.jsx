import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { getAuditLog } from "../../services/auditService.js";
import EmptyState from "../../components/EmptyState.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import { ClipboardList } from "../../components/icons/index.jsx";

const ENTITY_LABELS = {
  notification: "Bildirim",
  fineKinney: "Fine-Kinney",
  document: "Doküman",
  equipment: "Ekipman",
  periodicCheck: "Periyodik Kontrol",
};

const ENTITY_FILTERS = [{ key: "all", label: "Tümü" }, ...Object.entries(ENTITY_LABELS).map(([key, label]) => ({ key, label }))];

function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogPanel() {
  const { theme } = useTheme();
  const [log, setLog] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [entityFilter, setEntityFilter] = useState("all");

  useEffect(() => {
    getAuditLog()
      .then((data) => {
        setLog(data);
        setLoaded(true);
      })
      .catch((err) => {
        // BUG FIX (Sprint 8 polish): .catch() yoktu — hata durumunda `loaded` hiç
        // true olmuyor, panel SONSUZA KADAR yükleniyor görünüyordu.
        console.error("Aktivite geçmişi yüklenemedi:", err);
        setError(err);
        setLoaded(true);
      });
  }, []);

  const filteredLog = useMemo(
    () => (entityFilter === "all" ? log : log.filter((e) => e.entityType === entityFilter)),
    [log, entityFilter]
  );

  if (!loaded) return <Loading label="Aktivite geçmişi yükleniyor..." />;
  if (error) return <ErrorState title="Aktivite geçmişi yüklenemedi" description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin." onRetry={() => window.location.reload()} />;

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: theme.textFaint }}>
        Sistemdeki bildirim, risk değerlendirmesi, doküman ve kontrol kayıtlarındaki işlemlerin izlenebilir dökümü.
      </p>

      {log.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setEntityFilter(f.key)}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0"
              style={
                entityFilter === f.key
                  ? { background: theme.accent, color: theme.onAccent }
                  : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filteredLog.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Henüz aktivite kaydı yok" description="Bildirim, risk değerlendirmesi veya doküman işlemleri burada listelenecek." />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredLog.map((entry) => (
            <div key={entry.id} className="rounded-lg border px-3 py-2.5 flex items-start justify-between gap-3" style={{ borderColor: theme.border, background: theme.surface }}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: theme.textPrimary }}>{entry.action}</p>
                <p className="text-xs truncate" style={{ color: theme.textMuted }}>{entry.details}</p>
                <p className="text-[10.5px] mt-0.5" style={{ color: theme.textFaint }}>{entry.actor} • {ENTITY_LABELS[entry.entityType] || entry.entityType}</p>
              </div>
              <span className="text-[10.5px] shrink-0" style={{ color: theme.textFaint }}>{formatTimestamp(entry.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
