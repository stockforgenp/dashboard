/**
 * FinancesView Component
 * High-performance Income & Expense Tracking Hub for StockForge Dashboard.
 * Monitors earnings, operational expenditures, client payments received, and net cashflow.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  RefreshCw,
  Building2,
  FileText,
  Trash2,
  Edit2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { Table, Column } from "../components/common/Table.tsx";
import { Skeleton } from "../components/common/Skeleton.tsx";
import { ConfirmDialog } from "../components/common/ConfirmDialog.tsx";
import { ActionMenu } from "../components/common/ActionMenu.tsx";
import { FinanceEntryModal } from "../components/forms/FinanceEntryModal.tsx";
import {
  FinanceTransaction,
  FinanceTransactionType,
  FinanceStats,
  getAllFinances,
  getFinanceStats,
  deleteFinance,
} from "../lib/services/financeService.ts";
import { Client, getAllClients } from "../lib/services/clientService.ts";
import { formatDate } from "../lib/utils/format.ts";

export const FinancesView: React.FC = () => {
  const { isNepali, formatNumberByLang } = useLanguage();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Core Data
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [stats, setStats] = useState<FinanceStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0,
    incomeCount: 0,
    expenseCount: 0,
    incomeByCategory: {},
    expenseByCategory: {},
    recentTransactions: [],
  });
  const [clients, setClients] = useState<Client[]>([]);

  // Filter States
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] =
    useState<FinanceTransactionType>("income");
  const [editingTransaction, setEditingTransaction] =
    useState<FinanceTransaction | null>(null);

  // Delete Confirmation State
  const [transactionToDelete, setTransactionToDelete] =
    useState<FinanceTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch data
  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const [fetchedList, fetchedStats, fetchedClients] = await Promise.all([
          getAllFinances(),
          getFinanceStats(),
          getAllClients(),
        ]);

        setTransactions(fetchedList);
        setStats(fetchedStats);
        setClients(fetchedClients);

        if (isManual) {
          showToast(
            isNepali
              ? "आम्दानी तथा खर्च विवरण अद्यावधिक भयो"
              : "Finance data refreshed",
            "info",
          );
        }
      } catch (err: any) {
        console.error("Failed to load finance data:", err);
        showToast(
          err.message ||
            (isNepali
              ? "डेटा लोड हुन सकेन"
              : "Failed to load finance transactions"),
          "error",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isNepali, showToast],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open modal helper
  const handleOpenAdd = (type: FinanceTransactionType) => {
    setModalInitialType(type);
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: FinanceTransaction) => {
    setEditingTransaction(t);
    setModalInitialType(t.type);
    setIsModalOpen(true);
  };

  // Delete transaction
  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFinance(transactionToDelete.id);
      showToast(
        isNepali
          ? `${transactionToDelete.type === "income" ? "आम्दानी" : "खर्च"} रेकर्ड हटाइयो`
          : "Transaction record deleted successfully",
        "success",
      );
      setTransactionToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error("Delete failed:", err);
      showToast(err.message || "Failed to delete transaction", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered transactions for table
  const filteredData = useMemo(() => {
    return transactions.filter((item) => {
      // Type filter
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // Client filter
      if (clientFilter !== "all") {
        if (clientFilter === "unlinked") {
          if (item.clientId) return false;
        } else if (item.clientId !== clientFilter) {
          return false;
        }
      }

      // Search query (search bar)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesClient = item.clientName?.toLowerCase().includes(q);
        const matchesShop = item.clientShopName?.toLowerCase().includes(q);
        const matchesRef = item.reference?.toLowerCase().includes(q);
        const matchesPayment = item.paymentMethod?.toLowerCase().includes(q);
        const matchesNote = item.note?.toLowerCase().includes(q);
        const matchesAmount = String(item.amount).includes(q);

        if (
          !matchesCategory &&
          !matchesClient &&
          !matchesShop &&
          !matchesRef &&
          !matchesPayment &&
          !matchesNote &&
          !matchesAmount
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, clientFilter, searchQuery]);

  // Derived available categories for the category filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (typeFilter === "all" || t.type === typeFilter) {
        set.add(t.category);
      }
    });
    return Array.from(set).sort();
  }, [transactions, typeFilter]);

  // Client-linked revenue calculation
  const clientLinkedIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income" && Boolean(t.clientId))
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [transactions]);

  // Table Columns
  const columns = useMemo<Column<FinanceTransaction>[]>(
    () => [
      {
        id: "date",
        header: isNepali ? "मिति र सन्दर्भ" : "Date & Ref",
        width: "160px",
        sortable: true,
        sortValue: (t) => t.date,
        render: (t) => (
          <div>
            <div className="font-mono text-neutral-200 font-medium text-xs">
              {formatDate(t.date)}
            </div>
            {t.reference ? (
              <div className="text-[10px] font-mono text-neutral-400 truncate max-w-[140px] mt-0.5">
                Ref: {t.reference}
              </div>
            ) : (
              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                {t.paymentMethod || "Direct"}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "type",
        header: isNepali ? "प्रकार" : "Type",
        width: "110px",
        render: (t) => (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              t.type === "income"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
            }`}
          >
            {t.type === "income" ? (
              <>
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                <span>{isNepali ? "कमाई" : "Income"}</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-3 h-3 shrink-0" />
                <span>{isNepali ? "खर्च" : "Expense"}</span>
              </>
            )}
          </span>
        ),
      },
      {
        id: "category",
        header: isNepali ? "कोटी" : "Category",
        width: "160px",
        sortable: true,
        sortValue: (t) => t.category,
        render: (t) => (
          <div className="font-semibold text-neutral-200 text-xs truncate max-w-[160px]">
            {t.category}
          </div>
        ),
      },
      {
        id: "client",
        header: isNepali ? "ग्राहक / पसल" : "Linked Client",
        render: (t) => {
          if (!t.clientId && !t.clientName) {
            return (
              <span className="text-[11px] text-neutral-500 italic">
                {isNepali ? "— जोडिएको छैन —" : "— Unlinked —"}
              </span>
            );
          }
          return (
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
              <div className="min-w-0 truncate">
                <div className="font-bold text-xs text-neutral-100 truncate">
                  {t.clientName || "Client"}
                </div>
                {t.clientShopName && (
                  <div className="text-[10px] text-neutral-400 truncate">
                    {t.clientShopName}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "payment",
        header: isNepali ? "माध्यम" : "Method",
        width: "120px",
        render: (t) => (
          <span className="text-xs text-neutral-300 font-mono">
            {t.paymentMethod || "Cash"}
          </span>
        ),
      },
      {
        id: "note",
        header: isNepali ? "विवरण / कैफियत" : "Note / Remarks",
        render: (t) => (
          <div
            className="text-xs text-neutral-400 truncate max-w-[220px]"
            title={t.note}
          >
            {t.note || <span className="text-neutral-600">—</span>}
          </div>
        ),
      },
      {
        id: "amount",
        header: isNepali ? "रकम" : "Amount",
        align: "right",
        width: "150px",
        sortable: true,
        sortValue: (t) => (t.type === "income" ? t.amount : -t.amount),
        render: (t) => (
          <div className="text-right">
            <span
              className={`font-mono font-extrabold text-sm ${
                t.type === "income" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {t.type === "income" ? "+" : "-"}Rs.{" "}
              {formatNumberByLang(t.amount)}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        width: "60px",
        render: (t) => (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionMenu
              align="right"
              triggerSize="sm"
              title={`Actions for ${t.category}`}
              items={[
                {
                  id: "edit",
                  label: isNepali ? "सम्पादन गर्नुहोस्" : "Edit Record",
                  icon: Edit2,
                  color: "neutral",
                  onClick: () => handleOpenEdit(t),
                },
                {
                  id: "delete",
                  label: isNepali ? "हटाउनुहोस्" : "Delete",
                  icon: Trash2,
                  color: "danger",
                  onClick: () => setTransactionToDelete(t),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [isNepali, formatNumberByLang],
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* KPI Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned (Income) */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "कुल कमाई (आम्दानी)" : "Total Earned (Income)"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="100px" height="32px" className="my-0.5" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
                Rs. {formatNumberByLang(stats.totalIncome)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between font-mono">
              <span>
                {formatNumberByLang(stats.incomeCount)}{" "}
                {isNepali ? "भुक्तानी रेकर्डहरू" : "transactions recorded"}
              </span>
              <span className="text-emerald-400 text-xs font-semibold">
                100% Inflow
              </span>
            </div>
          </div>
        </div>

        {/* Total Spent (Expenses) */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-rose-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "कुल खर्च (खर्चिएको)" : "Total Spent (Expenses)"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="100px" height="32px" className="my-0.5" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tabular-nums">
                Rs. {formatNumberByLang(stats.totalExpenses)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between font-mono">
              <span>
                {formatNumberByLang(stats.expenseCount)}{" "}
                {isNepali ? "खर्च रेकर्डहरू" : "expenses recorded"}
              </span>
              <span className="text-rose-400 text-xs font-semibold">
                Outflow
              </span>
            </div>
          </div>
        </div>

        {/* Net Profit / Balance */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "खुद नाफा / नगद प्रवाह" : "Net Profit / Balance"}
            </span>
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                stats.netProfit >= 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="100px" height="32px" className="my-0.5" />
            ) : (
              <div
                className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                  stats.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {stats.netProfit >= 0 ? "+" : ""}Rs.{" "}
                {formatNumberByLang(stats.netProfit)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {stats.totalIncome > 0
                  ? `${Math.round((stats.netProfit / stats.totalIncome) * 100)}% margin`
                  : "0% margin"}
              </span>
              <span
                className={`font-semibold text-xs ${
                  stats.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {stats.netProfit >= 0 ? "Positive Cashflow" : "Deficit"}
              </span>
            </div>
          </div>
        </div>

        {/* Client-Linked Revenue */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-teal-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "ग्राहक भुक्तानी आम्दानी" : "Client Payment Revenue"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="90px" height="32px" className="my-0.5" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 font-mono tabular-nums">
                Rs. {formatNumberByLang(clientLinkedIncome)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {clients.length > 0
                  ? `${formatNumberByLang(clients.length)} ${isNepali ? "दर्ता ग्राहकहरू" : "clients registered"}`
                  : "No clients yet"}
              </span>
              <span className="text-teal-400 text-xs font-semibold">
                Store Inflows
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Financial Ledger Table */}
      <div className="space-y-4">
        <Table<FinanceTransaction>
          data={filteredData}
          columns={columns}
          keyExtractor={(t) => t.id}
          isLoading={isLoading}
          enablePagination={true}
          pageSize={15}
          pageSizeOptions={[15, 30, 50, 100]}
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>
                {isNepali
                  ? "आम्दानी तथा खर्च खाता"
                  : "Finance Transactions Ledger"}
              </span>
            </div>
          }
          subtitle={
            isNepali
              ? `कुल ${formatNumberByLang(filteredData.length)} रेकर्डहरू फेला परे`
              : `Showing ${filteredData.length} records matching current filters`
          }
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: isNepali
              ? "रकम, ग्राहक, कोटी, वा सन्दर्भ खोज्नुहोस्..."
              : "Search amount, client, category, or reference...",
          }}
          filters={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Switcher Pills */}
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                    typeFilter === "all"
                      ? "bg-neutral-800 text-white shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {isNepali ? "सबै" : "All"}
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("income")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    typeFilter === "income"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-emerald-400/80 hover:text-emerald-300"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>{isNepali ? "आम्दानी" : "Income"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("expense")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    typeFilter === "expense"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-rose-400/80 hover:text-rose-300"
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>{isNepali ? "खर्च" : "Expense"}</span>
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">
                  {isNepali ? "सबै कोटीहरू" : "All Categories"}
                </option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Client Filter */}
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[180px]"
              >
                <option value="all">
                  {isNepali ? "सबै ग्राहकहरू" : "All Clients"}
                </option>
                <option value="unlinked">
                  {isNepali
                    ? "ग्राहक नजोडिएका (General)"
                    : "General (Unlinked)"}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ""}
                  </option>
                ))}
              </select>

              {(typeFilter !== "all" ||
                categoryFilter !== "all" ||
                clientFilter !== "all" ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("all");
                    setCategoryFilter("all");
                    setClientFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-[11px] text-neutral-400 hover:text-neutral-200 underline cursor-pointer px-1"
                >
                  {isNepali ? "फिल्टर हटाउनुहोस्" : "Reset"}
                </button>
              )}
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAdd("income")}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isNepali ? "+ आम्दानी" : "+ Income"}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAdd("expense")}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isNepali ? "+ खर्च" : "+ Expense"}</span>
              </button>
            </div>
          }
          emptyTitle={
            isNepali ? "कुनै कारोबार फेला परेन" : "No Finance Transactions"
          }
          emptyDescription={
            isNepali
              ? "तपाईंको आम्दानी तथा खर्च विवरण यहाँ प्रदर्शित हुनेछ।"
              : "Record your first income or operational expense to begin tracking cash flow."
          }
          emptyAction={
            <div className="flex items-center justify-center gap-3 mt-3">
              <button
                onClick={() => handleOpenAdd("income")}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isNepali ? "पहिलो आम्दानी थप्नुहोस्" : "Record Income"}
                </span>
              </button>
              <button
                onClick={() => handleOpenAdd("expense")}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isNepali ? "पहिलो खर्च थप्नुहोस्" : "Record Expense"}
                </span>
              </button>
            </div>
          }
        />
      </div>

      {/* Finance Entry Modal */}
      <FinanceEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalInitialType}
        editingTransaction={editingTransaction}
        clients={clients}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(transactionToDelete)}
        title={
          isNepali
            ? `${transactionToDelete?.type === "income" ? "आम्दानी" : "खर्च"} रेकर्ड मेटाउने?`
            : `Delete ${transactionToDelete?.type === "income" ? "Income" : "Expense"} Record?`
        }
        message={
          isNepali
            ? `के तपाईं साँच्चै Rs. ${transactionToDelete?.amount} को "${transactionToDelete?.category}" कारोबार मेटाउन चाहनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।`
            : `Are you sure you want to delete the ${transactionToDelete?.type} record for Rs. ${transactionToDelete?.amount} (${transactionToDelete?.category})? This cannot be undone.`
        }
        confirmText={isNepali ? "मेटाउनुहोस्" : "Delete"}
        cancelText={isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onClose={() => setTransactionToDelete(null)}
      />
    </div>
  );
};
