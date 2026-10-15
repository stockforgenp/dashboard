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
import { formatDate } from "../lib/utils/format";
import { Table, Column } from "../components/common/Table";
import { Skeleton } from "../components/common/Skeleton";
import { ClientOnboardingModal, LeadEnquiryModal } from "../components/forms";

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { isNepali, formatNumberByLang } = useLanguage();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Action Modals
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddEnquiryOpen, setIsAddEnquiryOpen] = useState(false);

  // KPI Statistics
  const [clientStats, setClientStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    trial: 0,
    expired: 0,
    cancelled: 0,
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
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [latestReview, setLatestReview] = useState<ClientReview | null>(null);

  const refreshData = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

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
        setRecentClients(allC.slice(0, 5));
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

  return (
    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="text-3xl font-extrabold text-neutral-100 font-mono tabular-nums">
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

        {/* Active Subscriptions */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/clients")}
          className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "सक्रिय खाताहरू" : "Active Stores"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="60px" height="32px" className="my-0.5" />
            ) : (
              <div className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
                {formatNumberByLang(clientStats.active)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {formatNumberByLang(clientStats.trial)}{" "}
                {isNepali ? "परीक्षण (ट्रायल)" : "on trial"}
              </span>
              <span className="text-emerald-400 group-hover:translate-x-1 transition-transform font-semibold text-xs">
                →
              </span>
            </div>
          </div>
        </motion.div>

        {/* Total Inquiries & Leads */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/enquiries")}
          className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-teal-500/50 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "सोधपुछ तथा लिड्स" : "Inbound Leads"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="60px" height="32px" className="my-0.5" />
            ) : (
              <div className="text-3xl font-extrabold text-neutral-100 font-mono tabular-nums">
                {formatNumberByLang(enquiryStats.total)}
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span
                className={
                  enquiryStats.new_count > 0 ? "text-amber-400 font-medium" : ""
                }
              >
                {formatNumberByLang(enquiryStats.new_count)}{" "}
                {isNepali ? "नयाँ बाँकी" : "new awaiting reply"}
              </span>
              <span className="text-teal-400 group-hover:translate-x-1 transition-transform font-semibold text-xs">
                →
              </span>
            </div>
          </div>
        </motion.div>

        {/* Happy Client Reviews Summary */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => navigate("/reviews")}
          className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">
              {isNepali ? "सन्तुष्टि मूल्याङ्कन" : "Client Satisfaction"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <Skeleton width="80px" height="32px" className="my-0.5" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-300 font-mono tabular-nums">
                  {reviewStats.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-amber-400 flex items-center">
                  {"★".repeat(Math.round(reviewStats.averageRating || 5))}
                </span>
              </div>
            )}
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
              <span>
                {formatNumberByLang(reviewStats.total)}{" "}
                {isNepali ? "समीक्षाहरू" : "verified reviews"}
              </span>
              <span className="text-amber-400 group-hover:translate-x-1 transition-transform font-semibold text-xs">
                →
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2-Column Split: Recent Clients & Inbound Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Clients Directory */}
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
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
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
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
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Right Column: Inbound Leads & Demo Inquiries */}
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
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
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
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
              <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
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
