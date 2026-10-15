/**
 * CommandPaletteModal Component
 * Power-user quick launcher, navigation switcher, and catalog search (Ctrl+K / Cmd+K)
 */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  ArrowRight,
  Sun,
  Moon,
  UserCheck,
  MessageSquare,
  Star,
} from "lucide-react";
import { NavTab } from "../layout/Sidebar.tsx";
import { useTheme } from "../../context/ThemeContext.tsx";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  category: "Screens" | "Quick Actions";
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Base navigation & action items
  const baseItems: PaletteItem[] = useMemo(
    () => [
      {
        id: "nav-dashboard",
        title: "Dashboard Overview",
        subtitle: "Key business metrics, recent activities, and performance",
        icon: LayoutDashboard,
        category: "Screens",
        action: () => {
          onNavigate("dashboard");
          onClose();
        },
      },
      {
        id: "nav-clients",
        title: "Registered Clients & Stores",
        subtitle: "Manage registered clients, retail accounts, and store details",
        icon: UserCheck,
        category: "Screens",
        action: () => {
          onNavigate("clients");
          onClose();
        },
      },
      {
        id: "nav-enquiries",
        title: "Customer Enquiries & Demo Leads",
        subtitle: "View inbound inquiries, POS demo requests, and customer leads",
        icon: MessageSquare,
        category: "Screens",
        action: () => {
          onNavigate("enquiries");
          onClose();
        },
      },
      {
        id: "nav-reviews",
        title: "Happy Clients Reviews",
        subtitle: "Customer satisfaction ratings, stars, and internal reviews",
        icon: Star,
        category: "Screens",
        action: () => {
          onNavigate("reviews");
          onClose();
        },
      },
      {
        id: "action-toggle-theme",
        title: isDark
          ? "Switch to Light Theme (Default)"
          : "Switch to Dark Theme",
        subtitle: isDark
          ? "Change interface to bright daylight mode"
          : "Change interface to deep obsidian night mode",
        icon: isDark ? Sun : Moon,
        category: "Quick Actions",
        action: () => {
          toggleTheme();
          onClose();
        },
      },
    ],
    [
      onNavigate,
      onClose,
      isDark,
      toggleTheme,
    ],
  );

  // Filter items if user types a query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return baseItems;
    }

    return baseItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q),
    );
  }, [query, baseItems]);

  // Adjust selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev + 1) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) =>
          (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Keep selected item scrolled into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`,
    ) as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cmd-palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            key="cmd-palette-box"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 420,
              mass: 0.5,
            }}
            className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-neutral-800 bg-neutral-950/70 gap-3">
              <Search className="w-5 h-5 text-neutral-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search screens, pages, or quick actions..."
                className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-sm focus:outline-hidden"
              />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-800 border border-neutral-700 rounded">
                Esc
              </kbd>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="p-2 overflow-y-auto max-h-[55vh] space-y-1"
            >
              {filteredItems.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-500 space-y-1">
                  <p>No matching commands or pages found</p>
                  <p className="text-[11px] text-neutral-600">
                    Try searching for &quot;clients&quot;, &quot;enquiries&quot;, or &quot;reviews&quot;
                  </p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-neutral-800/90 text-neutral-100"
                          : "text-neutral-300 hover:bg-neutral-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-neutral-950 text-neutral-400 border-neutral-800"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate flex items-center gap-2">
                            <span>{item.title}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer controls hint */}
            <div className="px-4 py-2 border-t border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-500">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="font-mono text-[10px] bg-neutral-800 px-1 rounded mr-1">
                    ↑↓
                  </kbd>
                  Navigate
                </span>
                <span>
                  <kbd className="font-mono text-[10px] bg-neutral-800 px-1 rounded mr-1">
                    ↵
                  </kbd>
                  Select
                </span>
              </div>
              <div>
                <span>
                  <kbd className="font-mono text-[10px] bg-neutral-800 px-1 rounded mr-1">
                    ESC
                  </kbd>
                  Close
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
