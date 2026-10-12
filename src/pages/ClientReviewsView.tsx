/**
 * Client Reviews View (Internal Dashboard Only)
 * Dedicated navigation module for managing customer happiness reviews and store ratings.
 * NOTE: These reviews are strictly internal records stored in local SQLite database
 * and are completely disconnected from the public website.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Star,
  Plus,
  Trash2,
  Search,
  Filter,
  ShieldCheck,
  Users,
  Store,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Modal } from "../components/common/Modal";
import { NavTab } from "../components/layout/Sidebar";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { getAllClients, Client } from "../lib/services/clientService";
import {
  getAllClientReviews,
  getClientReviewsStats,
  createClientReview,
  deleteClientReview,
  ClientReview,
  CreateClientReviewInput,
} from "../lib/services/reviewService";

interface ClientReviewsViewProps {
  onNavigateToTab?: (tab: NavTab) => void;
}

export const ClientReviewsView: React.FC<ClientReviewsViewProps> = ({
  onNavigateToTab,
}) => {
  const { isNepali } = useLanguage();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    fiveStarCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<
    "all" | "5" | "4" | "3" | "2" | "1"
  >("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<CreateClientReviewInput>({
    client_name: "",
    shop_name: "",
    location: "",
    rating: 5,
    review_text: "",
    client_id: null,
  });

  const loadData = useCallback(async () => {
    try {
      const [rList, rStats, cList] = await Promise.all([
        getAllClientReviews(),
        getClientReviewsStats(),
        getAllClients(),
      ]);
      setReviews(rList);
      setStats(rStats);
      setClients(cList);
    } catch (e) {
      console.error("Error loading client reviews:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = (prefillClient?: Client) => {
    setForm({
      client_name: prefillClient ? prefillClient.name : "",
      shop_name: prefillClient ? prefillClient.company_name || "" : "",
      location: prefillClient ? prefillClient.address || "" : "",
      rating: 5,
      review_text: "",
      client_id: prefillClient ? String(prefillClient.id) : null,
    });
    setIsAddModalOpen(true);
  };

  const handleClientSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setForm((prev) => ({ ...prev, client_id: null }));
      return;
    }
    const found = clients.find((c) => String(c.id) === selectedId);
    if (found) {
      setForm((prev) => ({
        ...prev,
        client_name: found.name,
        shop_name: found.company_name || "",
        location: found.address || "",
        client_id: String(found.id),
      }));
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) {
      showToast(
        isNepali
          ? "कृपया ग्राहक वा पसलको नाम प्रविष्ट गर्नुहोस्"
          : "Please enter the client name",
        "warning",
      );
      return;
    }
    if (!form.review_text.trim()) {
      showToast(
        isNepali
          ? "कृपया ग्राहकको प्रतिक्रिया वा समीक्षा प्रविष्ट गर्नुहोस्"
          : "Please enter the review text",
        "warning",
      );
      return;
    }

    try {
      await createClientReview({
        client_name: form.client_name.trim(),
        shop_name: form.shop_name?.trim() || null,
        location: form.location?.trim() || null,
        rating: Number(form.rating) || 5,
        review_text: form.review_text.trim(),
        client_id: form.client_id || null,
      });

      showToast(
        isNepali
          ? "सन्तुष्ट ग्राहक समीक्षा सफलतापूर्वक थपियो"
          : "Client review saved to dashboard successfully",
        "success",
      );

      setIsAddModalOpen(false);
      setForm({
        client_name: "",
        shop_name: "",
        location: "",
        rating: 5,
        review_text: "",
        client_id: null,
      });
      await loadData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to save review", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReviewId) return;
    try {
      await deleteClientReview(deletingReviewId);
      showToast(
        isNepali ? "समीक्षा हटाइयो" : "Review removed from dashboard",
        "info",
      );
      setDeletingReviewId(null);
      await loadData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to delete review", "error");
    }
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      // Rating filter
      if (ratingFilter !== "all" && rev.rating !== parseInt(ratingFilter, 10)) {
        return false;
      }
      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        rev.client_name.toLowerCase().includes(q) ||
        (rev.shop_name && rev.shop_name.toLowerCase().includes(q)) ||
        (rev.location && rev.location.toLowerCase().includes(q)) ||
        rev.review_text.toLowerCase().includes(q)
      );
    });
  }, [reviews, ratingFilter, searchQuery]);

  return (
    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>
                {isNepali ? "सन्तुष्ट ग्राहक समीक्षा" : "Happy Clients Reviews"}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>
                {isNepali
                  ? "आन्तरिक ड्यासबोर्ड मात्र"
                  : "Internal Dashboard Only"}
              </span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 mt-2">
            {isNepali
              ? "सन्तुष्ट ग्राहक तथा पसलेहरूको समीक्षा"
              : "Client Happiness & Testimonials"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            {isNepali
              ? "तपाईंको पसलबाट सन्तुष्ट ग्राहकहरू, नियमित किराना तथा खुद्रा पसलेहरूको वास्तविक प्रतिक्रिया आन्तरिक रूपमा रेकर्ड गर्नुहोस्।"
              : "Privately record customer feedback, retailer satisfaction ratings, and happiness stories stored locally in your offline SQLite database."}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 rounded-xl border border-amber-400/40 shadow-lg shadow-amber-950/40 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>
              {isNepali ? "नयाँ समीक्षा थप्नुहोस्" : "Add Happy Client Review"}
            </span>
          </button>
        </div>
      </div>

      {/* Internal Security & Notice Banner */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-neutral-200">
              {isNepali
                ? "गोपनीयता सूचना: यो सेक्सन सार्वजनिक वेबसाइटमा जाँदैन"
                : "Privacy Guarantee: Strictly Internal to Dashboard"}
            </div>
            <div className="text-neutral-400 text-[11px] mt-0.5">
              {isNepali
                ? "यहाँ थपिएका समीक्षाहरू तपाईंको आफ्नै SQLite डेटाबेसमा मात्र रहन्छन्। सार्वजनिक वेबसाइटका समीक्षाहरू अलग छन्।"
                : "All reviews added here remain private inside your local database. They are never published or pushed to the public website."}
            </div>
          </div>
        </div>

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab("clients")}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {isNepali
                ? "दर्ता ग्राहकहरू हेर्नुहोस्"
                : "View Registered Clients"}
            </span>
          </button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Average Rating */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              {isNepali ? "औसत सन्तुष्टि स्तर" : "Average Happiness Rating"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-neutral-100">
              {stats.averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-neutral-500 font-medium">/ 5.0</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(stats.averageRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-neutral-700"
                }`}
              />
            ))}
            <span className="text-[11px] text-neutral-400 ml-2">
              ({stats.total} {isNepali ? "समीक्षाहरू" : "total reviews"})
            </span>
          </div>
        </div>

        {/* Card 2: 5-Star Reviews */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              {isNepali
                ? "५-तारे उत्कृष्ट समीक्षाहरू"
                : "5-Star Perfect Ratings"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-400">
              {stats.fiveStarCount}
            </span>
            <span className="text-xs text-neutral-500">
              (
              {stats.total > 0
                ? Math.round((stats.fiveStarCount / stats.total) * 100)
                : 0}
              % {isNepali ? "उत्कृष्ट" : "perfect"})
            </span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            {isNepali
              ? "अधिकतम सन्तुष्ट खुद्रा व्यवसायीहरू"
              : "Delighted store partners & loyal clients"}
          </p>
        </div>

        {/* Card 3: Total Recorded */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              {isNepali
                ? "कुल दर्ता गरिएका समीक्षाहरू"
                : "Total Recorded Reviews"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-neutral-100">
              {stats.total}
            </span>
            <span className="text-xs text-neutral-500">
              {isNepali ? "ग्राहक विवरण" : "client stories"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            {isNepali
              ? "स्थानीय अफलाइन SQLite मा सुरक्षित"
              : "Safely retained in local database storage"}
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isNepali
                ? "ग्राहकको नाम, पसल वा ठेगाना खोज्नुहोस्..."
                : "Search client, shop name, location, or feedback..."
            }
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-neutral-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>{isNepali ? "तारा स्तर:" : "Stars:"}</span>
          </span>
          {(["all", "5", "4", "3", "2", "1"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                ratingFilter === r
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200"
              }`}
            >
              {r === "all" ? (isNepali ? "सबै" : "All") : `${r} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Star className="w-6 h-6 fill-amber-400/30" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-200">
              {searchQuery || ratingFilter !== "all"
                ? isNepali
                  ? "कुनै समीक्षा फेला परेन"
                  : "No reviews match your filters"
                : isNepali
                  ? "अहिलेसम्म कुनै ग्राहक समीक्षा थपिएको छैन"
                  : "No client reviews recorded yet"}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {isNepali
                ? 'नयाँ ग्राहक समीक्षा थप्न "नयाँ समीक्षा थप्नुहोस्" बटनमा क्लिक गर्नुहोस्।'
                : 'Click "Add Happy Client Review" above to record genuine satisfaction stories from your retail buyers.'}
            </p>
          </div>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {isNepali ? "पहिलो समीक्षा थप्नुहोस्" : "Add First Review"}
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col justify-between group relative shadow-xs"
            >
              {/* Card Top: Stars & Delete Button */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-neutral-700"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-1.5">
                      {rev.rating}.0
                    </span>
                  </div>

                  <button
                    onClick={() => setDeletingReviewId(rev.id)}
                    className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                    title={isNepali ? "समीक्षा हटाउनुहोस्" : "Delete review"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-neutral-200 italic leading-relaxed line-clamp-4">
                  "{rev.review_text}"
                </p>
              </div>

              {/* Card Bottom: Client Info & Timestamp */}
              <div className="mt-5 pt-3.5 border-t border-neutral-800/80 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-100 truncate">
                    {rev.client_name}
                  </div>
                  {rev.shop_name && (
                    <div className="text-[11px] text-emerald-400 font-medium truncate flex items-center gap-1 mt-0.5">
                      <Store className="w-3 h-3 shrink-0" />
                      <span>{rev.shop_name}</span>
                    </div>
                  )}
                  {rev.location && (
                    <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{rev.location}</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-neutral-500 whitespace-nowrap shrink-0 mt-0.5">
                  {new Date(rev.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={
          isNepali
            ? "सन्तुष्ट ग्राहक समीक्षा थप्नुहोस्"
            : "Add Happy Client Review"
        }
      >
        <form onSubmit={handleSaveReview} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {isNepali
                ? "यो समीक्षा केवल ड्यासबोर्डमा सुरक्षित रहनेछ, सार्वजनिक वेबसाइटमा देखिने छैन।"
                : "This review is saved to your private local SQLite dashboard only and will NOT appear on the public website."}
            </span>
          </div>

          {/* Quick pick from registered clients */}
          {clients.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {isNepali
                  ? "दर्ता ग्राहकबाट छान्नुहोस् (ऐच्छिक)"
                  : "Pick from Registered Clients (Optional)"}
              </label>
              <select
                value={form.client_id ? String(form.client_id) : ""}
                onChange={handleClientSelectChange}
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">
                  {isNepali
                    ? "-- नयाँ ग्राहक प्रविष्ट गर्नुहोस् --"
                    : "-- Enter New Client Manually --"}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ""} -{" "}
                    {c.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Client Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              {isNepali ? "ग्राहकको नाम *" : "Client / Storekeeper Name *"}
            </label>
            <input
              type="text"
              required
              value={form.client_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, client_name: e.target.value }))
              }
              placeholder={
                isNepali ? "जस्तै: रमेश श्रेष्ठ" : "e.g. Ramesh Shrestha"
              }
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Shop Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {isNepali ? "पसल / मार्टको नाम" : "Store / Mart Name"}
              </label>
              <input
                type="text"
                value={form.shop_name || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shop_name: e.target.value }))
                }
                placeholder={
                  isNepali
                    ? "जस्तै: न्यूरोड किराना भण्डार"
                    : "e.g. New Road Mart"
                }
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {isNepali ? "ठेगाना / सहर" : "Location / City"}
              </label>
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder={isNepali ? "जस्तै: काठमाडौँ" : "e.g. Kathmandu"}
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Rating selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              {isNepali
                ? "सन्तुष्टि मूल्याङ्कन (Rating) *"
                : "Satisfaction Rating *"}
            </label>
            <div className="flex items-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                  className="p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= form.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-neutral-700"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-400 ml-2">
                {form.rating} {isNepali ? "तारा" : "Stars"}
              </span>
            </div>
          </div>

          {/* Review text */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              {isNepali
                ? "ग्राहकको प्रतिक्रिया / अनुभव *"
                : "Review Feedback / Experience *"}
            </label>
            <textarea
              required
              rows={4}
              value={form.review_text}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, review_text: e.target.value }))
              }
              placeholder={
                isNepali
                  ? "ग्राहकको अनुभव यहाँ लेख्नुहोस् (जस्तै: अफलाइन बिलिङ र प्रिन्टर एकदमै छिटो चल्यो...)"
                  : "Write their feedback here (e.g. Offline billing is very fast, printer prints receipts seamlessly...)"
              }
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              {isNepali ? "समीक्षा सुरक्षित गर्नुहोस्" : "Save Review"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingReviewId}
        onClose={() => setDeletingReviewId(null)}
        title={isNepali ? "समीक्षा हटाउन चाहनुहुन्छ?" : "Delete Client Review?"}
        message={
          isNepali
            ? "के तपाईं साँच्चै यो ग्राहक समीक्षा ड्यासबोर्डबाट मेटाउन चाहनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।"
            : "Are you sure you want to permanently delete this client review from the dashboard?"
        }
        confirmText={isNepali ? "हटाउनुहोस्" : "Delete"}
        cancelText={isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
        onConfirm={handleDeleteConfirm}
        isDestructive={true}
      />
    </div>
  );
};
