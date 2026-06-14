import { ChevronLeft } from "lucide-react";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const INTRO_IMAGE = "/quiz/intro-main.jpg";

const TestIntroPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";

  return (
    // 🚨 족쇄 해제: max-w-md(너비 제한)를 삭제하고 w-full을 주입하여 화면 전체를 쓰도록 강제
    <div className="w-full flex min-h-[100dvh] flex-col overflow-x-hidden overflow-y-auto bg-white pb-40 font-sans">
      
      {/* 헤더: px-5 여백 */}
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-5">
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
      </header>

      <div className="flex w-full flex-1 flex-col">
        {/* 메인 콘텐츠: px-5 여백 */}
        <main className="flex w-full flex-1 flex-col px-5 pt-8 text-center">
          
          {/* 이미지 영역 */}
          <div className="relative mx-auto mb-10 mt-6 h-72 w-72">
            <div className="absolute right-4 top-0 h-56 w-56 rounded-full bg-[#E8C5B0] opacity-60" />
            <div className="absolute bottom-0 left-4 h-60 w-60 overflow-hidden rounded-full border-4 border-white">
              <img
                src={INTRO_IMAGE}
                alt="예쁜 네일 아트가 된 손"
                className="h-full w-full rounded-full object-cover object-center shadow-md"
              />
            </div>
          </div>

          {/* 텍스트 영역 */}
          <h2 className="whitespace-pre-line break-keep font-sans text-[22px] font-bold leading-snug tracking-tight text-gray-900 sm:text-[24px]">
            {isEnglish
              ? "Find Your Perfect Match"
              : "내 손에 어울리는\n네일 디자인을 찾아보세요"}
          </h2>
          <p className="mt-3 whitespace-pre-line break-keep font-sans text-[14px] font-medium tracking-tight text-gray-500 sm:text-[15px]">
            {isEnglish
              ? "Take a quick test to find your style"
              : "간단한 선택으로 나에게 어울리는\n퍼스널 네일을 추천해 드려요"}
          </p>

          {/* 🚨 베이지색 안내 박스: max-w-sm(너비 제한) 삭제 및 w-full 적용으로 좌우 꽉 차게 뻗음 */}
          <div className="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#FFF7F2] px-5 py-6">
            <div className="flex flex-col items-start gap-y-3.5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[18px] leading-none" aria-hidden>✨</span>
                <span className="font-sans text-[14px] font-medium tracking-tight text-gray-800 sm:text-[15px]">
                  {isEnglish ? "Just 3 seconds! Quick custom diagnosis" : "딱 3초! 초간단 맞춤 진단"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[18px] leading-none" aria-hidden>🤌</span>
                <span className="font-sans text-[14px] font-medium tracking-tight text-gray-800 sm:text-[15px]">
                  {isEnglish ? "Perfect analysis of hand type & tone" : "내 손 타입/톤 완벽 분석"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[18px] leading-none" aria-hidden>🎨</span>
                <span className="font-sans text-[14px] font-medium tracking-tight text-gray-800 sm:text-[15px]">
                  {isEnglish ? "Trendy nail recommendations for you" : "나만의 트렌드 네일 추천"}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 하단 바: w-full 및 좌우 px-5 여백 통일 */}
      <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 mx-auto w-full max-w-md bg-white px-5 py-4 pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => navigate("/test-step1")}
          className="h-14 w-full flex-shrink-0 rounded-xl bg-[#FF7D66] px-4 py-4 font-sans text-[16px] font-bold text-white shadow-lg shadow-[#FF7D66]/30 transition-transform active:scale-95"
        >
          {isEnglish ? "Start Test" : "테스트 시작"}
        </button>
      </div>

    </div>
  );
};

export default TestIntroPage;
