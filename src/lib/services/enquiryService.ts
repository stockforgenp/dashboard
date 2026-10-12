import { apiRequest } from "../api/apiClient";
import { Client, createClient } from "./clientService";

export type EnquiryType =
  | "on_site_demo"
  | "vat_compliance"
  | "hardware_pairing"
  | "multi_unit_help"
  | "wholesale_deployment"
  | "general_support"
  | "sales"
  | "support"
  | "demo"
  | "billing"
  | "partnership"
  | "general";

export type EnquiryStatus =
  | "new"
  | "pending"
  | "contacted"
  | "in_progress"
  | "converted"
  | "resolved"
  | "closed";

export interface Enquiry {
  id: string;
  reference_id: string;
  full_name: string;
  shop_name: string | null;
  email: string;
  phone: string;
  store_type: string | null;
  inquiry_type: EnquiryType | string;
  subject: string | null;
  message: string;
  status: EnquiryStatus;
  notes: string | null;
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEnquiryInput {
  reference_id?: string;
  full_name: string;
  shop_name?: string;
  email: string;
  phone: string;
  store_type?: string;
  inquiry_type?: string;
  subject?: string;
  message: string;
  status?: EnquiryStatus;
  notes?: string;
  clientId?: string;
}

export interface EnquiryStats {
  total: number;
  new_count: number;
  contacted_count: number;
  in_progress_count: number;
  converted_count: number;
  closed_count: number;
}

function normalizeEnquiry(doc: any): Enquiry {
  const status: EnquiryStatus = doc.status === "pending" ? "new" : doc.status;
  const createdAt = doc.createdAt || doc.created_at || new Date().toISOString();
  const updatedAt = doc.updatedAt || doc.updated_at || createdAt;

  return {
    id: doc.id || doc._id || "",
    reference_id: doc.reference_id || `INQ-${doc.id?.slice?.(0, 8) || "REF"}`,
    full_name: doc.name || doc.full_name || "",
    shop_name: doc.shopName || doc.shop_name || null,
    email: doc.email || "",
    phone: doc.phone || "",
    store_type: doc.store_type || doc.shopType || "Grocery & Supermarket",
    inquiry_type: doc.type || doc.inquiry_type || "general",
    subject: doc.subject || "Inquiry",
    message: doc.message || "",
    status,
    notes: doc.adminNotes || doc.notes || null,
    clientId: doc.clientId,
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export async function getAllEnquiries(filter?: {
  search?: string;
  status?: string;
  inquiryType?: string;
  page?: number;
  limit?: number;
}): Promise<Enquiry[]> {
  const params: any = {
    page: filter?.page || 1,
    limit: filter?.limit || 100,
  };
  if (filter?.search) params.search = filter.search;
  if (filter?.status && filter.status !== "all") {
    params.status = filter.status === "new" ? "pending" : filter.status;
  }
  if (filter?.inquiryType && filter.inquiryType !== "all") {
    params.type = filter.inquiryType;
  }

  const result = await apiRequest<any[]>("/inquiries", { params });
  return (Array.isArray(result) ? result : []).map(normalizeEnquiry);
}

export async function getEnquiryById(id: string): Promise<Enquiry> {
  const result = await apiRequest<any>(`/inquiries/${id}`);
  return normalizeEnquiry(result);
}

export async function createEnquiry(
  input: CreateEnquiryInput,
): Promise<Enquiry> {
  const payload = {
    name: input.full_name,
    email: input.email,
    phone: input.phone,
    shopName: input.shop_name,
    type: input.inquiry_type || "general",
    subject: input.subject || `Inquiry from ${input.full_name}`,
    message: input.message,
    clientId: input.clientId,
  };

  const result = await apiRequest<any>("/inquiries", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeEnquiry(result);
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  notes?: string,
): Promise<Enquiry> {
  // Map 'new' to 'pending' for backend compatibility
  const backendStatus = status === "new" ? "pending" : status;

  const payload: any = {
    status: backendStatus,
  };
  if (notes !== undefined) {
    payload.adminNotes = notes;
  }

  const result = await apiRequest<any>(`/inquiries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return normalizeEnquiry(result);
}

export async function deleteEnquiry(id: string): Promise<void> {
  await apiRequest(`/inquiries/${id}`, {
    method: "DELETE",
  });
}

/**
 * 1-Click Convert Enquiry into a Registered Client
 */
export async function convertEnquiryToClient(enquiryId: string): Promise<{
  client: Client;
  enquiry: Enquiry;
}> {
  const enq = await getEnquiryById(enquiryId);

  const client = await createClient({
    name: enq.full_name,
    email: enq.email,
    phone: enq.phone,
    shopName: enq.shop_name || undefined,
    shopType: enq.store_type || "Retail Store",
    notes: `Converted from Enquiry ${enq.reference_id} on ${new Date().toLocaleDateString()}.\nInquiry message: ${enq.message}`,
  });

  const updatedEnquiry = await updateEnquiryStatus(
    enquiryId,
    "converted",
    `Converted to Registered Client ${client.name} (${client.id}).`,
  );

  return { client, enquiry: updatedEnquiry };
}

export async function getEnquiryStats(): Promise<EnquiryStats> {
  try {
    const list = await getAllEnquiries({ limit: 1000 });
    let new_count = 0;
    let contacted_count = 0;
    let in_progress_count = 0;
    let converted_count = 0;
    let closed_count = 0;

    for (const inq of list) {
      if (inq.status === "new" || inq.status === "pending") new_count++;
      else if (inq.status === "contacted") contacted_count++;
      else if (inq.status === "in_progress") in_progress_count++;
      else if (inq.status === "converted" || inq.status === "resolved")
        converted_count++;
      else if (inq.status === "closed") closed_count++;
    }

    return {
      total: list.length,
      new_count,
      contacted_count,
      in_progress_count,
      converted_count,
      closed_count,
    };
  } catch (err) {
    console.error("Failed to get enquiry stats:", err);
    return {
      total: 0,
      new_count: 0,
      contacted_count: 0,
      in_progress_count: 0,
      converted_count: 0,
      closed_count: 0,
    };
  }
}
