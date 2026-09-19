import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useStorageEstimate } from "../../hooks/useStorageEstimate.js";
import { getStorageUsageLevel, formatStorageBytes } from "../../services/storageEstimateService.js";
import { HardDrive } from "../../components/icons/index.jsx";

const TONE_KEYS = {
  success: { bg: "successBg", text: "successText" },
  warning: { bg: "warnBg", text: "warnText" },
  danger: { bg: "highRiskBg", text: "highRiskText" },
};

/**
 * Tarayıcı depolama kullanımının (`navigator.storage.estimate()`) yaklaşık göstergesi.
 * HARDENING: önceden kullanıcının depolama limitine ne kadar yaklaştığına dair hiçbir
 * görünürlüğü yoktu — ilk sinyali bir yazma işlemi gerçekten patlayınca alıyordu (bkz.
 * db.js → QuotaExceededError). Destekleyen tarayıcılarda küçük bir erken uyarı sağlar.
 *
 * Desteklenmiyorsa veya tahmin alınamazsa (`estimate: null`) SESSİZCE hiçbir şey
 * render etmez — bozuk/eksik bir gösterge göstermek, hiç göstermemekten kötüdür.
 */
export default function StorageUsageIndicator() {
  const { theme } = useTheme();
  const { estimate, loading } = useStorageEstimate();

  if (loading || !estimate) return null;

  const { usageBytes, quotaBytes, percentUsed } = estimate;
  const level = getStorageUsageLevel(percentUsed);
  const tone = TONE_KEYS[level.tone];

  return (
    <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
      <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
        <HardDrive style={{ fontSize: "14px" }} /> Cihaz Depolama Alanı
      </p>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: theme.textMuted }}>
          {formatStorageBytes(usageBytes)} / {formatStorageBytes(quotaBytes)} kullanılıyor
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: theme[tone.bg], color: theme[tone.text] }}>
          %{percentUsed} — {level.label}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: theme.surfaceAlt }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(percentUsed, 100)}%`, background: theme[tone.text] }} />
      </div>
      {level.tone !== "success" && (
        <p className="text-[10.5px] mt-2" style={{ color: theme.textFaint }}>
          Alan daralıyorsa Ayarlar &gt; Yedekleme'den bir yedek indirip eski fotoğrafları
          (Risk Tespiti) veya dokümanları temizlemeyi düşünebilirsiniz.
        </p>
      )}
      <p className="text-[10px] mt-1.5" style={{ color: theme.textFaint }}>
        Bu, tarayıcının verdiği YAKLAŞIK bir tahmindir, kesin bir ölçüm değildir.
      </p>
    </div>
  );
}
