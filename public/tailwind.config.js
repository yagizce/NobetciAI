// Tailwind'i CDN'den (cdn.tailwindcss.com — tarayıcıda her sayfa yüklemesinde çalışan
// bir JIT derleyici) gerçek bir build-time adımına taşıyan config. `content` altındaki
// yollar TARANIP kullanılan class isimleri tespit ediliyor, sonuçta sadece GERÇEKTEN
// kullanılan utility'leri içeren küçük/statik bir CSS dosyası üretiliyor.
//
// BİLİNÇLİ OLARAK BOŞ BIRAKILDI: `theme.extend` ve `plugins` — proje CDN sürümünü hiç
// özelleştirmeden (index.html'de tailwind.config script'i yoktu), sadece varsayılan
// tema + inline style/CSS custom property'lerle (bkz. constants/theme.js,
// ThemeContext.jsx) çalışıyordu. Buradaki config o davranışı BİREBİR koruyor — hiçbir
// yeni renk/spacing/breakpoint eklenmedi, sadece "CDN'de neydi, build'de de o".
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
