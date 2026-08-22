import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout.jsx";
import Loading from "./components/Loading.jsx";

// Route-based code splitting — each page is its own chunk, only downloaded when visited.
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Chat = lazy(() => import("./pages/Chat.jsx"));
const RiskAnalysis = lazy(() => import("./pages/RiskAnalysis.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const Legislation = lazy(() => import("./pages/Legislation.jsx"));
const KnowledgeCenter = lazy(() => import("./pages/KnowledgeCenter.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  return (
    // PHONE FRAME: kullanıcı isteği üzerine (bkz. CHANGELOG.md) uygulama artık masaüstü
    // tarayıcıda bile telefon genişliğinde, ortalanmış bir "çerçeve" içinde gösteriliyor.
    // BİLİNÇLİ TASARIM KARARI: `sm:` (640px) eşiğinde devreye giriyor — gerçek telefon
    // ekranlarında (< 640px) bu sarmalayıcının HİÇBİR görsel etkisi yok (max-width zaten
    // doğal genişlikten geniş, hiçbir şey değişmez). Yükseklik/overflow'a KASITLI OLARAK
    // dokunulmadı (overflow-hidden YOK) — Header.jsx (`sticky top-0`) position: sticky
    // kullanıyor; bir üst elemanda overflow:hidden/scroll/auto olması sticky'yi kalıcı
    // olarak bozar. Bu yüzden yuvarlak köşe/bezel efekti değil, sade bir genişlik
    // sınırı + gölge tercih edildi.
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#1C1917" }}>
      <div className="w-full sm:max-w-[430px] sm:shadow-2xl">
        <Suspense fallback={<Loading label="Sayfa yükleniyor..." />}>
          <Routes>
            {/* Auth pages: no sidebar/header */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Main app shell: sidebar + header + page content */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="chat" element={<Chat />} />
              <Route path="risk-analysis" element={<RiskAnalysis />} />
              <Route path="documents" element={<Documents />} />
              <Route path="legislation" element={<Legislation />} />
              <Route path="knowledge-center" element={<KnowledgeCenter />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
