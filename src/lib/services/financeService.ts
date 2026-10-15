import { apiRequest } from "../api/apiClient";

export type FinanceTransactionType = "income" | "expense";

export interface FinanceTransaction {
  id: string;
  type: FinanceTransactionType; // "income" (earned) or "expense" (spent)
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod?: string;
  clientId?: string;
  clientName?: string;
  clientShopName?: string;
  reference?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinanceInput {
  type: FinanceTransactionType;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  clientId?: string;
  clientName?: string;
  clientShopName?: string;
  reference?: string;
  note?: string;
}

export interface UpdateFinanceInput {
  type?: FinanceTransactionType;
  category?: string;
  amount?: number;
  date?: string;
  paymentMethod?: string;
  clientId?: string | null;
  clientName?: string | null;
  clientShopName?: string | null;
  reference?: string | null;
  note?: string | null;
}

export interface FinanceStats {
  totalIncome: number; // Total Earned
  totalExpenses: number; // Total Spent
  netProfit: number; // Total Earned - Total Spent
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
  recentTransactions: FinanceTransaction[];
}

export interface ListFinancesFilter {
  type?: FinanceTransactionType | "all";
  category?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const DEFAULT_INCOME_CATEGORIES = [
  "Client Payment Received",
  "Subscription Payment",
  "Software License",
  "Setup & Onboarding",
  "Custom Feature / Module",
  "Support & Maintenance",
  "Consulting",
  "Other Income",
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Cloud Hosting & Servers",
  "Software Licenses & SaaS",
  "Salaries & Developer Payouts",
  "Marketing & Advertising",
  "Office & Operations",
  "Internet & Utilities",
  "Domain & Security SSL",
  "Legal & Compliance",
  "Other Expense",
] as const;

export const DEFAULT_PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "eSewa",
  "Khalti",
  "Card / POS",
  "Cheque",
  "Other",
] as const;

/**
 * Fetch all finance transactions with optional query filters
 */
export async function getAllFinances(filter?: ListFinancesFilter): Promise<FinanceTransaction[]> {
  const params: any = {
    page: filter?.page || 1,
    limit: filter?.limit || 200,
  };
  if (filter?.type && filter.type !== "all") params.type = filter.type;
  if (filter?.category && filter.category !== "all") params.category = filter.category;
  if (filter?.clientId && filter.clientId !== "all") params.clientId = filter.clientId;
  if (filter?.startDate) params.startDate = filter.startDate;
  if (filter?.endDate) params.endDate = filter.endDate;
  if (filter?.search) params.search = filter.search;

  const result = await apiRequest<{
    data: FinanceTransaction[];
    total: number;
    page: number;
    limit: number;
  }>("/finances", { params });

  return result?.data || (Array.isArray(result) ? result : []);
}

/**
 * Fetch high-level finance metrics & category breakdowns
 */
export async function getFinanceStats(filter?: {
  startDate?: string;
  endDate?: string;
  clientId?: string;
}): Promise<FinanceStats> {
  const params: any = {};
  if (filter?.startDate) params.startDate = filter.startDate;
  if (filter?.endDate) params.endDate = filter.endDate;
  if (filter?.clientId && filter.clientId !== "all") params.clientId = filter.clientId;

  return await apiRequest<FinanceStats>("/finances/stats", { params });
}

/**
 * Create a new income or expense transaction
 */
export async function createFinance(input: CreateFinanceInput): Promise<FinanceTransaction> {
  return await apiRequest<FinanceTransaction>("/finances", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Update existing finance transaction
 */
export async function updateFinance(
  id: string,
  input: UpdateFinanceInput,
): Promise<FinanceTransaction> {
  return await apiRequest<FinanceTransaction>(`/finances/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Delete finance transaction
 */
export async function deleteFinance(id: string): Promise<void> {
  await apiRequest<{ id: string }>(`/finances/${id}`, {
    method: "DELETE",
  });
}

