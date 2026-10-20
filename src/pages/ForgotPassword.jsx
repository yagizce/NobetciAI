import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { HardHat, Mail } from "../components/icons/index.jsx";

// Demo formu; e-posta gönderimi henüz bağlı değil.
export default function ForgotPassword() {
  useDocumentTitle("Şifremi Unuttum");
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    // 🔧 Backend geçiş noktası: burada gerçek bir Supabase Auth çağrısı olacak:
    //   await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: ... })
    // Bugün backend olmadığı için hiçbir e-posta GÖNDERİLMİYOR — yalnızca UI akışı
    // gösteriliyor. Gerçek çağrı eklendiğinde hata durumunu da ele almak gerekecek
    // (bkz. ToastContext kullanım deseni, örn. BackupSection.jsx).
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.pageBg }}>
      <div className="w-full max-w-sm rounded-2xl border p-6" style={{ borderColor: theme.border, background: theme.surface }}>
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: theme.accent }}>
            <HardHat style={{ fontSize: "22px", color: theme.onAccent }} sw={2.5} />
          </div>
          <p className="font-[Oswald] text-lg uppercase tracking-wide" style={{ color: theme.textPrimary }}>Şifremi Unuttum</p>
        </div>

        {submitted ? (
          <div className="text-center py-2">
            <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: theme.surfaceAlt }}>
              <Mail style={{ fontSize: "20px", color: theme.accent }} />
            </div>
            <p className="text-sm mb-1" style={{ color: theme.textPrimary }}>
              Şifre sıfırlama henüz aktif değil.
            </p>
            <p className="text-[11px]" style={{ color: theme.textFaint }}>
              <strong>{email}</strong> adresine e-posta gönderilmedi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-xs mb-3" style={{ color: theme.textFaint }}>
              Şifre sıfırlama için e-posta adresinizi girin.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              required
              maxLength={200}
              className="w-full text-sm rounded-lg px-3 py-2.5 mb-4 outline-none border"
              style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
            />
            <button
              type="submit"
              disabled={!email.trim()}
              className="block w-full text-center text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40"
              style={{ background: theme.accent, color: theme.onAccent }}
            >
              Sıfırlama Bağlantısı Gönder
            </button>
          </form>
        )}

        <p className="text-[11px] text-center mt-4" style={{ color: theme.textFaint }}>
          <Link to="/login" style={{ color: theme.accent }}>Girişe geri dön</Link>
        </p>
        <p className="text-[10.5px] text-center mt-3" style={{ color: theme.textFaint }}>
          Demo ekranı. E-posta gönderimi henüz aktif değil.
        </p>
      </div>
    </div>
  );
}
