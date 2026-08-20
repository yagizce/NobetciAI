import { useTheme } from "../contexts/ThemeContext.jsx";
import { AlertTriangle } from "./icons/index.jsx";
import Button from "./ui/Button.jsx";

/**
 * Genel amaçlı hata durumu — veri çekme/kaydetme başarısız olduğunda kullanılır.
 * ErrorBoundary'den farkı: ErrorBoundary render hatalarını (crash) yakalar, bu bileşen
 * ise "istek başarısız oldu ama uygulama çökmedi" durumları için kullanılır (örn. bir
 * servis çağrısı reddedilirse, catch bloğunda bu bileşeni göster).
 *
 * @param {{ title?: string, description?: string, onRetry?: () => void }} props
 */
export default function ErrorState({ title = "Bir şeyler ters gitti", description, onRetry }) {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: theme.emergencyBg }}>
        <AlertTriangle style={{ fontSize: "22px", color: theme.emergencyText }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{title}</p>
      {description && <p className="text-xs mt-1 max-w-xs" style={{ color: theme.textFaint }}>{description}</p>}
      {onRetry && (
        <div className="mt-3">
          <Button size="sm" onClick={onRetry}>Tekrar Dene</Button>
        </div>
      )}
    </div>
  );
}
