/**
 * Top Application Header
 * Follows the 3-zone contract: Breadcrumb trail & Command Palette on left, status & actions on right.
 */
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Keyboard,
  Sun,
  Moon,
  Languages,
  Store,
  LogOut,
  Globe,
  ChevronDown,
  CheckCircle2,
  Building,
} from "lucide-react";
import { NavTab } from "./Sidebar.tsx";
import { MODIFIER_LABEL } from "../../lib/hooks/useGlobalShortcuts.ts";
import { useTheme } from "../../context/ThemeContext.tsx";
import { useLanguage } from "../../context/LanguageContext.tsx";
import { useAuth } from "../../context/AuthContext.tsx";

interface HeaderProps {
  currentTab: NavTab;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenCommandPalette,
  onOpenShortcutsHelp,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { t, toggleLanguage, isNepali } = useLanguage();
  const { currentShop, logout } = useAuth();

  const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: t("nav_dashboard"),
      subtitle: isNepali
        ? "कार्यकारी सारांश र मुख्य वित्तीय सूचकहरू"
        : "Executive overview & key metrics",
    },

    clients: {
      title: t("nav_clients"),
      subtitle: isNepali
        ? "दर्ता भएका पसलहरू, ग्राहक खाता, क्रेडिट सीमा र सम्पर्क विवरण"
        : "Registered retail clients, khata credit balances, and store directory",
    },
    enquiries: {
      title: t("nav_enquiries"),
      subtitle: isNepali
        ? "वेबसाइट तथा काउन्टर सोधपुछ, अन-साइट डेमो अनुरोध र लिड्स"
        : "Inbound store inquiries, on-site POS demo requests, and customer leads",
    },
    reviews: {
      title: t("nav_reviews"),
      subtitle: isNepali
        ? "सन्तुष्ट ग्राहक तथा पसलेहरूको आन्तरिक मूल्याङ्कन र समीक्षा"
        : "Internal customer happiness feedback and retailer reviews",
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
            title={`Open Command Palette (${MODIFIER_LABEL}+K)`}
            aria-label="Open Command Palette"
          >
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] text-neutral-400 hidden lg:inline">
              {isNepali ? "खोज्नुहोस् वा जानुहोस्..." : "Search or jump to..."}
            </span>
            <span className="text-[11px] text-neutral-400 lg:hidden">
              {isNepali ? "खोज्नुहोस्" : "Search"}
            </span>
            <kbd className="inline-flex items-center text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-700/60">
              {MODIFIER_LABEL}+K
            </kbd>
          </motion.button>
        )}
      </div>

      {/* Zone 2: Status, Store Switcher, Tools & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Language Toggle Button (EN <-> NP) */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={toggleLanguage}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs text-neutral-300 hover:text-neutral-100 bg-neutral-950/80 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-800/70 hover:border-emerald-500/50 cursor-pointer shadow-xs"
          title={
            isNepali
              ? "Switch to English (Alt+L)"
              : "नेपाली भाषामा बदल्नुहोस् (Alt+L)"
          }
          aria-label="Toggle Language"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-bold text-emerald-400 font-mono">
            {isNepali ? "नेपाली" : "EN"}
          </span>
          <kbd className="hidden 2xl:inline-flex text-[9px] font-mono text-neutral-500 bg-neutral-900 px-1 py-0.2 rounded border border-neutral-800">
            Alt+L
          </kbd>
        </motion.button>

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

        {/* Shortcuts Guide Button */}
        {onOpenShortcutsHelp && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenShortcutsHelp}
            className="hidden sm:inline-flex p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-800/60 hover:border-neutral-700 cursor-pointer"
            title="Keyboard Shortcuts Cheatsheet (?)"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </header>
  );
};
