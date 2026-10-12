/**
 * Language (i18n) Context & Hook
 * Provides seamless English (en) <-> Nepali (np) language conversion
 * Persists selection to localStorage
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
  SupportedLanguage,
  TRANSLATIONS,
  toNepaliDigits,
} from "../lib/i18n/translations.ts";

interface LanguageContextType {
  language: SupportedLanguage;
  currencySymbol: string;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>,
  ) => string;
  formatNumberByLang: (val: number | string) => string;
  isNepali: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_STORAGE_KEY = "stockforge_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === "en" || stored === "np") {
        return stored;
      }
    } catch {
      // Ignore localStorage errors
    }
    return "en";
  });

  useEffect(() => {
    document.documentElement.lang = language === "np" ? "ne" : "en";
  }, [language]);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch {
      // Ignore persistence errors
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "np" : "en");
  }, [language, setLanguage]);

  const t = useCallback(
    (
      key: string,
      fallbackOrParams?: string | Record<string, string | number>,
      params?: Record<string, string | number>,
    ): string => {
      let fallback = key;
      let interpolationParams: Record<string, string | number> | undefined;

      if (typeof fallbackOrParams === "string") {
        fallback = fallbackOrParams;
        interpolationParams = params;
      } else if (fallbackOrParams && typeof fallbackOrParams === "object") {
        interpolationParams = fallbackOrParams;
      }

      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      let text = dict[key] || TRANSLATIONS.en[key] || fallback;

      if (interpolationParams) {
        Object.entries(interpolationParams).forEach(([paramKey, paramVal]) => {
          const valStr =
            language === "np" && typeof paramVal === "number"
              ? toNepaliDigits(paramVal)
              : String(paramVal);
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), valStr);
        });
      }

      return text;
    },
    [language],
  );

  const formatNumberByLang = useCallback(
    (val: number | string): string => {
      if (language === "np") {
        return toNepaliDigits(val);
      }
      return String(val);
    },
    [language],
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        currencySymbol: language === "np" ? "रु." : "Rs.",
        setLanguage,
        toggleLanguage,
        t,
        formatNumberByLang,
        isNepali: language === "np",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
