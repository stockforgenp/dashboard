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
  Users,
  Store,
  MapPin,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Table, Column } from "../components/common/Table";
import { ActionMenu } from "../components/common/ActionMenu";
import { Skeleton, CardSkeleton } from "../components/common/Skeleton";
import { NavTab } from "../components/layout/Sidebar";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { getAllClients, Client } from "../lib/services/clientService";
import { formatDate } from "../lib/utils/format";
import {
  getAllClientReviews,
  getClientReviewsStats,
  deleteClientReview,
  ClientReview,
} from "../lib/services/reviewService";
import { ClientReviewModal } from "../components/forms/index.ts";

export const ClientReviewsView = () => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefillClient, setPrefillClient] = useState<Client | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = (client?: Client) => {
    setPrefillClient(client || null);
    setIsAddModalOpen(true);
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

  const reviewColumns = useMemo<Column<ClientReview>[]>(
    () => [
      {
        id: "client",
        header: isNepali ? "ग्राहक तथा पसल" : "Client & Store",
        sortable: true,
        accessor: (r) => r.client_name,
        render: (rev) => (
          <div>
            <div className="font-bold text-neutral-100 text-xs">
              {rev.client_name}
            </div>
            {rev.shop_name && (
              <div className="text-[11px] text-amber-400/90 font-medium truncate">
                {rev.shop_name}
              </div>
            )}
            {rev.location && (
              <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                <span>{rev.location}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "rating",
        header: isNepali ? "मूल्याङ्कन" : "Rating",
        sortable: true,
        accessor: (r) => r.rating,
        render: (rev) => (
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold text-xs font-mono">
              {rev.rating}.0
            </span>
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= rev.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-700"
                  }`}
                />
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "review",
        header: isNepali ? "समीक्षा / प्रतिक्रिया" : "Review Feedback",
        render: (rev) => (
          <p className="text-xs text-neutral-300 italic line-clamp-2 max-w-md leading-relaxed">
            "{rev.review_text}"
          </p>
        ),
      },
      {
        id: "date",
        header: isNepali ? "मिति" : "Date",
        sortable: true,
        accessor: (r) => r.created_at,
        render: (rev) => (
          <div className="text-[11px] text-neutral-400 font-mono">
            {formatDate(rev.created_at)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        render: (rev) => (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              align="right"
              title={`Actions for review by ${rev.client_name}`}
              items={[
                {
                  id: "delete",
                  label: "Delete Review",
                  icon: Trash2,
                  color: "rose",
                  onClick: () => setDeletingReviewId(rev.id),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [isNepali],
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
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
            {isLoading ? (
              <Skeleton width="60px" height="32px" className="my-0.5" />
            ) : (
              <>
                <span className="text-3xl font-black tracking-tight text-neutral-100">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-500 font-medium">
                  / 5.0
                </span>
              </>
            )}
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
            {isLoading ? (
              <Skeleton width="50px" height="32px" className="my-0.5" />
            ) : (
              <>
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
              </>
            )}
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
            {isLoading ? (
              <Skeleton width="50px" height="32px" className="my-0.5" />
            ) : (
              <>
                <span className="text-3xl font-black tracking-tight text-neutral-100">
                  {stats.total}
                </span>
                <span className="text-xs text-neutral-500">
                  {isNepali ? "ग्राहक विवरण" : "client stories"}
                </span>
              </>
            )}
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            {isNepali
              ? "स्थानीय अफलाइन SQLite मा सुरक्षित"
              : "Safely retained in local database storage"}
          </p>
        </div>
      </div>

      {/* Reviews Display Table / Hub with Integrated Search, Filters, and Actions */}
      <Table<ClientReview>
        data={filteredReviews}
        columns={reviewColumns}
        keyExtractor={(rev) => rev.id}
        isLoading={isLoading}
        skeletonRows={6}
        enablePagination={true}
        pageSize={10}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: isNepali
            ? "ग्राहकको नाम, पसल वा ठेगाना खोज्नुहोस्..."
            : "Search client, shop name, location, or feedback...",
        }}
        filters={
          <>
            {/* Rating Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(["all", "5", "4", "3", "2", "1"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
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

            {/* View Toggle */}
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-neutral-800 text-amber-400 shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
                title={isNepali ? "तालिका दृश्य" : "Table View"}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-neutral-800 text-amber-400 shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
                title={isNepali ? "कार्ड दृश्य" : "Cards View"}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </>
        }
        actions={
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {isNepali ? "नयाँ समीक्षा थप्नुहोस्" : "Add Happy Client Review"}
            </span>
          </button>
        }
        customView={
          viewMode === "cards" ? (
            filteredReviews.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-neutral-900/40 space-y-4">
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
                    className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between group relative shadow-xs"
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

                        <ActionMenu
                          align="right"
                          title={`Actions for review by ${rev.client_name}`}
                          items={[
                            {
                              id: "delete",
                              label: "Delete Review",
                              icon: Trash2,
                              color: "rose",
                              onClick: () => setDeletingReviewId(rev.id),
                            },
                          ]}
                        />
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
            )
          ) : undefined
        }
        emptyState={{
          title:
            searchQuery || ratingFilter !== "all"
              ? isNepali
                ? "कुनै समीक्षा फेला परेन"
                : "No reviews match your filters"
              : isNepali
                ? "अहिलेसम्म कुनै ग्राहक समीक्षा थपिएको छैन"
                : "No client reviews recorded yet",
          description: isNepali
            ? 'नयाँ ग्राहक समीक्षा थप्न "पहिलो समीक्षा थप्नुहोस्" बटनमा क्लिक गर्नुहोस्।'
            : 'Click "Add Happy Client Review" above to record genuine satisfaction stories from your retail buyers.',
          icon: <Star className="w-6 h-6 text-amber-400 fill-amber-400/30" />,
          action: {
            label: isNepali ? "पहिलो समीक्षा थप्नुहोस्" : "Add First Review",
            onClick: () => handleOpenAddModal(),
            icon: <Plus className="w-3.5 h-3.5" />,
          },
        }}
      />

      {/* Add Review Modal */}
      <ClientReviewModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPrefillClient(null);
        }}
        clients={clients}
        prefillClient={prefillClient}
        onSuccess={() => loadData()}
      />

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
