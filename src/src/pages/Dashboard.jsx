import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  return <DashboardPage />;
}
