import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { HardHat } from "../components/icons/index.jsx";

// Demo formu; gerçek kimlik doğrulama henüz bağlı değil.
export default function Login() {
  useDocumentTitle("Giriş Yap");
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    // 🔧 Backend geçiş noktası: burada gerçek bir Supabase Auth çağrısı olacak
    // (bkz. ForgotPassword.jsx'teki aynı desendeki yorum). Bugün backend olmadığı
    // için doğrudan dashboard'a yönlendiriliyor — hiçbir kimlik doğrulama yapılmıyor.
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen frame-fill flex items-center justify-center px-4" style={{ background: theme.pageBg }}>
      <div className="w-full max-w-sm rounded-2xl border p-6" style={{ borderColor: theme.border, background: theme.surface }}>
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: theme.accent }}>
            <HardHat style={{ fontSize: "22px", color: theme.onAccent }} sw={2.5} />
          </div>
          <p className="font-[Oswald] text-lg uppercase tracking-wide" style={{ color: theme.textPrimary }}>Nöbetçi</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            required
            maxLength={200}
            className="w-full text-sm rounded-lg px-3 py-2.5 mb-3 outline-none border"
            style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            required
            maxLength={200}
            className="w-full text-sm rounded-lg px-3 py-2.5 mb-2 outline-none border"
            style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
          />
          <p className="text-[11px] text-right mb-4">
            <Link to="/forgot-password" style={{ color: theme.accent }}>Şifremi unuttum</Link>
          </p>
          <button
            type="submit"
            disabled={!email.trim() || !password}
            className="block w-full text-center text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40"
            style={{ background: theme.accent, color: theme.onAccent }}
          >
            Giriş Yap
          </button>
        </form>
        <p className="text-[11px] text-center mt-3" style={{ color: theme.textFaint }}>
          Hesabın yok mu? <Link to="/register" style={{ color: theme.accent }}>Kayıt ol</Link>
        </p>
        <p className="text-[10.5px] text-center mt-3" style={{ color: theme.textFaint }}>
          Demo ekranı. Gerçek hesap girişi henüz aktif değil.
        </p>
      </div>
    </div>
  );
}
