/**
 * Dashboard View
 * Executive relationship command center for Registered Clients, Inquiries & Leads,
 * and Internal Happy Clients Reviews with a dedicated tab switcher menu.
 *
 * NOTE: The reviews in this dashboard are strictly internal and NOT connected to the public website.
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  MessageSquare,
  ArrowRight,
  CreditCard,
  Building2,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Star,
  Plus,
  Quote,
  Trash2,
  Lock,
  Smile,
  LayoutDashboard,
} from "lucide-react";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Modal } from "../components/common/Modal";
import { NavTab } from "../components/layout/Sidebar";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
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
  createClientReview,
  deleteClientReview,
  ClientReview,
} from "../lib/services/reviewService";
import { formatDate } from "../lib/utils/format";

type DashboardSectionTab = "all" | "clients" | "enquiries" | "reviews";

interface DashboardViewProps {
  onNavigateToTab: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
}) => {
  const { isNepali, formatNumberByLang } = useLanguage();
  const { showToast } = useToast();

  // Navigation tab state inside Dashboard
  const [activeDashboardTab, setActiveDashboardTab] =
    useState<DashboardSectionTab>("all");

  const [clientStats, setClientStats] = useState(() => ({
    total: 0,
    active: 0,
    inactive: 0,
    trial: 0,
    expired: 0,
    cancelled: 0,
  }));
  const [enquiryStats, setEnquiryStats] = useState(() => ({
    total: 0,
    new_count: 0,
    contacted_count: 0,
    in_progress_count: 0,
    converted_count: 0,
    closed_count: 0,
  }));
  const [reviewStats, setReviewStats] = useState(() => ({
    total: 0,
    averageRating: 5.0,
    fiveStarCount: 0,
  }));

  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [allClientsList, setAllClientsList] = useState<Client[]>([]);

  // Add Review Modal state
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    client_name: "",
    shop_name: "",
    location: "",
    rating: 5,
    review_text: "",
    client_id: "",
  });

  // Delete review confirmation state
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [cStats, eStats, rStats, allC, allE, allR] = await Promise.all([
        getClientsStats(),
        getEnquiryStats(),
        getClientReviewsStats(),
        getAllClients(),
        getAllEnquiries(),
        getAllClientReviews(),
      ]);

      setClientStats(cStats);
      setEnquiryStats(eStats);
      setReviewStats(rStats);
      setAllClientsList(allC);
      setRecentClients(allC.slice(0, 6));
      setRecentEnquiries(allE.slice(0, 6));
      setReviews(allR);
    } catch (e) {
      console.error("Error refreshing dashboard:", e);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleOpenAddReview = (prefillClient?: Client) => {
    setReviewForm({
      client_name: prefillClient ? prefillClient.name : "",
      shop_name: prefillClient ? prefillClient.company_name || "" : "",
      location: prefillClient ? prefillClient.address || "" : "",
      rating: 5,
      review_text: "",
      client_id: prefillClient ? String(prefillClient.id) : "",
    });
    setIsAddReviewModalOpen(true);
  };

  const handleClientSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setReviewForm((prev) => ({ ...prev, client_id: "" }));
      return;
    }
    const found =
      recentClients.find((c) => String(c.id) === selectedId) ||
      allClientsList.find((c) => String(c.id) === selectedId);

    if (found) {
      setReviewForm({
        client_name: found.name,
        shop_name: found.company_name || "",
        location: found.address || "",
        rating: 5,
        review_text: reviewForm.review_text,
        client_id: String(found.id),
      });
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!reviewForm.client_name.trim()) {
        showToast("Please enter the client or shopkeeper name", "warning");
        return;
      }
      if (!reviewForm.review_text.trim()) {
        showToast("Please enter the client review feedback", "warning");
        return;
      }

      await createClientReview({
        client_name: reviewForm.client_name.trim(),
        shop_name: reviewForm.shop_name.trim() || null,
        location: reviewForm.location.trim() || null,
        rating: reviewForm.rating,
        review_text: reviewForm.review_text.trim(),
        client_id: reviewForm.client_id || null,
      });

      showToast(
        isNepali
          ? "सन्तुष्ट ग्राहकको समीक्षा सफलतापूर्वक थपियो!"
          : "Happy client review added successfully!",
        "success",
      );
      setIsAddReviewModalOpen(false);
      setReviewForm({
        client_name: "",
        shop_name: "",
        location: "",
        rating: 5,
        review_text: "",
        client_id: "",
      });
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to save review", "error");
    }
  };

  const handleDeleteReviewConfirm = async () => {
    if (!deletingReviewId) return;
    try {
      await deleteClientReview(deletingReviewId);
      showToast(
        isNepali ? "समीक्षा हटाइयो" : "Review removed from dashboard",
        "info",
      );
      setDeletingReviewId(null);
      await refreshData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to delete review", "error");
    }
  };

  const navMenuItems: Array<{
    id: DashboardSectionTab;
    label: string;
    icon: React.ElementType;
    count?: number;
    badgeColor?: string;
  }> = [
    {
      id: "all",
      label: isNepali ? "सबै सारांश" : "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "clients",
      label: isNepali ? "दर्ता ग्राहकहरू" : "Registered Clients",
      icon: Users,
      count: clientStats.total,
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "enquiries",
      label: isNepali ? "सोधपुछ तथा लिड्स" : "Enquiries & Leads",
      icon: MessageSquare,
      count:
        enquiryStats.new_count > 0
          ? enquiryStats.new_count
          : enquiryStats.total,
      badgeColor:
        enquiryStats.new_count > 0
          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
          : "bg-teal-500/10 text-teal-400 border-teal-500/30",
    },
    {
      id: "reviews",
      label: isNepali ? "सन्तुष्ट ग्राहक समीक्षा" : "Happy Clients Reviews",
      icon: Star,
      count: reviewStats.total,
      badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            <span>
              {isNepali
                ? "ड्यासबोर्ड: ग्राहक, सोधपुछ तथा समीक्षा केन्द्र"
                : "Dashboard: Clients, Inquiries & Reviews"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {isNepali
              ? "दर्ता भएका पसलहरू, सदस्यता स्थिति, इनबाउन्ड लिड्स र सन्तुष्ट ग्राहकहरूको आन्तरिक समीक्षा"
              : "Executive relationship command center for registered retail clients, inbound leads, and client reviews"}
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab("reviews")}
            className="px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Open dedicated Happy Clients Review Nav Menu"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{isNepali ? "समीक्षा मेनु" : "Reviews Menu"}</span>
          </button>
          <button
            onClick={() => handleOpenAddReview()}
            className="px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Add a new client testimonial/review directly to dashboard"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>{isNepali ? "+ समीक्षा थप्नुहोस्" : "+ Add Review"}</span>
          </button>
          <button
            onClick={() => onNavigateToTab("clients")}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isNepali ? "ग्राहक सूची" : "Client Directory"}</span>
          </button>
          <button
            onClick={() => onNavigateToTab("enquiries")}
            className="px-3.5 py-2 text-xs font-semibold text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 rounded-xl border border-teal-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isNepali ? "सोधपुछ लिड्स" : "Demo Leads"}</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD NAV MENU TABS */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-x-auto shadow-xs">
        {navMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeDashboardTab === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveDashboardTab(item.id)}
              className={`relative px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "text-neutral-100 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeDashboardTabPill"
                  className="absolute inset-0 bg-neutral-800 rounded-xl border border-neutral-700/70"
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                />
              )}
              <Icon
                className={`relative z-10 w-4 h-4 ${
                  isActive
                    ? item.id === "reviews"
                      ? "text-amber-400 fill-amber-400"
                      : item.id === "enquiries"
                        ? "text-teal-400"
                        : item.id === "clients"
                          ? "text-emerald-400"
                          : "text-neutral-200"
                    : "text-neutral-500"
                }`}
              />
              <span className="relative z-10">{item.label}</span>
              {typeof item.count === "number" && item.count > 0 && (
                <span
                  className={`relative z-10 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                    item.badgeColor ||
                    "bg-neutral-800 text-neutral-300 border-neutral-700"
                  }`}
                >
                  {formatNumberByLang(item.count)}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Primary KPI Metrics: Registered Clients, Enquiries & Reviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Clients */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveDashboardTab("clients")}
          className={`p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-900 border flex flex-col justify-between transition-all cursor-pointer group shadow-sm ${
            activeDashboardTab === "clients"
              ? "border-emerald-500/70 ring-1 ring-emerald-500/50"
              : "border-emerald-500/30 hover:border-emerald-500/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "कुल दर्ता ग्राहकहरू" : "Total Registered Clients"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-neutral-100 font-mono tabular-nums">
              {formatNumberByLang(clientStats.total)}
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center justify-between">
              <span>
                {formatNumberByLang(clientStats.active)}{" "}
                {isNepali ? "सक्रिय पसल" : "active stores"}
              </span>
              <span className="group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-semibold text-emerald-400">
                <span>{isNepali ? "हेर्नुहोस् →" : "View →"}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Active Client Subscriptions */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveDashboardTab("clients")}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-neutral-900 to-neutral-900 border border-emerald-500/25 hover:border-emerald-500/50 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali
                ? "सक्रिय सदस्यताहरू (Active Accounts)"
                : "Active Client Accounts"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {formatNumberByLang(clientStats.active)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {formatNumberByLang(clientStats.trial)}{" "}
                {isNepali ? "परीक्षण (ट्रायल)" : "on trial plan"}
              </span>
              <span className="text-emerald-400 group-hover:translate-x-1 transition-transform font-semibold">
                →
              </span>
            </div>
          </div>
        </motion.div>

        {/* Total Inquiries */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveDashboardTab("enquiries")}
          className={`p-5 rounded-2xl bg-gradient-to-br from-teal-950/30 via-neutral-900 to-neutral-900 border flex flex-col justify-between transition-all cursor-pointer group shadow-sm ${
            activeDashboardTab === "enquiries"
              ? "border-teal-500/70 ring-1 ring-teal-500/50"
              : "border-teal-500/25 hover:border-teal-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "कुल सोधपुछ तथा लिड्स" : "Total Inquiries & Leads"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-neutral-100 font-mono tabular-nums">
              {formatNumberByLang(enquiryStats.total)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {formatNumberByLang(enquiryStats.new_count)}{" "}
                {isNepali ? "नयाँ सोधपुछ" : "new uncontacted"}
              </span>
              <span className="text-teal-400 group-hover:translate-x-1 transition-transform font-semibold">
                →
              </span>
            </div>
          </div>
        </motion.div>

        {/* Happy Client Reviews Summary */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => setActiveDashboardTab("reviews")}
          className={`p-5 rounded-2xl bg-gradient-to-br from-yellow-950/30 via-neutral-900 to-neutral-900 border flex flex-col justify-between transition-all cursor-pointer group shadow-sm ${
            activeDashboardTab === "reviews"
              ? "border-amber-400 ring-1 ring-amber-400/50"
              : "border-amber-500/30 hover:border-amber-400/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "ग्राहक सन्तुष्टि समीक्षा" : "Happy Client Reviews"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-300 font-mono tabular-nums">
                {reviewStats.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-amber-400 font-medium flex items-center">
                {"★".repeat(5)}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {formatNumberByLang(reviewStats.total)}{" "}
                {isNepali ? "समीक्षा रेकर्ड" : "reviews logged"}
              </span>
              <span className="text-amber-400 group-hover:translate-x-1 transition-transform font-semibold">
                View →
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECTION 1: REGISTERED CLIENTS (Visible when 'all' or 'clients' selected) */}
      {(activeDashboardTab === "all" || activeDashboardTab === "clients") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Registered Clients Showcase */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-100">
                      {isNepali
                        ? "दर्ता भएका ग्राहक तथा पसलहरू"
                        : "Registered Clients Directory"}
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                      {isNepali
                        ? "सम्पर्क विवरण, स्टोर प्रकार र सदस्यता स्थिति"
                        : "Active retail accounts & subscription status"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToTab("clients")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{isNepali ? "सबै हेर्नुहोस्" : "Manage All"}</span>
                  <span>→</span>
                </button>
              </div>

              {/* Recent Clients List */}
              <div className="mt-4 divide-y divide-neutral-800/80">
                {recentClients.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500">
                    {isNepali
                      ? "हालसम्म कुनै दर्ता ग्राहक थपिएको छैन।"
                      : "No registered clients found."}
                  </div>
                ) : (
                  recentClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => onNavigateToTab("clients")}
                      className="py-3 px-2 -mx-2 rounded-xl hover:bg-neutral-800/50 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-200 group-hover:text-emerald-400 transition-colors truncate">
                            {client.name}
                          </span>
                          {client.company_name && (
                            <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                              ({client.company_name})
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
                            {client.client_type}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-neutral-600" />
                            <span className="font-mono">{client.phone}</span>
                          </span>
                          {client.address && (
                            <span className="truncate max-w-[140px] text-neutral-400">
                              {client.address}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            client.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                          }`}
                        >
                          {(client.status || "active").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                {formatNumberByLang(clientStats.total)}{" "}
                {isNepali ? "कुल ग्राहक" : "total clients recorded"}
              </span>
              <button
                onClick={() => onNavigateToTab("clients")}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <span>
                  {isNepali ? "ग्राहक व्यवस्थापन" : "Open Clients Directory"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Inquiries & Leads Showcase */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-100">
                      {isNepali
                        ? "सोधपुछ तथा अन-साइट डेमो लिड्स"
                        : "Inbound Inquiries & Leads"}
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                      {isNepali
                        ? "वेबसाइट तथा काउन्टर डेमो अनुरोधहरू"
                        : "Prospective retail stores & demo requests"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToTab("enquiries")}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{isNepali ? "सबै हेर्नुहोस्" : "Manage All"}</span>
                  <span>→</span>
                </button>
              </div>

              {/* Recent Enquiries List */}
              <div className="mt-4 divide-y divide-neutral-800/80">
                {recentEnquiries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500">
                    {isNepali
                      ? "हालसम्म कुनै नयाँ सोधपुछ छैन।"
                      : "No enquiries logged yet."}
                  </div>
                ) : (
                  recentEnquiries.map((enquiry) => (
                    <div
                      key={enquiry.id}
                      onClick={() => onNavigateToTab("enquiries")}
                      className="py-3 px-2 -mx-2 rounded-xl hover:bg-neutral-800/50 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-200 group-hover:text-teal-400 transition-colors truncate">
                            {enquiry.full_name}
                          </span>
                          {enquiry.shop_name && (
                            <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                              ({enquiry.shop_name})
                            </span>
                          )}
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {enquiry.reference_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-neutral-600" />
                            <span>{enquiry.phone}</span>
                          </span>
                          <span className="truncate max-w-[150px] text-neutral-400">
                            {enquiry.subject || enquiry.message}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                            enquiry.status === "new"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : enquiry.status === "converted"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-neutral-800 text-neutral-300 border-neutral-700"
                          }`}
                        >
                          {enquiry.status.toUpperCase()}
                        </span>
                        <div className="text-[9px] text-neutral-500 mt-0.5 font-mono">
                          {formatDate(enquiry.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                {formatNumberByLang(enquiryStats.new_count)}{" "}
                {isNepali ? "नयाँ सोधपुछ बाँकी" : "new leads awaiting reply"}
              </span>
              <button
                onClick={() => onNavigateToTab("enquiries")}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <span>
                  {isNepali ? "सोधपुछ व्यवस्थापन" : "Review Inbound Leads"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ENQUIRIES & LEADS SPECIFIC TAB VIEW (Visible when 'enquiries' selected) */}
      {activeDashboardTab === "enquiries" && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-100">
                  {isNepali
                    ? "इनबाउन्ड सोधपुछ तथा डेमो लिड्स पूर्ण सूची"
                    : "Inbound Inquiries & Demo Leads Hub"}
                </h2>
                <p className="text-xs text-neutral-400">
                  {isNepali
                    ? "सबै डेमो अनुरोधहरू र ग्राहक लिड्सको प्रत्यक्ष स्थिति"
                    : "Live inbound inquiries and conversion pipeline"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab("enquiries")}
              className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>
                {isNepali
                  ? "पूर्ण सोधपुछ मेनु खोल्नुहोस्"
                  : "Open Full Enquiries Hub"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-800/80">
            {recentEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                onClick={() => onNavigateToTab("enquiries")}
                className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-neutral-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-200 group-hover:text-teal-400 transition-colors">
                      {enquiry.full_name}
                    </span>
                    {enquiry.shop_name && (
                      <span className="text-xs text-neutral-400 font-medium">
                        — {enquiry.shop_name}
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {enquiry.reference_id}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-300 mt-1 italic line-clamp-1">
                    "{enquiry.subject || enquiry.message}"
                  </div>
                  <div className="text-[11px] text-neutral-500 flex items-center gap-4 mt-1 font-mono">
                    <span>{enquiry.phone}</span>
                    <span>{enquiry.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
                      enquiry.status === "new"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : enquiry.status === "converted"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-neutral-800 text-neutral-300 border-neutral-700"
                    }`}
                  >
                    {enquiry.status.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-neutral-500">
                    {formatDate(enquiry.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: HAPPY CLIENTS REVIEWS (Visible when 'all' or 'reviews' selected) */}
      {(activeDashboardTab === "all" || activeDashboardTab === "reviews") && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/20 border border-amber-500/20 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-100">
                    {isNepali
                      ? "सन्तुष्ट ग्राहक समीक्षा तथा प्रतिक्रिया"
                      : "Happy Clients Reviews"}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    <Lock className="w-3 h-3" />
                    <span>
                      {isNepali
                        ? "आन्तरिक ड्यासबोर्ड मात्र"
                        : "Internal Dashboard Only"}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {isNepali
                    ? "स्थानीय SQLite मा सुरक्षित - यो सेक्सन सार्वजनिक वेबसाइटसँग जोडिएको छैन"
                    : "Stored locally in SQLite – private internal feedback not visible on the public website"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
                <span className="text-neutral-400 font-medium">
                  {isNepali ? "औसत मूल्याङ्कन:" : "Avg Rating:"}
                </span>
                <span className="font-bold text-amber-400 font-mono">
                  {reviewStats.averageRating.toFixed(1)} / 5.0
                </span>
                <span className="text-amber-400">★</span>
              </div>
              <button
                onClick={() => onNavigateToTab("reviews")}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isNepali ? "समीक्षा मेनु" : "Reviews Menu"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleOpenAddReview()}
                className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isNepali ? "नयाँ समीक्षा थप्नुहोस्" : "Add Client Review"}
                </span>
              </button>
            </div>
          </div>

          {/* Reviews Grid */}
          {reviews.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-neutral-950/60 border border-neutral-800/80 p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Smile className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-neutral-300">
                {isNepali
                  ? "कुनै समीक्षा रेकर्ड गरिएको छैन"
                  : "No happy client reviews logged yet"}
              </div>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                {isNepali
                  ? "तपाईंका पसलका ग्राहक तथा व्यापारीहरूबाट प्राप्त सकारात्मक अनुभवहरू यहाँ रेकर्ड गर्नुहोस्।"
                  : "Log client satisfaction testimonials and ratings from your registered stores directly into this private dashboard repository."}
              </p>
              <button
                onClick={() => handleOpenAddReview()}
                className="mt-2 px-4 py-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {isNepali ? "पहिलो समीक्षा थप्नुहोस्" : "Add First Review"}
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((rev) => (
                <motion.div
                  key={rev.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-amber-500/40 flex flex-col justify-between transition-all relative group shadow-sm"
                >
                  <div>
                    {/* Rating Stars and Delete Button */}
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rev.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-neutral-700"
                            }`}
                          />
                        ))}
                        <span className="text-[11px] font-mono font-bold text-amber-400/90 ml-1.5">
                          {rev.rating}.0
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {formatDate(rev.created_at)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingReviewId(rev.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Review Quote Body */}
                    <div className="mt-3.5 relative">
                      <Quote className="w-5 h-5 text-amber-500/20 absolute -top-1 -left-1 pointer-events-none" />
                      <p className="text-xs text-neutral-300 leading-relaxed pl-3 italic">
                        "{rev.review_text}"
                      </p>
                    </div>
                  </div>

                  {/* Author & Shop Details */}
                  <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-neutral-100 truncate flex items-center gap-1.5">
                        <span>{rev.client_name}</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      </div>
                      {(rev.shop_name || rev.location) && (
                        <div className="text-[10px] text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                          {rev.shop_name && (
                            <span className="font-medium">{rev.shop_name}</span>
                          )}
                          {rev.shop_name && rev.location && <span>•</span>}
                          {rev.location && <span>{rev.location}</span>}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20 shrink-0">
                      Verified
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Happy Client Review */}
      <Modal
        isOpen={isAddReviewModalOpen}
        onClose={() => setIsAddReviewModalOpen(false)}
        title={
          isNepali
            ? "सन्तुष्ट ग्राहकको समीक्षा थप्नुहोस्"
            : "Add Happy Client Review"
        }
        subtitle={
          isNepali
            ? "आन्तरिक ड्यासबोर्डमा सुरक्षित गरिन्छ (सार्वजनिक वेबसाइटमा देखिँदैन)"
            : "Private internal dashboard record (not displayed on public website)"
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveReview} className="space-y-4">
          {/* Quick select from existing registered clients */}
          {recentClients.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {isNepali
                  ? "दर्ता भएका ग्राहकबाट छान्नुहोस् (वैकल्पिक)"
                  : "Select Registered Client (Optional)"}
              </label>
              <select
                value={reviewForm.client_id}
                onChange={handleClientSelectChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">
                  {isNepali
                    ? "-- नयाँ वा बाहिरी ग्राहक लेख्नुहोस् --"
                    : "-- Type manually or pick registered store --"}
                </option>
                {allClientsList.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ""} -{" "}
                    {c.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Client Name & Shop Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {isNepali
                  ? "ग्राहक वा व्यापारीको नाम *"
                  : "Client / Store Owner Name *"}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Shrestha"
                value={reviewForm.client_name}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, client_name: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {isNepali ? "पसल / फर्मको नाम" : "Shop / Business Name"}
              </label>
              <input
                type="text"
                placeholder="e.g. Shrestha General Store"
                value={reviewForm.shop_name}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, shop_name: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Location & Star Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {isNepali ? "स्थान / ठेगाना" : "Location / City"}
              </label>
              <input
                type="text"
                placeholder="e.g. New Road, Kathmandu"
                value={reviewForm.location}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, location: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {isNepali ? "मूल्याङ्कन (Rating)" : "Star Rating (1 - 5)"}
              </label>
              <div className="flex items-center gap-2 h-9 px-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setReviewForm({ ...reviewForm, rating: star })
                    }
                    className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= reviewForm.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-neutral-700"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-amber-400 ml-2">
                  {reviewForm.rating} Star{reviewForm.rating > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Review Feedback Text */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              {isNepali
                ? "सन्तुष्ट ग्राहकको समीक्षा / अनुभव *"
                : "Client Review / Testimonial *"}
            </label>
            <textarea
              required
              rows={4}
              placeholder="e.g. The offline POS saved us during network downtime. Fractional units and thermal receipts are printed in seconds."
              value={reviewForm.review_text}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, review_text: e.target.value })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              {isNepali
                ? "यो समीक्षा तपाईंको ड्यासबोर्डमा मात्र रहन्छ र सार्वजनिक वेबसाइटमा कहिल्यै देखिँदैन।"
                : "Privacy Guaranteed: This review is saved only to your local dashboard and will NOT appear on the public website."}
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setIsAddReviewModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {isNepali ? "समीक्षा सुरक्षित गर्नुहोस्" : "Save Review"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Review Dialog */}
      <ConfirmDialog
        isOpen={!!deletingReviewId}
        onClose={() => setDeletingReviewId(null)}
        title={isNepali ? "समीक्षा हटाउन चाहनुहुन्छ?" : "Delete Client Review?"}
        message={
          isNepali
            ? "के तपाईं यो ग्राहक समीक्षा ड्यासबोर्डबाट स्थायी रूपमा हटाउन निश्चित हुनुहुन्छ?"
            : "Are you sure you want to remove this client review from your dashboard? This action cannot be undone."
        }
        confirmText={isNepali ? "हटाउनुहोस्" : "Delete Review"}
        cancelText={isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
        isDestructive={true}
        onConfirm={handleDeleteReviewConfirm}
      />
    </div>
  );
};
