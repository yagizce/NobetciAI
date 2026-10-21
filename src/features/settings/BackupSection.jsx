import { useState, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { buildFullBackup, validateBackup, restoreFullBackup, downloadBackupFile, estimateBackupSizeBytes, getMissingBackupStoreCount } from "../../services/backupService.js";
import { LAST_BACKUP_STORAGE_KEY, isBackupStale, daysSinceLastBackup } from "../../constants/backup.js";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Download, Upload, AlertTriangle } from "../../components/icons/index.jsx";

/**
 * Yerel verinin yedek indirme, dosya seçme ve geri yükleme onay akışı.
 */
const MAX_BACKUP_SIZE_BYTES = 25 * 1024 * 1024; // 25MB — hem geri yükleme (yüklenen dosya) hem de indirme (bkz. handleDownload) tarafında AYNI sınır uygulanır.

function formatMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

// Son indirme tarihi yalnızca bu cihaza aittir; eski yedekle geri alınmamalıdır.
function useLastBackupInfo() {
  const [lastBackupAt, setLastBackupAt] = useLocalStorage(LAST_BACKUP_STORAGE_KEY, null);
  const daysSince = daysSinceLastBackup(lastBackupAt);
  return { lastBackupAt, setLastBackupAt, daysSince, isStale: isBackupStale(lastBackupAt) };
}

export default function BackupSection() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [pendingRestore, setPendingRestore] = useState(null); // doğrulanmış, onay bekleyen yedek
  const [oversizedBackup, setOversizedBackup] = useState(null); // { backup, sizeBytes } — bkz. handleDownload
  const [busy, setBusy] = useState(false);
  const { lastBackupAt, setLastBackupAt, daysSince, isStale } = useLastBackupInfo();

  // Büyük yedekte fotoğrafsız indirme seçeneği sunulur; diğer kayıtlar korunur.
  async function handleDownload() {
    setBusy(true);
    try {
      const backup = await buildFullBackup();
      const sizeBytes = estimateBackupSizeBytes(backup);
      if (sizeBytes > MAX_BACKUP_SIZE_BYTES) {
        setOversizedBackup({ backup, sizeBytes });
        return;
      }
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

  async function handleDownloadWithoutPhotos() {
    setBusy(true);
    try {
      const backup = await buildFullBackup({ includePhotos: false });
      downloadBackupFile(backup, { labelSuffix: "fotografsiz" });
      setLastBackupAt(new Date().toISOString());
      setOversizedBackup(null);
      showToast("Fotoğraflar hariç tutularak yedek indirildi (tüm risk/eğitim/kontrol verisi dahil).", "success");
    } catch (err) {
      console.error("Yedek indirilemedi:", err);
      showToast("Yedek oluşturulamadı. Yerel verileri kontrol edip tekrar deneyin.", "error");
    } finally {
      setBusy(false);
    }
  }

  function handleDownloadAnyway() {
    if (!oversizedBackup) return;
    downloadBackupFile(oversizedBackup.backup);
    setLastBackupAt(new Date().toISOString());
    setOversizedBackup(null);
    showToast("Yedek indirildi — ancak bu dosya bu cihazın geri yükleme sınırının üzerinde, ileride bu cihazda geri yüklenemeyebilir.", "error");
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
    reader.onerror = () => showToast("Yedek dosyası okunamadı. Lütfen dosyayı yeniden seçin.", "error");
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

  const missingStoreCount = pendingRestore ? getMissingBackupStoreCount(pendingRestore) : 0;
  const restoreWarning = missingStoreCount > 0
    ? ` Yedek, uygulamanın ${missingStoreCount} veri bölümünü içermiyor; o bölümlerdeki mevcut kayıtlar silinecek.`
    : "";
  const backupDate = pendingRestore?.exportedAt
    ? ` Yedek tarihi: ${new Date(pendingRestore.exportedAt).toLocaleString("tr-TR")}`
    : "";

  return (
    <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
      <p className="text-sm font-semibold mb-1" style={{ color: theme.textPrimary }}>Yedekleme</p>
      <p className="text-[11px] mb-3" style={{ color: theme.textFaint }}>
        Tüm firmaların kayıtları bu cihazda tutulur. Cihaz kaybına karşı düzenli yedek indirin.
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
          <Download style={{ fontSize: "13px" }} /> Tüm Firmaları Yedekle
        </Button>
        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy} className="flex items-center gap-1.5">
          <Upload style={{ fontSize: "13px" }} /> Yedekten Geri Yükle
        </Button>
      </div>
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileSelected} style={{ display: "none" }} />

      <ConfirmDialog
        open={Boolean(pendingRestore)}
        title="Yedekten geri yükle"
        message={`Bu işlem, bu cihazdaki TÜM mevcut veriyi (Fine-Kinney, çalışanlar, dokümanlar, her şey) yedek dosyasındaki veriyle DEĞİŞTİRECEK. Bu geri alınamaz. Devam etmek istediğinize emin misiniz?${restoreWarning}${backupDate}`}
        confirmLabel="Evet, Geri Yükle"
        danger
        onConfirm={handleConfirmRestore}
        onCancel={() => setPendingRestore(null)}
      />

      {/* Yedek MAX_BACKUP_SIZE_BYTES sınırını aştığında (bkz. handleDownload) — kullanıcı
          asla sessizce "geri yüklenemeyecek bir yedek" ile baş başa bırakılmaz, üç net
          seçenek sunulur. */}
      <Modal open={Boolean(oversizedBackup)} onClose={() => setOversizedBackup(null)} title="Yedek çok büyük">
        <p className="text-sm mb-3" style={{ color: theme.textMuted }}>
          Yedeğiniz {oversizedBackup && formatMB(oversizedBackup.sizeBytes)}MB — bu cihazın geri
          yükleme sınırı {formatMB(MAX_BACKUP_SIZE_BYTES)}MB. Büyüklüğün nedeni muhtemelen
          Vision AI ile analiz edilen fotoğraflar. Fotoğraflar hariç indirirseniz tüm
          risk/eğitim/kontrol verisi yine de eksiksiz yedeklenir, yalnızca fotoğraflar
          dışarıda kalır.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownloadWithoutPhotos} disabled={busy}>Fotoğrafsız İndir (önerilir)</Button>
          <Button variant="secondary" onClick={handleDownloadAnyway} disabled={busy}>Yine de Tam İndir (fotoğraflı)</Button>
          <Button variant="secondary" onClick={() => setOversizedBackup(null)} disabled={busy}>Vazgeç</Button>
        </div>
      </Modal>
    </div>
  );
}
