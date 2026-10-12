import {
  apiRequest,
  setStoredToken,
  removeStoredToken,
  setStoredAdminUser,
  removeStoredAdminUser,
  getStoredToken,
} from "../api/apiClient";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: "super_admin" | "admin";
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  token: string;
  tokenType: "Bearer";
  admin: AdminUser;
}

/**
 * Super Admin Login via Backend API
 * POST /api/v1/admin/login
 */
export async function loginAdmin(input: AdminLoginInput): Promise<AdminUser> {
  const result = await apiRequest<AdminAuthResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (result.token) {
    setStoredToken(result.token);
  }
  if (result.admin) {
    setStoredAdminUser(result.admin);
  }

  return result.admin;
}

/**
 * Super Admin Logout
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await apiRequest("/admin/logout", {
      method: "POST",
    });
  } catch (err) {
    console.warn("Failed to notify backend of logout:", err);
  } finally {
    removeStoredToken();
    removeStoredAdminUser();
  }
}

/**
 * Verify if admin has a stored session token
 */
export function hasAdminToken(): boolean {
  return !!getStoredToken();
}
