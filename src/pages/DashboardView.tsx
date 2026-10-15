/**
 * Minimized Executive Dashboard View
 * High-level command center with key performance metrics, quick action shortcuts,
 * and streamlined overviews of recent registered clients, incoming leads, and feedback.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  MessageSquare,
  Star,
  ArrowRight,
  Building2,
  RefreshCw,
  Plus,
  Quote,
  Sparkles,
  Eye,
  UserPlus,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { ActionMenu } from "../components/common/ActionMenu";
import {
  getClientsStats,
  getAllClients,
  Client,
} from "../lib/services/clientService";
import {
  getEnquiryStats,
  getAllEnquiries,
  Enquiry,
} from "../lib/services/enquiryService";
import {
  getClientReviewsStats,
  getAllClientReviews,
  ClientReview,
} from "../lib/services/reviewService";
import {
  getFinanceStats,
  getAllFinances,
  FinanceStats,
  FinanceTransaction,
  FinanceTransactionType,
} from "../lib/services/financeService";
import { formatDate } from "../lib/utils/format";
import { Table, Column } from "../components/common/Table";
import { Skeleton } from "../components/common/Skeleton";
import {
  ClientOnboardingModal,
  LeadEnquiryModal,
  FinanceEntryModal,
} from "../components/forms";

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { isNepali, formatNumberByLang } = useLanguage();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Action Modals
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddEnquiryOpen, setIsAddEnquiryOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeModalType, setFinanceModalType] = useState<FinanceTransactionType>("income");

  // KPI Statistics
  const [clientStats, setClientStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    trial: 0,
    expired: 0,
    cancelled: 0,
  });

  const [financeStats, setFinanceStats] = useState<FinanceStats>({
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

  const [enquiryStats, setEnquiryStats] = useState({
    total: 0,
    new_count: 0,
    contacted_count: 0,
    in_progress_count: 0,
    converted_count: 0,
    closed_count: 0,
  });

  const [reviewStats, setReviewStats] = useState({
    total: 0,
    averageRating: 5.0,
    fiveStarCount: 0,
  });

  // Recent Items (Top 5 each)
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [recentFinances, setRecentFinances] = useState<FinanceTransaction[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [latestReview, setLatestReview] = useState<ClientReview | null>(null);

  const refreshData = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const [cStats, fStats, eStats, rStats, allC, allF, allE, allR] =
          await Promise.all([
            getClientsStats().catch(() => ({
              total: 0,
              active: 0,
              inactive: 0,
              trial: 0,
              expired: 0,
              cancelled: 0,
            })),
            getFinanceStats().catch(() => ({
              totalIncome: 0,
              totalExpenses: 0,
              netProfit: 0,
              transactionCount: 0,
              incomeCount: 0,
              expenseCount: 0,
              incomeByCategory: {},
              expenseByCategory: {},
              recentTransactions: [],
            })),
            getEnquiryStats().catch(() => ({
              total: 0,
              new_count: 0,
              contacted_count: 0,
              in_progress_count: 0,
              converted_count: 0,
              closed_count: 0,
            })),
            getClientReviewsStats().catch(() => ({
              total: 0,
              averageRating: 5.0,
              fiveStarCount: 0,
            })),
            getAllClients().catch(() => []),
            getAllFinances({ limit: 5 }).catch(() => []),
            getAllEnquiries().catch(() => []),
            getAllClientReviews().catch(() => []),
          ]);

        setClientStats(cStats);
        setFinanceStats(fStats);
        setEnquiryStats(eStats);
        setReviewStats(rStats);
        setRecentClients(allC.slice(0, 5));
        setRecentFinances(allF.slice(0, 5));
        setRecentEnquiries(allE.slice(0, 5));
        setLatestReview(allR.length > 0 ? allR[0] : null);

        if (isManual) {
          showToast(
            isNepali ? "ड्यासबोर्ड अद्यावधिक गरियो" : "Dashboard refreshed",
            "info",
          );
        }
      } catch (e) {
        console.error("Error refreshing dashboard:", e);
        showToast(
          isNepali
            ? "ड्यासबोर्ड लोड हुन सकेन"
            : "Failed to load dashboard data",
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
    refreshData();
  }, [refreshData]);

  // Table Columns: Recent Clients
  const recentClientColumns = useMemo<Column<Client>[]>(
    () => [
      {
        id: "client",
        header: isNepali ? "ग्राहक तथा पसल" : "Client & Store",
        render: (c) => (
          <div>
            <div className="font-bold text-neutral-100 text-xs truncate">
              {c.name}
            </div>
            <div className="text-[11px] text-neutral-400 truncate">
              {c.company_name || c.client_type}
            </div>
          </div>
        ),
      },
      {
        id: "contact",
        header: isNepali ? "सम्पर्क" : "Contact",
        render: (c) => (
          <div className="text-xs font-mono text-neutral-300">{c.phone}</div>
        ),
      },
      {
        id: "status",
        header: isNepali ? "स्थिति" : "Status",
        align: "right",
        render: (c) => (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              c.status === "active"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700"
            }`}
          >
            {(c.status || "active").toUpperCase()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        render: (c) => (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              align="right"
              triggerSize="sm"
              title={`Actions for ${c.name}`}
              items={[
                {
                  id: "view",
                  label: "View Clients",
                  icon: Eye,
                  color: "neutral",
                  onClick: () => navigate("/clients"),
                },
                {
                  id: "onboard",
                  label: "New Client",
                  icon: UserPlus,
                  color: "emerald",
                  onClick: () => setIsAddClientOpen(true),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [isNepali, navigate],
  );

  // Table Columns: Recent Enquiries
  const recentEnquiryColumns = useMemo<Column<Enquiry>[]>(
    () => [
      {
        id: "lead",
        header: isNepali ? "अनुरोधकर्ता" : "Lead",
        render: (e) => (
          <div>
            <div className="font-bold text-neutral-100 text-xs truncate">
              {e.full_name}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              {e.reference_id}
            </div>
          </div>
        ),
      },
      {
        id: "contact",
        header: isNepali ? "विवरण" : "Details",
        render: (e) => (
          <div>
            <div className="text-xs font-mono text-neutral-300">{e.phone}</div>
            <div className="text-[11px] text-neutral-400 truncate max-w-[150px]">
              {e.subject || e.message}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: isNepali ? "स्थिति" : "Status",
        align: "right",
        render: (e) => (
          <div>
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                e.status === "new"
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : e.status === "converted"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-neutral-800 text-neutral-300 border-neutral-700"
              }`}
            >
              {e.status.toUpperCase()}
            </span>
            <div className="text-[9px] text-neutral-500 mt-0.5 font-mono">
              {formatDate(e.created_at)}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        render: (e) => (
          <div className="flex items-center justify-end" onClick={(ev) => ev.stopPropagation()}>
            <ActionMenu
              align="right"
              triggerSize="sm"
              title={`Actions for ${e.full_name}`}
              items={[
                {
                  id: "view",
                  label: "View Enquiries",
                  icon: Eye,
                  color: "neutral",
                  onClick: () => navigate("/enquiries"),
                },
                {
                  id: "new-lead",
                  label: "New Inquiry",
                  icon: MessageSquare,
                  color: "emerald",
                  onClick: () => setIsAddEnquiryOpen(true),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [isNepali, navigate],
  );

  // Table Columns: Recent Finances (Earned vs Spent)
  const recentFinanceColumns = useMemo<Column<FinanceTransaction>[]>(
    () => [
      {
        id: "date",
        header: isNepali ? "मिति" : "Date",
        width: "90px",
        render: (t) => (
          <div className="font-mono text-neutral-300 text-[11px]">
            {formatDate(t.date)}
          </div>
        ),
      },
      {
        id: "details",
        header: isNepali ? "विवरण / ग्राहक" : "Category & Client",
        render: (t) => (
          <div className="min-w-0">
            <div className="font-bold text-neutral-100 text-xs truncate">
              {t.category}
            </div>
            {t.clientName ? (
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 truncate mt-0.5">
                <Building2 className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{t.clientName}</span>
                {t.clientShopName && (
                  <span className="text-neutral-400 truncate">({t.clientShopName})</span>
                )}
              </div>
            ) : t.note ? (
              <div className="text-[10px] text-neutral-400 truncate max-w-[140px] mt-0.5">
                {t.note}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "amount",
        header: isNepali ? "रकम" : "Amount",
        align: "right",
        render: (t) => (
          <div className="text-right">
            <span
              className={`font-mono font-bold text-xs ${
                t.type === "income" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {t.type === "income" ? "+" : "-"}Rs. {formatNumberByLang(t.amount)}
            </span>
          </div>
        ),
      },
    ],
    [isNepali, formatNumberByLang],
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Top Quick Action Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-100 flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <span>{isNepali ? "व्यवस्थापन कमाण्ड सेन्टर" : "Executive Command Center"}</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {isNepali
              ? "आम्दानी (कमाई), खर्च, ग्राहक भुक्तानी र खुद नाफाको प्रत्यक्ष ट्र्याकिङ"
              : "Live revenue earnings, operational expenditures, client billing, and store performance"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isNepali ? "ताजा गर्नुहोस्" : "Refresh"}</span>
          </button>

          {/* Record Income Button */}
          <button
            onClick={() => {
              setFinanceModalType("income");
              setIsFinanceModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isNepali ? "+ आम्दानी (कमाई)" : "+ Record Income"}</span>
          </button>

          {/* Record Expense Button */}
          <button
            onClick={() => {
              setFinanceModalType("expense");
              setIsFinanceModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isNepali ? "+ खर्च (खर्चिएको)" : "+ Record Expense"}</span>
          </button>

          {/* Onboard Client Button */}
          <button
            onClick={() => setIsAddClientOpen(true)}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>{isNepali ? "+ नयाँ ग्राहक" : "+ New Client"}</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned (Income) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/finances")}
          className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "कुल कमाई (आम्दानी)" : "Total Earned (Income)"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="100px" height="32px" className="my-0.5" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
                Rs. {formatNumberByLang(financeStats.totalIncome)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between font-mono">
              <span>{formatNumberByLang(financeStats.incomeCount)} {isNepali ? "भुक्तानी रेकर्डहरू" : "inflows recorded"}</span>
              <span className="text-emerald-400 group-hover:translate-x-1 transition-transform font-semibold text-xs flex items-center gap-0.5">
                <span>Finances →</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Total Spent (Expenses) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/finances")}
          className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-rose-500/50 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "कुल खर्च (खर्चिएको)" : "Total Spent (Expenses)"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="100px" height="32px" className="my-0.5" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tabular-nums">
                Rs. {formatNumberByLang(financeStats.totalExpenses)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between font-mono">
              <span>{formatNumberByLang(financeStats.expenseCount)} {isNepali ? "खर्च रेकर्डहरू" : "outflows"}</span>
              <span className="text-rose-400 group-hover:translate-x-1 transition-transform font-semibold text-xs flex items-center gap-0.5">
                <span>Finances →</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Net Profit / Balance */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/finances")}
          className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "खुद नाफा / नगद प्रवाह" : "Net Cashflow / Profit"}
            </span>
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center group-hover:scale-105 transition-transform ${
                financeStats.netProfit >= 0
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
                  financeStats.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {financeStats.netProfit >= 0 ? "+" : ""}Rs. {formatNumberByLang(financeStats.netProfit)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {financeStats.totalIncome > 0
                  ? `${Math.round((financeStats.netProfit / financeStats.totalIncome) * 100)}% margin`
                  : "0% margin"}
              </span>
              <span
                className={`font-semibold text-xs ${
                  financeStats.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {financeStats.netProfit >= 0 ? "Profitable" : "Deficit"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Total Registered Clients */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/clients")}
          className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "कुल दर्ता ग्राहकहरू" : "Total Clients"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="70px" height="32px" className="my-0.5" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-100 font-mono tabular-nums">
                {formatNumberByLang(clientStats.total)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {formatNumberByLang(clientStats.active)}{" "}
                {isNepali ? "सक्रिय पसलहरू" : "active stores"}
              </span>
              <span className="text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-semibold text-xs">
                <span>→</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Subscriptions */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/clients")}
          className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-emerald-500/40 flex flex-col justify-between transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "सक्रिय पसल खाताहरू" : "Active Store Accounts"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton width="50px" height="28px" className="my-0.5" />
            ) : (
              <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
                {formatNumberByLang(clientStats.active)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-0.5">
              <span>{formatNumberByLang(clientStats.trial)} {isNepali ? "ट्रायलमा छन्" : "on active trial"}</span>
            </div>
          </div>
        </motion.div>

        {/* Inbound Leads */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/enquiries")}
          className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-teal-500/40 flex flex-col justify-between transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "सोधपुछ तथा लिड्स" : "Inbound Demo Leads"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton width="50px" height="28px" className="my-0.5" />
            ) : (
              <div className="text-2xl font-extrabold text-neutral-100 font-mono tabular-nums">
                {formatNumberByLang(enquiryStats.total)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-0.5">
              <span className={enquiryStats.new_count > 0 ? "text-amber-400 font-medium" : ""}>
                {formatNumberByLang(enquiryStats.new_count)} {isNepali ? "नयाँ सोधपुछ" : "new awaiting response"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Customer Satisfaction */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/reviews")}
          className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-amber-500/40 flex flex-col justify-between transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "ग्राहक सन्तुष्टि" : "Client Satisfaction"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton width="60px" height="28px" className="my-0.5" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-300 font-mono tabular-nums">
                  {reviewStats.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-amber-400">
                  {"★".repeat(Math.round(reviewStats.averageRating || 5))}
                </span>
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-0.5">
              <span>{formatNumberByLang(reviewStats.total)} {isNepali ? "समीक्षाहरू" : "verified reviews"}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3-Column Split: Recent Finances, Recent Clients & Inbound Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Recent Financial Activity */}
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-100">
                    {isNepali ? "हालको नगद कारोबार" : "Recent Cash Flow"}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {isNepali ? "पछिल्लो आम्दानी तथा खर्च" : "Latest income & expense records"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/finances")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{isNepali ? "सबै हेर्नुहोस्" : "View All"}</span>
                <span>→</span>
              </button>
            </div>

            <div className="mt-3">
              <Table<FinanceTransaction>
                data={recentFinances}
                columns={recentFinanceColumns}
                keyExtractor={(t) => t.id}
                isLoading={isLoading}
                skeletonRows={4}
                compact={true}
                onRowClick={() => navigate("/finances")}
                emptyState={{
                  title: isNepali ? "कुनै कारोबार छैन" : "No Transactions",
                  description: isNepali
                    ? "हालसम्म कुनै आम्दानी वा खर्च रेकर्ड गरिएको छैन।"
                    : "Record your first earned income or spent expense.",
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-mono">
              {formatNumberByLang(financeStats.transactionCount)}{" "}
              {isNepali ? "कुल कारोबार" : "total transactions"}
            </span>
            <button
              onClick={() => navigate("/finances")}
              className="text-xs text-neutral-300 hover:text-white inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>{isNepali ? "खाता खोल्नुहोस्" : "Open Finances Hub"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Column 2: Recent Clients Directory */}
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-100">
                    {isNepali
                      ? "हालका दर्ता ग्राहकहरू"
                      : "Recent Registered Clients"}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {isNepali
                      ? "पछिल्लो समय थपिएका पसलहरू"
                      : "Latest store onboardings"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/clients")}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{isNepali ? "सबै हेर्नुहोस्" : "View All"}</span>
                <span>→</span>
              </button>
            </div>

            <div className="mt-3">
              <Table<Client>
                data={recentClients}
                columns={recentClientColumns}
                keyExtractor={(client) => client.id}
                isLoading={isLoading}
                skeletonRows={4}
                compact={true}
                onRowClick={() => navigate("/clients")}
                emptyState={{
                  title: isNepali ? "कुनै ग्राहक फेला परेन" : "No Clients Yet",
                  description: isNepali
                    ? "हालसम्म कुनै दर्ता ग्राहक थपिएको छैन।"
                    : "Onboard your first store client to get started.",
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-mono">
              {formatNumberByLang(clientStats.total)}{" "}
              {isNepali ? "कुल ग्राहक रेकर्ड" : "total clients"}
            </span>
            <button
              onClick={() => navigate("/clients")}
              className="text-xs text-neutral-300 hover:text-white inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>
                {isNepali
                  ? "ग्राहक व्यवस्थापन खोल्नुहोस्"
                  : "Open Clients Directory"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </div>

        {/* Column 3: Inbound Leads & Demo Inquiries */}
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-100">
                    {isNepali
                      ? "हालका सोधपुछ तथा लिड्स"
                      : "Recent Inbound Leads"}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {isNepali
                      ? "वेबसाइट र सोधपुछबाट प्राप्त अनुरोधहरू"
                      : "Prospective client demo inquiries"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/enquiries")}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{isNepali ? "सबै हेर्नुहोस्" : "View All"}</span>
                <span>→</span>
              </button>
            </div>

            <div className="mt-3">
              <Table<Enquiry>
                data={recentEnquiries}
                columns={recentEnquiryColumns}
                keyExtractor={(enquiry) => enquiry.id}
                isLoading={isLoading}
                skeletonRows={4}
                compact={true}
                onRowClick={() => navigate("/enquiries")}
                emptyState={{
                  title: isNepali ? "कुनै नयाँ सोधपुछ छैन" : "No Enquiries Yet",
                  description: isNepali
                    ? "हालसम्म कुनै सोधपुछ रेकर्ड गरिएको छैन।"
                    : "Prospective customer inquiries will appear here.",
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-mono">
              {formatNumberByLang(enquiryStats.new_count)}{" "}
              {isNepali ? "नयाँ सोधपुछ बाँकी" : "new leads"}
            </span>
            <button
              onClick={() => navigate("/enquiries")}
              className="text-xs text-neutral-300 hover:text-white inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>
                {isNepali ? "सोधपुछ हब खोल्नुहोस्" : "Open Enquiries Hub"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Spotlight Strip: Latest Feedback & Quick Hub Navigation */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {latestReview ? (
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Quote className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-200 truncate">
                  {latestReview.client_name}
                </span>
                {latestReview.shop_name && (
                  <span className="text-[11px] text-neutral-400 truncate">
                    ({latestReview.shop_name})
                  </span>
                )}
                <span className="text-xs text-amber-400 flex items-center">
                  {"★".repeat(latestReview.rating)}
                </span>
              </div>
              <p className="text-xs text-neutral-300 italic truncate max-w-xl mt-0.5">
                "{latestReview.review_text}"
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {isNepali
                ? "सबै सेवाहरू स्थानीय प्रणालीमा सुरक्षित रूपमा सञ्चालन भइरहेका छन्।"
                : "All client services and offline POS sync pipelines running normally."}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/reviews")}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>
              {isNepali ? "सबै समीक्षा हेर्नुहोस्" : "View Client Reviews"}
            </span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Quick Action: Finance Entry Modal */}
      <FinanceEntryModal
        isOpen={isFinanceModalOpen}
        initialType={financeModalType}
        onClose={() => setIsFinanceModalOpen(false)}
        onSuccess={() => {
          setIsFinanceModalOpen(false);
          refreshData();
        }}
      />

      {/* Quick Action: Onboard Client Modal */}
      <ClientOnboardingModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSuccess={() => {
          setIsAddClientOpen(false);
          refreshData();
        }}
      />

      {/* Quick Action: Lead Enquiry Modal */}
      <LeadEnquiryModal
        isOpen={isAddEnquiryOpen}
        onClose={() => setIsAddEnquiryOpen(false)}
        onSuccess={() => {
          setIsAddEnquiryOpen(false);
          refreshData();
        }}
      />
    </div>
  );
};
