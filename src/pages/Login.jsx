import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { HardHat } from "../components/icons/index.jsx";

export default function Login() {
  useDocumentTitle("Giriş Yap");
  const { theme } = useTheme();
  return (
    <div className="min-h-screen frame-fill flex items-center justify-center px-4" style={{ background: theme.pageBg }}>
      <div className="w-full max-w-sm rounded-2xl border p-6" style={{ borderColor: theme.border, background: theme.surface }}>
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: theme.accent }}>
            <HardHat style={{ fontSize: "22px", color: theme.onAccent }} sw={2.5} />
          </div>
          <p className="font-[Oswald] text-lg uppercase tracking-wide" style={{ color: theme.textPrimary }}>Nöbetçi</p>
        </div>
        <input type="email" placeholder="E-posta" className="w-full text-sm rounded-lg px-3 py-2.5 mb-3 outline-none border" style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }} />
        <input type="password" placeholder="Şifre" className="w-full text-sm rounded-lg px-3 py-2.5 mb-2 outline-none border" style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }} />
        <p className="text-[11px] text-right mb-4">
          <Link to="/forgot-password" style={{ color: theme.accent }}>Şifremi unuttum</Link>
        </p>
        <Link to="/dashboard" className="block w-full text-center text-sm font-semibold py-2.5 rounded-lg" style={{ background: theme.accent, color: theme.onAccent }}>
          Giriş Yap
        </Link>
        <p className="text-[11px] text-center mt-3" style={{ color: theme.textFaint }}>
          Hesabın yok mu? <Link to="/register" style={{ color: theme.accent }}>Kayıt ol</Link>
        </p>
        <p className="text-[10.5px] text-center mt-3" style={{ color: theme.textFaint }}>
          Not: bu ekran şu an bir arayüz taslağıdır; gerçek kimlik doğrulama backend'i henüz bağlı değil.
        </p>
      </div>
    </div>
  );
}
