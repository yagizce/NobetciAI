import { useState, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import Modal from "./ui/Modal.jsx";
import Button from "./ui/Button.jsx";
import { parseCsv, rowsToObjects } from "../utils/importCsv.js";
import { downloadCsv } from "../utils/exportCsv.js";
import { Upload } from "./icons/index.jsx";

const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024; // 2MB — bu ölçekte bir firma için bol bol yeterli
const MAX_CSV_ROWS = 5000; // güvenlik sprinti: sınırsız satır arayüzü dondurabilir

/**
 * AI_ROADMAP.md → "Toplu veri içe aktarma" maddesinin karşılığı. Tekrar kullanılabilir:
 * her çağıran taraf kendi `mapRow`/`onConfirm`'unu verir (bkz. EmployeesSection.jsx,
 * DepartmentsSection.jsx, BranchesSection.jsx). Bilinçli akış: dosya seçilince HEMEN
 * kaydedilmez — önce bir önizleme modalı (kaç kayıt geçerli, kaç satır hangi hatayla
 * atlanacak) gösterilir, kullanıcı "Aktar"a basmadan hiçbir şey kaydedilmez. Aynı
 * "öner, kullanıcı onaylar" ilkesinin veri girişi versiyonu.
 *
 * @param {{
 *   label?: string,
 *   templateHeaders: string[],
 *   templateExampleRow?: string[],
 *   mapRow: (row: Record<string,string>, alreadyStaged?: object[], rowIndex?: number) => (object | { error: string }),
 *   onConfirm: (entities: object[]) => Promise<void>,
 * }} props
 */
export default function CsvImportButton({ label = "İçe Aktar (CSV)", templateHeaders, templateExampleRow, mapRow, onConfirm }) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null); // { valid: object[], errors: {line, error}[] } | null
  const [importing, setImporting] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosyanın tekrar seçilebilmesi için input'u sıfırla
    if (!file) return;

    if (file.size > MAX_CSV_SIZE_BYTES) {
      showToast(`Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimum ${MAX_CSV_SIZE_BYTES / 1024 / 1024}MB olmalı.`, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result || ""));
      if (rows.length > MAX_CSV_ROWS + 1) { // +1: başlık satırı
        showToast(`Dosya çok fazla satır içeriyor (${rows.length - 1}). Maksimum ${MAX_CSV_ROWS} satır desteklenir — dosyayı bölüp tekrar deneyin.`, "error");
        return;
      }
      const objects = rowsToObjects(rows);
      const valid = [];
      const errors = [];
      objects.forEach((obj, idx) => {
        // HARDENING: `valid` (bu dosyada şu ana kadar KABUL EDİLMİŞ satırlar) mapRow'a
        // ikinci parametre olarak veriliyor — mapRow (örn. DepartmentsSection.jsx →
        // mapDepartmentRow) bunu kullanarak AYNI CSV dosyası içinde tekrar eden bir kaydı
        // da yakalayabilir. Önceden yalnızca zaten KAYITLI (state'teki) verilerle
        // karşılaştırılıyordu — dosyanın kendi içindeki bir tekrar (örn. "Üretim" iki kez)
        // hiç yakalanmıyordu.
        // HARDENING: `idx` (bu dosyadaki satır sırası) de mapRow'a veriliyor — id
        // üretiminde `Date.now() + Math.random()*100000` yerine `Date.now() + idx`
        // kullanılabilsin diye (bkz. aşağıdaki not).
        const result = mapRow(obj, valid, idx);
        if (result && typeof result === "object" && "error" in result) {
          errors.push({ line: idx + 2, error: result.error }); // +2: 1=başlık satırı, veri 2'den başlar
        } else if (result) {
          valid.push(result);
        }
      });
      setPreview({ valid, errors });
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleConfirm() {
    if (!preview || preview.valid.length === 0) return;
    setImporting(true);
    try {
      await onConfirm(preview.valid);
      setPreview(null);
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    downloadCsv("sablon.csv", templateHeaders, templateExampleRow ? [templateExampleRow] : []);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}
        >
          <Upload style={{ fontSize: "13px" }} /> {label}
        </button>
        <button onClick={downloadTemplate} className="text-[11px] font-semibold underline" style={{ color: theme.textMuted }}>
          Şablon indir
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: "none" }} />

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title="İçe Aktarma Önizlemesi">
        {preview && (
          <>
            <p className="text-sm mb-3" style={{ color: theme.textPrimary }}>
              <strong>{preview.valid.length}</strong> kayıt eklenmeye hazır
              {preview.errors.length > 0 && <> — <strong>{preview.errors.length}</strong> satır atlanacak</>}.
            </p>

            {preview.errors.length > 0 && (
              <div className="rounded-lg px-3 py-2 mb-3 text-xs max-h-32 overflow-y-auto" style={{ background: theme.warnBg, color: theme.warnText }}>
                {preview.errors.map((e, i) => <p key={i}>Satır {e.line}: {e.error}</p>)}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPreview(null)} className="flex-1">Vazgeç</Button>
              <Button onClick={handleConfirm} disabled={preview.valid.length === 0 || importing} className="flex-1">
                {importing ? "Aktarılıyor..." : `${preview.valid.length} Kaydı Aktar`}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
