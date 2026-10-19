import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useGlobalSearch } from "../hooks/useGlobalSearch.js";
import { Search, X, ChevronLeft } from "../components/icons/index.jsx";

/** Modüller arası arama; mobilde açılan arama alanı, masaüstünde satır içi kutu. */
export default function GlobalSearchBar() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false); // masaüstü: dropdown açık mı
  const [mobileOpen, setMobileOpen] = useState(false); // mobil: tam genişlik arama modu açık mı
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const { results, loading } = useGlobalSearch(query);

  useEffect(() => {
    if (mobileOpen) mobileInputRef.current?.focus();
  }, [mobileOpen]);

  function handleSelect(target) {
    navigate(target.path + (target.search || ""), target.state ? { state: target.state } : undefined);
    setQuery("");
    setOpen(false);
    setMobileOpen(false);
    inputRef.current?.blur();
  }

  function closeMobile() {
    setMobileOpen(false);
    setQuery("");
  }

  const showDropdown = open && query.trim().length >= 2;
  const showMobileResults = mobileOpen && query.trim().length >= 2;

  const resultsList = (
    <>
      {loading && <p className="px-3 py-3 text-xs" style={{ color: theme.textFaint }}>Aranıyor...</p>}

      {!loading && results.length === 0 && (
        <p className="px-3 py-3 text-xs" style={{ color: theme.textFaint }}>"{query}" için sonuç bulunamadı.</p>
      )}

      {!loading && results.map((group) => (
        <div key={group.key} className="py-1.5" style={{ borderTop: `1px solid ${theme.border}` }}>
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textFaint }}>{group.label}</p>
          {group.items.map((item) => (
            <button
              key={item.id}
              onMouseDown={() => handleSelect(group.target)}
              className="w-full text-left px-3 py-1.5 text-sm"
              style={{ color: theme.textPrimary }}
            >
              <p className="truncate">{item.title}</p>
              {item.subtitle && <p className="text-[10.5px] truncate" style={{ color: theme.textFaint }}>{item.subtitle}</p>}
            </button>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Masaüstü/tablet — satır içi, HİÇ değişmedi */}
      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search style={{ fontSize: "15px", color: theme.textFaint, position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)} // sonuç butonlarındaki onMouseDown'ın önce ateşlenmesi için kısa gecikme
          placeholder="Tüm modüllerde ara..."
          className="w-full text-sm rounded-full pl-9 pr-4 py-2 outline-none border"
          style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
        />

        {showDropdown && (
          <div
            className="absolute left-0 right-0 mt-1.5 rounded-xl shadow-lg overflow-hidden z-40 max-h-96 overflow-y-auto"
            style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
          >
            {resultsList}
          </div>
        )}
      </div>

      {/* Mobil — ikon; dokununca tam genişlik arama moduna geçer */}
      <button onClick={() => setMobileOpen(true)} aria-label="Ara" className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.surfaceAlt }}>
        <Search style={{ fontSize: "16px", color: theme.textMuted }} />
      </button>

      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col" style={{ background: theme.surface }}>
          <div
            className="flex items-center gap-2 px-3 pb-2.5 shrink-0"
            style={{ background: theme.header, borderBottom: `1px solid ${theme.border}`, paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <button onClick={closeMobile} aria-label="Aramayı kapat" className="p-1.5 -m-1.5 rounded-lg shrink-0">
              <ChevronLeft style={{ fontSize: "20px", color: theme.textPrimary }} />
            </button>
            <div className="flex-1 relative">
              <Search style={{ fontSize: "14px", color: theme.textFaint, position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tüm modüllerde ara..."
                className="w-full text-sm rounded-full pl-8 pr-8 py-2 outline-none border"
                style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Aramayı temizle" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full" style={{ color: theme.textFaint }}>
                  <X style={{ fontSize: "13px" }} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!showMobileResults ? (
              <p className="px-4 py-6 text-center text-xs" style={{ color: theme.textFaint }}>
                Fine-Kinney, Risk Tespiti, Periyodik Kontrol, Dokümanlar ve Bilgi Kütüphanesi'nde arayın.
              </p>
            ) : resultsList}
          </div>
        </div>
      )}
    </>
  );
}
