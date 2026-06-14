import { useLanguageContext } from "@/contexts/LanguageContext";

export type AppLanguage = "ko" | "en";

/** V2 다국어 — 전역 Context/Store 연동 시 이 훅 내부만 교체 */
export function useLanguage() {
  const { language, setLanguage } = useLanguageContext();

  return {
    language,
    isEn: language === "en",
    setLanguage,
  };
}
