import {
  apiRequest,
  setStoredToken,
  removeStoredToken,
  setStoredAdminUser,
  removeStoredAdminUser,
  getStoredToken,
} from '../api/apiClient';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: 'super_admin' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  token: string;
  tokenType: 'Bearer';
  admin: AdminUser;
}

/**
 * Super Admin Login via Backend API
 * POST /api/v1/admin/login
 */
export async function loginAdmin(input: AdminLoginInput): Promise<AdminUser> {
  const result = await apiRequest<AdminAuthResponse>('/admin/login', {
    method: 'POST',
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
 * Get current admin profile
 * GET /api/v1/admin/me
 */
export async function getAdminProfile(): Promise<AdminUser> {
  const admin = await apiRequest<AdminUser>('/admin/me');
  setStoredAdminUser(admin);
  return admin;
}

/**
 * Super Admin Logout
 */
export function logoutAdmin(): void {
  removeStoredToken();
  removeStoredAdminUser();
}

/**
 * Verify if admin has a stored session token
 */
export function hasAdminToken(): boolean {
  return !!getStoredToken();
}
