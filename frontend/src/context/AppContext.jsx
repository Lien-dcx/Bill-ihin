import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import AppContext from "./appContextStore";

const DEFAULT_SETTINGS = {
  defaultCurrency: "PHP",
  cycleStartDay: 1,
  requireContributionProofNote: true,
  allowPartialContributions: true,
  autoAlertBudgetPct: 85,
  inAppAlerts: true,
};

const EMPTY_DATA = {
  household: null,
  members: [],
  categories: [],
  budgets: [],
  bills: [],
  contributions: [],
  assignments: [],
  payments: [],
  notifications: [],
  activities: [],
};

const PAGE_PATHS = {
  dashboard: "/dashboard",
  "member-dashboard": "/dashboard",
  "household-overview": "/household",
  bills: "/bills",
  budgets: "/budgets",
  contributions: "/contributions",
  assignments: "/assignments",
  payments: "/payments",
  members: "/members",
  categories: "/categories",
  reports: "/reports",
  notifications: "/notifications",
  profile: "/profile",
  settings: "/settings",
  login: "/login",
  register: "/register",
};

function errorMessage(error) {
  return error?.response?.data?.message || "The request could not be completed. Please try again.";
}

function pageForPath(pathname, isAdmin) {
  if (pathname === "/dashboard" || pathname === "/") return isAdmin ? "dashboard" : "member-dashboard";
  if (pathname === "/household") return "household-overview";
  if (pathname === "/bills") return "bills";
  if (pathname.startsWith("/bills/")) return "bill-details";
  if (pathname === "/budgets") return "budgets";
  if (pathname === "/contributions") return "contributions";
  if (pathname.startsWith("/contributions/")) return "contribution-details";
  if (pathname === "/assignments") return "assignments";
  if (pathname === "/payments") return "payments";
  if (pathname === "/members") return "members";
  if (pathname === "/categories") return "categories";
  if (pathname === "/reports") return "reports";
  if (pathname === "/notifications") return "notifications";
  if (pathname === "/profile") return "profile";
  if (pathname === "/settings") return "settings";
  if (pathname === "/register") return "register";
  return "login";
}

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState(EMPTY_DATA);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedBillIdState, setSelectedBillIdState] = useState(null);
  const [selectedContributionIdState, setSelectedContributionIdState] = useState(null);
  const currentUserIdRef = useRef(null);

  const isAuthenticated = Boolean(currentUser);
  const isAdmin = currentUser?.role === "Administrator";
  const currentPage = pageForPath(location.pathname, isAdmin);
  const billPathId = location.pathname.match(/^\/bills\/(\d+)$/)?.[1];
  const contributionPathId = location.pathname.match(/^\/contributions\/(\d+)$/)?.[1];
  const selectedBillId = billPathId ? Number(billPathId) : selectedBillIdState;
  const selectedContributionId = contributionPathId ? Number(contributionPathId) : selectedContributionIdState;

  const addToast = useCallback((message, type = "success", title = "") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((items) => [...items, { id, message, type, title }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const applyData = useCallback((nextData) => {
    setData({
      household: nextData.household || null,
      members: nextData.members || [],
      categories: nextData.categories || [],
      budgets: nextData.budgets || [],
      bills: nextData.bills || [],
      contributions: nextData.contributions || [],
      assignments: nextData.assignments || [],
      payments: nextData.payments || [],
      notifications: nextData.notifications || [],
      activities: nextData.activities || [],
    });
    setSettings({ ...DEFAULT_SETTINGS, ...(nextData.settings || {}) });
    const updatedUser = nextData.members?.find((member) => Number(member.id) === Number(currentUserIdRef.current));
    if (updatedUser) setCurrentUser(updatedUser);
  }, []);

  const loadData = useCallback(async () => {
    const response = await api.get("/household/data");
    applyData(response.data);
    return response.data;
  }, [applyData]);

  const clearSession = useCallback(() => {
    currentUserIdRef.current = null;
    setCurrentUser(null);
    setData(EMPTY_DATA);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const navigateTo = useCallback((page, params = {}) => {
    if (params.billId) setSelectedBillIdState(Number(params.billId));
    if (params.contributionId) setSelectedContributionIdState(Number(params.contributionId));
    let path = PAGE_PATHS[page];
    if (page === "bill-details") path = `/bills/${params.billId ?? selectedBillIdState ?? ""}`;
    if (page === "contribution-details") path = `/contributions/${params.contributionId ?? selectedContributionIdState ?? ""}`;
    if (path) navigate(path);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate, selectedBillIdState, selectedContributionIdState]);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const response = await api.get("/auth/me");
        if (!active) return;
        currentUserIdRef.current = response.data.user.id;
        setCurrentUser(response.data.user);
        setSettings({ ...DEFAULT_SETTINGS, ...(response.data.settings || {}) });
        await loadData();
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setIsInitializing(false);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, [loadData, clearSession]);

  const runMutation = useCallback(async (request, successMessage) => {
    try {
      await request();
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
      }
      addToast(errorMessage(error), "error");
      return false;
    }
    try {
      await loadData();
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
      }
      addToast("Your change was saved, but the latest records could not be loaded.", "warning");
      return true;
    }
    addToast(successMessage, "success");
    return true;
  }, [addToast, clearSession, loadData, navigate]);

  const loginWithEmail = useCallback(async ({ email, password }) => {
    try {
      await api.post("/auth/login", { email, password });
      await loadData();
      const response = await api.get("/auth/me");
      currentUserIdRef.current = response.data.user.id;
      setCurrentUser(response.data.user);
      setSettings({ ...DEFAULT_SETTINGS, ...(response.data.settings || {}) });
      navigate("/dashboard", { replace: true });
      return true;
    } catch (error) {
      addToast(errorMessage(error), "error");
      return false;
    }
  }, [addToast, loadData, navigate]);

  const registerAccount = useCallback(async (account) => {
    try {
      const response = await api.post("/auth/register", account);
      currentUserIdRef.current = response.data.user.id;
      setCurrentUser(response.data.user);
      await loadData();
      navigate("/dashboard", { replace: true });
      addToast(`Welcome to Bill-ihin, ${response.data.user.name}.`, "success");
      return true;
    } catch (error) {
      addToast(errorMessage(error), "error");
      return false;
    }
  }, [addToast, loadData, navigate]);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* Clear the local session even if the API is offline. */ }
    clearSession();
    navigate("/login", { replace: true });
    addToast("You have been logged out.", "info");
  }, [addToast, clearSession, navigate]);

  const simulateRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadData();
      addToast("Household records refreshed.", "info");
    } catch (error) {
      addToast(errorMessage(error), "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, loadData]);

  const addBill = useCallback((bill) => runMutation(() => api.post("/bills", bill), "Bill created."), [runMutation]);
  const updateBill = useCallback((id, updates) => runMutation(() => api.patch(`/bills/${id}`, updates), "Bill updated."), [runMutation]);
  const deleteBill = useCallback((id) => runMutation(() => api.delete(`/bills/${id}`), "Bill deleted."), [runMutation]);

  const addContribution = useCallback((contribution) => runMutation(
    () => api.post("/contributions", contribution),
    "Contribution submitted for administrator verification."
  ), [runMutation]);
  const updateContribution = useCallback((id, updates) => runMutation(() => api.patch(`/contributions/${id}`, updates), "Contribution updated."), [runMutation]);
  const deleteContribution = useCallback((id) => runMutation(() => api.delete(`/contributions/${id}`), "Contribution removed."), [runMutation]);
  const verifyContribution = useCallback((id) => runMutation(() => api.post(`/contributions/${id}/verify`), "Contribution confirmed and added to collected funds."), [runMutation]);
  const rejectContribution = useCallback((id, reason) => runMutation(() => api.post(`/contributions/${id}/reject`, { reason }), "Contribution rejected."), [runMutation]);

  const saveBudget = useCallback((budget) => runMutation(
    () => budget.id ? api.patch(`/budgets/${budget.id}`, budget) : api.post("/budgets", budget),
    budget.id ? "Category budget updated." : "Budget allocation created."
  ), [runMutation]);
  const deleteBudget = useCallback((id) => runMutation(() => api.delete(`/budgets/${id}`), "Budget allocation removed."), [runMutation]);

  const saveAssignment = useCallback((assignment) => runMutation(
    () => assignment.id ? api.patch(`/assignments/${assignment.id}`, assignment) : api.post("/assignments", assignment),
    assignment.id ? "Bill assignment updated." : "Bill responsibility assigned."
  ), [runMutation]);
  const deleteAssignment = useCallback((id) => runMutation(() => api.delete(`/assignments/${id}`), "Assignment removed."), [runMutation]);

  const savePayment = useCallback((payment) => runMutation(
    () => payment.id ? api.patch(`/payments/${payment.id}`, payment) : api.post("/payments", payment),
    payment.id ? "Payment record updated." : "Actual bill payment recorded."
  ), [runMutation]);
  const deletePayment = useCallback((id) => runMutation(() => api.delete(`/payments/${id}`), "Payment record deleted."), [runMutation]);

  const saveMember = useCallback((member) => runMutation(
    () => member.id ? api.patch(`/members/${member.id}`, member) : api.post("/members", member),
    member.id ? "Household member updated." : "Household member account created."
  ), [runMutation]);
  const deleteMember = useCallback((id) => runMutation(() => api.delete(`/members/${id}`), "Member access removed."), [runMutation]);

  const saveCategory = useCallback((category) => runMutation(
    () => category.id ? api.patch(`/categories/${category.id}`, category) : api.post("/categories", category),
    category.id ? "Category updated." : "Category created."
  ), [runMutation]);
  const deleteCategory = useCallback((id) => runMutation(() => api.delete(`/categories/${id}`), "Category deleted."), [runMutation]);

  const markNotificationRead = useCallback((id) => runMutation(
    () => api.patch(`/notifications/${id}/read`), "Notification marked as read."
  ), [runMutation]);
  const markAllNotificationsRead = useCallback(() => runMutation(
    () => api.patch("/notifications/read-all"), "All notifications marked as read."
  ), [runMutation]);
  const deleteNotification = useCallback((id) => runMutation(
    () => api.delete(`/notifications/${id}`), "Notification deleted."
  ), [runMutation]);

  const updateProfile = useCallback((updates) => runMutation(
    () => api.patch("/auth/profile", updates), "Your profile has been saved."
  ), [runMutation]);
  const changePassword = useCallback((passwords) => runMutation(
    () => api.patch("/auth/password", passwords), "Password updated."
  ), [runMutation]);
  const updateHouseholdAndSettings = useCallback((householdUpdates, settingsUpdates) => runMutation(
    () => api.put("/household", { ...householdUpdates, settings: settingsUpdates }),
    "Household settings updated."
  ), [runMutation]);

  const value = useMemo(() => ({
    isAuthenticated,
    isInitializing,
    currentUser,
    currentUserId: currentUser?.id ?? null,
    isAdmin,
    currentPage,
    navigateTo,
    selectedBillId,
    setSelectedBillId: setSelectedBillIdState,
    selectedContributionId,
    setSelectedContributionId: setSelectedContributionIdState,
    ...data,
    settings,
    toasts,
    isLoading,
    simulateRefresh,
    addToast,
    dismissToast,
    loginWithEmail,
    registerAccount,
    logout,
    addBill,
    updateBill,
    deleteBill,
    addContribution,
    updateContribution,
    deleteContribution,
    verifyContribution,
    rejectContribution,
    saveBudget,
    deleteBudget,
    saveAssignment,
    deleteAssignment,
    savePayment,
    deletePayment,
    saveMember,
    deleteMember,
    saveCategory,
    deleteCategory,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    updateProfile,
    changePassword,
    updateHouseholdAndSettings,
  }), [
    isAuthenticated, isInitializing, currentUser, isAdmin, currentPage, navigateTo,
    selectedBillId, selectedContributionId, data, settings, toasts, isLoading,
    simulateRefresh, addToast, dismissToast, loginWithEmail, registerAccount, logout,
    addBill, updateBill, deleteBill, addContribution, updateContribution, deleteContribution,
    verifyContribution, rejectContribution, saveBudget, deleteBudget, saveAssignment,
    deleteAssignment, savePayment, deletePayment, saveMember, deleteMember, saveCategory,
    deleteCategory, markNotificationRead, markAllNotificationsRead, deleteNotification,
    updateProfile, changePassword, updateHouseholdAndSettings,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

