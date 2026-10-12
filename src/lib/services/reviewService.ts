import { apiRequest } from "../api/apiClient";

export interface ClientReview {
  id: string;
  client_name: string;
  shop_name: string | null;
  location: string | null;
  rating: number; // 1 to 5 stars
  review_text: string;
  client_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientReviewInput {
  client_name: string;
  shop_name?: string | null;
  location?: string | null;
  rating: number;
  review_text: string;
  client_id?: string | null;
}

export interface ReviewStats {
  total: number;
  averageRating: number;
  fiveStarCount: number;
}

function normalizeReview(doc: any): ClientReview {
  const createdAt = doc.createdAt || doc.created_at || new Date().toISOString();
  const updatedAt = doc.updatedAt || doc.updated_at || createdAt;

  return {
    id: doc.id || doc._id || "",
    client_name: doc.clientName || doc.client_name || "",
    shop_name: doc.shopName || doc.shop_name || null,
    location: doc.location || null,
    rating: Number(doc.rating || 5),
    review_text: doc.reviewText || doc.review_text || "",
    client_id: doc.clientId || doc.client_id || null,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export async function getAllClientReviews(filter?: {
  rating?: number;
  search?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}): Promise<ClientReview[]> {
  const params: any = {
    page: filter?.page || 1,
    limit: filter?.limit || 100,
  };
  if (filter?.rating) params.rating = filter.rating;
  if (filter?.search) params.search = filter.search;
  if (filter?.clientId) params.clientId = filter.clientId;

  const result = await apiRequest<any>("/reviews", { params });
  const list = Array.isArray(result) ? result : result.reviews || [];
  return list.map(normalizeReview);
}

export async function createClientReview(
  input: CreateClientReviewInput,
): Promise<ClientReview> {
  const payload = {
    clientName: input.client_name,
    shopName: input.shop_name || undefined,
    location: input.location || undefined,
    rating: input.rating,
    reviewText: input.review_text,
    clientId: input.client_id || undefined,
  };

  const result = await apiRequest<any>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeReview(result);
}

export async function deleteClientReview(id: string): Promise<void> {
  await apiRequest(`/reviews/${id}`, {
    method: "DELETE",
  });
}

export async function getClientReviewsStats(): Promise<ReviewStats> {
  try {
    const res = await apiRequest<any>("/reviews", { params: { limit: 1000 } });
    if (res && res.stats) {
      return {
        total: res.stats.total || 0,
        averageRating: res.stats.averageRating || 5.0,
        fiveStarCount: res.stats.fiveStarCount || 0,
      };
    }

    const list: any[] = Array.isArray(res) ? res : res.reviews || [];
    if (list.length === 0) {
      return { total: 0, averageRating: 5.0, fiveStarCount: 0 };
    }

    const sum = list.reduce((acc, r) => acc + (r.rating || 5), 0);
    const fiveStarCount = list.filter((r) => r.rating >= 5).length;
    const averageRating = parseFloat((sum / list.length).toFixed(1));

    return { total: list.length, averageRating, fiveStarCount };
  } catch (err) {
    console.error("Failed to get client reviews stats:", err);
    return { total: 0, averageRating: 5.0, fiveStarCount: 0 };
  }
}
