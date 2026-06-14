import { useEffect } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const recommendedNails = [
  {
    title: "복숭아 시럽 퐁당, 골드 마블",
    likes: "❤️ 3.9k",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1200&q=80",
  },
  {
    title: "고급스러운 리얼 대리석",
    likes: "❤️ 2.6k",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=80",
  },
  {
    title: "은은한 누드 글로시 프렌치",
    likes: "❤️ 4.1k",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=1200&q=80",
  },
  {
    title: "시크한 블랙 라인 포인트",
    likes: "❤️ 1.8k",
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=1200&q=80",
  },
];

const TestResultPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-gray-50 pb-36">
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
          className="p-1 text-gray-700"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="whitespace-nowrap text-lg font-bold text-gray-900">진단 결과</h1>
        <button type="button" aria-label="공유하기" className="p-1 text-gray-700">
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 px-4 pb-6">
        <h2 className="mt-8 text-center text-2xl font-bold text-gray-900">당신에게 어울리는 네일</h2>
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center justify-center rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-500">
            ✨ Elevated &amp; Elegant Style
          </span>
        </div>

        <div className="mb-8 mt-6 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
          <p className="mb-2 text-sm font-bold text-orange-500">✨ 추천 이유</p>
          <p className="text-sm leading-relaxed text-gray-700">
            고객님의 손 타입을 보완하면서도 선택하신 무드와 컬러에 완벽하게 어울리는 맞춤형 디자인입니다. 세로 라인 디테일이
            손을 더욱 슬림하고 우아하게 돋보이게 합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {recommendedNails.map((item) => (
            <button
              key={item.title}
              type="button"
              className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm"
              onClick={() => navigate("/detail/demo")}
            >
              <img src={item.image} alt="" className="aspect-[4/5] w-full object-cover" />
              <div className="p-3">
                <div className="line-clamp-2 text-sm font-bold text-gray-900">{item.title}</div>
                <div className="mt-1 text-xs text-gray-500">{item.likes}</div>
              </div>
            </button>
          ))}
        </div>
      </main>

      <div className="fixed left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-gray-100/80 bg-white px-5 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] [bottom:calc(72px+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={() => navigate("/my/saved")}
          className="w-full rounded-xl bg-[#FF7F66] py-4 text-center text-base font-bold text-white transition-opacity active:opacity-90"
        >
          내 네일 보드에 저장
        </button>
      </div>
    </div>
  );
};

export default TestResultPage;
