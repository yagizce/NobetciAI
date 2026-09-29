import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { Sparkles } from "../../components/icons/index.jsx";
import { resetAndSeedDemoData } from "../../services/demoSeedService.js";

/**
 * Sprint 11 — Demo Data & Realistic Product Experience. `resetAndSeedDemoData()`
 * YIKICI olduğu için (tüm firmalar dahil TÜM yerel veriyi siler) burada
 * `ConfirmDialog` ile aynı BackupSection.jsx'teki "yedekten geri yükle" onay
 * deseni birebir kullanılıyor — yeni bir onay mekanizması icat edilmedi.
 */
export default function DemoDataSection() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirmReset() {
    setConfirmOpen(false);
    setBusy(true);
    try {
      await resetAndSeedDemoData();
      // BackupSection.jsx'teki geri yükleme sonrası ile AYNI gerekçe: tüm veri
      // taban tabana değişti, her React context'inin (aktif firma, rol, vb.)
      // temiz baştan okuması gerekiyor — tam sayfa yenileme en güvenilir yol.
      window.location.reload();
    } catch (err) {
      console.error("Örnek veriler sıfırlanamadı:", err);
      showToast("Örnek veriler sıfırlanamadı. Tarayıcı depolama alanını kontrol edip tekrar deneyin.", "error");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
      <p className="text-sm font-semibold mb-1 flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
        <Sparkles style={{ fontSize: "14px" }} /> Örnek Veri
      </p>
      <p className="text-xs mb-3" style={{ color: theme.textFaint }}>
        Tüm mevcut veriyi (firma, çalışanlar, riskler, belgeler — her şey) silip yerine gerçekçi bir örnek firma yükler. Ürünü göstermek veya sıfırdan denemek için kullanılabilir.
      </p>
      <Button size="sm" variant="secondary" onClick={() => setConfirmOpen(true)} disabled={busy} className="flex items-center gap-1.5">
        <Sparkles style={{ fontSize: "13px" }} /> {busy ? "Sıfırlanıyor..." : "Sıfırla ve Örnek Verilerle Doldur"}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Tüm veriyi sıfırla"
        message="Bu işlem, bu cihazdaki TÜM mevcut veriyi (firma, çalışanlar, riskler, belgeler, her şey) SİLECEK ve yerine örnek bir demo firma yükleyecek. Bu geri alınamaz. Devam etmek istediğinize emin misiniz?"
        confirmLabel="Evet, Sıfırla"
        danger
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
