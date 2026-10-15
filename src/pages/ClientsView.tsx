/**
 * Clients Management View
 * Dedicated management view for Registered Store Clients, Accounts, and Fiscal PAN/VAT records across Nepal.
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserPlus,
  Download,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  BadgeCheck,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Table, Column } from "../components/common/Table.tsx";
import { ActionMenu } from "../components/common/ActionMenu.tsx";
import {
  getAllClients,
  deleteClient,
  toggleClientStatus,
  getClientsStats,
  Client,
} from "../lib/services/clientService.ts";
import { formatDate, formatNumber } from "../lib/utils/format.ts";
import { ConfirmDialog } from "../components/common/ConfirmDialog.tsx";
import { Modal } from "../components/common/Modal.tsx";
import { useToast } from "../context/ToastContext.tsx";
import {
  ClientOnboardingModal,
  STORE_TYPES,
} from "../components/forms/index.ts";

export const ClientsView: React.FC = () => {
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

  const handleOpenAddClient = () => {
    setEditingClient(null);
    setIsAddClientOpen(true);
  };

  const handleOpenEditClient = (c: Client) => {
    setEditingClient(c);
  };

  const handleToggleClientStatus = async (
    id: string,
    currentStatus: string,
  ) => {
    try {
      const updated = await toggleClientStatus(id, currentStatus);
      showToast(`Client status changed to ${updated.status}`, "success");
      await refreshClientData();
    } catch (err: unknown) {
      showToast((err as Error).message || "Failed to update status", "error");
    }
  };

  const handleDeleteClientConfirm = async () => {
    if (deletingClientId) {
      try {
        await deleteClient(deletingClientId);
        showToast("Client deleted", "success");
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
      showToast("Exported clients to CSV", "success");
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
        header: "Client & Store",
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
        header: "Contact",
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
        header: "Type & Location",
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
        header: "Status",
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
            title={"Toggle active/inactive status"}
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
                ? "Active"
                : c.status === "suspended"
                  ? "Suspended"
                  : c.status === "banned"
                    ? "Banned"
                    : "Inactive"}
            </span>
          </button>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        render: (c) => (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionMenu
              align="right"
              title={`Actions for ${c.name}`}
              items={[
                {
                  id: "view",
                  label: "View Details",
                  icon: Eye,
                  color: "neutral",
                  onClick: () => setViewingClient(c),
                },
                {
                  id: "edit",
                  label: "Edit Client",
                  icon: Edit2,
                  color: "emerald",
                  onClick: () => handleOpenEditClient(c),
                },
                {
                  id: "toggle-status",
                  label:
                    c.status === "active"
                      ? "Deactivate Client"
                      : "Activate Client",
                  icon: c.status === "active" ? ShieldAlert : ShieldCheck,
                  color: c.status === "active" ? "amber" : "emerald",
                  onClick: () =>
                    handleToggleClientStatus(c.id, c.status || "active"),
                },
                {
                  id: "delete",
                  label: "Delete Client",
                  icon: Trash2,
                  color: "rose",
                  divider: true,
                  onClick: () => setDeletingClientId(c.id),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              {"Total Registered"}
            </div>
            <div className="text-2xl font-bold text-neutral-100 font-mono mt-1">
              {formatNumber(clientStats.total)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {"Active accounts"}:{" "}
              <span className="text-emerald-400 font-semibold font-mono">
                {formatNumber(clientStats.active)}
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
              {"Active Stores"}
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {formatNumber(clientStats.active)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {"Live billing & POS"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              {"Inactive / Suspended"}
            </div>
            <div className="text-2xl font-bold text-neutral-300 font-mono mt-1">
              {formatNumber(clientStats.inactive)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {"Needs review or renewal"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
              {"Converted Leads"}
            </div>
            <div className="text-2xl font-bold text-teal-400 font-mono mt-1">
              {formatNumber(
                clients.filter((c) =>
                  c.notes?.includes("Converted from Lead/Enquiry"),
                ).length,
              )}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {"Converted from enquiries"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <BadgeCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Clients Table with Integrated Search, Filters, and Actions */}
      <Table<Client>
        data={filteredClients}
        columns={clientColumns}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        skeletonRows={7}
        enablePagination={true}
        pageSize={10}
        onRowClick={(c) => setViewingClient(c)}
        search={{
          value: clientSearch,
          onChange: setClientSearch,
          placeholder: "Search by client name, store, phone, or PAN...",
          predicate: (c, query) => {
            const q = query.toLowerCase();
            return (
              c.name.toLowerCase().includes(q) ||
              (c.company_name ? c.company_name.toLowerCase().includes(q) : false) ||
              (c.phone ? c.phone.includes(q) : false) ||
              (c.pan_number ? c.pan_number.includes(q) : false) ||
              (c.email ? c.email.toLowerCase().includes(q) : false) ||
              (c.address ? c.address.toLowerCase().includes(q) : false)
            );
          },
        }}
        filters={
          <>
            <select
              value={clientStatusFilter}
              onChange={(e) => setClientStatusFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>

            <select
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Store Types</option>
              {STORE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </>
        }
        actions={
          <>
            <button
              onClick={handleExportClientsCsv}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenAddClient}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Client</span>
            </button>
          </>
        }
        emptyState={{
          title: "No Registered Clients Found",
          description:
            clientSearch ||
            clientStatusFilter !== "all" ||
            clientTypeFilter !== "all"
              ? "Try adjusting your search query or filters."
              : "Start by registering your regular retail clients, store accounts, and contact records.",
          icon: <Users className="w-6 h-6 text-neutral-400" />,
          action: {
            label: "Register First Client",
            onClick: handleOpenAddClient,
            icon: <UserPlus className="w-3.5 h-3.5" />,
          },
        }}
      />

      {/* MODAL 1: ONBOARD / EDIT CLIENT */}
      <ClientOnboardingModal
        isOpen={isAddClientOpen || editingClient !== null}
        onClose={() => {
          setIsAddClientOpen(false);
          setEditingClient(null);
        }}
        editingClient={editingClient}
        onSuccess={() => refreshClientData()}
      />

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
                  {viewingClient.company_name || "Retail Store"}
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
                <span className="text-neutral-500">Phone:</span>
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
                <span className="text-neutral-500">Email:</span>
                <div className="text-neutral-200 mt-0.5 truncate">
                  {viewingClient.email || "—"}
                </div>
              </div>

              <div>
                <span className="text-neutral-500">Store Type:</span>
                <div className="text-neutral-200 mt-0.5">
                  {viewingClient.client_type}
                </div>
              </div>

              <div>
                <span className="text-neutral-500">PAN/VAT Number:</span>
                <div className="font-mono text-neutral-200 mt-0.5">
                  {viewingClient.pan_number || "—"}
                </div>
              </div>

              <div className="col-span-2">
                <span className="text-neutral-500">Location:</span>
                <div className="text-neutral-200 mt-0.5">
                  {viewingClient.address || "—"}
                </div>
              </div>

              {viewingClient.subscription && (
                <div className="col-span-2 pt-2 border-t border-neutral-800 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-neutral-500 text-[10px]">Plan:</span>
                    <div className="font-semibold text-emerald-400 capitalize mt-0.5">
                      {viewingClient.subscription.plan || "trial"}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px]">
                      Duration:
                    </span>
                    <div className="font-mono text-neutral-200 mt-0.5">
                      {viewingClient.subscription.durationDays
                        ? `${viewingClient.subscription.durationDays} days`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px]">
                      Expiry Date:
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
                  Internal Notes
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
                Edit Profile
              </button>
              <button
                onClick={() => setViewingClient(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Close
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
        title="Delete Client"
        message="Are you sure you want to permanently delete this client record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
};
