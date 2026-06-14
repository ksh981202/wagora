import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const COLOR_OPTIONS = [
  {
    id: "pink",
    titleKo: "핑크",
    titleEn: "Pink",
    toneKo: "🎀 쿨톤 추천",
    toneEn: "🎀 Cool Tone",
    tagsKo: "#여리여리 #러블리",
    tagsEn: "#Delicate #Lovely",
    src: "/color/color-pink.png",
  },
  {
    id: "nude",
    titleKo: "누드/베이지",
    titleEn: "Nude/Beige",
    toneKo: "🌞 웜톤 추천",
    toneEn: "🌞 Warm Tone",
    tagsKo: "#차분함 #오피스",
    tagsEn: "#Calm #OfficeLook",
    src: "/color/color-nude.png",
  },
  {
    id: "red",
    titleKo: "레드/버건디",
    titleEn: "Red/Burgundy",
    toneKo: "🍓 매혹적인 포인트",
    toneEn: "🍓 Glamorous Point",
    tagsKo: "#치명적 #섹시 #포인트",
    tagsEn: "#Chic #Sexy #Point",
    src: "/color/color-red.png",
  },
  {
    id: "black",
    titleKo: "블랙/다크",
    titleEn: "Black/Dark",
    toneKo: "🕶 시크한 매력",
    toneEn: "🕶 Moody & Chic",
    tagsKo: "#시크 #도도 #걸크러쉬",
    tagsEn: "#Chic #Bold #GirlCrush",
    src: "/color/color-black.png",
  },
  {
    id: "pastel",
    titleKo: "파스텔",
    titleEn: "Pastel",
    toneKo: "🌸 몽글몽글 수채화",
    toneEn: "🌸 Soft Pastel",
    tagsKo: "#몽환적 #유니크",
    tagsEn: "#Dreamy #Unique",
    src: "/color/color-pastel.png",
  },
  {
    id: "glitter",
    titleKo: "글리터",
    titleEn: "Glitter",
    toneKo: "💎 화려한 끝판왕",
    toneEn: "💎 Fancy Glitter",
    tagsKo: "#영롱 #반짝반짝 #시선집중",
    tagsEn: "#Sparkle #Blings #Glam",
    src: "/color/color-glitter.png",
  },
];

const COLOR_TIPS: Record<string, { ko: string; en: string }> = {
  pink: {
    ko: "여리여리한 핑크는 손끝에 생기를 더해줘요.",
    en: "Delicate pink adds a subtle, lovely vitality to your fingertips.",
  },
  nude: {
    ko: "차분한 누드/베이지는 데일리에 안성맞춤이에요.",
    en: "Calm nude and beige colors are perfect for your daily look.",
  },
  red: {
    ko: "강렬한 레드는 포인트 네일로 강추예요.",
    en: "Intense red is highly recommended as a statement point color.",
  },
  black: {
    ko: "도도한 블랙은 시크한 무드를 완성해요.",
    en: "Bold black perfectly completes a sleek, chic mood.",
  },
  pastel: {
    ko: "파스텔 톤은 부드럽고 유니크한 인상을 줘요.",
    en: "Soft pastel tones give a gentle yet unique impression.",
  },
  glitter: {
    ko: "글리터는 특별한 날 분위기를 한껏 살려줘요.",
    en: "Glitter instantly elevates your vibe for any special occasion.",
  },
  default: {
    ko: "평소 즐겨 입는 옷이나 자주 바르는 립스틱 색상을 떠올려보세요. 나와 가장 친숙하고 편안한 컬러가 손끝에도 잘 어울려요.",
    en: "Think of the clothes you love to wear or your favorite lipstick shade. The colors you feel most comfortable with will naturally look best on your nails.",
  },
};

export default function TestStep3Page() {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { language } = useLanguageContext();
  const isEnglish = language === "en";

  const currentTip = selectedColor ? COLOR_TIPS[selectedColor] : COLOR_TIPS.default;
  const tipText = isEnglish ? currentTip.en : currentTip.ko;

  return (
    <div className="relative mx-auto flex h-full min-h-[100dvh] w-full flex-col overflow-y-scroll overflow-x-hidden box-border bg-white pb-40 font-sans">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white w-full">
        <div className="flex h-14 w-full items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
            <span className="font-sans text-sm font-bold tracking-tight text-[#FF826E]">STEP 3 / 3</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-full rounded-full bg-[#FF826E] transition-all" />
          </div>
        </div>
      </header>

      <main className="box-border w-full flex-1 px-5 pt-8">
        <h2 className="mb-1 whitespace-pre-line font-sans text-[20px] font-bold leading-snug tracking-tight text-gray-900 sm:text-[22px]">
          {isEnglish ? "Choose a color you like" : "끌리는 컬러를 선택해주세요"}
        </h2>
        <p className="mb-8 mt-2 font-sans text-[13px] font-medium tracking-tight text-gray-500 sm:text-[14px]">
          {isEnglish
            ? "Please choose the nail color chip that attracts you the most."
            : "가장 끌리는 네일 컬러 칩을 골라주세요."}
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 w-full box-border">
          {COLOR_OPTIONS.map((color) => {
            const isSelected = selectedColor === color.id;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColor(color.id)}
                className="group flex w-full flex-col items-center outline-none relative box-border"
              >
                <div className="relative mx-auto mb-3 flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-transparent sm:h-28 sm:w-28 shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                    <img
                      src={color.src}
                      alt={isEnglish ? color.titleEn : color.titleKo}
                      className="h-full w-full object-cover object-center transition-transform duration-200"
                    />
                  </div>

                  <div
                    className={`pointer-events-none absolute inset-0 z-20 rounded-full border-[3.5px] border-[#FF826E] box-border transition-opacity duration-150 ${
                      isSelected ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <span
                    className={`absolute right-0 -top-1 z-30 flex items-center justify-center rounded-full bg-[#FF826E] p-1 text-white shadow-sm transition-opacity duration-150 ${
                      isSelected ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
                  </span>
                </div>

                <div className="flex w-full flex-col items-center text-center">
                  <p className="mt-1 rounded-full bg-gray-100 px-3 py-0.5 font-sans text-[11px] font-semibold tracking-tight text-gray-600 sm:text-[12px]">
                    {isEnglish ? color.toneEn : color.toneKo}
                  </p>
                  <p className="mt-1 font-sans text-[16px] font-bold tracking-tight text-gray-900 sm:text-[17px]">
                    {isEnglish ? color.titleEn : color.titleKo}
                  </p>
                  <p className="mt-0.5 font-sans text-[12px] font-medium tracking-tight text-gray-400 sm:text-[13px]">
                    {isEnglish ? color.tagsEn : color.tagsKo}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
          <p className="mb-2 flex items-center gap-1 font-sans text-[15px] font-bold tracking-tight text-[#FF826E]">
            <span aria-hidden>💡</span>
            {isEnglish ? "Chief Curator's Color Tip" : "수석 큐레이터의 컬러 팁"}
          </p>
          <p className="break-keep font-sans text-[14px] font-medium leading-relaxed tracking-tight text-gray-700">
            {tipText}
          </p>
        </div>
      </main>

      <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 mx-auto w-full max-w-md bg-white px-5 py-4 pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          disabled={!selectedColor}
          onClick={() => {
            if (selectedColor) sessionStorage.setItem("diagnosis.colorId", selectedColor);
            navigate("/test-result");
          }}
          className="h-[56px] w-full shrink-0 rounded-xl bg-[#FF7D66] font-sans text-[16px] font-bold tracking-tight text-white shadow-lg shadow-[#FF7D66]/30 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isEnglish ? "View Results" : "결과 보기"}
        </button>
      </div>
    </div>
  );
}
