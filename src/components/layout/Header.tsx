/**
 * Top Application Header
 * Follows the 3-zone contract: Breadcrumb trail & Command Palette on left, status & actions on right.
 */
import { motion } from "framer-motion";
import { Search, Sun, Moon } from "lucide-react";
import { NavTab } from "./Sidebar.tsx";
import { useTheme } from "../../context/ThemeContext.tsx";

interface HeaderProps {
  currentTab: NavTab;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenCommandPalette,
}) => {
  const { toggleTheme, isDark } = useTheme();

  const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Executive overview & key metrics",
    },
    finances: {
      title: "Finances & Cash Flow",
      subtitle:
        "Earnings, operational expenditures, client payments received, and net profit",
    },
    clients: {
      title: "Registered Clients",
      subtitle:
        "Registered retail clients, store directory, and contact records",
    },
    enquiries: {
      title: "Enquiries & Leads",
      subtitle:
        "Inbound store inquiries, on-site POS demo requests, and customer leads",
    },
    reviews: {
      title: "Client Reviews",
      subtitle: "Internal customer happiness feedback and retailer reviews",
    },
  };

  return (
    <header className="h-14 px-4 sm:px-6 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0 select-none z-20">
      {/* Zone 1: Current Tab Title & Command Search */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 sm:flex-initial">
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2 truncate">
            <span>{TAB_TITLES[currentTab]?.title || "StockForge"}</span>
            <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              REST API
            </span>
          </h1>
          <p className="text-[11px] text-neutral-400 hidden lg:block truncate max-w-sm">
            {TAB_TITLES[currentTab]?.subtitle}
          </p>
        </div>

        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Open Command Palette"
            aria-label="Open Command Palette"
          >
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] text-neutral-400 hidden lg:inline">
              Search or jump to...
            </span>
            <span className="text-[11px] text-neutral-400 lg:hidden">
              Search
            </span>
          </motion.button>
        )}
      </div>

      {/* Zone 2: Status, Store Switcher, Tools & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-1.5 sm:px-2.5 sm:py-1.5 flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-800/60 hover:border-neutral-700 cursor-pointer"
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden 2xl:inline text-[11px] font-medium text-neutral-300">
                Light
              </span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden 2xl:inline text-[11px] font-medium text-neutral-400">
                Dark
              </span>
            </>
          )}
        </motion.button>
      </div>
    </header>
  );
};
