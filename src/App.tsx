/**
 * StockForge - Admin Management Console
 * React + TypeScript + Tailwind CSS + Backend API
 */
import React, { useState, useMemo, useCallback } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ToastProvider } from "./context/ToastContext.tsx";
import { Sidebar, NavTab } from "./components/layout/Sidebar.tsx";
import { Header } from "./components/layout/Header.tsx";
import { Loader2 } from "lucide-react";
import { useGlobalShortcuts } from "./lib/hooks/useGlobalShortcuts.ts";
import { ShortcutsHelpModal } from "./components/common/ShortcutsHelpModal.tsx";
import { CommandPaletteModal } from "./components/common/CommandPaletteModal.tsx";
import { useTheme } from "./context/ThemeContext.tsx";
import { useLanguage } from "./context/LanguageContext.tsx";
import { useAuth } from "./context/AuthContext.tsx";
import { AuthView } from "./pages/AuthView.tsx";
import { DashboardView } from "./pages/DashboardView.tsx";
import { ClientsEnquiriesView } from "./pages/ClientsEnquiriesView.tsx";
import { ClientReviewsView } from "./pages/ClientReviewsView.tsx";

export default function App() {
  const { toggleTheme } = useTheme();
  const { toggleLanguage, language } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active tab from URL path
  const currentTab: NavTab = useMemo(() => {
    const path = location.pathname.replace(/^\//, "").split("/")[0];
    if (path === "registered-clients") return "clients";
    if (path === "client-reviews") return "reviews";
    const validTabs: NavTab[] = [
      "dashboard",
      "clients",
      "enquiries",
      "reviews",
    ];
    return validTabs.includes(path as NavTab) ? (path as NavTab) : "dashboard";
  }, [location.pathname]);

  const effectiveCurrencySymbol = useMemo(() => {
    return language === "np" ? "रु." : "Rs.";
  }, [language]);

  // Power user modal states
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);

  const handleNavigate = useCallback(
    (tab: NavTab) => {
      navigate(`/${tab}`);
    },
    [navigate],
  );

  // Wire up global keyboard shortcuts across the app
  useGlobalShortcuts({
    onNavigate: handleNavigate,
    onOpenCommandPalette: () => {
      setIsCommandPaletteOpen((prev) => !prev);
    },
    onOpenShortcutsHelp: () => {
      setIsShortcutsHelpOpen(true);
    },
    onCloseModals: () => {
      setIsCommandPaletteOpen(false);
      setIsShortcutsHelpOpen(false);
    },
    onOpenCreateProduct: () => {},
    onToggleTheme: toggleTheme,
    onToggleLanguage: toggleLanguage,
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <div className="text-xs font-mono text-neutral-400">
            Connecting to StockForge Platform...
          </div>
        </div>
      </div>
    );
  }

  // Authentication View Routes (/login, /auth)
  const isAuthRoute =
    location.pathname === "/login" || location.pathname === "/auth";

  if (isAuthRoute) {
    return (
      <ToastProvider>
        <AuthView onSuccess={() => navigate("/dashboard")} />
      </ToastProvider>
    );
  }

  // Require Super Admin session for dashboard routes
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <AuthView
          onSuccess={() =>
            navigate(
              location.pathname === "/" ? "/dashboard" : location.pathname,
            )
          }
        />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleNavigate}
          toggleSidebar={toggleSidebar}
          setToggleSidebar={() => setToggleSidebar((prev) => !prev)}
          onOpenShortcuts={() => setIsShortcutsHelpOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-neutral-950">
          {/* Header */}
          <Header
            currentTab={currentTab}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
          />

          {/* Active View Container with React Router Routes */}
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="h-full"
              >
                <Routes location={location}>
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/dashboard"
                    element={<DashboardView onNavigateToTab={handleNavigate} />}
                  />
                  <Route
                    path="/clients"
                    element={<ClientsEnquiriesView initialTab="clients" />}
                  />
                  <Route
                    path="/enquiries"
                    element={<ClientsEnquiriesView initialTab="enquiries" />}
                  />
                  <Route
                    path="/reviews"
                    element={
                      <ClientReviewsView onNavigateToTab={handleNavigate} />
                    }
                  />
                  <Route
                    path="/client-reviews"
                    element={
                      <ClientReviewsView onNavigateToTab={handleNavigate} />
                    }
                  />

                  {/* Fallback route */}
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Global Shortcuts Cheatsheet Modal */}
      <ShortcutsHelpModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
        currencySymbol={effectiveCurrencySymbol}
      />
    </ToastProvider>
  );
}
