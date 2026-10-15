/**
 * Enquiries Management View
 * Dedicated management view for Inbound Retail Enquiries, POS Demos, and Leads Conversion.
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Eye,
  Store,
  PlusCircle,
  BadgeCheck,
  UserCheck,
  LayoutGrid,
  List,
} from "lucide-react";
import { Table, Column } from "../components/common/Table.tsx";
import { ActionMenu } from "../components/common/ActionMenu.tsx";
import { CardSkeleton } from "../components/common/Skeleton.tsx";
import {
  getAllEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  getEnquiryStats,
  Enquiry,
  EnquiryStatus,
  EnquiryStats,
} from "../lib/services/enquiryService.ts";
import { formatDate } from "../lib/utils/format.ts";
import { ConfirmDialog } from "../components/common/ConfirmDialog.tsx";
import { Modal } from "../components/common/Modal.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { useToast } from "../context/ToastContext.tsx";
import {
  LeadEnquiryModal,
  ConvertLeadModal,
  INQUIRY_TYPE_LABELS,
} from "../components/forms/index.ts";

export const EnquiriesView: React.FC = () => {
  const navigate = useNavigate();
  const { isNepali, formatNumberByLang } = useLanguage();
  const { showToast } = useToast();

  // Enquiries state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquirySearch, setEnquirySearch] = useState("");
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<string>("all");
  const [enquiryTypeFilter, setEnquiryTypeFilter] = useState<string>("all");
  const [enquiryStats, setEnquiryStats] = useState<EnquiryStats>({
    total: 0,
    new_count: 0,
    contacted_count: 0,
    in_progress_count: 0,
    converted_count: 0,
    closed_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [enquiryViewMode, setEnquiryViewMode] = useState<"table" | "cards">(
    "table",
  );

  // Modals state
  const [isAddEnquiryOpen, setIsAddEnquiryOpen] = useState(false);
  const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
  const [deletingEnquiryId, setDeletingEnquiryId] = useState<string | null>(
    null,
  );
  const [convertingEnquiry, setConvertingEnquiry] = useState<Enquiry | null>(
    null,
  );

  // Refresh data function
  const refreshEnquiryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [e, eStats] = await Promise.all([
        getAllEnquiries({
          search: enquirySearch,
          status: enquiryStatusFilter,
          inquiryType: enquiryTypeFilter,
        }),
        getEnquiryStats(),
      ]);
      setEnquiries(e);
      setEnquiryStats(eStats);
    } catch (err) {
      console.error("Error refreshing enquiries data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [enquirySearch, enquiryStatusFilter, enquiryTypeFilter]);

  useEffect(() => {
    refreshEnquiryData();
  }, [refreshEnquiryData]);

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    try {
      await updateEnquiryStatus(id, newStatus);
      showToast(
        isNepali
          ? `सोधपुछ स्थिति अद्यावधिक गरियो: ${newStatus}`
          : `Enquiry status changed to ${newStatus}`,
        "success",
      );
      await refreshEnquiryData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to update status", "error");
    }
  };

  const handleDeleteEnquiryConfirm = async () => {
    if (deletingEnquiryId) {
      try {
        await deleteEnquiry(deletingEnquiryId);
        showToast(isNepali ? "सोधपुछ हटाइयो" : "Enquiry removed", "success");
        setDeletingEnquiryId(null);
        await refreshEnquiryData();
      } catch (err: unknown) {
        showToast(
          (err as Error).message || "Failed to delete enquiry",
          "error",
        );
      }
    }
  };

  const enquiryColumns = useMemo<Column<Enquiry>[]>(
    () => [
      {
        id: "ref",
        header: isNepali ? "सन्दर्भ / प्रकार" : "Reference & Type",
        sortable: true,
        accessor: (e) => e.reference_id,
        render: (enq) => {
          const typeLabel = INQUIRY_TYPE_LABELS[enq.inquiry_type] || {
            en: enq.inquiry_type,
            np: enq.inquiry_type,
          };
          return (
            <div>
              <span className="font-mono text-xs font-bold text-neutral-200 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 inline-block">
                {enq.reference_id}
              </span>
              <div className="text-[11px] text-neutral-400 mt-1 font-medium truncate max-w-[170px]">
                {isNepali ? typeLabel.np : typeLabel.en}
              </div>
            </div>
          );
        },
      },
      {
        id: "inquirer",
        header: isNepali ? "अनुरोधकर्ता तथा पसल" : "Inquirer & Store",
        sortable: true,
        accessor: (e) => e.full_name,
        render: (enq) => (
          <div>
            <div className="font-bold text-neutral-100 text-xs">
              {enq.full_name}
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
              <Store className="w-3 h-3 text-neutral-500 shrink-0" />
              <span className="truncate max-w-[160px]">
                {enq.shop_name || enq.store_type || "Retail Store"}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "contact",
        header: isNepali ? "सम्पर्क" : "Contact",
        render: (enq) => (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${enq.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-neutral-200 hover:text-emerald-400 font-mono flex items-center gap-1 transition-colors"
              >
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{enq.phone}</span>
              </a>
              <a
                href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                WA
              </a>
            </div>
            {enq.email && (
              <a
                href={`mailto:${enq.email}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-neutral-400 hover:text-emerald-400 truncate flex items-center gap-1 transition-colors block max-w-[150px]"
              >
                <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                <span className="truncate">{enq.email}</span>
              </a>
            )}
          </div>
        ),
      },
      {
        id: "date",
        header: isNepali ? "मिति" : "Date",
        sortable: true,
        accessor: (e) => e.created_at,
        render: (enq) => (
          <div className="text-[11px] text-neutral-400 font-mono">
            {formatDate(enq.created_at)}
          </div>
        ),
      },
      {
        id: "status",
        header: isNepali ? "स्थिति" : "Status",
        sortable: true,
        accessor: (e) => e.status,
        render: (enq) => (
          <select
            value={enq.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              handleStatusChange(enq.id, e.target.value as EnquiryStatus)
            }
            className="text-[11px] font-semibold px-2 py-1 rounded-lg border bg-neutral-950 border-neutral-700 text-neutral-200 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="new">{isNepali ? "नयाँ (New)" : "New"}</option>
            <option value="contacted">
              {isNepali ? "सम्पर्क भयो" : "Contacted"}
            </option>
            <option value="in_progress">
              {isNepali ? "प्रक्रियामा" : "In Progress"}
            </option>
            <option value="converted">
              {isNepali ? "ग्राहक बन्यो" : "Converted"}
            </option>
            <option value="closed">{isNepali ? "बन्द" : "Closed"}</option>
          </select>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        render: (enq) => (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              align="right"
              title={`Actions for ${enq.full_name}`}
              items={[
                enq.status !== "converted" && {
                  id: "convert",
                  label: "Convert to Client",
                  icon: UserCheck,
                  color: "emerald",
                  onClick: () => setConvertingEnquiry(enq),
                },
                {
                  id: "view",
                  label: "View Details",
                  icon: Eye,
                  color: "neutral",
                  onClick: () => setViewingEnquiry(enq),
                },
                {
                  id: "delete",
                  label: "Delete Enquiry",
                  icon: Trash2,
                  color: "rose",
                  divider: true,
                  onClick: () => setDeletingEnquiryId(enq.id),
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
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Enquiries Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              {isNepali ? "कुल सोधपुछ" : "Total Inquiries"}
            </div>
            <div className="text-2xl font-bold text-neutral-100 font-mono mt-1">
              {formatNumberByLang(enquiryStats.total)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {isNepali ? "सबै च्यानलबाट" : "From all channels"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>{isNepali ? "नयाँ सोधपुछ" : "New Leads"}</span>
              {enquiryStats.new_count > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
              {formatNumberByLang(enquiryStats.new_count)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {isNepali ? "सम्पर्क गर्न बाँकी" : "Awaiting contact"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              {isNepali ? "प्रक्रियामा" : "In Progress"}
            </div>
            <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
              {formatNumberByLang(
                enquiryStats.in_progress_count + enquiryStats.contacted_count,
              )}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {isNepali ? "डेमो / छलफल जारी" : "Active follow-up"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              {isNepali ? "रूपान्तरित ग्राहक" : "Converted"}
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {formatNumberByLang(enquiryStats.converted_count)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {isNepali ? "सफल ग्राहक दर्ता" : "Became registered client"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BadgeCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              {isNepali ? "समाप्त / बन्द" : "Resolved"}
            </div>
            <div className="text-2xl font-bold text-neutral-300 font-mono mt-1">
              {formatNumberByLang(enquiryStats.closed_count)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {isNepali ? "सम्पन्न सोधपुछ" : "Closed / finished"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>



      {/* Enquiries List / Table with Integrated Search, Filters, and Actions */}
      <Table<Enquiry>
        data={enquiries}
        columns={enquiryColumns}
        keyExtractor={(enq) => enq.id}
        isLoading={isLoading}
        skeletonRows={6}
        enablePagination={true}
        pageSize={10}
        onRowClick={(enq) => setViewingEnquiry(enq)}
        search={{
          value: enquirySearch,
          onChange: setEnquirySearch,
          placeholder: isNepali
            ? "Ref ID, नाम, पसल वा सोधपुछको सन्देश खोज्नुहोस्..."
            : "Search by reference ID, inquirer, store, or message...",
        }}
        filters={
          <>
            <select
              value={enquiryStatusFilter}
              onChange={(e) => setEnquiryStatusFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">
                {isNepali ? "सबै स्थिति" : "All Status"}
              </option>
              <option value="new">{isNepali ? "नयाँ (New)" : "New"}</option>
              <option value="contacted">
                {isNepali ? "सम्पर्क गरिएको (Contacted)" : "Contacted"}
              </option>
              <option value="in_progress">
                {isNepali ? "प्रक्रियामा (In Progress)" : "In Progress"}
              </option>
              <option value="converted">
                {isNepali ? "ग्राहक बन्यो (Converted)" : "Converted"}
              </option>
              <option value="closed">
                {isNepali ? "बन्द (Closed)" : "Closed"}
              </option>
            </select>

            <select
              value={enquiryTypeFilter}
              onChange={(e) => setEnquiryTypeFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">
                {isNepali ? "सबै अनुरोध प्रकार" : "All Inquiry Types"}
              </option>
              {Object.entries(INQUIRY_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {isNepali ? label.np : label.en}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setEnquiryViewMode("table")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  enquiryViewMode === "table"
                    ? "bg-neutral-800 text-teal-400 shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
                title={isNepali ? "तालिका दृश्य" : "Table View"}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setEnquiryViewMode("cards")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  enquiryViewMode === "cards"
                    ? "bg-neutral-800 text-teal-400 shadow-xs"
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
            onClick={() => setIsAddEnquiryOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isNepali ? "नयाँ सोधपुछ दर्ता" : "Log Inquiry"}</span>
          </button>
        }
        customView={
          enquiryViewMode === "cards" ? (
            enquiries.length === 0 ? (
              <div className="p-12 text-center bg-neutral-900/40 rounded-xl">
                <MessageSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-neutral-300">
                  {isNepali ? "कुनै सोधपुछ छैन" : "No Enquiries"}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  {isNepali
                    ? "अन-साइट डेमो अनुरोध वा ग्राहक प्रश्नहरू यहाँ कार्ड स्वरूपमा देखाइनेछ।"
                    : "Retail leads and inquiries will appear here in interactive cards."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enquiries.map((enq) => {
                  const typeLabel = INQUIRY_TYPE_LABELS[enq.inquiry_type] || {
                    en: enq.inquiry_type,
                    np: enq.inquiry_type,
                  };

                  return (
                    <div
                      key={enq.id}
                      onClick={() => setViewingEnquiry(enq)}
                      className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                      {/* Top strip */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-200 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                            {enq.reference_id}
                          </span>
                          <span className="text-[10px] font-semibold text-teal-400 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                            {isNepali ? typeLabel.np : typeLabel.en}
                          </span>
                        </div>

                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={enq.status}
                            onChange={(e) =>
                              handleStatusChange(
                                enq.id,
                                e.target.value as EnquiryStatus,
                              )
                            }
                            className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-neutral-950 border-neutral-700 text-neutral-200 focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="new">{isNepali ? "नयाँ" : "New"}</option>
                            <option value="contacted">
                              {isNepali ? "सम्पर्क भयो" : "Contacted"}
                            </option>
                            <option value="in_progress">
                              {isNepali ? "प्रक्रियामा" : "In Progress"}
                            </option>
                            <option value="converted">
                              {isNepali ? "ग्राहक बन्यो" : "Converted"}
                            </option>
                            <option value="closed">
                              {isNepali ? "बन्द" : "Closed"}
                            </option>
                          </select>

                          <ActionMenu
                            align="right"
                            title={`Actions for ${enq.full_name}`}
                            items={[
                              enq.status !== "converted" && {
                                id: "convert",
                                label: "Convert to Client",
                                icon: UserCheck,
                                color: "emerald",
                                onClick: () => setConvertingEnquiry(enq),
                              },
                              {
                                id: "view",
                                label: "View Details",
                                icon: Eye,
                                color: "neutral",
                                onClick: () => setViewingEnquiry(enq),
                              },
                              {
                                id: "delete",
                                label: "Delete Enquiry",
                                icon: Trash2,
                                color: "rose",
                                divider: true,
                                onClick: () => setDeletingEnquiryId(enq.id),
                              },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Middle: Details & Message */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="font-bold text-neutral-100 text-sm">
                            {enq.full_name}
                          </div>
                          <div className="text-xs text-neutral-400 font-medium">
                            {enq.shop_name || "Retail Business"}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-1">
                            {new Date(enq.created_at).toLocaleString()}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${enq.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-neutral-200 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{enq.phone}</span>
                            </a>
                            <a
                              href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                            >
                              WhatsApp
                            </a>
                          </div>
                          <div>
                            <a
                              href={`mailto:${enq.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors truncate"
                            >
                              <Mail className="w-3.5 h-3.5 text-neutral-500" />
                              <span className="truncate">{enq.email}</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 text-xs text-neutral-300">
                        {enq.subject && (
                          <div className="font-semibold text-neutral-200 text-xs mb-1 line-clamp-1">
                            {enq.subject}
                          </div>
                        )}
                        <p className="line-clamp-2 text-neutral-400 text-[11px] leading-relaxed">
                          {enq.message}
                        </p>
                      </div>

                      {/* Bottom Action Strip */}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs">
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                          {enq.notes ? (
                            <span className="italic line-clamp-1">
                              {isNepali ? "टिप्पणी" : "Note"}: {enq.notes}
                            </span>
                          ) : (
                            <span className="text-neutral-500">
                              {isNepali
                                ? "कुनै अतिरिक्त टिप्पणी छैन"
                                : "No follow-up notes logged"}
                            </span>
                          )}
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          {enq.status !== "converted" ? (
                            <button
                              onClick={() => setConvertingEnquiry(enq)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>
                                {isNepali
                                  ? "दर्ता भएका ग्राहकमा बदल्नुहोस्"
                                  : "Convert to Registered Client"}
                              </span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                              <BadgeCheck className="w-3.5 h-3.5" />
                              <span>
                                {isNepali
                                  ? "ग्राहक दर्ता सम्पन्न"
                                  : "Client Profile Active"}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : undefined
        }
        emptyState={{
          title: isNepali ? "कुनै सोधपुछ फेला परेन" : "No Enquiries Found",
          description: isNepali
            ? "वेबसाइटको सम्पर्क वा डेमो फारामबाट आउने अनुरोधहरू यहाँ देखा पर्नेछन्।"
            : "Inquiries submitted through the website contact form or demo requests will appear here.",
          icon: <MessageSquare className="w-6 h-6 text-neutral-400" />,
          action: {
            label: isNepali
              ? "पहिलो सोधपुछ दर्ता गर्नुहोस्"
              : "Log First Enquiry",
            onClick: () => setIsAddEnquiryOpen(true),
            icon: <PlusCircle className="w-3.5 h-3.5" />,
          },
        }}
      />

      {/* MODAL 1: LOG NEW ENQUIRY */}
      <LeadEnquiryModal
        isOpen={isAddEnquiryOpen}
        onClose={() => setIsAddEnquiryOpen(false)}
        onSuccess={() => refreshEnquiryData()}
      />

      {/* MODAL 2: VIEW ENQUIRY DETAILS */}
      <Modal
        isOpen={viewingEnquiry !== null}
        onClose={() => setViewingEnquiry(null)}
        title={
          viewingEnquiry
            ? `${viewingEnquiry.reference_id} - ${viewingEnquiry.full_name}`
            : "Enquiry Details"
        }
        subtitle={
          viewingEnquiry?.shop_name || "Customer Retail Demo & Inquiry Request"
        }
        maxWidth="lg"
      >
        {viewingEnquiry && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <span>{viewingEnquiry.full_name}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-teal-400">
                    {viewingEnquiry.reference_id}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {viewingEnquiry.shop_name || "Retail Lead"} &bull;{" "}
                  {viewingEnquiry.store_type}
                </div>
              </div>

              <div>
                <select
                  value={viewingEnquiry.status}
                  onChange={(e) =>
                    handleStatusChange(
                      viewingEnquiry.id,
                      e.target.value as EnquiryStatus,
                    )
                  }
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-neutral-950 border-neutral-700 text-neutral-200 focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="new">{isNepali ? "नयाँ" : "New"}</option>
                  <option value="contacted">
                    {isNepali ? "सम्पर्क भयो" : "Contacted"}
                  </option>
                  <option value="in_progress">
                    {isNepali ? "प्रक्रियामा" : "In Progress"}
                  </option>
                  <option value="converted">
                    {isNepali ? "ग्राहक बन्यो" : "Converted"}
                  </option>
                  <option value="closed">{isNepali ? "बन्द" : "Closed"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500">
                  {isNepali ? "फोन नम्बर" : "Phone"}:
                </span>
                <div className="font-mono text-neutral-200 mt-0.5 flex items-center gap-2">
                  <span>{viewingEnquiry.phone}</span>
                  <a
                    href={`tel:${viewingEnquiry.phone}`}
                    className="text-teal-400 hover:underline text-[10px]"
                  >
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${viewingEnquiry.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline text-[10px]"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "इमेल" : "Email"}:
                </span>
                <div className="text-neutral-200 mt-0.5 truncate">
                  {viewingEnquiry.email ? (
                    <a
                      href={`mailto:${viewingEnquiry.email}`}
                      className="hover:text-teal-400"
                    >
                      {viewingEnquiry.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "अनुरोध प्रकार" : "Inquiry Type"}:
                </span>
                <div className="text-neutral-200 mt-0.5 font-medium">
                  {INQUIRY_TYPE_LABELS[viewingEnquiry.inquiry_type]?.[
                    isNepali ? "np" : "en"
                  ] || viewingEnquiry.inquiry_type}
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "प्राप्त मिति" : "Received At"}:
                </span>
                <div className="font-mono text-neutral-200 mt-0.5">
                  {new Date(viewingEnquiry.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {viewingEnquiry.subject && (
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                  {isNepali ? "विषय" : "Subject"}
                </span>
                <div className="text-neutral-100 font-semibold mt-0.5 text-xs">
                  {viewingEnquiry.subject}
                </div>
              </div>
            )}

            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                {isNepali ? "सन्देश / विवरण" : "Message / Enquiry Text"}
              </span>
              <p className="text-neutral-300 mt-1 whitespace-pre-line leading-relaxed">
                {viewingEnquiry.message}
              </p>
            </div>

            {viewingEnquiry.notes && (
              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                  {isNepali ? "आन्तरिक टिप्पणी" : "Staff Notes"}
                </span>
                <p className="text-neutral-400 mt-1 whitespace-pre-line leading-relaxed italic">
                  {viewingEnquiry.notes}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-neutral-800">
              {viewingEnquiry.status !== "converted" ? (
                <button
                  onClick={() => {
                    const enq = viewingEnquiry;
                    setViewingEnquiry(null);
                    setConvertingEnquiry(enq);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    {isNepali
                      ? "दर्ता भएका ग्राहकमा बदल्नुहोस्"
                      : "Convert to Registered Client"}
                  </span>
                </button>
              ) : (
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4" />
                  <span>
                    {isNepali ? "पहिले नै रूपान्तरित" : "Already converted"}
                  </span>
                </span>
              )}

              <button
                onClick={() => setViewingEnquiry(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {isNepali ? "बन्द गर्नुहोस्" : "Close"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: CONVERT ENQUIRY TO CLIENT MODAL */}
      <ConvertLeadModal
        isOpen={convertingEnquiry !== null}
        onClose={() => setConvertingEnquiry(null)}
        enquiry={convertingEnquiry}
        onSuccess={() => {
          refreshEnquiryData();
          navigate("/clients");
        }}
      />

      {/* CONFIRM DELETE ENQUIRY DIALOG */}
      <ConfirmDialog
        isOpen={deletingEnquiryId !== null}
        onClose={() => setDeletingEnquiryId(null)}
        onConfirm={handleDeleteEnquiryConfirm}
        title={isNepali ? "सोधपुछ मेटाउनुहोस्" : "Delete Enquiry"}
        message={
          isNepali
            ? "के तपाईं यो सोधपुछ हटाउन निश्चित हुनुहुन्छ?"
            : "Are you sure you want to remove this inquiry record?"
        }
        confirmText={isNepali ? "मेटाउनुहोस्" : "Delete"}
        cancelText={isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
        isDestructive={true}
      />
    </div>
  );
};
