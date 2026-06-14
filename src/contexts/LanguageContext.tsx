import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "ko" | "en";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  isEnglish: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("gelia-language");
    return savedLanguage === "en" ? "en" : "ko";
  });

  useEffect(() => {
    localStorage.setItem("gelia-language", language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isEnglish: language === "en",
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguageContext must be used within LanguageProvider");
  }
  return context;
}
