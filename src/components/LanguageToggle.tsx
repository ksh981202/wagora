import { Languages } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";

type LanguageToggleProps = {
  compact?: boolean;
};

export default function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguageContext();
  const isEnglish = language === "en";

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLanguage(language === "ko" ? "en" : "ko")}
        className="inline-flex h-10 min-w-[64px] items-center justify-center gap-1 rounded-full bg-secondary px-3 text-[12px] font-semibold text-foreground transition-opacity hover:opacity-90"
        aria-label={isEnglish ? "Switch language to Korean" : "언어를 영어로 변경"}
        title={isEnglish ? "Switch to Korean" : "Switch to English"}
      >
        <Languages size={14} aria-hidden />
        <span>{language === "ko" ? "EN" : "KO"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLanguage(language === "ko" ? "en" : "ko")}
      className="inline-flex h-10 min-w-[86px] items-center justify-center gap-1.5 rounded-full bg-secondary px-3 text-[12px] font-semibold text-foreground transition-opacity hover:opacity-90"
      aria-label={isEnglish ? "Switch language to Korean" : "언어를 영어로 변경"}
      title={isEnglish ? "Switch to Korean" : "Switch to English"}
    >
      <span>{language === "ko" ? "EN" : "KO"}</span>
    </button>
  );
}
