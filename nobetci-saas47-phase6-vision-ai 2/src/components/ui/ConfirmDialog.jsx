import { useState, useCallback } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

/**
 * HARDENING: `onConfirm` genelde async bir silme/geri-yükleme işlemidir (bu bileşen
 * app genelinde 7 yerde kullanılıyor — Fine-Kinney/Departman/Çalışan/Şube silme, yedek
 * geri yükleme, belge silme, periyodik kontrol silme). Önceden onay butonu işlem
 * sürerken devre dışı bırakılmıyordu: hızlı çift tıklama (veya bir dev-tools kancası)
 * `onConfirm`'i art arda iki kez tetikleyip aynı silme/geri-yükleme işlemini iki kez
 * çalıştırabiliyordu. Düzeltme TEK bu dosyada yapıldı — 7 çağıran dosyanın hiçbirinin
 * değişmesi gerekmedi, hepsi otomatik korunuyor.
 *
 * @param {{ open: boolean, title?: string, message: string, confirmLabel?: string, cancelLabel?: string, onConfirm: () => void, onCancel: () => void, danger?: boolean }} props
 */
export default function ConfirmDialog({ open, title = "Emin misiniz?", message, confirmLabel = "Onayla", cancelLabel = "Vazgeç", onConfirm, onCancel, danger = false }) {
  const { theme } = useTheme();
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (confirming) return; // zaten devam eden bir onay varsa yenisini yok say
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      // Bileşen `open=false` olsa bile Modal.jsx içinde DEĞİL, ConfirmDialog'un kendisinde
      // kalmaya devam eder (yalnızca <Modal> içeriği null döner) — bu yüzden state'i
      // sıfırlamak güvenli ve bir sonraki açılışta "confirming" takılı kalmaz.
      setConfirming(false);
    }
  }, [confirming, onConfirm]);

  return (
    <Modal open={open} onClose={confirming ? () => {} : onCancel} title={title}>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>{message}</p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={confirming} className="flex-1">{cancelLabel}</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={handleConfirm} disabled={confirming} className="flex-1">
          {confirming ? "..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
