/**
 * Global Keyboard Shortcuts Hook & Registry
 * StockForge Desktop & Web POS
 */
import { useEffect } from "react";
import { NavTab } from "../../components/layout/Sidebar.tsx";

export const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

export const MODIFIER_LABEL = isMac ? "⌘" : "Ctrl";

export interface ShortcutDefinition {
  id: string;
  category: "Navigation" | "Point of Sale" | "General & Quick Actions";
  label: string;
  description: string;
  keys: string[];
  displayKeys: string;
}

export const SHORTCUT_REGISTRY: ShortcutDefinition[] = [
  {
    id: "nav-dashboard",
    category: "Navigation",
    label: "Dashboard",
    description: "View sales overview, KPIs, and revenue metrics",
    keys: ["ctrl+d", "cmd+d", "alt+d"],
    displayKeys: `${MODIFIER_LABEL}+D`,
  },
  {
    id: "nav-clients",
    category: "Navigation",
    label: "Registered Clients",
    description:
      "Manage registered clients, retail stores, and accounts directory",
    keys: ["alt+c", "ctrl+shift+c", "cmd+shift+c"],
    displayKeys: "Alt+C",
  },
  {
    id: "nav-enquiries",
    category: "Navigation",
    label: "Enquiries & Demo Leads",
    description: "View website inquiries, on-site demo requests, and leads",
    keys: ["alt+q", "ctrl+shift+q", "cmd+shift+q"],
    displayKeys: "Alt+Q",
  },
  {
    id: "action-command-palette",
    category: "General & Quick Actions",
    label: "Command Palette",
    description: "Quickly search all screens, commands, and catalog items",
    keys: ["ctrl+k", "cmd+k"],
    displayKeys: `${MODIFIER_LABEL}+K`,
  },
  {
    id: "action-help",
    category: "General & Quick Actions",
    label: "Shortcuts Cheatsheet",
    description: "Show this keyboard shortcuts guide",
    keys: ["?", "ctrl+/", "cmd+/"],
    displayKeys: "?",
  },
  {
    id: "general-escape",
    category: "General & Quick Actions",
    label: "Close / Cancel",
    description: "Close active modal, command palette, or dismiss sheet",
    keys: ["escape"],
    displayKeys: "Esc",
  },
  {
    id: "general-toggle-theme",
    category: "General & Quick Actions",
    label: "Toggle Light / Dark Theme",
    description: "Switch between light daylight and dark obsidian mode",
    keys: ["alt+t", "ctrl+shift+t", "cmd+shift+t"],
    displayKeys: "Alt+T",
  },
  {
    id: "general-toggle-language",
    category: "General & Quick Actions",
    label: "Switch Language (EN <-> NP)",
    description: "Toggle UI language between English and Nepali",
    keys: ["alt+l", "ctrl+shift+l", "cmd+shift+l"],
    displayKeys: "Alt+L",
  },
];

export interface UseGlobalShortcutsOptions {
  onNavigate: (tab: NavTab) => void;
  onOpenCommandPalette: () => void;
  onOpenShortcutsHelp: () => void;
  onCloseModals?: () => void;
  onOpenCreateProduct?: () => void;
  onToggleTheme?: () => void;
  onToggleLanguage?: () => void;
}

export function isTypingInInput(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement | null;
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    Boolean(target.isContentEditable)
  );
}

export function useGlobalShortcuts({
  onNavigate,
  onOpenCommandPalette,
  onOpenShortcutsHelp,
  onCloseModals,
  onOpenCreateProduct,
  onToggleTheme,
  onToggleLanguage,
}: UseGlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const key = e.key.toLowerCase();

      // Toggle Theme: Alt+T or Ctrl+Shift+T (works everywhere)
      if ((isAlt && key === "t") || (isModifier && e.shiftKey && key === "t")) {
        e.preventDefault();
        if (onToggleTheme) {
          onToggleTheme();
        }
        return;
      }

      // Toggle Language: Alt+L or Ctrl+Shift+L (works everywhere)
      if ((isAlt && key === "l") || (isModifier && e.shiftKey && key === "l")) {
        e.preventDefault();
        if (onToggleLanguage) {
          onToggleLanguage();
        }
        return;
      }
      const inInput = isTypingInInput(e);

      // Escape key
      if (e.key === "Escape") {
        if (onCloseModals) {
          onCloseModals();
        }
        return;
      }

      // Command Palette: Ctrl+K or Cmd+K
      if (isModifier && key === "k") {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      // Shortcuts Help: "?" (when not in input) or Ctrl+/ or Cmd+/
      if ((!inInput && e.key === "?") || (isModifier && key === "/")) {
        e.preventDefault();
        onOpenShortcutsHelp();
        return;
      }

      // Create Product: Ctrl+Shift+P or Cmd+Shift+P
      // Ctrl+D / Cmd+D or Alt+D: Dashboard
      if (
        (isModifier && !e.shiftKey && key === "d") ||
        (isAlt && key === "d")
      ) {
        e.preventDefault();
        onNavigate("dashboard");
        return;
      }

      // Alt+C or Ctrl+Shift+C: Registered Clients
      if ((isAlt && key === "c") || (isModifier && e.shiftKey && key === "c")) {
        e.preventDefault();
        onNavigate("clients");
        return;
      }

      // Alt+Q or Ctrl+Shift+Q: Enquiries
      if ((isAlt && key === "q") || (isModifier && e.shiftKey && key === "q")) {
        e.preventDefault();
        onNavigate("enquiries");
        return;
      }

      // Alt+R or Ctrl+Shift+R: Reviews
      if ((isAlt && key === "r") || (isModifier && e.shiftKey && key === "r")) {
        e.preventDefault();
        onNavigate("reviews");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onNavigate,
    onOpenCommandPalette,
    onOpenShortcutsHelp,
    onCloseModals,
    onOpenCreateProduct,
    onToggleTheme,
  ]);
}
