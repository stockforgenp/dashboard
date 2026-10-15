/**
 * Shared Table Component for StockForge Dashboard
 * Standardized, theme-aware, accessible data table with built-in:
 * - Skeleton loading state (animated shimmer matching columns)
 * - Empty state with customizable iconography, messaging, and actions
 * - Interactive sorting (asc/desc with column headers)
 * - Row click handlers, custom cell rendering, and pagination support
 */
import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TableSkeleton } from "./Skeleton";

export interface Column<T> {
  key?: string;
  id?: string;
  header: React.ReactNode;
  accessor?: keyof T | ((row: T, index: number) => React.ReactNode);
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
  width?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | boolean | Date | null | undefined;
}

export interface TableEmptyStateConfig {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string | number;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode | TableEmptyStateConfig;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ElementType;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  striped?: boolean;
  compact?: boolean;
  className?: string;
  containerClassName?: string;
  stickyHeader?: boolean;
  hoverable?: boolean;
  footer?: React.ReactNode;
  defaultSortKey?: string;
  defaultSortOrder?: "asc" | "desc";
  pagination?: PaginationConfig;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  skeletonRows = 5,
  emptyState,
  emptyTitle = "No records found",
  emptyDescription = "There are no data records available for this view.",
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  onRowClick,
  rowClassName,
  striped = false,
  compact = false,
  className = "",
  containerClassName = "",
  stickyHeader = false,
  hoverable = true,
  footer,
  defaultSortKey,
  defaultSortOrder = "asc",
  pagination,
}: TableProps<T>): React.ReactElement {
  // Sorting state
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  const getColIdentifier = (col: Column<T>, idx: number) =>
    col.key || col.id || `col-${idx}`;

  const handleHeaderClick = (col: Column<T>, idx: number) => {
    if (!col.sortable) return;
    const key = getColIdentifier(col, idx);
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Sorted data calculation
  const sortedData = useMemo(() => {
    if (!sortKey || !data || data.length === 0) return data;
    const targetCol = columns.find(
      (c, idx) => getColIdentifier(c, idx) === sortKey,
    );
    if (!targetCol) return data;

    return [...data].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;

      if (targetCol.sortValue) {
        valA = targetCol.sortValue(a);
        valB = targetCol.sortValue(b);
      } else if (typeof targetCol.accessor === "function") {
        valA = targetCol.accessor(a, 0);
        valB = targetCol.accessor(b, 0);
      } else if (targetCol.accessor) {
        valA = a[targetCol.accessor];
        valB = b[targetCol.accessor];
      }

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let comparison = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else if (valA instanceof Date && valB instanceof Date) {
        comparison = valA.getTime() - valB.getTime();
      } else {
        comparison = String(valA).localeCompare(String(valB), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortOrder, columns]);

  // Derive column alignment classes
  const getAlignClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  const columnWidths = useMemo(
    () => columns.map((col) => col.width),
    [columns],
  );

  const renderEmptyContent = () => {
    if (React.isValidElement(emptyState)) {
      return emptyState;
    }
    if (emptyState && typeof emptyState === "object") {
      const config = emptyState as TableEmptyStateConfig;
      return (
        <div className="p-12 text-center space-y-3 bg-neutral-900/40">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-neutral-400 mx-auto">
            {config.icon || <EmptyIcon className="w-6 h-6" />}
          </div>
          <h3 className="text-sm font-bold text-neutral-200">
            {config.title || emptyTitle}
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            {config.description || emptyDescription}
          </p>
          {config.action && (
            <div className="pt-2">
              <button
                type="button"
                onClick={config.action.onClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {config.action.icon}
                <span>{config.action.label}</span>
              </button>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="p-12 text-center space-y-3 bg-neutral-900/40">
        <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-neutral-400 mx-auto">
          <EmptyIcon className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-neutral-200">{emptyTitle}</h3>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
          {emptyDescription}
        </p>
        {emptyAction && <div className="pt-2">{emptyAction}</div>}
      </div>
    );
  };

  return (
    <div
      className={`bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs flex flex-col ${containerClassName}`}
    >
      <div className="overflow-x-auto w-full">
        {isLoading ? (
          <TableSkeleton
            rows={skeletonRows}
            columns={columns.length}
            columnWidths={columnWidths}
            compact={compact}
          />
        ) : sortedData.length === 0 ? (
          renderEmptyContent()
        ) : (
          <table className={`w-full text-xs ${className}`}>
            <thead
              className={`bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800 ${
                stickyHeader ? "sticky top-0 z-10 backdrop-blur-xs" : ""
              }`}
            >
              <tr>
                {columns.map((col, idx) => {
                  const key = getColIdentifier(col, idx);
                  const isSorted = sortKey === key;
                  const alignClass = getAlignClass(col.align);

                  return (
                    <th
                      key={key}
                      style={{ width: col.width }}
                      onClick={() => handleHeaderClick(col, idx)}
                      className={`${
                        compact ? "py-2 px-3" : "py-3 px-4"
                      } ${alignClass} ${
                        col.sortable
                          ? "cursor-pointer select-none hover:text-neutral-200 transition-colors"
                          : ""
                      } ${col.headerClassName || ""}`}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          col.align === "right"
                            ? "justify-end w-full"
                            : col.align === "center"
                              ? "justify-center w-full"
                              : ""
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-neutral-500">
                            {isSorted ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-emerald-400" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-60 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {sortedData.map((row, rowIdx) => {
                const key = keyExtractor
                  ? keyExtractor(row, rowIdx)
                  : (row as { id?: string | number }).id ?? rowIdx;

                const customRowClass =
                  typeof rowClassName === "function"
                    ? rowClassName(row, rowIdx)
                    : rowClassName || "";

                const isStriped = striped && rowIdx % 2 === 1;

                return (
                  <tr
                    key={String(key)}
                    onClick={() => onRowClick?.(row, rowIdx)}
                    className={`${
                      isStriped ? "bg-neutral-900/60" : "bg-neutral-900/20"
                    } ${
                      hoverable ? "hover:bg-neutral-800/40" : ""
                    } ${
                      onRowClick ? "cursor-pointer" : ""
                    } transition-colors ${customRowClass}`}
                  >
                    {columns.map((col, colIdx) => {
                      const alignClass = getAlignClass(col.align);
                      let content: React.ReactNode = null;

                      if (col.render) {
                        content = col.render(row, rowIdx);
                      } else if (typeof col.accessor === "function") {
                        content = col.accessor(row, rowIdx);
                      } else if (col.accessor) {
                        content = row[col.accessor] as unknown as React.ReactNode;
                      }

                      return (
                        <td
                          key={getColIdentifier(col, colIdx)}
                          style={{ width: col.width }}
                          className={`${
                            compact ? "py-2.5 px-3" : "py-3.5 px-4"
                          } ${alignClass} ${col.className || ""}`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Pagination */}
      {(footer || pagination) && (
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          {footer ? (
            <div className="w-full">{footer}</div>
          ) : pagination ? (
            <>
              <div className="text-[11px] font-mono text-neutral-500">
                Showing{" "}
                <span className="text-neutral-300 font-bold">
                  {Math.min(
                    (pagination.currentPage - 1) * pagination.pageSize + 1,
                    pagination.totalItems,
                  )}
                </span>
                {" - "}
                <span className="text-neutral-300 font-bold">
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    pagination.totalItems,
                  )}
                </span>{" "}
                of{" "}
                <span className="text-neutral-300 font-bold">
                  {pagination.totalItems}
                </span>{" "}
                items
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.currentPage <= 1}
                  onClick={() =>
                    pagination.onPageChange(pagination.currentPage - 1)
                  }
                  className="px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Prev</span>
                </button>

                <span className="text-[11px] font-mono px-2 text-neutral-400">
                  Page {pagination.currentPage} of{" "}
                  {Math.max(
                    1,
                    Math.ceil(pagination.totalItems / pagination.pageSize),
                  )}
                </span>

                <button
                  type="button"
                  disabled={
                    pagination.currentPage >=
                    Math.ceil(pagination.totalItems / pagination.pageSize)
                  }
                  onClick={() =>
                    pagination.onPageChange(pagination.currentPage + 1)
                  }
                  className="px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="text-[11px]">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
