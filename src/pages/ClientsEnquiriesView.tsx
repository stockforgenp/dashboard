/**
 * Clients & Enquiries Management View
 * Unified CRM hub for Registered Store Clients, Khata Credit Ledgers,
 * and Inbound Retail Enquiries & On-Site Demo Requests.
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  MessageSquare,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  Store,
  CreditCard,
  AlertCircle,
  PlusCircle,
  FileText,
  BadgeCheck,
  RefreshCw,
  Send,
  UserCheck,
  Calendar,
  Sparkles,
  Lock,
  EyeOff,
} from "lucide-react";
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  toggleClientStatus,
  getClientsStats,
  Client,
  CreateClientInput,
} from "../lib/services/clientService.ts";
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
import { formatDate } from "../lib/utils/format.ts";
import { ConfirmDialog } from "../components/common/ConfirmDialog.tsx";
import { Modal } from "../components/common/Modal.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { useToast } from "../context/ToastContext.tsx";

interface ClientsEnquiriesViewProps {
  initialTab?: "clients" | "enquiries";
}

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

export const ClientsEnquiriesView: React.FC<ClientsEnquiriesViewProps> = ({
  initialTab = "clients",
}) => {
  const { isNepali, formatNumberByLang } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"clients" | "enquiries">(
    initialTab,
  );

  // Sync initialTab if prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState<string>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");
  const [clientStats, setClientStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

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

  // Modals state
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const [isAddEnquiryOpen, setIsAddEnquiryOpen] = useState(false);
  const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
  const [deletingEnquiryId, setDeletingEnquiryId] = useState<string | null>(
    null,
  );
  const [convertingEnquiry, setConvertingEnquiry] = useState<Enquiry | null>(
    null,
  );
  const [showConvertPassword, setShowConvertPassword] = useState(false);
  const [isConvertingLoading, setIsConvertingLoading] = useState(false);
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
  const refreshAllData = useCallback(async () => {
    try {
      const [c, cStats, e, eStats] = await Promise.all([
        getAllClients({
          search: clientSearch,
          status: clientStatusFilter,
        }),
        getClientsStats(),
        getAllEnquiries({
          search: enquirySearch,
          status: enquiryStatusFilter,
          inquiryType: enquiryTypeFilter,
        }),
        getEnquiryStats(),
      ]);
      setClients(c);
      setClientStats(cStats);
      setEnquiries(e);
      setEnquiryStats(eStats);
    } catch (err) {
      console.error("Error refreshing clients & enquiries data:", err);
    }
  }, [
    clientSearch,
    clientStatusFilter,
    enquirySearch,
    enquiryStatusFilter,
    enquiryTypeFilter,
  ]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Client Form state
  const [showPassword, setShowPassword] = useState(false);
  const [clientForm, setClientForm] = useState<CreateClientInput>({
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

  const resetClientForm = () => {
    setShowPassword(false);
    setClientForm({
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
  };

  const handleOpenAddClient = () => {
    resetClientForm();
    setIsAddClientOpen(true);
  };

  const handleOpenEditClient = (c: Client) => {
    setShowPassword(false);
    setClientForm({
      name: c.name,
      company_name: c.company_name || "",
      email: c.email || "",
      password: "",
      phone: c.phone,
      client_type: c.client_type,
      address: c.address || "",
      pan_number: c.pan_number || "",
      status: c.status,
      notes: c.notes || "",
      plan: c.subscription?.plan || "trial",
      durationDays: c.subscription?.durationDays || 14,
    });
    setEditingClient(c);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, clientForm);
        showToast(
          isNepali
            ? "ग्राहक विवरण अद्यावधिक गरियो"
            : "Client updated successfully",
          "success",
        );
        setEditingClient(null);
      } else {
        await createClient(clientForm);
        showToast(
          isNepali
            ? "नयाँ ग्राहक सफलतापूर्वक दर्ता भयो"
            : "Client registered successfully",
          "success",
        );
        setIsAddClientOpen(false);
      }
      resetClientForm();
      await refreshAllData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to save client", "error");
    }
  };

  const handleToggleClientStatus = async (
    id: string,
    currentStatus: string,
  ) => {
    try {
      const updated = await toggleClientStatus(id, currentStatus);
      showToast(
        isNepali
          ? `ग्राहक स्थिति परिवर्तन गरियो (${updated.status})`
          : `Client status changed to ${updated.status}`,
        "success",
      );
      await refreshAllData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to update status", "error");
    }
  };

  const handleDeleteClientConfirm = async () => {
    if (deletingClientId) {
      try {
        await deleteClient(deletingClientId);
        showToast(isNepali ? "ग्राहक हटाइयो" : "Client deleted", "success");
        setDeletingClientId(null);
        await refreshAllData();
      } catch (err: unknown) {
        showToast((err as Error).message || "Failed to delete client", "error");
      }
    }
  };

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
      await refreshAllData();
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
      await refreshAllData();
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
      await refreshAllData();
      setActiveTab("clients");
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
        await refreshAllData();
      } catch (err: unknown) {
        showToast(
          (err as Error).message || "Failed to delete enquiry",
          "error",
        );
      }
    }
  };

  // Export Clients to CSV
  const handleExportClientsCsv = () => {
    try {
      const headers = [
        "ID",
        "Name",
        "Company/Store",
        "Phone",
        "Email",
        "Client Type",
        "Address",
        "PAN/VAT",
        "Status",
        "Created At",
      ];
      const rows = clients.map((c) => [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${(c.company_name || "").replace(/"/g, '""')}"`,
        `"${c.phone}"`,
        `"${c.email || ""}"`,
        `"${c.client_type}"`,
        `"${(c.address || "").replace(/"/g, '""')}"`,
        `"${c.pan_number || ""}"`,
        c.status || "active",
        c.createdAt || (c as any).created_at || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stockforge_registered_clients_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(
        isNepali ? "ग्राहक सूची CSV डाउनलोड भयो" : "Exported clients to CSV",
        "success",
      );
    } catch {
      showToast("Export failed", "error");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2.5">
            {activeTab === "clients" ? (
              <Users className="w-6 h-6 text-emerald-400" />
            ) : (
              <MessageSquare className="w-6 h-6 text-teal-400" />
            )}
            <span>
              {isNepali
                ? activeTab === "clients"
                  ? "दर्ता भएका ग्राहक तथा पसलहरू"
                  : "सोधपुछ तथा डेमो अनुरोधहरू"
                : activeTab === "clients"
                  ? "Registered Clients & Stores"
                  : "Inquiries & Demo Leads"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {isNepali
              ? activeTab === "clients"
                ? "नेपालभरका खुद्रा पसल, सुपरमार्ट र व्यक्तिगत ग्राहकहरूको प्रोफाइल तथा सम्पर्क व्यवस्थापन"
                : "वेबसाइट तथा काउन्टरबाट प्राप्त अन-साइट डेमो अनुरोध, बिलिङ प्रश्नहरू र नयाँ ग्राहक लिड्स"
              : activeTab === "clients"
                ? "Directory of registered retail accounts, client profiles, and store directory across Nepal"
                : "Inbound requests for on-site POS demonstrations, sequential billing setups, and incoming retail leads"}
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl self-start md:self-auto shrink-0 shadow-xs">
          <button
            onClick={() => setActiveTab("clients")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "clients"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {isNepali ? "दर्ता भएका ग्राहकहरू" : "Registered Clients"}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === "clients"
                  ? "bg-emerald-700/80 text-white"
                  : "bg-neutral-800 text-neutral-300"
              }`}
            >
              {formatNumberByLang(clientStats.total)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("enquiries")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
              activeTab === "enquiries"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {isNepali ? "सोधपुछ तथा लिड्स" : "Enquiries & Requests"}
            </span>
            {enquiryStats.new_count > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === "enquiries"
                  ? "bg-teal-700/80 text-white"
                  : enquiryStats.new_count > 0
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-neutral-800 text-neutral-300"
              }`}
            >
              {formatNumberByLang(enquiryStats.total)}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: REGISTERED CLIENTS */}
      {activeTab === "clients" && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {isNepali ? "कुल दर्ता ग्राहक" : "Total Registered"}
                </div>
                <div className="text-2xl font-bold text-neutral-100 font-mono mt-1">
                  {formatNumberByLang(clientStats.total)}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {isNepali ? "सक्रिय खाताहरू" : "Active accounts"}:{" "}
                  <span className="text-emerald-400 font-semibold font-mono">
                    {formatNumberByLang(clientStats.active)}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {isNepali ? "सक्रिय स्टोरहरू" : "Active Stores"}
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {formatNumberByLang(clientStats.active)}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {isNepali ? "निष्क्रिय खाता" : "Inactive"}:{" "}
                  <span className="text-neutral-400 font-mono">
                    {formatNumberByLang(clientStats.inactive)}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Store className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {isNepali ? "सक्रिय ग्राहक" : "Active Clients"}
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {formatNumberByLang(clientStats.active)}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {isNepali
                    ? `${formatNumberByLang(clientStats.inactive)} निष्क्रिय खाता`
                    : `${formatNumberByLang(clientStats.inactive)} inactive accounts`}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {isNepali ? "अनुरोध लिड्स" : "Connected Leads"}
                </div>
                <div className="text-2xl font-bold text-neutral-100 font-mono mt-1">
                  {formatNumberByLang(enquiryStats.converted_count)}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {isNepali
                    ? "सोधपुछबाट रूपान्तरित"
                    : "Converted from enquiries"}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BadgeCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder={
                  isNepali
                    ? "ग्राहक नाम, पसल, फोन नम्बर वा PAN खोज्नुहोस्..."
                    : "Search by client name, store, phone, or PAN..."
                }
                className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={clientTypeFilter}
                onChange={(e) => setClientTypeFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">
                  {isNepali ? "सबै पसल प्रकार" : "All Store Types"}
                </option>
                {STORE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">
                  {isNepali ? "सबै स्थिति" : "All Status"}
                </option>
                <option value="active">
                  {isNepali ? "सक्रिय (Active)" : "Active"}
                </option>
                <option value="inactive">
                  {isNepali ? "निष्क्रिय (Inactive)" : "Inactive"}
                </option>
                <option value="suspended">
                  {isNepali ? "निलम्बित (Suspended)" : "Suspended"}
                </option>
                <option value="banned">
                  {isNepali ? "प्रतिबन्धित (Banned)" : "Banned"}
                </option>
              </select>

              <button
                onClick={handleExportClientsCsv}
                className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export clients to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isNepali ? "निर्यात" : "Export"}
                </span>
              </button>

              <button
                onClick={handleOpenAddClient}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {isNepali ? "+ नयाँ ग्राहक दर्ता" : "+ Register Client"}
                </span>
              </button>
            </div>
          </div>

          {/* Clients List / Table */}
          {clients.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/40 border border-neutral-800/80 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-200">
                {isNepali
                  ? "कुनै ग्राहक फेला परेन"
                  : "No Registered Clients Found"}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {clientSearch ||
                clientStatusFilter !== "all" ||
                clientTypeFilter !== "all"
                  ? isNepali
                    ? "खोज फिल्टरहरू परिवर्तन गरी हेर्नुहोस्।"
                    : "Try adjusting your search query or filters."
                  : isNepali
                    ? "तपाईंको खुद्रा पसल वा ग्राहकहरूको विवरण यहाँ दर्ता गरी व्यवस्थापन गर्नुहोस्।"
                    : "Start by registering your regular retail clients, store accounts, and contact records."}
              </p>
              <button
                onClick={handleOpenAddClient}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {isNepali
                    ? "पहिलो ग्राहक दर्ता गर्नुहोस्"
                    : "Register First Client"}
                </span>
              </button>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">
                        {isNepali ? "ग्राहक तथा पसल" : "Client & Store"}
                      </th>
                      <th className="py-3 px-4">
                        {isNepali ? "सम्पर्क" : "Contact"}
                      </th>
                      <th className="py-3 px-4">
                        {isNepali ? "प्रकार र ठेगाना" : "Type & Location"}
                      </th>
                      <th className="py-3 px-4">
                        {isNepali ? "स्थिति" : "Status"}
                      </th>
                      <th className="py-3 px-4 text-right">
                        {isNepali ? "कार्यहरू" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {clients.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase shrink-0">
                              {c.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-neutral-100 flex items-center gap-1.5">
                                <span className="truncate">{c.name}</span>
                                {c.pan_number && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono">
                                    PAN: {c.pan_number}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-400 truncate">
                                {c.company_name || "Independent Client"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <a
                              href={`tel:${c.phone}`}
                              className="text-neutral-200 hover:text-emerald-400 font-mono flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span>{c.phone}</span>
                            </a>
                            {c.email && (
                              <a
                                href={`mailto:${c.email}`}
                                className="text-neutral-400 hover:text-emerald-400 text-[11px] truncate flex items-center gap-1 transition-colors"
                              >
                                <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                                <span className="truncate">{c.email}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <span className="inline-block px-2 py-0.5 text-[10px] rounded-md bg-neutral-800/80 text-neutral-300 border border-neutral-700/50">
                              {c.client_type}
                            </span>
                            {c.address && (
                              <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                                <span className="truncate">{c.address}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() =>
                              handleToggleClientStatus(c.id, c.status || "active")
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                              c.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : c.status === "suspended"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                  : c.status === "banned"
                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                                    : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-750"
                            }`}
                            title={
                              isNepali
                                ? "स्थिति परिवर्तन गर्नुहोस्"
                                : "Toggle active/inactive status"
                            }
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                c.status === "active"
                                  ? "bg-emerald-400"
                                  : c.status === "suspended"
                                    ? "bg-amber-400"
                                    : c.status === "banned"
                                      ? "bg-rose-400"
                                      : "bg-neutral-500"
                              }`}
                            />
                            <span>
                              {c.status === "active"
                                ? isNepali
                                  ? "सक्रिय"
                                  : "Active"
                                : c.status === "suspended"
                                  ? isNepali
                                    ? "निलम्बित"
                                    : "Suspended"
                                  : c.status === "banned"
                                    ? isNepali
                                      ? "प्रतिबन्धित"
                                      : "Banned"
                                    : isNepali
                                      ? "निष्क्रिय"
                                      : "Inactive"}
                            </span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingClient(c)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                              title={
                                isNepali ? "विवरण हेर्नुहोस्" : "View details"
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditClient(c)}
                              className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                              title={
                                isNepali ? "सम्पादन गर्नुहोस्" : "Edit client"
                              }
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingClientId(c.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                              title={isNepali ? "हटाउनुहोस्" : "Delete client"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ENQUIRIES & DEMO REQUESTS */}
      {activeTab === "enquiries" && (
        <div className="space-y-6">
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
                    enquiryStats.in_progress_count +
                      enquiryStats.contacted_count,
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

            {/* Quick status filters & action */}
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

              <button
                onClick={() => {
                  resetEnquiryForm();
                  setIsAddEnquiryOpen(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {isNepali ? "+ नयाँ सोधपुछ दर्ता" : "+ Log Inquiry"}
                </span>
              </button>
            </div>
          </div>

          {/* Enquiries List */}
          {enquiries.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900/40 border border-neutral-800/80 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-200">
                {isNepali ? "कुनै सोधपुछ फेला परेन" : "No Enquiries Found"}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {isNepali
                  ? "वेबसाइटको सम्पर्क वा डेमो फारामबाट आउने अनुरोधहरू यहाँ देखा पर्नेछन्।"
                  : "Inquiries submitted through the website contact form or demo requests will appear here."}
              </p>
              <button
                onClick={() => {
                  resetEnquiryForm();
                  setIsAddEnquiryOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>
                  {isNepali
                    ? "पहिलो सोधपुछ दर्ता गर्नुहोस्"
                    : "Log First Enquiry"}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => {
                const typeLabel = INQUIRY_TYPE_LABELS[enq.inquiry_type] || {
                  en: enq.inquiry_type,
                  np: enq.inquiry_type,
                };

                const statusStyles: Record<
                  EnquiryStatus,
                  { bg: string; text: string; border: string }
                > = {
                  new: {
                    bg: "bg-amber-500/10",
                    text: "text-amber-400",
                    border: "border-amber-500/30",
                  },
                  pending: {
                    bg: "bg-amber-500/10",
                    text: "text-amber-400",
                    border: "border-amber-500/30",
                  },
                  contacted: {
                    bg: "bg-blue-500/10",
                    text: "text-blue-400",
                    border: "border-blue-500/30",
                  },
                  in_progress: {
                    bg: "bg-purple-500/10",
                    text: "text-purple-400",
                    border: "border-purple-500/30",
                  },
                  converted: {
                    bg: "bg-emerald-500/10",
                    text: "text-emerald-400",
                    border: "border-emerald-500/30",
                  },
                  resolved: {
                    bg: "bg-emerald-500/10",
                    text: "text-emerald-400",
                    border: "border-emerald-500/30",
                  },
                  closed: {
                    bg: "bg-neutral-800",
                    text: "text-neutral-400",
                    border: "border-neutral-700",
                  },
                };

                const currStyle = statusStyles[enq.status] || statusStyles.new;

                return (
                  <div
                    key={enq.id}
                    className="p-4 sm:p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-750 transition-all space-y-3.5"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-neutral-200 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                          {enq.reference_id}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                          {isNepali ? typeLabel.np : typeLabel.en}
                        </span>
                        {enq.store_type && (
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Store className="w-3 h-3 text-neutral-500" />
                            <span>{enq.store_type}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status dropdown */}
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            handleStatusChange(
                              enq.id,
                              e.target.value as EnquiryStatus,
                            )
                          }
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${currStyle.bg} ${currStyle.text} ${currStyle.border}`}
                        >
                          <option value="new">
                            {isNepali ? "नयाँ (New)" : "New"}
                          </option>
                          <option value="contacted">
                            {isNepali ? "सम्पर्क भयो (Contacted)" : "Contacted"}
                          </option>
                          <option value="in_progress">
                            {isNepali
                              ? "प्रक्रियामा (In Progress)"
                              : "In Progress"}
                          </option>
                          <option value="converted">
                            {isNepali
                              ? "ग्राहक बन्यो (Converted)"
                              : "Converted"}
                          </option>
                          <option value="closed">
                            {isNepali ? "बन्द (Closed)" : "Closed"}
                          </option>
                        </select>

                        <button
                          onClick={() => setViewingEnquiry(enq)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                          title="View complete message"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            className="text-xs text-neutral-200 hover:text-emerald-400 font-mono flex items-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{enq.phone}</span>
                          </a>
                          <a
                            href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                          >
                            WhatsApp
                          </a>
                        </div>
                        <div>
                          <a
                            href={`mailto:${enq.email}`}
                            className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors truncate"
                          >
                            <Mail className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="truncate">{enq.email}</span>
                          </a>
                        </div>
                      </div>

                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 text-xs text-neutral-300">
                        {enq.subject && (
                          <div className="font-semibold text-neutral-200 text-xs mb-1 line-clamp-1">
                            {enq.subject}
                          </div>
                        )}
                        <p className="line-clamp-2 text-neutral-400 text-[11px] leading-relaxed">
                          {enq.message}
                        </p>
                      </div>
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

                      <div>
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
        </div>
      )}

      {/* MODAL 1: ADD / EDIT CLIENT */}
      <Modal
        isOpen={isAddClientOpen || editingClient !== null}
        onClose={() => {
          setIsAddClientOpen(false);
          setEditingClient(null);
          resetClientForm();
        }}
        title={
          editingClient
            ? isNepali
              ? "ग्राहक विवरण सम्पादन गर्नुहोस्"
              : "Edit Registered Client"
            : isNepali
              ? "नयाँ ग्राहक / पसल दर्ता गर्नुहोस्"
              : "Register New Client / Retail Store"
        }
        subtitle={
          isNepali
            ? "पसलको नाम, सम्पर्क विवरण, स्टोर प्रकार र PAN/VAT प्रविष्ट गर्नुहोस्"
            : "Enter business name, phone, store type, and fiscal PAN/VAT"
        }
        maxWidth="xl"
      >
        <form onSubmit={handleSaveClient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "पसल / फर्मको नाम" : "Business / Store Name"}
            </label>
            <input
              type="text"
              value={clientForm.company_name}
              onChange={(e) =>
                setClientForm({ ...clientForm, company_name: e.target.value })
              }
              placeholder={
                isNepali
                  ? "जस्तै: श्रेष्ठ सुपरमार्ट"
                  : "e.g. Shrestha Supermart"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali
                  ? "ग्राहक / सम्पर्क व्यक्तिको नाम *"
                  : "Client / Owner Name *"}
              </label>
              <input
                type="text"
                required
                value={clientForm.name}
                onChange={(e) =>
                  setClientForm({ ...clientForm, name: e.target.value })
                }
                placeholder={
                  isNepali ? "जस्तै: रमेश श्रेष्ठ" : "e.g. Ramesh Shrestha"
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
                value={clientForm.phone}
                onChange={(e) =>
                  setClientForm({ ...clientForm, phone: e.target.value })
                }
                placeholder="+977 98XXXXXXXX"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "इमेल ठेगाना *" : "Email Address *"}
              </label>
              <input
                type="email"
                required
                value={clientForm.email}
                onChange={(e) =>
                  setClientForm({ ...clientForm, email: e.target.value })
                }
                placeholder="storekeeper@mart.np"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-300">
                  {editingClient
                    ? isNepali
                      ? "नयाँ पासवर्ड (परिवर्तन गर्न चाहेमा मात्र)"
                      : "New Password (Leave blank to keep current)"
                    : isNepali
                      ? "खाता पासवर्ड *"
                      : "Account Password *"}
                </label>
                {!editingClient && !clientForm.password && (
                  <span className="text-[10px] text-neutral-500">
                    {isNepali
                      ? "खाली छोडेमा: StockForge2026!"
                      : "Default: StockForge2026!"}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={clientForm.password || ""}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, password: e.target.value })
                  }
                  placeholder={
                    editingClient
                      ? "••••••••"
                      : isNepali
                        ? "नयाँ पासवर्ड प्रविष्ट गर्नुहोस् वा पूर्वनिर्धारित प्रयोग गर्नुहोस्"
                        : "Enter client password (min 6 characters)"
                  }
                  minLength={editingClient ? undefined : 6}
                  className="w-full pl-3 pr-10 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "पसल / ग्राहक प्रकार" : "Retail Store Type"}
              </label>
              <select
                value={clientForm.client_type}
                onChange={(e) =>
                  setClientForm({ ...clientForm, client_type: e.target.value })
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
                value={clientForm.pan_number}
                onChange={(e) =>
                  setClientForm({ ...clientForm, pan_number: e.target.value })
                }
                placeholder="60XXXXXXXX"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "ठेगाना / सहर" : "Store Location / Address"}
              </label>
              <input
                type="text"
                value={clientForm.address}
                onChange={(e) =>
                  setClientForm({ ...clientForm, address: e.target.value })
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
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali
                  ? "खाता स्थिति (Account Status)"
                  : "Client Account Status"}
              </label>
              <select
                value={clientForm.status || "active"}
                onChange={(e) =>
                  setClientForm({ ...clientForm, status: e.target.value })
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="active">
                  {isNepali ? "सक्रिय (Active)" : "Active"}
                </option>
                <option value="inactive">
                  {isNepali ? "निष्क्रिय (Inactive)" : "Inactive"}
                </option>
                <option value="suspended">
                  {isNepali ? "निलम्बित (Suspended)" : "Suspended"}
                </option>
                <option value="banned">
                  {isNepali ? "प्रतिबन्धित (Banned)" : "Banned"}
                </option>
              </select>
            </div>
          </div>

          {/* Onboarding Plan & Duration */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-200">
                {isNepali
                  ? "योजना तथा सदस्यता अवधि"
                  : "Subscription Plan & Duration"}
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {isNepali ? "सुरुवाती सक्रियता" : "Onboarding Setup"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  {isNepali ? "सदस्यता योजना (Plan)" : "Subscription Plan"}
                </label>
                <select
                  value={clientForm.plan || "trial"}
                  onChange={(e) => {
                    const selectedPlan = e.target.value;
                    let defaultDuration = clientForm.durationDays || 14;
                    if (
                      selectedPlan === "trial" &&
                      (!clientForm.durationDays ||
                        clientForm.durationDays === 30)
                    ) {
                      defaultDuration = 14;
                    } else if (
                      selectedPlan !== "trial" &&
                      clientForm.durationDays === 14
                    ) {
                      defaultDuration = 30;
                    }
                    setClientForm({
                      ...clientForm,
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
                  value={clientForm.durationDays || 14}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      durationDays: Math.max(1, parseInt(e.target.value) || 1),
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
                { label: isNepali ? "९० दिन (३ महिना)" : "90 Days", days: 90 },
                {
                  label: isNepali ? "१८० दिन (६ महिना)" : "180 Days",
                  days: 180,
                },
                {
                  label: isNepali ? "३६५ दिन (१ वर्ष)" : "365 Days (1 Yr)",
                  days: 365,
                },
              ].map((preset) => {
                const isSelected = clientForm.durationDays === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() =>
                      setClientForm({
                        ...clientForm,
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

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali
                ? "टिप्पणी तथा नोटहरू"
                : "Internal Notes & Special Terms"}
            </label>
            <textarea
              rows={2}
              value={clientForm.notes}
              onChange={(e) =>
                setClientForm({ ...clientForm, notes: e.target.value })
              }
              placeholder={
                isNepali
                  ? "भुक्तानी सर्तहरू, सम्पर्क समय वा विशेष छुट सम्बन्धी नोट..."
                  : "Payment terms, preferred delivery hours, or store agreements..."
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setIsAddClientOpen(false);
                setEditingClient(null);
                resetClientForm();
              }}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {editingClient
                ? isNepali
                  ? "परिवर्तन सुरक्षित गर्नुहोस्"
                  : "Save Changes"
                : isNepali
                  ? "ग्राहक सुरक्षित गर्नुहोस्"
                  : "Register Client"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: VIEW CLIENT DETAILS */}
      <Modal
        isOpen={viewingClient !== null}
        onClose={() => setViewingClient(null)}
        title={viewingClient?.name || "Client Details"}
        subtitle={viewingClient?.company_name || "Retail Client Profile"}
        maxWidth="lg"
      >
        {viewingClient && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-neutral-100">
                  {viewingClient.name}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {viewingClient.company_name ||
                    (isNepali ? "स्वतन्त्र खुद्रा स्टोर" : "Retail Store")}
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  viewingClient.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : viewingClient.status === "suspended"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : viewingClient.status === "banned"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                }`}
              >
                {(viewingClient.status || "ACTIVE").toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500">
                  {isNepali ? "फोन नम्बर" : "Phone"}:
                </span>
                <div className="font-mono text-neutral-200 mt-0.5 flex items-center gap-2">
                  <span>{viewingClient.phone}</span>
                  <a
                    href={`tel:${viewingClient.phone}`}
                    className="text-emerald-400 hover:underline text-[10px]"
                  >
                    Call
                  </a>
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "इमेल" : "Email"}:
                </span>
                <div className="text-neutral-200 mt-0.5 truncate">
                  {viewingClient.email || "—"}
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "पसलको प्रकार" : "Store Type"}:
                </span>
                <div className="text-neutral-200 mt-0.5">
                  {viewingClient.client_type}
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "PAN / VAT" : "PAN/VAT Number"}:
                </span>
                <div className="font-mono text-neutral-200 mt-0.5">
                  {viewingClient.pan_number || "—"}
                </div>
              </div>

              <div className="col-span-2">
                <span className="text-neutral-500">
                  {isNepali ? "ठेगाना" : "Location"}:
                </span>
                <div className="text-neutral-200 mt-0.5">
                  {viewingClient.address || "—"}
                </div>
              </div>

              {viewingClient.subscription && (
                <div className="col-span-2 pt-2 border-t border-neutral-800 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-neutral-500 text-[10px]">
                      {isNepali ? "योजना (Plan)" : "Plan"}:
                    </span>
                    <div className="font-semibold text-emerald-400 capitalize mt-0.5">
                      {viewingClient.subscription.plan || "trial"}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px]">
                      {isNepali ? "अवधि" : "Duration"}:
                    </span>
                    <div className="font-mono text-neutral-200 mt-0.5">
                      {viewingClient.subscription.durationDays
                        ? `${viewingClient.subscription.durationDays} ${isNepali ? "दिन" : "days"}`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px]">
                      {isNepali ? "म्याद सकिने मिति" : "Expiry Date"}:
                    </span>
                    <div className="font-mono text-neutral-300 mt-0.5 text-[11px]">
                      {viewingClient.subscription.expiryDate
                        ? formatDate(viewingClient.subscription.expiryDate)
                        : "—"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {viewingClient.notes && (
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                  {isNepali ? "टिप्पणीहरू" : "Internal Notes"}
                </span>
                <p className="text-neutral-300 mt-1 whitespace-pre-line leading-relaxed">
                  {viewingClient.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => {
                  const c = viewingClient;
                  setViewingClient(null);
                  handleOpenEditClient(c);
                }}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {isNepali ? "सम्पादन" : "Edit Profile"}
              </button>
              <button
                onClick={() => setViewingClient(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {isNepali ? "बन्द गर्नुहोस्" : "Close"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: LOG NEW ENQUIRY */}
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
                  isNepali ? "जस्तै: प्रकाश थापा" : "e.g. Prakash Thapa"
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "पसल / फर्मको नाम" : "Shop / Business Name"}
              </label>
              <input
                type="text"
                value={enquiryForm.shop_name}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, shop_name: e.target.value })
                }
                placeholder={
                  isNepali
                    ? "जस्तै: पोखरा फ्रेस मार्ट"
                    : "e.g. Pokhara Fresh Mart"
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "सम्पर्क फोन नम्बर *" : "Phone / Mobile Number *"}
              </label>
              <input
                type="tel"
                required
                value={enquiryForm.phone}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, phone: e.target.value })
                }
                placeholder="+977 98XXXXXXXX"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "इमेल ठेगाना *" : "Email Address *"}
              </label>
              <input
                type="email"
                required
                value={enquiryForm.email}
                onChange={(e) =>
                  setEnquiryForm({ ...enquiryForm, email: e.target.value })
                }
                placeholder="inquiry@store.np"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "पसलको प्रकार" : "Retail Store Type"}
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

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "अनुरोधको प्रकृति" : "Inquiry Purpose"}
              </label>
              <select
                value={enquiryForm.inquiry_type}
                onChange={(e) =>
                  setEnquiryForm({
                    ...enquiryForm,
                    inquiry_type: e.target.value,
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
                  ? "जस्तै: नयाँ काउन्टर सेटअप डेमो"
                  : "e.g. 2 counter setup demo"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali ? "विस्तृत सन्देश वा विवरण *" : "Message Details *"}
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
                  ? "पसलको आवश्यकता, सोधपुछ वा डेमोको लागि उपयुक्त समय..."
                  : "Requirements, questions, or preferred demonstration date..."
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {isNepali
                ? "आन्तरिक नोट (वैकल्पिक)"
                : "Internal Follow-up Note (Optional)"}
            </label>
            <input
              type="text"
              value={enquiryForm.notes}
              onChange={(e) =>
                setEnquiryForm({ ...enquiryForm, notes: e.target.value })
              }
              placeholder={
                isNepali
                  ? "जस्तै: दिउँसो २ बजे कल ब्याक गर्ने"
                  : "e.g. Call back at 2 PM"
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
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

      {/* MODAL 4: VIEW ENQUIRY DETAILS */}
      <Modal
        isOpen={viewingEnquiry !== null}
        onClose={() => setViewingEnquiry(null)}
        title={viewingEnquiry?.full_name || "Enquiry Details"}
        subtitle={`Ref: ${viewingEnquiry?.reference_id || ""}`}
        maxWidth="lg"
      >
        {viewingEnquiry && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                  {isNepali ? "अनुरोध प्रकार" : "Inquiry Purpose"}
                </span>
                <div className="font-bold text-neutral-200 text-sm mt-0.5">
                  {isNepali
                    ? INQUIRY_TYPE_LABELS[viewingEnquiry.inquiry_type]?.np ||
                      viewingEnquiry.inquiry_type
                    : INQUIRY_TYPE_LABELS[viewingEnquiry.inquiry_type]?.en ||
                      viewingEnquiry.inquiry_type}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                  {isNepali ? "दर्ता समय" : "Received At"}
                </span>
                <div className="font-mono text-neutral-300 mt-0.5">
                  {new Date(viewingEnquiry.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-500">
                  {isNepali ? "पसलको नाम" : "Business"}:
                </span>
                <div className="text-neutral-200 mt-0.5 font-semibold">
                  {viewingEnquiry.shop_name || "—"}
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "पसलको प्रकार" : "Store Type"}:
                </span>
                <div className="text-neutral-200 mt-0.5">
                  {viewingEnquiry.store_type || "—"}
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "फोन नम्बर" : "Phone"}:
                </span>
                <div className="font-mono text-neutral-200 mt-0.5 flex items-center gap-2">
                  <span>{viewingEnquiry.phone}</span>
                  <a
                    href={`tel:${viewingEnquiry.phone}`}
                    className="text-emerald-400 hover:underline text-[10px]"
                  >
                    Call
                  </a>
                </div>
              </div>

              <div>
                <span className="text-neutral-500">
                  {isNepali ? "इमेल" : "Email"}:
                </span>
                <div className="text-neutral-200 mt-0.5 truncate">
                  {viewingEnquiry.email}
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
              {viewingEnquiry.subject && (
                <div className="font-bold text-neutral-100 text-sm mb-1">
                  {viewingEnquiry.subject}
                </div>
              )}
              <p className="text-neutral-300 whitespace-pre-line leading-relaxed">
                {viewingEnquiry.message}
              </p>
            </div>

            {viewingEnquiry.notes && (
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                  {isNepali ? "आन्तरिक नोट" : "Follow-up Notes"}
                </span>
                <p className="text-neutral-300 mt-1">{viewingEnquiry.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              {viewingEnquiry.status !== "converted" ? (
                <button
                  onClick={() => {
                    const enq = viewingEnquiry;
                    setViewingEnquiry(null);
                    openConvertModal(enq);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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

      {/* CONVERT ENQUIRY TO CLIENT MODAL */}
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

      {/* CONFIRM DELETE CLIENT DIALOG */}
      <ConfirmDialog
        isOpen={deletingClientId !== null}
        onClose={() => setDeletingClientId(null)}
        onConfirm={handleDeleteClientConfirm}
        title={isNepali ? "ग्राहक मेटाउनुहोस्" : "Delete Client"}
        message={
          isNepali
            ? "के तपाईं यो ग्राहक रेकर्ड हटाउन निश्चित हुनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।"
            : "Are you sure you want to permanently delete this client record? This action cannot be undone."
        }
        confirmText={isNepali ? "मेटाउनुहोस्" : "Delete"}
        cancelText={isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
        isDestructive={true}
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
