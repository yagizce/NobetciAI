import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useRole } from "../../contexts/RoleContext.jsx";
import ExpertDashboard from "./ExpertDashboard.jsx";
import EmployerDashboard from "./EmployerDashboard.jsx";
import EmployeeDashboard from "./EmployeeDashboard.jsx";

// Role-based routing (see CHANGELOG "2. ROLE BASED ROUTING"): the route itself stays
// /dashboard for everyone — no separate URLs per role — but the content rendered here
// is chosen entirely by the current user's role. Once real login exists, `role` will
// come from the authenticated session instead of the demo RoleContext switcher, and this
// component won't need to change at all.
export default function DashboardPage() {
  const { theme } = useTheme();
  const { role } = useRole();

  if (role === "expert") return <ExpertDashboard theme={theme} />;
  if (role === "employer") return <EmployerDashboard theme={theme} />;
  return <EmployeeDashboard theme={theme} />;
}
