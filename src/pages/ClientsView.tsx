/**
 * Clients Management View
 * Dedicated management view for Registered Store Clients, Accounts, and Fiscal PAN/VAT records across Nepal.
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  Store,
  CreditCard,
  AlertCircle,
  PlusCircle,
  FileText,
  BadgeCheck,
  RefreshCw,
  Lock,
  EyeOff,
} from "lucide-react";
import { Table, Column } from "../components/common/Table.tsx";
import { Skeleton } from "../components/common/Skeleton.tsx";
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

export const ClientsView: React.FC = () => {
  const { isNepali, formatNumberByLang } = useLanguage();
  const { showToast } = useToast();

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
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

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

  // Refresh data function
  const refreshClientData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [c, cStats] = await Promise.all([
        getAllClients({
          search: clientSearch,
          status: clientStatusFilter,
        }),
        getClientsStats(),
      ]);
      setClients(c);
      setClientStats(cStats);
    } catch (err) {
      console.error("Error refreshing clients data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [clientSearch, clientStatusFilter]);

  useEffect(() => {
    refreshClientData();
  }, [refreshClientData]);

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
      await refreshClientData();
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
      await refreshClientData();
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
        await refreshClientData();
      } catch (err: unknown) {
        showToast((err as Error).message || "Failed to delete client", "error");
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

  // Filter clients by type if selected
  const filteredClients = useMemo(() => {
    if (clientTypeFilter === "all") return clients;
    return clients.filter((c) => c.client_type === clientTypeFilter);
  }, [clients, clientTypeFilter]);

  const clientColumns = useMemo<Column<Client>[]>(
    () => [
      {
        id: "client",
        header: isNepali ? "ग्राहक तथा पसल" : "Client & Store",
        sortable: true,
        accessor: (c) => c.name,
        render: (c) => (
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
        ),
      },
      {
        id: "contact",
        header: isNepali ? "सम्पर्क" : "Contact",
        render: (c) => (
          <div className="space-y-0.5">
            <a
              href={`tel:${c.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-neutral-200 hover:text-emerald-400 font-mono flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
              <span>{c.phone}</span>
            </a>
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                onClick={(e) => e.stopPropagation()}
                className="text-neutral-400 hover:text-emerald-400 text-[11px] truncate flex items-center gap-1 transition-colors block max-w-[160px]"
              >
                <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                <span className="truncate">{c.email}</span>
              </a>
            )}
          </div>
        ),
      },
      {
        id: "type_location",
        header: isNepali ? "प्रकार र ठेगाना" : "Type & Location",
        sortable: true,
        accessor: (c) => c.client_type,
        render: (c) => (
          <div>
            <span className="inline-block px-2 py-0.5 text-[10px] rounded-md bg-neutral-800/80 text-neutral-300 border border-neutral-700/50">
              {c.client_type}
            </span>
            {c.address && (
              <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                <span className="truncate">{c.address}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: isNepali ? "स्थिति" : "Status",
        sortable: true,
        accessor: (c) => c.status || "active",
        render: (c) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleClientStatus(c.id, c.status || "active");
            }}
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
        ),
      },
      {
        id: "actions",
        header: isNepali ? "कार्यहरू" : "Actions",
        align: "right",
        render: (c) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingClient(c)}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
              title={isNepali ? "विवरण हेर्नुहोस्" : "View details"}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEditClient(c)}
              className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
              title={isNepali ? "सम्पादन गर्नुहोस्" : "Edit client"}
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
            <Users className="w-6 h-6 text-emerald-400" />
            <span>
              {isNepali
                ? "दर्ता भएका ग्राहक तथा पसलहरू"
                : "Registered Clients & Stores"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {isNepali
              ? "नेपालभरका खुद्रा पसल, सुपरमार्ट र व्यक्तिगत ग्राहकहरूको प्रोफाइल तथा सम्पर्क व्यवस्थापन"
              : "Directory of registered retail accounts, client profiles, and store directory across Nepal"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            onClick={handleExportClientsCsv}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isNepali ? "CSV निर्यात" : "Export CSV"}</span>
          </button>

          <button
            onClick={handleOpenAddClient}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isNepali ? "+ नयाँ ग्राहक दर्ता" : "+ Register Client"}</span>
          </button>
        </div>
      </div>

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
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              {isNepali ? "सक्रिय स्टोरहरू" : "Active Stores"}
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {formatNumberByLang(clientStats.active)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {isNepali ? "बिलिङ र POS चालु" : "Live billing & POS"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              {isNepali ? "निष्क्रिय / निलम्बित" : "Inactive / Suspended"}
            </div>
            <div className="text-2xl font-bold text-neutral-300 font-mono mt-1">
              {formatNumberByLang(clientStats.inactive)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {isNepali ? "नवीकरण वा ध्यान आवश्यक" : "Needs review or renewal"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
              {isNepali ? "सोधपुछबाट रूपान्तरित" : "Converted Leads"}
            </div>
            <div className="text-2xl font-bold text-teal-400 font-mono mt-1">
              {formatNumberByLang(
                clients.filter((c) =>
                  c.notes?.includes("Converted from Lead/Enquiry"),
                ).length,
              )}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {isNepali
                ? "अनलाइन सोधपुछबाट बनेका"
                : "Converted from enquiries"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <BadgeCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Clients Filters & Toolbar */}
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
                ? "नाम, पसल, फोन नम्बर वा PAN खोज्नुहोस्..."
                : "Search by client name, store, phone, or PAN..."
            }
            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Quick status & type filters */}
        <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      </div>

      {/* Clients Table */}
      <Table<Client>
        data={filteredClients}
        columns={clientColumns}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        skeletonRows={7}
        onRowClick={(c) => setViewingClient(c)}
        emptyState={{
          title: isNepali
            ? "कुनै ग्राहक फेला परेन"
            : "No Registered Clients Found",
          description:
            clientSearch ||
            clientStatusFilter !== "all" ||
            clientTypeFilter !== "all"
              ? isNepali
                ? "खोज फिल्टरहरू परिवर्तन गरी हेर्नुहोस्।"
                : "Try adjusting your search query or filters."
              : isNepali
                ? "तपाईंको खुद्रा पसल वा ग्राहकहरूको विवरण यहाँ दर्ता गरी व्यवस्थापन गर्नुहोस्।"
                : "Start by registering your regular retail clients, store accounts, and contact records.",
          icon: <Users className="w-6 h-6 text-neutral-400" />,
          action: {
            label: isNepali
              ? "पहिलो ग्राहक दर्ता गर्नुहोस्"
              : "Register First Client",
            onClick: handleOpenAddClient,
            icon: <UserPlus className="w-3.5 h-3.5" />,
          },
        }}
      />

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
                  ? "ग्राहक / व्यक्तिको नाम *"
                  : "Client / Contact Name *"}
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
                {isNepali ? "फोन / मोबाइल नम्बर *" : "Phone / Mobile Number *"}
              </label>
              <input
                type="tel"
                required
                value={clientForm.phone}
                onChange={(e) =>
                  setClientForm({ ...clientForm, phone: e.target.value })
                }
                placeholder="98XXXXXXXX"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "इमेल ठेगाना" : "Email Address"}
              </label>
              <input
                type="email"
                value={clientForm.email}
                onChange={(e) =>
                  setClientForm({ ...clientForm, email: e.target.value })
                }
                placeholder="store@example.com"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "पसलको प्रकार" : "Store / Business Type"}
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
          </div>

          {/* Password (for new clients) */}
          {!editingClient && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-300">
                  {isNepali ? "ग्राहक लगइन पासवर्ड" : "Client Login Password"}
                </label>
                {!clientForm.password && (
                  <span className="text-[10px] text-neutral-500">
                    {isNepali
                      ? "खाली: पूर्वनिर्धारित StockForge2026!"
                      : "Default: StockForge2026!"}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={clientForm.password}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, password: e.target.value })
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "ठेगाना / सहर" : "Store Address / City"}
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

          {/* Subscription Section */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-200">
                {isNepali
                  ? "सदस्यता योजना तथा अवधि"
                  : "Subscription Plan & Duration"}
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {isNepali ? "लाइसेन्स व्यवस्थापन" : "License Config"}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "स्थिति" : "Account Status"}
              </label>
              <select
                value={clientForm.status}
                onChange={(e) =>
                  setClientForm({ ...clientForm, status: e.target.value })
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {isNepali ? "टिप्पणी / विवरण" : "Internal Notes"}
              </label>
              <input
                type="text"
                value={clientForm.notes}
                onChange={(e) =>
                  setClientForm({ ...clientForm, notes: e.target.value })
                }
                placeholder={
                  isNepali ? "विशेष सम्झौता वा नोट..." : "Special notes..."
                }
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
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
    </div>
  );
};

