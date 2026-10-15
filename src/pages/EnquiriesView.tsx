/**
 * Enquiries Management View
 * Dedicated management view for Inbound Retail Enquiries, POS Demos, and Leads Conversion.
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Filter,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Eye,
  Store,
  PlusCircle,
  FileText,
  BadgeCheck,
  RefreshCw,
  UserCheck,
  Calendar,
  Sparkles,
  Lock,
  EyeOff,
  LayoutGrid,
  List,
} from "lucide-react";
import { Table, Column } from "../components/common/Table.tsx";
import { Skeleton, CardSkeleton } from "../components/common/Skeleton.tsx";
import {
  getAllEnquiries,
  createEnquiry,
  updateEnquiryStatus,
  deleteEnquiry,
  convertEnquiryToClient,
  getEnquiryStats,
  Enquiry,
  CreateEnquiryInput,
  EnquiryStatus,
  EnquiryStats,
} from "../lib/services/enquiryService.ts";
import { CreateClientInput } from "../lib/services/clientService.ts";
import { formatDate } from "../lib/utils/format.ts";
import { ConfirmDialog } from "../components/common/ConfirmDialog.tsx";
import { Modal } from "../components/common/Modal.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { useToast } from "../context/ToastContext.tsx";

const STORE_TYPES = [
  "Grocery & Supermarket",
  "Grocery Mart",
  "Supermarket",
  "Hardware & Construction",
  "Hardware Store",
  "Dairy, Oils & Liquids",
  "Electronics & Mobile",
  "Pharmacy & Health",
  "Clothing & Boutique",
  "Wholesale Dealer",
  "Other",
];

const INQUIRY_TYPE_LABELS: Record<string, { en: string; np: string }> = {
  on_site_demo: { en: "On-Site Demo Request", np: "अन-साइट डेमो अनुरोध" },
  vat_compliance: { en: "Invoicing & Tax Setup", np: "बिलिङ तथा कर प्रणाली" },
  hardware_pairing: {
    en: "Hardware / Printer Pairing",
    np: "प्रिन्टर तथा हार्डवेयर",
  },
  multi_unit_help: {
    en: "Multi-Unit Inventory Guidance",
    np: "एकाइ तथा मौज्दात सहयोग",
  },
  wholesale_deployment: {
    en: "Enterprise / Multi-Counter",
    np: "बहु-काउन्टर प्रणाली",
  },
  general_support: { en: "General Support Inquiry", np: "सामान्य सोधपुछ" },
};

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
  const [enquiryViewMode, setEnquiryViewMode] = useState<"table" | "cards">("table");

  // Modals state
  const [isAddEnquiryOpen, setIsAddEnquiryOpen] = useState(false);
  const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
  const [deletingEnquiryId, setDeletingEnquiryId] = useState<string | null>(null);
  const [convertingEnquiry, setConvertingEnquiry] = useState<Enquiry | null>(null);
  const [showConvertPassword, setShowConvertPassword] = useState(false);
  const [isConvertingLoading, setIsConvertingLoading] = useState(false);

  // Enquiry Form State
  const [enquiryForm, setEnquiryForm] = useState<CreateEnquiryInput>({
    full_name: "",
    shop_name: "",
    email: "",
    phone: "",
    store_type: "Grocery & Supermarket",
    inquiry_type: "on_site_demo",
    subject: "",
    message: "",
    status: "new",
    notes: "",
  });

  // Convert Form State
  const [convertForm, setConvertForm] = useState<CreateClientInput>({
    name: "",
    company_name: "",
    email: "",
    password: "",
    phone: "",
    client_type: "Grocery & Supermarket",
    address: "",
    pan_number: "",
    status: "active",
    notes: "",
    plan: "trial",
    durationDays: 14,
  });

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

  const resetEnquiryForm = () => {
    setEnquiryForm({
      full_name: "",
      shop_name: "",
      email: "",
      phone: "",
      store_type: "Grocery & Supermarket",
      inquiry_type: "on_site_demo",
      subject: "",
      message: "",
      status: "new",
      notes: "",
    });
  };

  const handleSaveEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEnquiry(enquiryForm);
      showToast(
        isNepali
          ? "सोधपुछ सफलतापूर्वक दर्ता गरियो"
          : "Enquiry logged successfully",
        "success",
      );
      setIsAddEnquiryOpen(false);
      resetEnquiryForm();
      await refreshEnquiryData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to log enquiry", "error");
    }
  };

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

  const openConvertModal = (enq: Enquiry) => {
    setShowConvertPassword(false);
    setConvertForm({
      name: enq.full_name || "",
      company_name: enq.shop_name || "",
      email: enq.email || "",
      phone: enq.phone || "",
      password: "",
      client_type: enq.store_type || "Grocery & Supermarket",
      address: "",
      pan_number: "",
      status: "active",
      notes: `Converted from Lead/Enquiry ${enq.reference_id}.\nLead Message: ${enq.message}`,
      plan: "trial",
      durationDays: 14,
    });
    setConvertingEnquiry(enq);
  };

  const handleConfirmConvertEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingEnquiry) return;

    if (!convertForm.email || !convertForm.email.includes("@")) {
      showToast(
        isNepali
          ? "कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्"
          : "Please enter a valid email address",
        "error",
      );
      return;
    }

    if (convertForm.password && convertForm.password.length < 6) {
      showToast(
        isNepali
          ? "पासवर्ड कम्तिमा ६ वर्णको हुनुपर्दछ"
          : "Password must be at least 6 characters long",
        "error",
      );
      return;
    }

    setIsConvertingLoading(true);
    try {
      const res = await convertEnquiryToClient(
        convertingEnquiry.id,
        convertForm,
      );
      showToast(
        isNepali
          ? `सफल! ${res.client.name} दर्ता भएका ग्राहकमा रूपान्तरण भयो`
          : `Converted! ${res.client.name} is now a registered client`,
        "success",
      );
      setConvertingEnquiry(null);
      await refreshEnquiryData();
      // Navigate to clients page so the user can see their converted client
      navigate("/clients");
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to convert enquiry", "error");
    } finally {
      setIsConvertingLoading(false);
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
            <div className="font-bold text-neutral-100 text-xs">{enq.full_name}</div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
              <Store className="w-3 h-3 text-neutral-500 shrink-0" />
              <span className="truncate max-w-[160px]">{enq.shop_name || enq.store_type || "Retail Store"}</span>
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
            onChange={(e) => handleStatusChange(enq.id, e.target.value as EnquiryStatus)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg border bg-neutral-950 border-neutral-700 text-neutral-200 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="new">{isNepali ? "नयाँ (New)" : "New"}</option>
            <option value="contacted">{isNepali ? "सम्पर्क भयो" : "Contacted"}</option>
            <option value="in_progress">{isNepali ? "प्रक्रियामा" : "In Progress"}</option>
            <option value="converted">{isNepali ? "ग्राहक बन्यो" : "Converted"}</option>
            <option value="closed">{isNepali ? "बन्द" : "Closed"}</option>
          </select>
        ),
      },
      {
        id: "actions",
        header: isNepali ? "कार्यहरू" : "Actions",
        align: "right",
        render: (enq) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {enq.status !== "converted" && (
              <button
                onClick={() => openConvertModal(enq)}
                className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-md transition-colors cursor-pointer"
                title={isNepali ? "ग्राहकमा बदल्नुहोस्" : "Convert to client"}
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setViewingEnquiry(enq)}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
              title={isNepali ? "विवरण हेर्नुहोस्" : "View enquiry"}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingEnquiryId(enq.id)}
              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
              title={isNepali ? "हटाउनुहोस्" : "Delete enquiry"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [isNepali],
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-teal-400" />
            <span>
              {isNepali ? "सोधपुछ तथा डेमो अनुरोधहरू" : "Inquiries & Demo Leads"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {isNepali
              ? "वेबसाइट तथा काउन्टरबाट प्राप्त अन-साइट डेमो अनुरोध, बिलिङ प्रश्नहरू र नयाँ ग्राहक लिड्स"
              : "Inbound requests for on-site POS demonstrations, sequential billing setups, and incoming retail leads"}
          </p>
        </div>

        <button
          onClick={() => {
            resetEnquiryForm();
            setIsAddEnquiryOpen(true);
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isNepali ? "+ नयाँ सोधपुछ दर्ता" : "+ Log Inquiry"}</span>
        </button>
      </div>

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

      {/* Enquiry Filters & Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={enquirySearch}
            onChange={(e) => setEnquirySearch(e.target.value)}
            placeholder={
              isNepali
                ? "Ref ID, नाम, पसल वा सोधपुछको सन्देश खोज्नुहोस्..."
                : "Search by reference ID, inquirer, store, or message..."
            }
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Quick status filters & view toggler */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={enquiryStatusFilter}
            onChange={(e) => setEnquiryStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
        </div>
      </div>

      {/* Enquiries List / Table */}
      {enquiryViewMode === "table" ? (
        <Table<Enquiry>
          data={enquiries}
          columns={enquiryColumns}
          keyExtractor={(enq) => enq.id}
          isLoading={isLoading}
          skeletonRows={6}
          onRowClick={(enq) => setViewingEnquiry(enq)}
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
              onClick: () => {
                resetEnquiryForm();
                setIsAddEnquiryOpen(true);
              },
              icon: <PlusCircle className="w-3.5 h-3.5" />,
            },
          }}
        />
      ) : isLoading ? (
        <CardSkeleton count={4} />
      ) : enquiries.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/40 rounded-xl border border-neutral-800">
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
                      <option value="new">
                        {isNepali ? "नयाँ" : "New"}
                      </option>
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

                    <button
                      onClick={() => setDeletingEnquiryId(enq.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                      title="Delete enquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                        onClick={() => openConvertModal(enq)}
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
      )}

      {/* MODAL 1: LOG NEW ENQUIRY */}
      <Modal
        isOpen={isAddEnquiryOpen}
        onClose={() => {
          setIsAddEnquiryOpen(false);
          resetEnquiryForm();
        }}
        title={
          isNepali ? "नयाँ सोधपुछ दर्ता गर्नुहोस्" : "Log New Customer Enquiry"
        }
        subtitle={
          isNepali
            ? "काउन्टर, फोन वा इमेलबाट आएको पसल सोधपुछ तथा डेमो अनुरोध अभिलेख गर्नुहोस्"
            : "Record walk-in, phone-in, or inbound store inquiry & demo request"
        }
        maxWidth="xl"
      >
        <form onSubmit={handleSaveEnquiry} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "सोधपुछकर्ताको नाम *" : "Inquirer Full Name *"}
              </label>
              <input
                type="text"
                required
                value={enquiryForm.full_name}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, full_name: e.target.value })
                }
                placeholder={
                  isNepali ? "जस्तै: कृष्ण पौडेल" : "e.g. Krishna Poudel"
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "पसल / व्यवसायको नाम" : "Store / Business Name"}
              </label>
              <input
                type="text"
                value={enquiryForm.shop_name}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, shop_name: e.target.value })
                }
                placeholder={
                  isNepali
                    ? "जस्तै: पोखरा डिपार्टमेन्टल स्टोर"
                    : "e.g. Pokhara Departmental Store"
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "सम्पर्क फोन / मोबाइल *" : "Phone Number *"}
              </label>
              <input
                type="tel"
                required
                value={enquiryForm.phone}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, phone: e.target.value })
                }
                placeholder="98XXXXXXXX"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "इमेल ठेगाना" : "Email Address"}
              </label>
              <input
                type="email"
                value={enquiryForm.email}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, email: e.target.value })
                }
                placeholder="inquiry@store.com.np"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "सोधपुछको प्रकार" : "Inquiry Category"}
              </label>
              <select
                value={enquiryForm.inquiry_type}
                onChange={(e) =>
                  setEnquiryForm({
                    ...enquiryForm,
                    inquiry_type: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {Object.entries(INQUIRY_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {isNepali ? label.np : label.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "पसलको प्रकार" : "Store Type"}
              </label>
              <select
                value={enquiryForm.store_type}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, store_type: e.target.value })
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {STORE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "विषय" : "Subject"}
            </label>
            <input
              type="text"
              value={enquiryForm.subject}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, subject: e.target.value })
              }
              placeholder={
                isNepali
                  ? "जस्तै: नयाँ किराना पसलको लागि अन-साइट डेमो चाहिएको"
                  : "e.g. Need on-site demo for a new grocery store setup"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "सोधपुछ सन्देश / प्रश्नहरू *" : "Message / Inquiry Details *"}
            </label>
            <textarea
              required
              rows={3}
              value={enquiryForm.message}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, message: e.target.value })
              }
              placeholder={
                isNepali
                  ? "ग्राहकको आवश्यकता र अनुरोधहरूको विस्तृत विवरण..."
                  : "Describe client requirements, counter count, demo timeline, etc..."
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "प्रारम्भिक स्थिति" : "Initial Status"}
              </label>
              <select
                value={enquiryForm.status}
                onChange={(e) =>
                  setEnquiryForm({
                    ...enquiryForm,
                    status: e.target.value as EnquiryStatus,
                  })
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="new">{isNepali ? "नयाँ" : "New"}</option>
                <option value="contacted">
                  {isNepali ? "सम्पर्क गरिएको" : "Contacted"}
                </option>
                <option value="in_progress">
                  {isNepali ? "प्रक्रियामा" : "In Progress"}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "आन्तरिक टिप्पणी" : "Staff Internal Notes"}
              </label>
              <input
                type="text"
                value={enquiryForm.notes}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, notes: e.target.value })
                }
                placeholder={
                  isNepali
                    ? "काउन्टरमा आएका / फोनमा कुरा भएका टिप्पणी..."
                    : "Notes from phone call..."
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setIsAddEnquiryOpen(false);
                resetEnquiryForm();
              }}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isNepali ? "सोधपुछ दर्ता गर्नुहोस्" : "Log Enquiry"}
            </button>
          </div>
        </form>
      </Modal>

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
                  <option value="closed">
                    {isNepali ? "बन्द" : "Closed"}
                  </option>
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
                    openConvertModal(enq);
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
      <Modal
        isOpen={convertingEnquiry !== null}
        onClose={() => {
          if (!isConvertingLoading) {
            setConvertingEnquiry(null);
          }
        }}
        title={
          isNepali
            ? "ग्राहकमा रूपान्तरण र दर्ता गर्नुहोस्"
            : "Convert Enquiry & Register Client"
        }
        subtitle={
          isNepali
            ? "सोधपुछको सम्पूर्ण विवरण समीक्षा गर्नुहोस् र ठेगाना तथा पासवर्ड जस्ता छुटेका जानकारी भर्नुहोस्"
            : "Review lead details and provide missing information such as address and password"
        }
        maxWidth="xl"
      >
        {convertingEnquiry && (
          <form onSubmit={handleConfirmConvertEnquiry} className="space-y-4">
            {/* Lead Summary Overview Banner */}
            <div className="p-3.5 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {convertingEnquiry.reference_id}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {convertingEnquiry.inquiry_type}
                </span>
              </div>
              {convertingEnquiry.message && (
                <div className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 leading-relaxed max-h-24 overflow-y-auto">
                  <span className="text-neutral-500 font-medium block text-[10px] mb-0.5 uppercase tracking-wider">
                    {isNepali ? "सोधपुछ सन्देश:" : "Inquiry Message:"}
                  </span>
                  {convertingEnquiry.message}
                </div>
              )}
            </div>

            {/* Store Name & Contact Person */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {isNepali ? "पसल / फर्मको नाम" : "Business / Store Name"}
                </label>
                <input
                  type="text"
                  value={convertForm.company_name}
                  onChange={(e) =>
                    setConvertForm({
                      ...convertForm,
                      company_name: e.target.value,
                    })
                  }
                  placeholder={
                    isNepali
                      ? "जस्तै: श्रेष्ठ सुपरमार्ट"
                      : "e.g. Shrestha Supermart"
                  }
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {isNepali
                    ? "ग्राहक / सम्पर्क व्यक्तिको नाम *"
                    : "Client / Owner Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={convertForm.name}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {isNepali ? "इमेल ठेगाना *" : "Email Address *"}
                </label>
                <input
                  type="email"
                  required
                  value={convertForm.email}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {isNepali
                    ? "सम्पर्क फोन / मोबाइल *"
                    : "Phone / Mobile Number *"}
                </label>
                <input
                  type="tel"
                  required
                  value={convertForm.phone}
                  onChange={(e) =>
                    setConvertForm({ ...convertForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Missing Information Highlight: Address & Password */}
            <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {isNepali
                    ? "थप आवश्यक विवरण (ठेगाना तथा पासवर्ड)"
                    : "Missing Information (Address & Password)"}
                </label>
                <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {isNepali ? "अत्यावश्यक" : "Required for Login"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    {isNepali
                      ? "पसलको ठेगाना / स्थान *"
                      : "Store Address / Location *"}
                  </label>
                  <input
                    type="text"
                    value={convertForm.address || ""}
                    onChange={(e) =>
                      setConvertForm({ ...convertForm, address: e.target.value })
                    }
                    placeholder={
                      isNepali
                        ? "जस्तै: नयाँ सडक, काठमाडौँ"
                        : "e.g. New Road, Kathmandu"
                    }
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-neutral-300">
                      {isNepali
                        ? "ग्राहक लगइन पासवर्ड *"
                        : "Client Login Password *"}
                    </label>
                    {!convertForm.password && (
                      <span className="text-[10px] text-neutral-500">
                        {isNepali
                          ? "खाली: StockForge2026!"
                          : "Default: StockForge2026!"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConvertPassword ? "text" : "password"}
                      value={convertForm.password || ""}
                      onChange={(e) =>
                        setConvertForm({
                          ...convertForm,
                          password: e.target.value,
                        })
                      }
                      placeholder={
                        isNepali
                          ? "पासवर्ड प्रविष्ट गर्नुहोस् (कम्तिमा ६ वर्ण)"
                          : "Enter password (min 6 characters)"
                      }
                      className="w-full pl-3 pr-10 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConvertPassword(!showConvertPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      title={
                        showConvertPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConvertPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Type & PAN / VAT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {isNepali ? "पसल / ग्राहक प्रकार" : "Retail Store Type"}
                </label>
                <select
                  value={convertForm.client_type}
                  onChange={(e) =>
                    setConvertForm({
                      ...convertForm,
                      client_type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {STORE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {isNepali ? "स्थायी लेखा नं (PAN / VAT)" : "PAN / VAT Number"}
                </label>
                <input
                  type="text"
                  value={convertForm.pan_number || ""}
                  onChange={(e) =>
                    setConvertForm({
                      ...convertForm,
                      pan_number: e.target.value,
                    })
                  }
                  placeholder="60XXXXXXXX"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Subscription Plan & Duration */}
            <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-200">
                  {isNepali
                    ? "सदस्यता योजना तथा अवधि"
                    : "Subscription Plan & Duration"}
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {isNepali ? "ग्राहक सदस्यता" : "Client Subscription"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    {isNepali ? "सदस्यता योजना (Plan)" : "Subscription Plan"}
                  </label>
                  <select
                    value={convertForm.plan || "trial"}
                    onChange={(e) => {
                      const selectedPlan = e.target.value;
                      let defaultDuration = convertForm.durationDays || 14;
                      if (
                        selectedPlan === "trial" &&
                        (!convertForm.durationDays ||
                          convertForm.durationDays === 30)
                      ) {
                        defaultDuration = 14;
                      } else if (
                        selectedPlan !== "trial" &&
                        convertForm.durationDays === 14
                      ) {
                        defaultDuration = 30;
                      }
                      setConvertForm({
                        ...convertForm,
                        plan: selectedPlan,
                        durationDays: defaultDuration,
                      });
                    }}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="trial">
                      {isNepali
                        ? "परीक्षण (Trial Plan)"
                        : "Trial (14 Days Default)"}
                    </option>
                    <option value="starter">
                      {isNepali ? "स्टार्टर (Starter Plan)" : "Starter Plan"}
                    </option>
                    <option value="pro">
                      {isNepali ? "प्रो / स्ट्यान्डर्ड (Pro Plan)" : "Pro Plan"}
                    </option>
                    <option value="enterprise">
                      {isNepali
                        ? "इन्टरप्राइज (Enterprise Plan)"
                        : "Enterprise Plan"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    {isNepali ? "योजना अवधि (दिनहरू)" : "Plan Duration (Days)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    required
                    value={convertForm.durationDays || 14}
                    onChange={(e) =>
                      setConvertForm({
                        ...convertForm,
                        durationDays:
                          Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="e.g. 14, 30, 90, 365"
                  />
                </div>
              </div>

              {/* Quick Duration Preset Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-neutral-500 mr-1">
                  {isNepali ? "द्रुत अवधि:" : "Quick Presets:"}
                </span>
                {[
                  { label: isNepali ? "१४ दिन" : "14 Days", days: 14 },
                  { label: isNepali ? "३० दिन" : "30 Days", days: 30 },
                  { label: isNepali ? "६० दिन" : "60 Days", days: 60 },
                  {
                    label: isNepali ? "९० दिन (३ महिना)" : "90 Days",
                    days: 90,
                  },
                  {
                    label: isNepali ? "१८० दिन (६ महिना)" : "180 Days",
                    days: 180,
                  },
                  {
                    label: isNepali ? "३६५ दिन (१ वर्ष)" : "365 Days (1 Yr)",
                    days: 365,
                  },
                ].map((preset) => {
                  const isSelected = convertForm.durationDays === preset.days;
                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() =>
                        setConvertForm({
                          ...convertForm,
                          durationDays: preset.days,
                        })
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali
                  ? "टिप्पणी तथा नोटहरू"
                  : "Internal Notes & Conversion Details"}
              </label>
              <textarea
                rows={2}
                value={convertForm.notes}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, notes: e.target.value })
                }
                placeholder={
                  isNepali
                    ? "सोधपुछ सम्बन्धी अतिरिक्त नोटहरू..."
                    : "Notes regarding this conversion..."
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                disabled={isConvertingLoading}
                onClick={() => setConvertingEnquiry(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isConvertingLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isConvertingLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {isNepali ? "दर्ता गर्दै..." : "Registering Client..."}
                    </span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      {isNepali
                        ? "ग्राहक दर्ता सम्पन्न गर्नुहोस्"
                        : "Complete Client Registration"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

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

