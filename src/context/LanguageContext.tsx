import React, { createContext, useContext } from "react";

/**
 * Standard English Context for StockForge Dashboard
 * Keeps the dashboard strictly in English without multi-lingual conversion overhead.
 */
export interface LanguageContextType {
  language: "en";
  isNepali: boolean;
  t: (key: string, fallback?: string) => string;
  formatNumberByLang: (val: number | string | undefined | null) => string;
}

const DEFAULT_LABELS: Record<string, string> = {
  nav_dashboard: "Dashboard",
  nav_finances: "Finances",
  nav_clients: "Clients",
  nav_enquiries: "Leads & Enquiries",
  nav_reviews: "Client Reviews",
  app_subtitle: "Enterprise Multi-Store ERP",
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  isNepali: false,
  t: (key: string, fallback?: string) => DEFAULT_LABELS[key] || fallback || key,
  formatNumberByLang: (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === "") return "0";
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num) ? "0" : num.toLocaleString("en-US");
  },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <LanguageContext.Provider
      value={{
        language: "en",
        isNepali: false,
        t: (key: string, fallback?: string) =>
          DEFAULT_LABELS[key] || fallback || key,
        formatNumberByLang: (val: number | string | undefined | null) => {
          if (val === undefined || val === null || val === "") return "0";
          const num = typeof val === "string" ? parseFloat(val) : val;
          return isNaN(num) ? "0" : num.toLocaleString("en-US");
        },
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

