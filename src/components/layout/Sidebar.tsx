import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  UserCheck,
  Star,
  Sun,
  Moon,
  PanelLeftOpen,
  PanelLeftClose,
  Store,
  LogOut,
  Wallet,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.tsx";
import { useLanguage } from "../../context/LanguageContext.tsx";
import { useAuth } from "../../context/AuthContext.tsx";
import { getEnquiryStats } from "../../lib/services/enquiryService.ts";

export type NavTab = "dashboard" | "clients" | "finances" | "enquiries" | "reviews";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  toggleSidebar: boolean;
  setToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  toggleSidebar,
  setToggleSidebar,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const { currentShop, logout } = useAuth();
  const [enquiryNewCount, setEnquiryNewCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    getEnquiryStats()
      .then((stats) => {
        if (isMounted) setEnquiryNewCount(stats.new_count);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentTab]);

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    {
      id: "dashboard",
      label: t("nav_dashboard"),
      icon: LayoutDashboard,
    },
    {
      id: "finances",
      label: t("nav_finances", "Finances"),
      icon: Wallet,
    },
    {
      id: "clients",
      label: t("nav_clients"),
      icon: UserCheck,
    },
    {
      id: "enquiries",
      label: t("nav_enquiries"),
      icon: MessageSquare,
      badge: enquiryNewCount > 0 ? enquiryNewCount : undefined,
    },
    { id: "reviews", label: t("nav_reviews"), icon: Star },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: toggleSidebar ? 256 : 64 }}
      transition={{ type: "spring", damping: 26, stiffness: 350, mass: 0.6 }}
      className="bg-neutral-950 border-r border-neutral-800/80 flex flex-col shrink-0 select-none overflow-hidden"
    >
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-neutral-800/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/icon.png"
            alt="StockForge Logo"
            className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-sm shadow-emerald-500/20"
          />
          {toggleSidebar && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="min-w-0 flex-1"
            >
              <div className="text-sm font-bold tracking-tight text-neutral-100 truncate">
                {currentShop ? currentShop.name : "StockForge"}
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
                <span className="truncate">
                  {currentShop ? currentShop.shop_type : t("app_subtitle")}
                </span>
              </div>
            </motion.div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={setToggleSidebar}
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-neutral-800/60 transition-colors cursor-pointer"
          title={toggleSidebar ? "Collapse sidebar" : "Expand sidebar"}
        >
          {toggleSidebar ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </motion.button>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <Link
              key={item.id}
              to={`/${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                isActive
                  ? "text-neutral-100 font-semibold"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavHighlight"
                  className="absolute inset-0 bg-neutral-800 rounded-lg shadow-xs"
                  transition={{ type: "spring", damping: 25, stiffness: 380 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-emerald-400"
                      : "text-neutral-500 group-hover:text-neutral-300"
                  }`}
                />
                {toggleSidebar && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>
              {toggleSidebar && item.badge !== undefined && (
                <div className="relative z-10 flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    {item.badge}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>


      {/* Theme Toggle Button */}
      <div className="px-3 py-1.5 border-t border-neutral-800/80 bg-neutral-950 shrink-0">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 transition-colors cursor-pointer"
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            )}
            {toggleSidebar && (
              <span className="truncate">
                {isDark ? "Light Theme" : "Dark Theme"}
              </span>
            )}
          </div>
          {toggleSidebar && (
            <span className="text-[10px] text-neutral-500 font-medium shrink-0">
              Switch
            </span>
          )}
        </motion.button>
      </div>


      {/* Shop Account & Logout */}
      {currentShop && (
        <div className="px-3 py-2 border-t border-neutral-800/80 bg-neutral-950/90 shrink-0">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800/60">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Store className="w-3.5 h-3.5" />
              </div>
              {toggleSidebar && (
                <div className="min-w-0 flex-1 leading-tight text-left">
                  <span className="text-[11px] font-bold text-neutral-200 block truncate">
                    {currentShop.name}
                  </span>
                  <span className="text-[9px] text-neutral-400 block truncate font-mono">
                    {currentShop.email}
                  </span>
                </div>
              )}
            </div>
            {toggleSidebar && (
              <button
                type="button"
                onClick={logout}
                className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer shrink-0"
                title="Log out of shop"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </motion.aside>
  );
};
