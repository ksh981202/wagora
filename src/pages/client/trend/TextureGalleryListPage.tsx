import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, Search } from 'lucide-react';

export default function TextureGalleryListPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-slate-900">
      {/* 상단 고정 영역 */}
      <div className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        
        {/* 헤더 */}
        <header className="relative flex h-14 w-full items-center justify-between bg-white px-5">
          <button type="button" onClick={() => navigate(-1)} className="z-10 p-2 -ml-2 transition-colors hover:bg-gray-100 rounded-full">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-gray-900 whitespace-nowrap">
            추천 갤러리
          </h1>
          <button type="button" className="z-10 p-2 -mr-2 transition-colors hover:bg-gray-100 rounded-full">
            <Search className="h-6 w-6 text-gray-900" />
          </button>
        </header>

        {/* 갤러리 서브 탭 (가로 스크롤) */}
        <section className="min-w-0 flex w-full overflow-x-auto whitespace-nowrap scrollbar-hide px-4 pb-2 pt-1 [&::-webkit-scrollbar]:hidden">
          {[
            { label: '전체', active: true },
            { label: '💧 시럽', active: false },
            { label: '☁️ 무광', active: false },
            { label: '✨ 글리터', active: false },
            { label: '🧲 자석', active: false },
            { label: '🪞 미러파우더', active: false }
          ].map((tab, idx) => (
            <button
              key={tab.label}
              type="button"
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium mr-2 ${
                idx === 0
                  ? "bg-[#ff765e] text-white" 
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="w-4 shrink-0" />
        </section>

        {/* 갯수 및 정렬 바 */}
        <div className="relative flex items-center justify-between px-4 pb-3 pt-2">
          <span className="text-sm text-gray-500">
            총 <span className="font-bold text-[#ff765e]">2,558</span>개의 디자인
          </span>
          <button type="button" className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1.5 text-sm font-medium text-gray-700">
            <span>인기순</span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* 메인 2열 그리드 (더미 데이터) */}
      <main className="grid grid-cols-2 gap-4 px-5 pt-4 pb-8">
        {[
          { id: 1, name: '하객 유니크 코랄 생화', img: 'https://picsum.photos/300/400?random=110' },
          { id: 2, name: '다크 프렌치 조개', img: 'https://picsum.photos/300/400?random=111' },
          { id: 3, name: '웨딩 핑크 조개', img: 'https://picsum.photos/300/400?random=112' },
          { id: 4, name: '올드머니 레드 시럽 글리터', img: 'https://picsum.photos/300/400?random=113' },
          { id: 5, name: '라벤더 마블 풀스톤', img: 'https://picsum.photos/300/400?random=114' },
          { id: 6, name: '발레코어 소라 치크', img: 'https://picsum.photos/300/400?random=115' }
        ].map((item) => (
          <article key={item.id} className="flex flex-col gap-2 cursor-pointer">
            <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
              <img src={item.img} alt={item.name} className="h-full w-full object-cover object-center" />
            </div>
            <div className="mt-1 flex w-full flex-col items-center justify-center px-1">
              <p className="line-clamp-2 w-full text-center text-[13px] font-bold tracking-tight text-gray-800">
                {item.name}
              </p>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
