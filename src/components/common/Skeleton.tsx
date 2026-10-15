/**
 * Reusable Skeleton Loading Components
 * Provides sleek, shimmering loading placeholders for tables, cards, and textual content.
 */
import React from "react";

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rounded",
  width,
  height,
  animate = true,
  style = {},
}) => {
  const variantStyles = {
    text: "rounded-md h-3.5 my-1",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-xl",
  }[variant];

  const inlineStyles: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      style={inlineStyles}
      className={`bg-neutral-800/70 border border-neutral-750/30 ${
        animate ? "animate-pulse" : ""
      } ${variantStyles} ${className}`}
      aria-hidden="true"
    />
  );
};

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  columnWidths?: (string | undefined)[];
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  columnWidths,
  showHeader = true,
  compact = false,
  className = "",
}) => {
  const rowCount = Math.max(1, rows);
  const colCount = Math.max(1, columns);

  // Stagger widths for a natural, realistic skeleton appearance
  const randomWidths = ["w-3/4", "w-1/2", "w-2/3", "w-4/5", "w-5/6", "w-3/5"];

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <table className="w-full text-left text-xs">
        {showHeader && (
          <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
            <tr>
              {Array.from({ length: colCount }).map((_, cIdx) => (
                <th
                  key={`th-skel-${cIdx}`}
                  className={`${compact ? "py-2 px-3" : "py-3 px-4"}`}
                  style={{ width: columnWidths?.[cIdx] }}
                >
                  <Skeleton
                    variant="rounded"
                    height={12}
                    className={
                      cIdx === 0
                        ? "w-24"
                        : cIdx === colCount - 1
                          ? "w-16 ml-auto"
                          : "w-20"
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-neutral-800/60">
          {Array.from({ length: rowCount }).map((_, rIdx) => (
            <tr key={`tr-skel-${rIdx}`} className="bg-neutral-900/30">
              {Array.from({ length: colCount }).map((_, cIdx) => {
                const widthClass =
                  columnWidths?.[cIdx] ||
                  randomWidths[(rIdx + cIdx) % randomWidths.length];

                return (
                  <td
                    key={`td-skel-${rIdx}-${cIdx}`}
                    className={`${compact ? "py-2.5 px-3" : "py-3.5 px-4"}`}
                  >
                    {cIdx === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton
                          variant="rounded"
                          className={`${
                            compact ? "w-7 h-7" : "w-9 h-9"
                          } shrink-0`}
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <Skeleton height={14} className="w-3/4" />
                          <Skeleton height={10} className="w-1/2" />
                        </div>
                      </div>
                    ) : cIdx === colCount - 1 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton
                          variant="rounded"
                          height={26}
                          className="w-16 ml-auto"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Skeleton height={13} className={widthClass} />
                        {rIdx % 2 === 0 && (
                          <Skeleton height={9} className="w-1/3" />
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export interface CardSkeletonProps {
  count?: number;
  className?: string;
  gridClassName?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 3,
  className = "",
  gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
}) => {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`card-skel-${idx}`}
          className={`p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4 ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="rounded" className="w-10 h-10 shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <Skeleton height={14} className="w-28" />
                <Skeleton height={10} className="w-20" />
              </div>
            </div>
            <Skeleton variant="rounded" height={22} className="w-14" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton height={12} className="w-full" />
            <Skeleton height={12} className="w-4/5" />
            <Skeleton height={12} className="w-2/3" />
          </div>
          <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between">
            <Skeleton height={10} className="w-24" />
            <Skeleton height={16} className="w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

