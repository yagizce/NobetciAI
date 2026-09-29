import { useRef, useState, useEffect } from "react";
import { AlertTriangle } from "../../components/icons/index.jsx";

/**
 * Zorunlu eğitim videosu için "ileri sarma" (seek-ahead) engelli player. Saf HTML5
 * `<video>` olayları üzerinde çalışır — yeni bağımlılık gerekmez.
 *
 * Mantık: izlenen en ileri nokta (`maxWatchedTime`) sürekli takip edilir. Kullanıcı
 * bunun ilerisine sarmaya çalışırsa (`seeking` olayı), oynatma konumu anında en ileri
 * izlenen noktaya geri çekilir. Geriye sarmaya (tekrar izlemeye) her zaman izin verilir.
 *
 * Sprint 7.2.1: `initialPositionSeconds` ile "kaldığı yerden devam et" desteklenir —
 * `maxWatchedTime` bu değerle başlatılır (0 ile değil), aksi halde devam noktasının
 * kendisi yanlışlıkla "ileri sarma" sayılıp geri çekilirdi. `onProgress` ile ilerleme
 * periyodik olarak (throttle'lı) ve videodan çıkarken kalıcı hale getirilir.
 *
 * @param {{
 *   theme: object, videoUrl: string, initialPositionSeconds?: number,
 *   onFullyWatched: () => void,
 *   onProgress?: (positionSeconds: number, durationSeconds: number) => void,
 * }} props
 */
export default function NoSkipVideoPlayer({ theme, videoUrl, initialPositionSeconds = 0, onFullyWatched, onProgress }) {
  const videoRef = useRef(null);
  const maxWatchedTime = useRef(initialPositionSeconds);
  const lastProgressSaveAt = useRef(0);
  const resumeAppliedRef = useRef(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [fullyWatched, setFullyWatched] = useState(false);
  // UX FIX (Eğitim cilası): video URL'si yüklenemezse (bozuk bağlantı, ağ hatası vb.)
  // önceden hiçbir hata durumu yoktu — kullanıcı sadece siyah, boş bir kutu görüyordu,
  // hiçbir açıklama yoktu. Native <video>'nun `onError` olayı yakalanarak anlaşılır bir
  // Türkçe mesaj gösteriliyor.
  const [videoError, setVideoError] = useState(false);

  function saveProgress(video) {
    if (!video || !video.duration || !onProgress) return;
    onProgress(maxWatchedTime.current, video.duration);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video || resumeAppliedRef.current) return;
    resumeAppliedRef.current = true;
    if (initialPositionSeconds > 0 && initialPositionSeconds < video.duration - 1) {
      video.currentTime = initialPositionSeconds;
    }
    setProgressPercent(Math.min(100, Math.round((maxWatchedTime.current / video.duration) * 100)));
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (video.currentTime > maxWatchedTime.current) {
      maxWatchedTime.current = video.currentTime;
      setProgressPercent(Math.min(100, Math.round((maxWatchedTime.current / video.duration) * 100)));
    }
    // İlerlemeyi her saniyede bir değil, ~5 saniyede bir kalıcı hale getir —
    // IndexedDB'ye gereksiz sık yazmamak için.
    if (video.currentTime - lastProgressSaveAt.current >= 5) {
      lastProgressSaveAt.current = video.currentTime;
      saveProgress(video);
    }
  }

  function handleSeeking() {
    const video = videoRef.current;
    if (!video) return;
    // Küçük bir tolerans (0.5sn) — tarayıcının kendi buffer/seek davranışından
    // kaynaklanan yanlış pozitifleri önlemek için.
    if (video.currentTime > maxWatchedTime.current + 0.5) {
      video.currentTime = maxWatchedTime.current;
    }
  }

  function handlePause() {
    saveProgress(videoRef.current);
  }

  function handleEnded() {
    setFullyWatched(true);
    setProgressPercent(100);
    saveProgress(videoRef.current);
    onFullyWatched();
  }

  // Kullanıcı sekmeyi/pencereyi kapatmadan önce son ilerlemeyi kaydet.
  useEffect(() => {
    return () => saveProgress(videoRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="rounded-xl overflow-hidden mb-2" style={{ background: "#000" }}>
        {videoError ? (
          <div className="w-full flex flex-col items-center justify-center gap-1.5 py-10 px-4 text-center">
            <AlertTriangle style={{ fontSize: "24px", color: theme.warnText }} />
            <p className="text-xs font-semibold" style={{ color: "#fff" }}>Video yüklenemedi</p>
            <p className="text-[10.5px]" style={{ color: theme.textFaint }}>İnternet bağlantınızı kontrol edip sayfayı yenileyin.</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList="nodownload"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onSeeking={handleSeeking}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={() => setVideoError(true)}
            className="w-full"
            style={{ maxHeight: "360px" }}
          />
        )}
      </div>
      {!videoError && (
        <>
          <div className="flex items-center justify-between mb-1">
            <div className="h-1.5 rounded-full overflow-hidden flex-1 mr-2" style={{ background: theme.surfaceAlt }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, background: theme.accent }} />
            </div>
            <span className="text-[10.5px] font-semibold shrink-0" style={{ color: theme.textMuted }}>%{progressPercent}</span>
          </div>
          <p className="text-[10.5px]" style={{ color: theme.textFaint }}>
            {fullyWatched ? "Video tamamlandı — sınava geçebilirsiniz." : "İleri sarma kapalıdır; sınava geçmek için videonun tamamını izlemeniz gerekir."}
          </p>
        </>
      )}
    </div>
  );
}
