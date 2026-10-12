import { apiRequest } from "../api/apiClient";

export interface ClientSubscription {
  plan: string;
  status: "active" | "expired" | "trial" | "grace_period" | "cancelled";
  startDate: string;
  durationDays: number;
  expiryDate: string;
  autoRenew?: boolean;
}

export interface Client {
  id: string; // Firebase UID
  name: string;
  email: string;
  phone?: string;
  shopName?: string;
  shopType?: string;
  address?: string;
  currencySymbol?: string;
  isActive: boolean;
  subscription: ClientSubscription;
  createdAt: string;
  updatedAt: string;

  // Compatibility getters/properties for existing UI components
  company_name?: string | null;
  client_type?: string;
  pan_number?: string | null;
  credit_limit?: number;
  current_balance?: number;
  status?: string;
  notes?: string | null;
}

export interface CreateClientInput {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  shopName?: string;
  shopType?: string;
  address?: string;
  currencySymbol?: string;
  plan?: string;
  trialDays?: number;

  // Compatibility
  company_name?: string;
  client_type?: string;
  pan_number?: string;
  credit_limit?: number;
  current_balance?: number;
  status?: string;
  notes?: string;
}

export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  trial: number;
  expired: number;
  cancelled: number;
  totalCreditBalance: number;
}

function normalizeClient(doc: any): Client {
  return {
    ...doc,
    id: doc.id || doc._id || "",
    company_name: doc.shopName || doc.company_name || null,
    client_type: doc.shopType || doc.client_type || "Retail Store",
    pan_number: doc.pan_number || null,
    credit_limit: doc.credit_limit || 0,
    current_balance: doc.current_balance || 0,
    status: doc.isActive ? "active" : "inactive",
    notes: doc.notes || null,
  };
}

export async function getAllClients(filter?: {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  limit?: number;
}): Promise<Client[]> {
  const params: any = {
    page: filter?.page || 1,
    limit: filter?.limit || 100,
  };
  if (filter?.search) params.search = filter.search;
  if (filter?.status && filter.status !== "all") params.status = filter.status;
  if (filter?.plan && filter.plan !== "all") params.plan = filter.plan;

  const result = await apiRequest<Client[]>("/clients", { params });
  return (Array.isArray(result) ? result : []).map(normalizeClient);
}

export async function getClientById(id: string): Promise<Client> {
  const result = await apiRequest<Client>(`/clients/${id}`);
  return normalizeClient(result);
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const payload = {
    name: input.name,
    email: input.email,
    password: input.password || "StockForge2026!",
    phone: input.phone,
    shopName: input.shopName || input.company_name,
    shopType: input.shopType || input.client_type || "Retail Store",
    address: input.address,
    currencySymbol: input.currencySymbol || "Rs.",
    plan: input.plan || "trial",
    trialDays: input.trialDays || 14,
  };

  const result = await apiRequest<any>("/clients/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const created = result.client || result;
  return normalizeClient(created);
}

export async function updateClient(
  id: string,
  input: Partial<CreateClientInput>,
): Promise<Client> {
  const payload: any = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.shopName !== undefined || input.company_name !== undefined) {
    payload.shopName = input.shopName || input.company_name;
  }
  if (input.shopType !== undefined || input.client_type !== undefined) {
    payload.shopType = input.shopType || input.client_type;
  }
  if (input.address !== undefined) payload.address = input.address;
  if (input.currencySymbol !== undefined)
    payload.currencySymbol = input.currencySymbol;
  if (input.status !== undefined) payload.isActive = input.status === "active";

  const result = await apiRequest<Client>(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return normalizeClient(result);
}

export async function toggleClientStatus(
  id: string,
  currentIsActive: boolean,
): Promise<Client> {
  return updateClient(id, {
    status: currentIsActive ? "inactive" : "active",
  });
}

export async function deleteClient(id: string): Promise<void> {
  await apiRequest(`/clients/${id}`, {
    method: "DELETE",
  });
}

export async function extendClientSubscription(input: {
  clientId: string;
  durationDays: number;
  plan?: string;
  amountPaid?: number;
  paymentReference?: string;
  notes?: string;
}): Promise<any> {
  return apiRequest("/subscriptions/extend", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cancelClientSubscription(input: {
  clientId: string;
  reason?: string;
}): Promise<any> {
  return apiRequest("/subscriptions/cancel", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getClientSubscriptionHistory(
  clientId: string,
): Promise<any[]> {
  const result = await apiRequest<any[]>(`/subscriptions/${clientId}/history`);
  return Array.isArray(result) ? result : [];
}

export async function getClientsStats(): Promise<ClientStats> {
  try {
    const clients = await getAllClients({ limit: 1000 });
    let active = 0;
    let trial = 0;
    let expired = 0;
    let cancelled = 0;

    for (const c of clients) {
      if (c.isActive) active++;
      const subStatus = c.subscription?.status;
      if (subStatus === "trial") trial++;
      else if (subStatus === "expired") expired++;
      else if (subStatus === "cancelled") cancelled++;
    }

    return {
      total: clients.length,
      active,
      inactive: clients.length - active,
      trial,
      expired,
      cancelled,
      totalCreditBalance: 0,
    };
  } catch (err) {
    console.error("Failed to get clients stats:", err);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      trial: 0,
      expired: 0,
      cancelled: 0,
      totalCreditBalance: 0,
    };
  }
}
