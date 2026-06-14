import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  localizePath,
  normalizeLanguage,
  type Language,
} from "@/shared/language/localizedRouting";

export type { Language };

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  isEnglish: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { lang } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const language = normalizeLanguage(lang);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        navigate(`${localizePath(location.pathname, nextLanguage)}${location.search}${location.hash}`);
      },
      isEnglish: language === "en",
    }),
    [language, location.hash, location.pathname, location.search, navigate],
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
