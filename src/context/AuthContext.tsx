/**
 * Authentication Context for Super Admin
 * Manages admin session, login via Backend REST API, token persistence, and profile verification.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  AdminUser,
  AdminLoginInput,
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  hasAdminToken,
} from "../lib/services/authService";
import { getStoredAdminUser } from "../lib/api/apiClient";

interface AuthContextType {
  admin: AdminUser | null;
  currentShop: any | null; // Compatibility with existing views that reference currentShop
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: AdminLoginInput) => Promise<AdminUser>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() =>
    getStoredAdminUser(),
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!hasAdminToken()) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await getAdminProfile();
      setAdmin(profile);
    } catch (err) {
      console.warn("Failed to verify admin profile, clearing token:", err);
      logoutAdmin();
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(
    async (input: AdminLoginInput): Promise<AdminUser> => {
      setIsLoading(true);
      try {
        const loggedAdmin = await loginAdmin(input);
        setAdmin(loggedAdmin);
        return loggedAdmin;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    logoutAdmin();
    setAdmin(null);
  }, []);

  // Compatibility object for existing headers/components referencing currentShop
  const currentShop = admin
    ? {
        id: 1,
        name: admin.name || "StockForge Admin",
        email: admin.email,
        phone: admin.phoneNumber || "+977-9800000000",
        shop_type: "Super Admin HQ",
        currency_symbol: "Rs.",
        role: admin.role,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        admin,
        currentShop,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
