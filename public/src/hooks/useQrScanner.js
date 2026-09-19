import { useRef, useState } from "react";

/**
 * QR Kod → Periyodik Kontrol entegrasyonu kapsamında DocumentsPage.jsx'teki "Ekipman
 * Kayıtları" sekmesinden BİREBİR TAŞINDI (kopyalanıp iki yerde bakımı gerekmesin diye
 * yeniden kullanılabilir bir hook'a çıkarıldı) — davranış AYNI, yalnızca konumu değişti:
 * dinamik `jsqr` import'u, kamera erişimi, canvas üzerinde kare kare tarama döngüsü.
 *
 * @returns {{
 *   videoRef: React.RefObject, canvasRef: React.RefObject, scanResult: string|null,
 *   startScan: () => void, resetScan: () => void,
 * }}
 */
export function useQrScanner({ onError } = {}) {
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  // PERFORMANS: jsQR yalnızca kullanıcı taramayı başlattığında dinamik import ile
  // indiriliyor (bkz. DocumentsPage.jsx'teki orijinal not) — bu davranış korunuyor.
  const jsQRRef = useRef(null);

  function scanQRLoop() {
    if (canvasRef.current && videoRef.current && jsQRRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQRRef.current(imageData.data, canvas.width, canvas.height);
      if (code) {
        setScanResult(code.data);
        videoRef.current.srcObject?.getTracks().forEach((t) => t.stop());
      } else {
        requestAnimationFrame(scanQRLoop);
      }
    }
  }

  function startScan() {
    if (navigator.mediaDevices?.getUserMedia) {
      import("jsqr")
        .then(({ default: jsQR }) => {
          jsQRRef.current = jsQR;
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                  videoRef.current.play();
                  scanQRLoop();
                };
              }
            })
            .catch((err) => {
              console.error("Kamera erişimi alınamadı:", err);
              onError?.("Kameraya erişilemedi. Lütfen tarayıcı ayarlarından bu site için kamera iznini kontrol edin.");
            });
        })
        .catch((err) => {
          console.error("QR okuyucu yüklenemedi:", err);
          onError?.("QR okuyucu yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.");
        });
    } else {
      onError?.("Bu tarayıcı kamera erişimini desteklemiyor.");
    }
  }

  function resetScan() {
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    setScanResult(null);
  }

  return { videoRef, canvasRef, scanResult, startScan, resetScan };
}
