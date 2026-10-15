/**
 * Super Admin Login View
 * Secure login using Backend REST API (POST /api/v1/admin/login)
 */
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Mail,
  LogIn,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useLanguage } from "../context/LanguageContext.tsx";
import { useTheme } from "../context/ThemeContext.tsx";

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const { isNepali } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "admin@stockforge.io",
    password: "SuperAdmin@StockForge2026!",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginData.email.trim()) {
      setError(
        isNepali
          ? "कृपया ईमेल ठेगाना प्रविष्ट गर्नुहोस्।"
          : "Email address is required.",
      );
      return;
    }

    if (!loginData.password) {
      setError(
        isNepali
          ? "कृपया पासवर्ड प्रविष्ट गर्नुहोस्।"
          : "Password is required.",
      );
      return;
    }

    try {
      setLoading(true);
      await login({
        email: loginData.email.trim(),
        password: loginData.password,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Super Admin login failed:", err);
      setError(
        err.message ||
          (isNepali
            ? "लगइन असफल भयो। कृपया क्रेडिसिअल जाँच गर्नुहोस्।"
            : "Login failed. Please check your credentials."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-neutral-900/60">
        <div className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt="StockForge Logo"
            className="w-9 h-9 rounded-xl object-contain shadow-lg shadow-emerald-500/20"
          />
          <div>
            <div className="text-base font-bold tracking-tight text-neutral-100 flex items-center gap-2">
              StockForge
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold tracking-wider">
                Admin
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Executive Platform Console
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Login Form Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="text-center space-y-1.5">
              <img
                src="/icon.png"
                alt="StockForge Logo"
                className="w-14 h-14 rounded-2xl object-contain mx-auto mb-3 shadow-lg shadow-emerald-500/20"
              />
              <h1 className="text-xl font-bold tracking-tight text-neutral-100">
                {isNepali ? "सुपर एडमिन लगइन" : "Super Admin Sign In"}
              </h1>
              <p className="text-xs text-neutral-400">
                {isNepali
                  ? "स्टकफोर्ज प्लेटफर्म कमाण्ड सेन्टरमा पहुँच पाउनुहोस्।"
                  : "Access the centralized clients & subscriptions management panel."}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  {isNepali ? "ईमेल" : "Email Address"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="admin@stockforge.io"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  {isNepali ? "पासवर्ड" : "Password"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {isNepali ? "प्रमाणीकरण गर्दै..." : "Authenticating..."}
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      {isNepali ? "लगइन गर्नुहोस्" : "Sign In as Super Admin"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-neutral-500">
        StockForge Cloud Management &bull; Connected to Express &amp; Firebase
        Backend
      </footer>
    </div>
  );
};
