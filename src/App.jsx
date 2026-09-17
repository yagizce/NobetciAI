import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout.jsx";
import PhoneFrame from "./layout/PhoneFrame.jsx";
import Loading from "./components/Loading.jsx";

// Route-based code splitting — each page is its own chunk, only downloaded when visited.
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Chat = lazy(() => import("./pages/Chat.jsx"));
const RiskAnalysis = lazy(() => import("./pages/RiskAnalysis.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const Legislation = lazy(() => import("./pages/Legislation.jsx"));
const KnowledgeCenter = lazy(() => import("./pages/KnowledgeCenter.jsx"));
const Audit = lazy(() => import("./pages/Audit.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const CosmosVisionTest = lazy(() => import("./pages/CosmosVisionTest.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  return (
    <PhoneFrame>
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
            <Route path="audit" element={<Audit />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            {/* NVIDIA Cosmos3-Nano-Reasoner — SADECE TEST sayfası, bilerek Sidebar/
                BottomTabBar navigasyonuna eklenmedi (bkz. pages/CosmosVisionTest.jsx
                dosya başı notu). Yalnızca doğrudan URL ile erişilir. */}
            <Route path="cosmos-vision-test" element={<CosmosVisionTest />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PhoneFrame>
  );
}
