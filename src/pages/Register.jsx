import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { HardHat } from "../components/icons/index.jsx";

// FIX (Sprint 8 polish): Login.jsx ile AYNI düzeltme — bkz. o dosyadaki not.
export default function Register() {
  useDocumentTitle("Kayıt Ol");
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return;
    // 🔧 Backend geçiş noktası: bkz. Login.jsx/ForgotPassword.jsx'teki aynı desendeki
    // yorum — gerçek bir Supabase Auth kayıt çağrısı burada olacak.
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen frame-fill flex items-center justify-center px-4" style={{ background: theme.pageBg }}>
      <div className="w-full max-w-sm rounded-2xl border p-6" style={{ borderColor: theme.border, background: theme.surface }}>
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: theme.accent }}>
            <HardHat style={{ fontSize: "22px", color: theme.onAccent }} sw={2.5} />
          </div>
          <p className="font-[Oswald] text-lg uppercase tracking-wide" style={{ color: theme.textPrimary }}>Hesap Oluştur</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ad Soyad"
            required
            maxLength={200}
            className="w-full text-sm rounded-lg px-3 py-2.5 mb-3 outline-none border"
            style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
          />
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
            className="w-full text-sm rounded-lg px-3 py-2.5 mb-4 outline-none border"
            style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
          />
          <button
            type="submit"
            disabled={!fullName.trim() || !email.trim() || !password}
            className="block w-full text-center text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40"
            style={{ background: theme.accent, color: theme.onAccent }}
          >
            Kayıt Ol
          </button>
        </form>
        <p className="text-[11px] text-center mt-3" style={{ color: theme.textFaint }}>
          Zaten hesabın var mı? <Link to="/login" style={{ color: theme.accent }}>Giriş yap</Link>
        </p>
        <p className="text-[10.5px] text-center mt-3" style={{ color: theme.textFaint }}>
          Not: bu ekran şu an bir arayüz taslağıdır; gerçek kimlik doğrulama backend'i henüz bağlı değil.
        </p>
      </div>
    </div>
  );
}
