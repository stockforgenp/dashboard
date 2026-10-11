import { apiRequest } from '../api/apiClient';
import { Client } from './clientService';
import { Enquiry } from './enquiryService';
import { ClientReview } from './reviewService';

export interface AdminOverviewStats {
  clients: {
    total: number;
    active: number;
    inactive: number;
    trial: number;
    expired: number;
    cancelled: number;
  };
  inquiries: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    fiveStarCount: number;
  };
  recentClients: Client[];
  recentInquiries: Enquiry[];
  recentReviews: ClientReview[];
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const result = await apiRequest<AdminOverviewStats>('/admin/stats');
  return result;
}
