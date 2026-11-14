import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/useApp";
import ToastContainer from "./components/ui/ToastContainer";
import LoadingIndicator from "./components/ui/LoadingIndicator";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import MemberDashboardPage from "./pages/MemberDashboardPage";
import HouseholdOverviewPage from "./pages/HouseholdOverviewPage";
import BillsExpensesPage from "./pages/BillsExpensesPage";
import BillDetailsPage from "./pages/BillDetailsPage";
import BudgetManagementPage from "./pages/BudgetManagementPage";
import ContributionsPage from "./pages/ContributionsPage";
import ContributionDetailsPage from "./pages/ContributionDetailsPage";
import BillAssignmentsPage from "./pages/BillAssignmentsPage";
import PaymentTrackingPage from "./pages/PaymentTrackingPage";
import HouseholdMembersPage from "./pages/HouseholdMembersPage";
import CategoriesPage from "./pages/CategoriesPage";
import ReportsAnalyticsPage from "./pages/ReportsAnalyticsPage";
import NotificationsPage from "./pages/NotificationsPage";
import MyProfilePage from "./pages/MyProfilePage";
import SettingsPage from "./pages/SettingsPage";

function ProtectedPage({ children, adminOnly = false }) {
  const { isAuthenticated, isInitializing, isAdmin } = useApp();
  if (isInitializing) return <main className="min-h-screen bg-[#F8FAFC] p-6"><LoadingIndicator label="Loading your household..." /></main>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestPage({ children }) {
  const { isAuthenticated, isInitializing } = useApp();
  if (isInitializing) return <main className="min-h-screen bg-[#F8FAFC] p-6"><LoadingIndicator label="Checking your session..." /></main>;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function DashboardPage() {
  const { isAdmin } = useApp();
  return isAdmin ? <AdminDashboardPage /> : <MemberDashboardPage />;
}

function RootRedirect() {
  const { isAuthenticated, isInitializing } = useApp();
  if (isInitializing) return <main className="min-h-screen bg-[#F8FAFC] p-6"><LoadingIndicator label="Loading your household..." /></main>;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<GuestPage><LoginPage /></GuestPage>} />
        <Route path="/register" element={<GuestPage><RegistrationPage /></GuestPage>} />
        <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
        <Route path="/household" element={<ProtectedPage><HouseholdOverviewPage /></ProtectedPage>} />
        <Route path="/bills" element={<ProtectedPage><BillsExpensesPage /></ProtectedPage>} />
        <Route path="/bills/:billId" element={<ProtectedPage><BillDetailsPage /></ProtectedPage>} />
        <Route path="/budgets" element={<ProtectedPage adminOnly><BudgetManagementPage /></ProtectedPage>} />
        <Route path="/contributions" element={<ProtectedPage><ContributionsPage /></ProtectedPage>} />
        <Route path="/contributions/:contributionId" element={<ProtectedPage><ContributionDetailsPage /></ProtectedPage>} />
        <Route path="/assignments" element={<ProtectedPage><BillAssignmentsPage /></ProtectedPage>} />
        <Route path="/payments" element={<ProtectedPage adminOnly><PaymentTrackingPage /></ProtectedPage>} />
        <Route path="/members" element={<ProtectedPage adminOnly><HouseholdMembersPage /></ProtectedPage>} />
        <Route path="/categories" element={<ProtectedPage adminOnly><CategoriesPage /></ProtectedPage>} />
        <Route path="/reports" element={<ProtectedPage adminOnly><ReportsAnalyticsPage /></ProtectedPage>} />
        <Route path="/notifications" element={<ProtectedPage><NotificationsPage /></ProtectedPage>} />
        <Route path="/profile" element={<ProtectedPage><MyProfilePage /></ProtectedPage>} />
        <Route path="/settings" element={<ProtectedPage adminOnly><SettingsPage /></ProtectedPage>} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
