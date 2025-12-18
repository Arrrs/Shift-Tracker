"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSettings, setSettings, syncSettingsFromDatabase, type Language } from "@/lib/utils/user-settings";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      // Try to load from localStorage/database
      const settings = await getSettings();

      if (settings.language) {
        setLanguageState(settings.language);
        setIsLoading(false);
        return;
      }

      // If no saved language, detect browser language
      const browserLang = navigator.language.toLowerCase();
      const detectedLang: Language = (browserLang.startsWith("uk") || browserLang.startsWith("ua")) ? "uk" : "en";

      // Save detected language
      setLanguageState(detectedLang);
      await setSettings({ language: detectedLang });
    } catch (error) {
      console.error("Error loading language settings:", error);
      // Fallback to English on error
      setLanguageState("en");
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    // Update UI immediately
    setLanguageState(lang);

    // Sync to localStorage and database in background
    await setSettings({ language: lang });
  };

  if (!mounted || isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
