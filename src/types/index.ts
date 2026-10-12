export interface LoginInput {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export type ClientType =
  | "Retail Store"
  | "Supermarket"
  | "Grocery Mart"
  | "Hardware Store"
  | "Pharmacy"
  | "Wholesale Dealer"
  | "Individual Customer"
  | "Other";

export type ClientStatus = "active" | "inactive" | "pending";

export interface Client {
  id: number;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string;
  client_type: string;
  address: string | null;
  pan_number: string | null;
  credit_limit: number;
  current_balance: number;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  company_name?: string;
  email?: string;
  phone: string;
  client_type?: string;
  address?: string;
  pan_number?: string;
  credit_limit?: number;
  current_balance?: number;
  status?: ClientStatus;
  notes?: string;
}

export type EnquiryType =
  | "on_site_demo"
  | "vat_compliance"
  | "hardware_pairing"
  | "multi_unit_help"
  | "wholesale_deployment"
  | "general_support";

export type EnquiryStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "converted"
  | "closed";

export interface Enquiry {
  id: number;
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
}

export interface EnquiryStats {
  total: number;
  new_count: number;
  contacted_count: number;
  in_progress_count: number;
  converted_count: number;
  closed_count: number;
}

export interface ClientReview {
  id: number;
  client_name: string;
  shop_name: string | null;
  location: string | null;
  rating: number; // 1 to 5 stars
  review_text: string;
  client_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientReviewInput {
  client_name: string;
  shop_name?: string | null;
  location?: string | null;
  rating: number;
  review_text: string;
  client_id?: number | null;
}
