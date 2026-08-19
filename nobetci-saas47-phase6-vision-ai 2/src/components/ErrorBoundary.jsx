import { Component } from "react";
import { THEMES } from "../constants/theme.js";

/**
 * App-wide error boundary. Class component because React only supports error
 * boundaries via componentDidCatch/getDerivedStateFromError — there is no hook
 * equivalent yet, so this intentionally isn't a function component.
 *
 * İki kullanım şekli var:
 * 1. `main.jsx`'te tüm uygulamayı saran TAM EKRAN sürüm (varsayılan, `compact` verilmez) —
 *    son çare: hiçbir şey render edilemiyorsa bu devreye girer.
 * 2. `Layout.jsx`'te yalnızca `<Outlet />`'i saran `compact` sürüm — bir SAYFANIN içeriği
 *    çökerse bile sidebar/header hayatta kalır, kullanıcı tam sayfa yenilemeden başka bir
 *    sayfaya geçebilir. `Layout.jsx`, `key={location.pathname}` vererek rota her
 *    değiştiğinde bu sınırı sıfırdan monte eder (hata durumu otomatik temizlenir);
 *    `handleRetry`, AYNI sayfada (rota değişmeden) yeniden denemek içindir.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Nöbetçi ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const theme = THEMES.light; // class component — no hook access, safe static fallback

      if (this.props.compact) {
        return (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="font-[Oswald] text-lg uppercase tracking-wide mb-2" style={{ color: theme.textPrimary }}>Bu sayfa yüklenemedi</p>
            <p className="text-sm mb-4 max-w-sm" style={{ color: theme.textMuted }}>
              Beklenmeyen bir hatayla karşılaştık. Tekrar deneyebilir veya menüden başka bir sayfaya geçebilirsiniz.
            </p>
            <button
              onClick={this.handleRetry}
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: theme.accent, color: theme.onAccent }}
            >
              Tekrar Dene
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: theme.pageBg }}>
          <p className="font-[Oswald] text-2xl uppercase tracking-wide mb-2" style={{ color: theme.textPrimary }}>Bir şeyler ters gitti</p>
          <p className="text-sm mb-4 max-w-sm" style={{ color: theme.textMuted }}>
            Uygulama beklenmeyen bir hatayla karşılaştı. Sayfayı yenilemeyi deneyin; sorun devam ederse geliştiriciye bildirin.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: theme.accent, color: theme.onAccent }}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
