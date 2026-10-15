/**
 * Shared Table & Card ActionMenu Component
 * Displays a dropdown menu with multiple customizable actions:
 * label, icon, color, divider, and click handlers.
 */
import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ActionColor =
  | "default"
  | "neutral"
  | "emerald"
  | "rose"
  | "danger"
  | "amber"
  | "warning"
  | "sky"
  | "info"
  | "indigo";

export interface ActionItem {
  id?: string;
  label: string;
  icon?: React.ElementType;
  color?: ActionColor;
  onClick: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  hidden?: boolean;
  divider?: boolean;
}

export interface ActionMenuProps {
  items: (ActionItem | null | undefined | false)[];
  align?: "left" | "right";
  orientation?: "vertical" | "horizontal";
  triggerSize?: "sm" | "md";
  triggerLabel?: string;
  triggerIcon?: React.ElementType;
  className?: string;
  title?: string;
}

const COLOR_STYLES: Record<
  ActionColor,
  { text: string; hover: string; icon: string }
> = {
  default: {
    text: "text-neutral-200",
    hover: "hover:bg-neutral-800 hover:text-neutral-100",
    icon: "text-neutral-400 group-hover:text-neutral-200",
  },
  neutral: {
    text: "text-neutral-300",
    hover: "hover:bg-neutral-800 hover:text-neutral-100",
    icon: "text-neutral-400 group-hover:text-neutral-200",
  },
  emerald: {
    text: "text-emerald-400",
    hover: "hover:bg-emerald-500/10 hover:text-emerald-300",
    icon: "text-emerald-400 group-hover:text-emerald-300",
  },
  rose: {
    text: "text-rose-400",
    hover: "hover:bg-rose-500/10 hover:text-rose-300",
    icon: "text-rose-400 group-hover:text-rose-300",
  },
  danger: {
    text: "text-rose-400",
    hover: "hover:bg-rose-500/10 hover:text-rose-300",
    icon: "text-rose-400 group-hover:text-rose-300",
  },
  amber: {
    text: "text-amber-400",
    hover: "hover:bg-amber-500/10 hover:text-amber-300",
    icon: "text-amber-400 group-hover:text-amber-300",
  },
  warning: {
    text: "text-amber-400",
    hover: "hover:bg-amber-500/10 hover:text-amber-300",
    icon: "text-amber-400 group-hover:text-amber-300",
  },
  sky: {
    text: "text-sky-400",
    hover: "hover:bg-sky-500/10 hover:text-sky-300",
    icon: "text-sky-400 group-hover:text-sky-300",
  },
  info: {
    text: "text-sky-400",
    hover: "hover:bg-sky-500/10 hover:text-sky-300",
    icon: "text-sky-400 group-hover:text-sky-300",
  },
  indigo: {
    text: "text-indigo-400",
    hover: "hover:bg-indigo-500/10 hover:text-indigo-300",
    icon: "text-indigo-400 group-hover:text-indigo-300",
  },
};

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  align = "right",
  orientation = "vertical",
  triggerSize = "sm",
  triggerLabel,
  triggerIcon: CustomTriggerIcon,
  className = "",
  title = "Actions",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const validItems = items.filter(
    (item): item is ActionItem => Boolean(item) && !(item as ActionItem).hidden,
  );

  // Close dropdown on outside click or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (validItems.length === 0) {
    return null;
  }

  const TriggerIcon =
    CustomTriggerIcon ||
    (orientation === "horizontal" ? MoreHorizontal : MoreVertical);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border transition-colors cursor-pointer ${
          isOpen
            ? "bg-neutral-800 text-neutral-100 border-neutral-700 shadow-sm"
            : "text-neutral-400 hover:text-neutral-200 bg-neutral-900/60 hover:bg-neutral-800 border-neutral-800/80 hover:border-neutral-700"
        } ${
          triggerSize === "sm"
            ? "p-1.5 text-xs"
            : "px-2.5 py-1.5 text-xs font-medium"
        }`}
        title={title}
        aria-label={title}
        aria-expanded={isOpen}
      >
        <TriggerIcon className="w-4 h-4 shrink-0" />
        {triggerLabel && <span className="truncate">{triggerLabel}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`absolute z-50 mt-1.5 w-44 rounded-xl bg-neutral-900 border border-neutral-800/90 shadow-2xl py-1 text-xs focus:outline-hidden ${
              align === "right" ? "right-0" : "left-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {validItems.map((item, index) => {
              const Icon = item.icon;
              const colorStyle = COLOR_STYLES[item.color || "default"];

              return (
                <React.Fragment key={item.id || `${item.label}-${index}`}>
                  {item.divider && (
                    <div className="my-1 border-t border-neutral-800/80" />
                  )}
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.disabled) return;
                      setIsOpen(false);
                      item.onClick(e);
                    }}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 transition-colors cursor-pointer group ${
                      item.disabled
                        ? "opacity-40 cursor-not-allowed text-neutral-500"
                        : `${colorStyle.text} ${colorStyle.hover}`
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          item.disabled ? "text-neutral-600" : colorStyle.icon
                        }`}
                      />
                    )}
                    <span className="truncate font-medium">{item.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
