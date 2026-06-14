import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const styleOptions = [
  {
    label: "심플",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=80",
  },
  {
    label: "귀여운",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=1200&q=80",
  },
  {
    label: "우아한",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1200&q=80",
  },
  {
    label: "화려한",
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=1200&q=80",
  },
  {
    label: "트렌디",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80",
    fullWidth: true,
  },
];

const TestStep2Page = () => {
  const navigate = useNavigate();
  const [selectedStyle, setSelectedStyle] = useState("");

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative pb-40">
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
            <span className="text-sm font-bold text-primary">STEP 2 / 3</span>
          </div>
          <div className="h-1 bg-gray-100 w-full rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-primary rounded-full transition-all" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4">
        <h2 className="text-lg font-bold text-gray-900 mt-4 mb-1">어떤 무드가 가장 끌려요?</h2>
        <p className="text-sm text-gray-500 mb-4">하나만 골라도 충분해요.</p>

        <div className="grid grid-cols-2 gap-3">
          {styleOptions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setSelectedStyle(s.label)}
              className={`relative rounded-2xl overflow-hidden text-left ${
                s.fullWidth ? "col-span-2 aspect-[2/1]" : "aspect-square"
              } ${selectedStyle === s.label ? "ring-2 ring-primary ring-offset-2" : ""}`}
            >
              <img src={s.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white font-bold">{s.label}</span>
              {selectedStyle === s.label && (
                <span className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </button>
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100">
        <button
          type="button"
          disabled={!selectedStyle}
          onClick={() => navigate("/test-step3")}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-primary disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default TestStep2Page;
