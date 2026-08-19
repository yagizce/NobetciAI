import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { RoleProvider } from "./contexts/RoleContext.jsx";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import { IsgDataProvider } from "./contexts/IsgDataContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { migrateLegacyCompanyData } from "./services/companyService.js";
import "./index.css";

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <RoleProvider>
              <IsgDataProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </IsgDataProvider>
            </RoleProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Eski tek-firma IndexedDB kayıtlarını UI okunmaya başlamadan önce companyId ile
// işaretler. Migration başarısız olursa uygulama yine açılır; hata kullanıcı akışını
// kilitlemek yerine konsola bırakılır ve kayıt işlemleri kendi guard'larını uygular.
migrateLegacyCompanyData().catch((error) => {
  console.error("Legacy firma verisi migration'ı tamamlanamadı:", error);
}).finally(renderApp);

// PWA / Service Worker — v2, network-first tasarım. HTML/JS/CSS cache-first değildir.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Kayıt başarısız olursa uygulama normal (SW'siz) çalışmaya devam eder.
    });
  });
}
