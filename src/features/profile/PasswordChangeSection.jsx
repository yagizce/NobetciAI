import { useState } from "react";
import { useToast } from "../../contexts/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";

/**
 * Şu an yalnızca arayüz — gerçek şifre değiştirme, kimlik doğrulama backend'i
 * eklenince `authService.js`'e bir `updatePassword()` fonksiyonu eklenip buraya
 * bağlanacak (bkz. CHANGELOG).
 * @param {{ theme: object }} props
 */
export default function PasswordChangeSection({ theme }) {
  const { showToast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleSubmit() {
    if (!current || !next || !confirm) {
      showToast("Tüm alanları doldurun.", "error");
      return;
    }
    if (next !== confirm) {
      showToast("Yeni şifreler eşleşmiyor.", "error");
      return;
    }
    showToast("Şifre değiştirme henüz aktif değil (arayüz hazır, backend bağlanınca çalışacak).", "neutral");
    setCurrent(""); setNext(""); setConfirm("");
  }

  const inputStyle = { background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary };

  return (
    <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surface }}>
      <p className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>Şifre Değiştir</p>
      <div className="flex flex-col gap-2 mb-3">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Mevcut şifre"
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={inputStyle} />
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Yeni şifre"
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={inputStyle} />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Yeni şifre (tekrar)"
          className="text-sm rounded-lg px-3 py-2 outline-none border" style={inputStyle} />
      </div>
      <Button size="sm" onClick={handleSubmit}>Şifreyi Güncelle</Button>
      <p className="text-[10.5px] mt-2" style={{ color: theme.textFaint }}>Bu alan şu an yalnızca arayüz — gerçek kimlik doğrulama eklenince aktif olacak.</p>
    </div>
  );
}
