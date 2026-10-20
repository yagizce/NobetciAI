import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { Building2, ListChecks, BookOpen, Users } from "../../components/icons/index.jsx";
import CompanyInfoSection from "./CompanyInfoSection.jsx";
import BranchesSection from "./BranchesSection.jsx";
import DepartmentsSection from "./DepartmentsSection.jsx";
import EmployeesSection from "./EmployeesSection.jsx";
import { getReleaseTabs, resolveReleaseTab } from "../../constants/releaseProfile.js";
import { useRole } from "../../contexts/RoleContext.jsx";

const TABS = [
  { key: "info", label: "Firma Bilgileri", icon: Building2 },
  { key: "branches", label: "Şubeler", icon: ListChecks },
  { key: "departments", label: "Departmanlar", icon: BookOpen },
  { key: "employees", label: "Çalışanlar", icon: Users, feature: "employeeDirectory" },
];

export default function CompanyManagementPanel() {
  const { theme } = useTheme();
  const { role } = useRole();
  const tabs = getReleaseTabs(TABS, role);
  const [selectedTab, setTab] = useState("info");
  const tab = resolveReleaseTab(tabs, selectedTab);
  const [company, setCompany] = useState(null);

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const disabled = t.key !== "info" && !company;
          return (
            <button
              key={t.key}
              onClick={() => !disabled && setTab(t.key)}
              disabled={disabled}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 disabled:opacity-40"
              style={tab === t.key ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
            >
              <t.icon style={{ fontSize: "13px" }} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "info" && <CompanyInfoSection theme={theme} onCompanyLoaded={setCompany} />}
      {tab === "branches" && company && <BranchesSection theme={theme} companyId={company.id} />}
      {tab === "departments" && company && <DepartmentsSection theme={theme} companyId={company.id} />}
      {tab === "employees" && company && <EmployeesSection theme={theme} companyId={company.id} />}
    </div>
  );
}
