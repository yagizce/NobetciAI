import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useRole } from "../contexts/RoleContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { SWITCHABLE_ROLES } from "../constants/allRoles.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { getCurrentUser } from "../services/authService.js";
import { getActiveCompany } from "../services/companyService.js";
import { validateImageFile } from "../utils/fileValidation.js";
import { UserRound, Camera } from "../components/icons/index.jsx";
import Loading from "../components/Loading.jsx";
import Badge from "../components/ui/Badge.jsx";
import PasswordChangeSection from "../features/profile/PasswordChangeSection.jsx";

const SUBSCRIPTION_LABELS = { trial: "Deneme Sürümü", pro: "Pro", enterprise: "Kurumsal" };

function formatLastLogin(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Profile() {
  useDocumentTitle("Profil");
  const { theme } = useTheme();
  const { role } = useRole();
  const { showToast } = useToast();
  const currentRole = SWITCHABLE_ROLES.find((r) => r.id === role);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    Promise.all([getCurrentUser(role), getActiveCompany()]).then(([currentUser, activeCompany]) => {
      setUser(currentUser);
      setCompany(activeCompany);
      setPhoto(currentUser.photo);
    });
  }, [role]);

  if (!user) return <Loading label="Profil yükleniyor..." />;

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const { valid, error } = await validateImageFile(file);
    if (!valid) {
      showToast(error, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
    // Not: bu değişiklik şu an yalnızca ekranda görünür, kalıcı değil — gerçek kullanıcı
    // profili (authService üzerinden) eklenince buradan doğrudan kaydedilecek.
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
      <p className="font-[Oswald] text-xl uppercase tracking-wide mb-4" style={{ color: theme.textPrimary }}>Profil</p>

      <div className="rounded-xl border px-4 py-4 flex items-center gap-3 mb-4" style={{ borderColor: theme.border, background: theme.surface }}>
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full border flex items-center justify-center overflow-hidden" style={{ background: theme.surfaceAlt, borderColor: theme.border }}>
            {photo ? <img src={photo} alt="Profil fotoğrafı" className="w-full h-full object-cover" /> : <UserRound style={{ fontSize: "30px", color: theme.accent }} />}
          </div>
          <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: theme.accent, border: `2px solid ${theme.surface}` }}>
            <Camera style={{ fontSize: "11px", color: theme.onAccent }} />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
        <div>
          <p className="font-semibold text-base" style={{ color: theme.textPrimary }}>{user.name}</p>
          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{user.title}</p>
          <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>{currentRole?.emoji} {currentRole?.label} • {company?.name || "Şirket bilgisi yok"}</p>
        </div>
      </div>

      <div className="rounded-xl border px-4 py-4 mb-4" style={{ borderColor: theme.border, background: theme.surface }}>
        {[
          ["E-posta", user.email],
          ["Telefon", user.phone],
          ["Departman", user.department],
          ["Şirket", `${company?.name || "—"}${company?.sector ? ` (${company.sector})` : ""}`],
          ["Son Giriş", formatLastLogin(user.lastLoginAt)],
        ].map(([label, value], i, arr) => (
          <div key={label} className="flex justify-between items-center gap-3 py-1.5" style={i !== arr.length - 1 ? { borderBottom: `1px solid ${theme.border}` } : {}}>
            <span className="text-xs" style={{ color: theme.textFaint }}>{label}</span>
            <span className="text-sm text-right" style={{ color: theme.textPrimary }}>{value}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: `1px solid ${theme.border}` }}>
          <span className="text-xs" style={{ color: theme.textFaint }}>Abonelik</span>
          <Badge tone={user.subscription === "trial" ? "warning" : "success"}>{SUBSCRIPTION_LABELS[user.subscription]}</Badge>
        </div>
      </div>

      <div className="mb-4">
        <PasswordChangeSection theme={theme} />
      </div>

      <div className="rounded-xl border px-4 py-4" style={{ borderColor: theme.border, background: theme.surfaceAlt }}>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          Bu demo sürümde kullanıcı bilgisi rol bazlı sahte (mock) bir servisten geliyor — üstteki rol anahtarını değiştirdiğinde farklı bir kullanıcı olarak görünürsün. Gerçek kimlik doğrulama eklenince yalnızca <code>src/services/authService.js</code> değişecek.
        </p>
      </div>
    </div>
  );
}
