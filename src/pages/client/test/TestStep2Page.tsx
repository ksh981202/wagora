import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const styleOptions = [
  { id: "simple", label: "심플·깔끔", labelEn: "Simple & Clean", image: "/quiz/mood-simple.jpg" },
  { id: "delicate", label: "여리여리·청순", labelEn: "Delicate & Pure", image: "/quiz/mood-delicate.jpg" },
  { id: "cute", label: "귀엽고 사랑스러운", labelEn: "Cute & Lovely", image: "/quiz/mood-cute.jpg" },
  { id: "elegant", label: "우아·고급스러운", labelEn: "Elegant & Luxe", image: "/quiz/mood-elegant.jpg" },
  { id: "glamorous", label: "화려한·블링블링", labelEn: "Glamorous & Sparkly", image: "/quiz/mood-glamorous.jpg" },
  { id: "unique", label: "유니크·힙한", labelEn: "Unique & Hip", image: "/quiz/mood-unique.jpg" },
] as const;

const MOOD_CURATOR_TIP_DEFAULT =
  "평소 즐겨 입는 옷이나 자주 바르는 립스틱 색상을 떠올려보세요. 나와 가장 친숙하고 편안한 무드가 손끝에도 잘 어울려요.";
const MOOD_CURATOR_TIP_DEFAULT_EN =
  "Think of the outfits you love or the lipstick shades you reach for most. The mood that feels most natural to you will also suit your fingertips.";

const MOOD_CURATOR_TIPS: Record<(typeof styleOptions)[number]["id"], { ko: string; en: string }> = {
  simple: {
    ko: "깔끔한 셔츠나 슬랙스를 즐겨 입는다면, 군더더기 없는 심플 네일이 단정하고 세련된 인상을 완성해 줄 거예요.",
    en: "If you love crisp shirts or slacks, a clean and simple nail look will complete a polished impression.",
  },
  delicate: {
    ko: "파스텔톤 블라우스나 원피스를 좋아하시나요? 은은하게 비치는 시럽 네일이 맑고 청순한 분위기를 극대화해 줍니다.",
    en: "If you like pastel blouses or dresses, sheer syrup nails will enhance a soft and pure mood.",
  },
  cute: {
    ko: "아기자기한 소품이나 캐주얼 룩을 즐긴다면, 귀여운 포인트가 들어간 네일로 일상에 기분 좋은 활력을 더해보세요.",
    en: "If you enjoy playful accessories or casual looks, cute accent nails can add cheerful energy to your day.",
  },
  elegant: {
    ko: "트위드 자켓이나 격식 있는 자리를 자주 간다면, 진주나 은은한 펄이 더해진 우아한 네일이 완벽한 매치입니다.",
    en: "For tweed jackets or formal occasions, elegant nails with pearls or subtle shimmer are a perfect match.",
  },
  glamorous: {
    ko: "포인트 액세서리나 시선을 사로잡는 룩을 즐긴다면, 빛나는 스톤과 파츠가 완벽한 주인공으로 만들어 줄 거예요.",
    en: "If you love statement accessories or eye-catching outfits, sparkling stones and charms will make your nails the star.",
  },
  unique: {
    ko: "트렌디한 스트릿 룩이나 나만의 개성을 중시한다면, 메탈이나 감각적인 드로잉이 들어간 힙한 네일로 개성을 뽐내보세요.",
    en: "If you value street style or individuality, show your personality with metallic details or artsy drawings.",
  },
};

const TestStep2Page = () => {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [selectedStyle, setSelectedStyle] = useState("");

  const curatorTip =
    selectedStyle && selectedStyle in MOOD_CURATOR_TIPS
      ? MOOD_CURATOR_TIPS[selectedStyle as keyof typeof MOOD_CURATOR_TIPS]
      : { ko: MOOD_CURATOR_TIP_DEFAULT, en: MOOD_CURATOR_TIP_DEFAULT_EN };
  const curatorTipBody = isEnglish ? curatorTip.en : curatorTip.ko;

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col overflow-x-hidden bg-white pb-40 font-sans">
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
            <span className="font-sans text-sm font-bold tracking-tight text-[#FF7D66]">STEP 2 / 3</span>
          </div>
          <div className="h-1 bg-gray-100 w-full rounded-full overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-[#FF7D66] transition-all" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4">
        <h2 className="mt-4 font-sans text-[18px] font-bold tracking-tight text-gray-900 sm:text-[20px]">
          {isEnglish ? "What mood do you prefer?" : "어떤 무드를 선호하나요?"}
        </h2>
        <p className="mb-5 mt-1 font-sans text-[13px] font-medium tracking-tight text-gray-500 sm:text-[14px]">
          {isEnglish ? "Choose the mood closest to your taste." : "내 취향에 가장 가까운 무드를 하나 골라주세요."}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {styleOptions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedStyle(s.id)}
              className={`relative aspect-square overflow-hidden rounded-2xl text-left ${
                selectedStyle === s.id ? "ring-2 ring-[#FF7D66]" : ""
              }`}
            >
              <img
                src={s.image}
                alt=""
                className="w-full h-full object-cover object-center"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/2 bg-gradient-to-t from-black/65 via-black/25 to-transparent"
                aria-hidden
              />
              <span className="absolute bottom-3 left-3 z-10 max-w-[85%] font-sans text-[16px] font-bold leading-snug tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:text-[18px]">
                {isEnglish && s.labelEn ? s.labelEn : s.label}
              </span>
              {selectedStyle === s.id && (
                <span className="absolute top-2 right-2 rounded-full border border-[#FF7D66] bg-[#FF7D66] p-1 text-white">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 w-full rounded-2xl border border-orange-100 bg-orange-50 p-5">
          <div className="mb-2 flex items-center gap-2 font-sans text-[15px] font-bold text-orange-500">
            <span aria-hidden>💡</span>
            {isEnglish ? "Chief Curator's Mood Tip" : "수석 큐레이터의 무드 팁"}
          </div>
          <p className="break-keep font-sans text-[14px] font-medium leading-relaxed tracking-tight text-gray-700">
            {curatorTipBody}
          </p>
        </div>
      </main>

      <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-gray-100 bg-white px-5 py-4 pb-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          disabled={!selectedStyle}
          onClick={() => {
            if (selectedStyle) sessionStorage.setItem("diagnosis.moodId", selectedStyle);
            navigate("/test-step3");
          }}
          className="w-full rounded-xl bg-[#FF7D66] py-3.5 font-bold text-white shadow-lg shadow-[#FF7D66]/30 disabled:opacity-40"
        >
          {isEnglish ? "Next" : "다음"}
        </button>
      </div>
    </div>
  );
};

export default TestStep2Page;
