// Minimal inline icon set — no external icon package dependency.
function Ic({ children, viewBox = "0 0 24 24", style = {}, sw = 2 }) {
  return (
    <svg viewBox={viewBox} width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", ...style }}>
      {children}
    </svg>
  );
}

export const HardHat = (p) => <Ic {...p}><path d="M4 18h16" /><path d="M6 18v-2a6 6 0 0 1 12 0v2" /><path d="M10 10V6a2 2 0 0 1 4 0v4" /><path d="M2 18h20" /></Ic>;
export const Mail = (p) => <Ic {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></Ic>;
export const Send = (p) => <Ic {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></Ic>;
export const MessageSquare = (p) => <Ic {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Ic>;
export const Camera = (p) => <Ic {...p}><path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="14" r="3.5" /></Ic>;
export const QrCode = (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h7v7h-7Z" /><path d="M11 11h2v2h-2Z" /></Ic>;
export const BookOpen = (p) => <Ic {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Ic>;
export const BarChart3 = (p) => <Ic {...p}><path d="M3 3v18h18" /><path d="M7 16v-4M12 16v-8M17 16v-2" /></Ic>;
export const Bell = (p) => <Ic {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Ic>;
export const Copy = (p) => <Ic {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Ic>;
export const Trash2 = (p) => <Ic {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Ic>;
export const RotateCcw = (p) => <Ic {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Ic>;
export const Plus = (p) => <Ic {...p}><path d="M12 5v14M5 12h14" /></Ic>;
export const CheckCircle2 = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.3 2.3L16 10" /></Ic>;
export const ClipboardList = (p) => <Ic {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9z" /><path d="M9 11h6M9 15h6M9 19h3" /></Ic>;
export const ShieldAlert = (p) => <Ic {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /><path d="M12 8v5M12 16h.01" /></Ic>;
export const Zap = (p) => <Ic {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></Ic>;
export const Flame = (p) => <Ic {...p}><path d="M12 2s-6 5-6 11a6 6 0 0 0 12 0c0-2-1-3-1-3s-1 2-2.5 2c1-3-2.5-5-2.5-10Z" /></Ic>;
export const MapPin = (p) => <Ic {...p}><path d="M12 22s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></Ic>;
export const Home = (p) => <Ic {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></Ic>;
export const Settings = (p) => <Ic {...p}><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m3.08-3.08l4.24-4.24" /></Ic>;
export const UserRound = (p) => <Ic {...p}><circle cx="12" cy="8" r="4" /><path d="M5 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5" /></Ic>;
export const Search = (p) => <Ic {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Ic>;
export const Menu = (p) => <Ic {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Ic>;
export const X = (p) => <Ic {...p}><path d="M18 6 6 18M6 6l12 12" /></Ic>;
export const ChevronDown = (p) => <Ic {...p}><path d="m6 9 6 6 6-6" /></Ic>;
export const LogOut = (p) => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Ic>;
export const Sun = (p) => <Ic {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></Ic>;
export const Moon = (p) => <Ic {...p}><path d="M21 12.5A9 9 0 1 1 11.5 3 7 7 0 0 0 21 12.5Z" /></Ic>;
export const FileText = (p) => <Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></Ic>;
export const Scale = (p) => <Ic {...p}><path d="M12 3v18M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z" /><path d="M5 8h14M9 21h6" /></Ic>;
export const Users = (p) => <Ic {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 3-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><circle cx="17.5" cy="8.5" r="2.4" /><path d="M16 13.2c2.5 0 5.5 1.6 5.5 4.8" /></Ic>;
export const Building2 = (p) => <Ic {...p}><path d="M4 22V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v18" /><path d="M14 9h5a1 1 0 0 1 1 1v12" /><path d="M9 6h.01M9 10h.01M9 14h.01M9 18h.01" /></Ic>;
export const ListChecks = (p) => <Ic {...p}><path d="m3 7 2 2 3-3" /><path d="m3 14 2 2 3-3" /><path d="M11 7h10M11 14h10M11 21h10" /></Ic>;
export const AlertTriangle = (p) => <Ic {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></Ic>;
export const LayoutDashboard = (p) => <Ic {...p}><rect x="3" y="3" width="8" height="9" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="14" width="8" height="7" rx="1.5" /></Ic>;

// --- Sprint 5A eklemeleri (Fine-Kinney profesyonelleştirme) ---
export const Paperclip = (p) => <Ic {...p}><path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.49-8.48" /></Ic>;
export const ImageIcon = (p) => <Ic {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></Ic>;
export const History = (p) => <Ic {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 3" /></Ic>;
export const StickyNote = (p) => <Ic {...p}><path d="M4 4h16v11l-5 5H4Z" /><path d="M15 20v-5h5" /></Ic>;
export const Info = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 8h.01" /></Ic>;
export const ChevronRight = (p) => <Ic {...p}><path d="m9 6 6 6-6 6" /></Ic>;

// --- Sprint 7.2.2 eklemeleri (Periyodik Kontrol — Takvim görünümü) ---
export const Calendar = (p) => <Ic {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Ic>;
export const ChevronLeft = (p) => <Ic {...p}><path d="m15 6-6 6 6 6" /></Ic>;

// --- Sprint 7.3 eklemeleri (Bilgi Kütüphanesi — AI Asistanı) ---
export const Sparkles = (p) => <Ic {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /><circle cx="12" cy="12" r="2" /></Ic>;
export const Star = (p) => <Ic {...p}><path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5-5.9-3.3-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.7z" /></Ic>;

// --- Sprint 7.4 eklemeleri (Dashboard — Karar Destek: 30 Gün Değişim / Yaklaşan Kontroller / Devam Eden Eğitimler) ---
export const ArrowUp = (p) => <Ic {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Ic>;
export const ArrowDown = (p) => <Ic {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></Ic>;
export const Minus = (p) => <Ic {...p}><path d="M5 12h14" /></Ic>;

// --- Sprint 7.2.3 eklemeleri (Periyodik Kontrol Merkezi — özet kartları) ---
export const Clock = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Ic>;

// --- Toplu veri işlemleri (CSV içe aktarma / toplu seçim) ---
export const Upload = (p) => <Ic {...p}><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></Ic>;
export const Download = (p) => <Ic {...p}><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></Ic>;
export const HardDrive = (p) => <Ic {...p}><line x1="22" y1="12" x2="2" y2="12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /><line x1="6" y1="16" x2="6.01" y2="16" /><line x1="10" y1="16" x2="10.01" y2="16" /></Ic>;
