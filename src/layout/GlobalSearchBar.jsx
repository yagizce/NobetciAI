import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useGlobalSearch } from "../hooks/useGlobalSearch.js";
import { Search } from "../components/icons/index.jsx";

/**
 * Header.jsx'teki önceden tamamen işlevsiz ("Ara..." placeholder'lı, hiçbir state/handler
 * içermeyen) arama kutusunun yerini alır. Modül bazlı arama kutularının (Fine-Kinney,
 * Dokümanlar vb.) YERİNİ TUTMAZ — üzerine "hangi modülde olduğunu bilmiyorum" senaryosu
 * için bir kısayol ekler. Sonuca tıklayınca ilgili modüle, o modülün kendi arama kutusu
 * ÖN DOLDURULMUŞ şekilde gidilir (bkz. constants/globalSearch.js → `target`).
 */
export default function GlobalSearchBar() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const { results, loading } = useGlobalSearch(query);

  function handleSelect(target) {
    navigate(target.path + (target.search || ""), target.state ? { state: target.state } : undefined);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div className="flex-1 max-w-md relative hidden sm:block">
      <Search style={{ fontSize: "15px", color: theme.textFaint, position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} // sonuç butonlarındaki onMouseDown'ın önce ateşlenmesi için kısa gecikme
        placeholder="Tüm modüllerde ara... (Fine-Kinney, Dokümanlar, Bilgi Kütüphanesi...)"
        className="w-full text-sm rounded-full pl-9 pr-4 py-2 outline-none border"
        style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
      />

      {showDropdown && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-xl shadow-lg overflow-hidden z-40 max-h-96 overflow-y-auto"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        >
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
        </div>
      )}
    </div>
  );
}
