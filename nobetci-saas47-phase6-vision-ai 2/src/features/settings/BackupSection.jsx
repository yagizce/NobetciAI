import { useState, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { buildFullBackup, validateBackup, restoreFullBackup, downloadBackupFile } from "../../services/backupService.js";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { Download, Upload, AlertTriangle } from "../../components/icons/index.jsx";

/**
 * Tam Yedek Al / Geri Yükle — bu uygulama tek bir cihazda (telefonda) çalışıyor, backend
 * senkronizasyonu yok; telefon kaybolur/arızalanırsa bu özellik olmadan HİÇBİR veri
 * kurtarma yolu yoktu. `backupService.js`'in üzerine kurulu, tüm mantık orada — bu bileşen
 * yalnızca dosya seçimi/onay akışını yönetir.
 */
const MAX_BACKUP_SIZE_BYTES = 25 * 1024 * 1024; // 25MB — tam veri + gömülü görseller (logo vb.) içerebileceği için CSV'den daha yüksek
const STALE_BACKUP_DAYS = 30;

// HARDENING (acil öncelik takibi): önceden "en son ne zaman yedek alındı" bilgisi
// HİÇBİR YERDE tutulmuyordu — bir kullanıcı aylarca yedek almadan devam edebilir ve
// bunu asla fark etmezdi (tam da bu özelliğin var olma amacı olan senaryo: telefon
// kaybolur, yedek yoktur). localStorage BİLEREK seçildi (IndexedDB DEĞİL) — bu salt
// "bu cihazda en son ne zaman tıklandı" bilgisi, taşınabilir/yedeklenmesi gereken
// domain verisi değil; üstelik IndexedDB'de tutulsaydı ESKİ bir yedek geri
// yüklendiğinde bu tarih de YANLIŞ ŞEKİLDE eski bir değere dönerdi.
function useLastBackupInfo() {
  const [lastBackupAt, setLastBackupAt] = useLocalStorage("nobetci:lastBackupAt", null);
  const daysSince = lastBackupAt ? Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
  return { lastBackupAt, setLastBackupAt, daysSince, isStale: daysSince === null || daysSince >= STALE_BACKUP_DAYS };
}

export default function BackupSection() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [pendingRestore, setPendingRestore] = useState(null); // doğrulanmış, onay bekleyen yedek
  const [busy, setBusy] = useState(false);
  const { lastBackupAt, setLastBackupAt, daysSince, isStale } = useLastBackupInfo();

  async function handleDownload() {
    setBusy(true);
    try {
      const backup = await buildFullBackup();
      downloadBackupFile(backup);
      setLastBackupAt(new Date().toISOString());
      showToast("Yedek indirildi.", "success");
    } catch (err) {
      console.error("Yedek indirilemedi:", err);
      showToast("Yedek oluşturulamadı. Yerel verileri kontrol edip tekrar deneyin.", "error");
    } finally {
      setBusy(false);
    }
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosyanın tekrar seçilebilmesi için
    if (!file) return;

    if (file.size > MAX_BACKUP_SIZE_BYTES) {
      showToast(`Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimum ${MAX_BACKUP_SIZE_BYTES / 1024 / 1024}MB olmalı.`, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        showToast("Dosya okunamadı — geçerli bir JSON yedek dosyası değil.", "error");
        return;
      }
      const check = validateBackup(parsed);
      if (!check.valid) {
        showToast(check.error, "error");
        return;
      }
      setPendingRestore(parsed);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleConfirmRestore() {
    setBusy(true);
    try {
      await restoreFullBackup(pendingRestore);
      setPendingRestore(null);
      showToast("Geri yükleme tamamlandı. Değişikliklerin her yerde görünmesi için sayfa yenilenecek.", "success");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      // Atomic transaction başarısız olduysa IndexedDB değişiklikleri geri alır;
      // kullanıcıya bunun açıkça belirtilmesi, veri kaybısı endişesini azaltır.
      console.error("Yedek geri yükleme hatası:", err);
      showToast(err?.message || "Geri yükleme başarısız oldu; mevcut veriler korunmuştur.", "error");
      setPendingRestore(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
      <p className="text-sm font-semibold mb-1" style={{ color: theme.textPrimary }}>Yedekleme</p>
      <p className="text-[11px] mb-3" style={{ color: theme.textFaint }}>
        Bu uygulama yalnızca bu cihazda veri tutar — telefon kaybolur veya arızalanırsa
        buradan indirdiğiniz bir yedek olmadan veriler kurtarılamaz. Düzenli olarak
        yedek almanız önerilir.
      </p>

      {lastBackupAt ? (
        <p className="text-[11px] mb-3" style={{ color: isStale ? theme.warnText : theme.textMuted }}>
          {isStale && <AlertTriangle style={{ fontSize: "11px", display: "inline", marginRight: "4px", verticalAlign: "-1px" }} />}
          Son yedek: {new Date(lastBackupAt).toLocaleString("tr-TR")} ({daysSince === 0 ? "bugün" : `${daysSince} gün önce`})
          {isStale && " — yeni bir yedek almanız önerilir."}
        </p>
      ) : (
        <p className="text-[11px] mb-3 flex items-center gap-1" style={{ color: theme.warnText }}>
          <AlertTriangle style={{ fontSize: "11px" }} /> Bu cihazda henüz hiç yedek alınmamış.
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={handleDownload} disabled={busy} className="flex items-center gap-1.5">
          <Download style={{ fontSize: "13px" }} /> Tam Yedek İndir
        </Button>
        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy} className="flex items-center gap-1.5">
          <Upload style={{ fontSize: "13px" }} /> Yedekten Geri Yükle
        </Button>
      </div>
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileSelected} style={{ display: "none" }} />

      <ConfirmDialog
        open={Boolean(pendingRestore)}
        title="Yedekten geri yükle"
        message={`Bu işlem, bu cihazdaki TÜM mevcut veriyi (Fine-Kinney, çalışanlar, dokümanlar, her şey) yedek dosyasındaki veriyle DEĞİŞTİRECEK. Bu geri alınamaz. Devam etmek istediğinize emin misiniz?${pendingRestore ? `\n\nYedek tarihi: ${new Date(pendingRestore.exportedAt).toLocaleString("tr-TR")}` : ""}`}
        confirmLabel="Evet, Geri Yükle"
        danger
        onConfirm={handleConfirmRestore}
        onCancel={() => setPendingRestore(null)}
      />
    </div>
  );
}
