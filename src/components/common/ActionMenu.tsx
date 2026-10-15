/**
 * Shared Table & Card ActionMenu Component
 * Displays a dropdown menu with multiple customizable actions:
 * label, icon, color, divider, and click handlers.
 * Renders via React Portal to prevent clipping by overflow-hidden table containers.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  }>({
    top: 0,
    left: 0,
    openUp: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const validItems = items.filter(
    (item): item is ActionItem => Boolean(item) && !(item as ActionItem).hidden,
  );

  // Compute fixed screen coordinates dynamically so menu is never clipped by containers
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 180;
    const menuEstimatedHeight = validItems.length * 36 + 16;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Determine if menu should open upward or downward
    const openUp =
      rect.bottom + menuEstimatedHeight > windowHeight &&
      rect.top > menuEstimatedHeight;

    let left = align === "right" ? rect.right - menuWidth : rect.left;

    // Viewport horizontal clamping
    if (left + menuWidth > windowWidth - 12) {
      left = windowWidth - menuWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    const top = openUp ? rect.top - 4 : rect.bottom + 4;

    setCoords({ top, left, openUp });
  }, [align, validItems.length]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown on outside click, escape key, or window scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen]);

  if (validItems.length === 0) {
    return null;
  }

  const TriggerIcon =
    CustomTriggerIcon ||
    (orientation === "horizontal" ? MoreHorizontal : MoreVertical);

  return (
    <>
      <div
        className={`relative inline-block text-left ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
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
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: coords.openUp ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: coords.openUp ? 4 : -4 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top: coords.openUp ? undefined : `${coords.top}px`,
                  bottom: coords.openUp
                    ? `${window.innerHeight - coords.top}px`
                    : undefined,
                  left: `${coords.left}px`,
                  width: "180px",
                  zIndex: 9999,
                }}
                className="rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-1 text-xs select-none focus:outline-hidden"
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
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};
