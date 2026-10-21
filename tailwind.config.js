import plugin from "tailwindcss/plugin.js";

// Ekran düzeni tarayıcıya değil, mobil uygulama alanının genişliğine göre değişir.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { screens: {}, extend: {} },
  plugins: [plugin(({ addVariant }) => {
    for (const [name, width] of Object.entries({ sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 })) {
      addVariant(name, `@container mobile-app (min-width: ${width}px)`);
    }
  })],
};
