import { Languages } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  SUPPORTED_LANGUAGES,
  localizePath,
  type Language,
} from "@/shared/language/localizedRouting";

type LanguageToggleProps = {
  compact?: boolean;
};

export default function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { language } = useLanguageContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isEnglish = language === "en";

  const switchToNextLanguage = () => {
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(language);
    const nextLanguage = SUPPORTED_LANGUAGES[
      (currentIndex + 1) % SUPPORTED_LANGUAGES.length
    ] as Language;
    navigate(`${localizePath(location.pathname, nextLanguage)}${location.search}${location.hash}`);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={switchToNextLanguage}
        className="inline-flex h-10 min-w-[64px] items-center justify-center gap-1 rounded-full bg-secondary px-3 text-[12px] font-semibold text-foreground transition-opacity hover:opacity-90"
        aria-label={isEnglish ? "Switch language" : "언어 변경"}
        title="Switch language"
      >
        <Languages size={14} aria-hidden />
        <span>{language.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={switchToNextLanguage}
      className="inline-flex h-10 min-w-[86px] items-center justify-center gap-1.5 rounded-full bg-secondary px-3 text-[12px] font-semibold text-foreground transition-opacity hover:opacity-90"
      aria-label={isEnglish ? "Switch language" : "언어 변경"}
      title="Switch language"
    >
      <span>{language.toUpperCase()}</span>
    </button>
  );
}
