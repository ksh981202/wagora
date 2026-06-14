import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const colorOptions = [
  {
    id: "pink",
    name: "핑크",
    swatchClass: "bg-pink-300",
    tone: "🎀 쿨톤 추천",
    tags: "#여리여리 #러블리",
    lightBorder: true,
  },
  {
    id: "nude",
    name: "누드/베이지",
    swatchClass: "bg-[#EADDCA]",
    tone: "☀️ 웜톤 추천",
    tags: "#차분함 #오피스",
    lightBorder: true,
  },
  {
    id: "red",
    name: "레드",
    swatchClass: "bg-red-500",
    tone: "톤 타지 않음",
    tags: "#관능적 #포인트",
    lightBorder: false,
  },
  {
    id: "black",
    name: "블랙",
    swatchClass: "bg-gray-800",
    tone: "톤 타지 않음",
    tags: "#시크 #도도함",
    lightBorder: false,
  },
  {
    id: "pastel",
    name: "파스텔",
    swatchClass: "bg-gradient-to-br from-pink-200 via-purple-200 to-sky-200",
    tone: "🎀 쿨톤 추천",
    tags: "#몽환적 #유니크",
    lightBorder: true,
  },
  {
    id: "glitter",
    name: "글리터",
    swatchClass: "bg-gradient-to-br from-amber-50 via-gray-200 to-slate-300",
    tone: "화려함 끝판왕",
    tags: "#영롱함 #파티",
    lightBorder: true,
  },
] as const;

function GlassColorOrb({
  swatchClass,
  lightBorder,
  isSelected,
}: {
  swatchClass: string;
  lightBorder: boolean;
  isSelected: boolean;
}) {
  return (
    <div
      className={`relative mx-auto h-[90px] w-[90px] overflow-hidden rounded-full shadow-lg transition-[transform,box-shadow] ${
        lightBorder ? "ring-1 ring-inset ring-gray-200/90" : ""
      } ${
        isSelected
          ? "ring-2 ring-orange-400 ring-offset-[3px] ring-offset-white shadow-xl scale-[1.04]"
          : ""
      }`}
    >
      <div className={`absolute inset-0 rounded-full ${swatchClass}`} aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/35 via-transparent to-black/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[14%] top-[12%] h-[26%] w-[44%] -rotate-[40deg] rounded-[999px] bg-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[18%] top-[20%] h-[10%] w-[24%] -rotate-[40deg] rounded-[999px] bg-white/55 blur-[0.5px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[18%] right-[16%] h-[14%] w-[14%] rounded-full bg-white/25 blur-[1.5px]"
        aria-hidden
      />
    </div>
  );
}

const TestStep3Page = () => {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState("");

  const tips: Record<string, string> = {
    default:
      "평소 즐겨 입는 옷이나 자주 바르는 립스틱 색상을 떠올려보세요. 나와 가장 친숙하고 편안한 컬러가 손끝에도 잘 어울려요.",
    pink: "여리여리한 핑크는 손끝에 생기를 더해줘요.",
    nude: "차분한 누드/베이지는 데일리에 안성맞춤이에요.",
    red: "강렬한 레드는 포인트 네일로 강추예요.",
    black: "도도한 블랙은 시크한 무드를 완성해요.",
    pastel: "파스텔 톤은 부드럽고 유니크한 인상을 줘요.",
    glitter: "글리터는 특별한 날 분위기를 한껏 살려줘요.",
  };

  const tipText = selectedColor ? tips[selectedColor] ?? tips.default : tips.default;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-white pb-40">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
        <div className="flex h-14 w-full items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            className="p-1 text-gray-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="whitespace-nowrap text-lg font-bold text-gray-900">퍼스널 네일 진단</h1>
          <div className="w-8" />
        </div>
        <div className="px-5 pb-3">
          <div className="mb-2 flex items-center justify-end">
            <span className="text-sm font-bold text-primary">STEP 3 / 3</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-full rounded-full bg-primary transition-all" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-6">
        <h2 className="mt-5 whitespace-pre-line text-2xl font-bold text-gray-900">
          {"좋아하는 컬러를\n선택하세요"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">가장 끌리는 네일 컬러 칩을 골라주세요.</p>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8">
          {colorOptions.map((c) => {
            const isSelected = selectedColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(c.id)}
                className="flex w-full flex-col items-center outline-none"
              >
                <GlassColorOrb
                  swatchClass={c.swatchClass}
                  lightBorder={c.lightBorder}
                  isSelected={isSelected}
                />
                <div className="mt-3 flex w-full flex-col items-center text-center">
                  <span className="mb-1 text-[11px] text-gray-500">{c.tone}</span>
                  <span className="text-base font-bold text-gray-900">{c.name}</span>
                  <span className="mt-0.5 text-xs text-gray-400">{c.tags}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
          <p className="mb-2 flex items-center gap-1 text-sm font-bold text-orange-500">
            <span aria-hidden>💡</span>
            수석 큐레이터의 컬러 팁
          </p>
          <p className="text-sm leading-relaxed text-gray-700">{tipText}</p>
        </div>
      </main>

      <div className="fixed left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-gray-100 bg-white p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] [bottom:calc(72px+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          disabled={!selectedColor}
          onClick={() => navigate("/test-result")}
          className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          결과 보기
        </button>
      </div>
    </div>
  );
};

export default TestStep3Page;
