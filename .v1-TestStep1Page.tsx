import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const nailLengthOptions = [
  {
    label: "짧은 손톱",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=80",
  },
  {
    label: "중간 길이",
    image: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=900&q=80",
  },
  {
    label: "긴 손톱",
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=900&q=80",
  },
];

const handTypeOptions = ["손가락이 짧은 편"];
const handTypeOptionsRest = ["손가락이 긴 편", "손이 통통한 편", "손이 마른 편"];
const allHandTypes = [...handTypeOptions, ...handTypeOptionsRest];

const TestStep1Page = () => {
  const navigate = useNavigate();
  const [selectedLength, setSelectedLength] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const canNext = selectedLength && selectedType;

  return (
    <div
      className="max-w-md mx-auto bg-white flex flex-col overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ height: "calc(100dvh - 60px)" }}
    >
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
          <h1 className="text-base font-bold text-gray-900">퍼스널 네일 진단</h1>
          <div className="w-8" />
        </div>
        <div className="px-5 pb-3">
          <div className="flex items-center justify-end mb-2">
            <span className="text-sm font-bold text-primary">STEP 1 / 3</span>
          </div>
          <div className="h-1 bg-gray-100 w-full rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-primary rounded-full transition-all" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-32">
        <h2 className="text-lg font-bold text-gray-900 mt-4 mb-1">손톱 길이를 골라주세요</h2>
        <p className="text-sm text-gray-500 mb-4">가장 가까운 스타일을 선택하면 돼요.</p>
        <div className="grid grid-cols-3 gap-2 mb-8">
          {nailLengthOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSelectedLength(opt.label)}
              className={`rounded-2xl overflow-hidden border-2 transition-all ${
                selectedLength === opt.label ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              }`}
            >
              <img src={opt.image} alt="" className="w-full aspect-square object-cover" />
              <span className="block text-xs font-medium py-2 bg-white">{opt.label}</span>
            </button>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">손 타입은 어떤가요?</h2>
        <p className="text-sm text-gray-500 mb-3">해당하는 것을 모두 선택해도 괜찮아요.</p>
        <div className="flex flex-col gap-2">
          {allHandTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`w-full py-3 px-4 rounded-xl border text-left text-sm font-medium transition-colors ${
                selectedType === t
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </main>

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button
          type="button"
          disabled={!canNext}
          onClick={() => navigate("/test-step2")}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default TestStep1Page;
