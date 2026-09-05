import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import { getRoleLabel } from "../../constants/allRoles.js";
import { getDocuments, saveDocument, deleteDocument, generateDocumentDraft } from "../../services/documentService.js";
import { DOCUMENT_TYPES, getDocumentTypeLabel } from "../../constants/documentTypes.js";
import { MOCK_USERS } from "../../constants/mockUsers.js";
import { todayLabel } from "../../utils/dateUtils.js";
import { logActivity } from "../../services/auditService.js";
import { createId } from "../../utils/id.js";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Loading from "../../components/Loading.jsx";
import ErrorState from "../../components/ErrorState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import DocumentDetailDrawer from "./DocumentDetailDrawer.jsx";
import { Plus, FileText, Trash2 } from "../../components/icons/index.jsx";

export default function DocumentGenerator() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { role } = useRole();
  const [documents, setDocuments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState(DOCUMENT_TYPES[0].value);
  const [title, setTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => {
    getDocuments()
      .then((docs) => { setDocuments(docs); setLoaded(true); })
      .catch((err) => {
        // BUG FIX (Sprint 8 polish): .catch() yoktu — hata durumunda `loaded` hiç
        // true olmuyor, sayfa SONSUZA KADAR yükleniyor görünüyordu.
        console.error("Belgeler yüklenemedi:", err);
        setLoadError(err);
        setLoaded(true);
      });
  }, []);

  async function createDocument() {
    if (!title.trim()) return;
    setGenerating(true);
    const typeLabel = getDocumentTypeLabel(type);
    const aiContent = await generateDocumentDraft({ typeLabel, title: title.trim() });
    const doc = {
      id: createId(),
      type,
      title: title.trim(),
      createdBy: MOCK_USERS[role]?.name || MOCK_USERS.employee?.name || "Bilinmeyen Kullanıcı", // BUG FIX (demo veri temizliği): önceden literal "Ahmet Yıldız" — bkz. RiskAnalysisPage.jsx'teki aynı düzeltme notu. Burada ayrıca AKTİF ROLE göre doğru kullanıcı adı kullanılıyor (belgeyi kim oluşturduysa).
      createdAt: todayLabel(),
      status: "draft",
      content: aiContent, // AI taslağı (boşsa üretim başarısız olmuştur, kullanıcı elle yazabilir)
    };
    // UX FIX (hata yönetimi cilası): `saveDocument` hiç try/catch içinde değildi — IndexedDB
    // yazması başarısız olursa (örn. depolama kotası dolu) hata yakalanmadan fırlıyordu ve
    // `generating` hiçbir zaman `false` olmuyordu (buton sonsuza kadar "Oluşturuluyor..."
    // görünüyordu). Diğer tüm modüllerdeki (Fine-Kinney, Çalışanlar, Periyodik Kontroller vb.)
    // save/delete deseniyle tutarlı hale getirildi.
    try {
      await saveDocument(doc);
      setDocuments((prev) => [doc, ...prev]);
      setTitle("");
      setFormOpen(false);
      showToast(aiContent ? "AI taslağı oluşturuldu, gözden geçirip düzenleyebilirsin." : "Belge oluşturuldu (AI taslağı üretilemedi, elle yazabilirsin).", aiContent ? "success" : "neutral");
      logActivity({ actor: getRoleLabel(role), action: "Belge oluşturuldu", details: `${doc.title} (${getDocumentTypeLabel(doc.type)})`, entityType: "document" });
      setSelectedDocId(doc.id);
    } catch (err) {
      console.error("Belge kaydedilemedi:", err);
      showToast("Belge kaydedilemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function updateDocumentContent(id, content) {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    const updated = { ...doc, content };
    try {
      await saveDocument(updated);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      // UX FIX (doküman cilası): önceden içerik kaydedildiğinde HİÇBİR görünür geri
      // bildirim yoktu — yalnızca "Kaydet" butonu kayboluyordu (isDirty=false), ki bu
      // kolayca fark edilmeyebilir. Uygulamadaki diğer TÜM belge işlemleriyle (oluşturma,
      // tamamlama, silme) tutarlı olacak şekilde bir başarı toast'ı eklendi.
      showToast("Belge içeriği kaydedildi.", "success");
    } catch (err) {
      console.error("Belge güncellenemedi:", err);
      showToast("Belge güncellenemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }

  async function markDocumentCompleted(id) {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    const updated = { ...doc, status: "completed" };
    try {
      await saveDocument(updated);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      showToast("Belge tamamlandı olarak işaretlendi.", "success");
      logActivity({ actor: getRoleLabel(role), action: "Belge tamamlandı", details: doc.title, entityType: "document" });
    } catch (err) {
      console.error("Belge tamamlandı olarak işaretlenemedi:", err);
      showToast("Belge güncellenemedi. Yerel depolama alanını kontrol edip tekrar deneyin.", "error");
    }
  }

  async function confirmDelete() {
    const doc = documents.find((d) => d.id === confirmDeleteId);
    try {
      await deleteDocument(confirmDeleteId);
      setDocuments((prev) => prev.filter((d) => d.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      showToast("Belge silindi.", "neutral");
      logActivity({ actor: getRoleLabel(role), action: "Belge silindi", details: doc?.title || `#${confirmDeleteId}`, entityType: "document" });
    } catch (err) {
      console.error("Belge silinemedi:", err);
      showToast("Belge silinemedi, lütfen tekrar deneyin.", "error");
    }
  }

  if (!loaded) return <Loading label="Belgeler yükleniyor..." />;
  if (loadError) return <ErrorState title="Belgeler yüklenemedi" description="Tarayıcı depolama alanına erişilemedi. Sayfayı yenileyip tekrar deneyin." onRetry={() => window.location.reload()} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: theme.textFaint }}>
          Belge türü ve başlık seçin — AI düzenlemeye hazır bir ilk taslak oluşturur.
        </p>
        <Button size="sm" onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1.5 shrink-0">
          <Plus style={{ fontSize: "13px" }} sw={2.5} /> Yeni Belge
        </Button>
      </div>

      {formOpen && (
        <div className="rounded-xl border px-3.5 py-3 mb-4 max-w-md" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
          <label className="block mb-2">
            <span className="block text-[10.5px] mb-1" style={{ color: theme.textFaint }}>Belge Türü</span>
            <select value={type} onChange={(e) => setType(e.target.value)} disabled={generating}
              className="w-full text-sm rounded-lg px-3 py-2 outline-none border disabled:opacity-60" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
              {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={generating} placeholder="Belge başlığı (örn. Depo B Risk Analizi)"
            className="w-full text-sm rounded-lg px-3 py-2 mb-3 outline-none border disabled:opacity-60" style={{ background: theme.surface, borderColor: theme.border, color: theme.textPrimary }} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={generating} className="flex-1">Vazgeç</Button>
            <Button onClick={createDocument} disabled={!title.trim() || generating} className="flex-1">
              {generating ? "AI taslak oluşturuyor..." : "Oluştur"}
            </Button>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Henüz belge yok" description="Yukarıdan yeni bir belge taslağı oluşturabilirsin." />
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {documents.map((d) => (
            <div key={d.id} onClick={() => setSelectedDocId(d.id)} role="button" tabIndex={0} className="rounded-lg border px-3.5 py-3 text-left cursor-pointer" style={{ borderColor: theme.border, background: theme.surface }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold min-w-0 break-words" style={{ color: theme.textPrimary }}>{d.title}</p>
                <span className="shrink-0">
                  <Badge tone={d.status === "completed" ? "success" : "pending"}>{d.status === "completed" ? "Tamamlandı" : "Taslak"}</Badge>
                </span>
              </div>
              <p className="text-xs mb-1.5" style={{ color: theme.textMuted }}>{getDocumentTypeLabel(d.type)}</p>
              <p className="text-[11px]" style={{ color: theme.textFaint }}>{d.createdBy} • {d.createdAt}</p>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(d.id); }} className="text-[11px] font-semibold flex items-center gap-0.5 mt-2" style={{ color: theme.emergencyText }}>
                <Trash2 style={{ fontSize: "11px" }} /> Sil
              </button>
            </div>
          ))}
        </div>
      )}

      <DocumentDetailDrawer
        theme={theme}
        document={documents.find((d) => d.id === selectedDocId) || null}
        onClose={() => setSelectedDocId(null)}
        onSaveContent={updateDocumentContent}
        onMarkCompleted={markDocumentCompleted}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Belgeyi sil"
        message="Bu belgeyi silmek istediğine emin misin?"
        confirmLabel="Sil"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
