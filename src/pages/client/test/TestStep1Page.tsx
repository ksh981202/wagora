import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const nailLengthOptions = [
  { id: "length-short", label: "짧은 손톱", labelEn: "Short Nails", image: "/quiz/length-short.jpg" },
  { id: "length-medium", label: "중간 길이", labelEn: "Medium Length", image: "/quiz/length-medium.jpg" },
  { id: "length-long", label: "긴 손톱", labelEn: "Long Nails", image: "/quiz/length-long.jpg" },
] as const;

const handTypeOptions = [
  { id: "short-finger", label: "🌷 손가락이 짧은 편", labelEn: "🌷 Shorter Fingers" },
  { id: "long-finger", label: "🦢 손가락이 긴 편", labelEn: "🦢 Longer Fingers" },
  { id: "plump-hand", label: "☁️ 손이 통통한 편", labelEn: "☁️ Fuller Hands" },
  { id: "slim-hand", label: "🩰 손이 마른 편", labelEn: "🩰 Slim Hands" },
] as const;

const TestStep1Page = () => {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [selectedLength, setSelectedLength] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const canNext = selectedLength && selectedType;

  return (
    <div className="mx-auto flex max-w-md min-h-[100dvh] flex-col overflow-hidden bg-white pb-40 font-sans [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <div className="flex h-14 w-full items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={isEnglish ? "Go back" : "뒤로가기"}
            className="p-1 text-gray-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="min-w-0 truncate font-sans text-lg font-bold tracking-tight text-gray-900">
            {isEnglish ? "Personal Nail Diagnosis" : "퍼스널 네일 진단"}
          </h1>
          <div className="w-8" />
        </div>
        <div className="px-5 pb-3">
          <div className="mb-2 flex items-center justify-end">
            <span className="font-sans text-sm font-bold tracking-tight text-[#FF7D66]">STEP 1 / 3</span>
          </div>
          <div className="h-1 bg-gray-100 w-full rounded-full overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-[#FF7D66] transition-all" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4">
        <h2 className="mt-4 font-sans text-[18px] font-bold tracking-tight text-gray-900 sm:text-[20px]">
          {isEnglish ? "Choose your nail length" : "손톱 길이를 골라주세요"}
        </h2>
        <p className="mb-4 mt-1 font-sans text-[13px] font-medium tracking-tight text-gray-500 sm:text-[14px]">
          {isEnglish ? "Select the closest style." : "가장 가까운 스타일을 선택하면 돼요."}
        </p>
        <div className="mb-8 grid grid-cols-3 gap-2">
          {nailLengthOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedLength(opt.id)}
              className={`overflow-hidden rounded-2xl border-2 transition-all ${
                selectedLength === opt.id ? "border-[#FF7D66] ring-2 ring-[#FF7D66]/20" : "border-transparent"
              }`}
            >
              <img
                src={opt.image}
                alt=""
                className="aspect-square w-full object-cover object-center"
              />
              <span
                className={`mt-2 block bg-white py-2 text-center font-sans text-[13px] font-medium tracking-tight sm:text-[14px] ${
                  selectedLength === opt.id ? "text-[#FF7D66]" : "text-gray-800"
                }`}
              >
                {isEnglish && opt.labelEn ? opt.labelEn : opt.label}
              </span>
            </button>
          ))}
        </div>

        <h2 className="font-sans text-[18px] font-bold tracking-tight text-gray-900 sm:text-[20px]">
          {isEnglish ? "What's your hand type?" : "손 타입은 어떤가요?"}
        </h2>
        <p className="mb-4 mt-1 font-sans text-[13px] font-medium tracking-tight text-gray-500 sm:text-[14px]">
          {isEnglish ? "Please select one." : "가장 가까운 타입을 하나만 선택해 주세요."}
        </p>
        <div className="flex flex-col gap-3">
          {handTypeOptions.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`w-full rounded-xl border px-5 py-4 text-left font-sans text-[15px] font-medium tracking-tight transition-colors sm:text-[16px] ${
                selectedType === t.id
                  ? "border-[#FF7D66] bg-[#FFF7F2] text-[#FF7D66]"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              {isEnglish && t.labelEn ? t.labelEn : t.label}
            </button>
          ))}
        </div>
      </main>

      <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-gray-100 bg-white px-5 py-4 pb-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          disabled={!canNext}
          onClick={() => {
            if (selectedLength) sessionStorage.setItem("diagnosis.lengthId", selectedLength);
            if (selectedType) sessionStorage.setItem("diagnosis.handTypeId", selectedType);
            navigate("/test-step2");
          }}
          className="w-full rounded-xl bg-[#FF7D66] py-3.5 font-sans text-[16px] font-bold tracking-wide text-white shadow-lg shadow-[#FF7D66]/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isEnglish ? "Next" : "다음"}
        </button>
      </div>
    </div>
  );
};

export default TestStep1Page;
