import { ChevronLeft, Search } from 'lucide-react'
import { useLanguageContext } from '@/contexts/LanguageContext'
import { CurationFallback } from '@/shared/ui/CurationFallback'
import { useNavigate } from 'react-router-dom'

export default function PatternCurationPage() {
  const navigate = useNavigate()
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  const ART_TABS = [
    { label: '프렌치', active: true },
    { label: '마블', active: false },
    { label: '체크', active: false },
    { label: '그라데이션', active: false },
    { label: '트위드', active: false },
  ]

  const BEST_ARTS = ['심플 피치 마블', '겨울 파스텔 마블 풀...', '소라 마블 자개']

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between bg-background px-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-2 p-2 text-gray-800"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-bold tracking-tight text-gray-900">
          아트 & 패턴 트렌드
        </h1>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="-mr-2 p-2 text-gray-800"
          aria-label="검색"
        >
          <Search size={22} strokeWidth={2} />
        </button>
      </header>

      <main className="mt-4 px-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold tracking-tight text-gray-900">
            아트별 모아보기
          </h2>
          <button type="button" className="text-[12px] font-medium text-gray-500">
            전체보기 {">"}
          </button>
        </div>
        <div className="min-w-0 -mx-5 mb-6 flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden">
          {ART_TABS.map((tab, idx) => (
            <div key={idx} className="flex shrink-0 flex-col items-center gap-2">
              <div
                className={`flex h-[64px] w-[64px] items-center justify-center rounded-full ${tab.active ? 'border-[2.5px] border-orange-500' : 'border border-transparent'}`}
              >
                <div className="h-[56px] w-[56px] overflow-hidden rounded-full bg-gray-200 shadow-sm" />
              </div>
              <span
                className={`text-[13px] ${tab.active ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}
              >
                {tab.label}
              </span>
            </div>
          ))}
        </div>

        <div className="relative mb-12 aspect-[3/4] w-full overflow-hidden rounded-[20px] shadow-md">
          <CurationFallback isEnglish={isEnglish} />
        </div>

        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold tracking-tight text-gray-900">
              지금 가장 핫한 마블 BEST
            </h2>
            <button type="button" className="text-[12px] font-medium text-gray-500">
              전체보기 {">"}
            </button>
          </div>
          <div className="min-w-0 -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden">
            {BEST_ARTS.map((title, i) => (
              <div key={i} className="flex min-w-[130px] flex-col gap-2">
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-gray-200 shadow-sm" />
                <span className="truncate px-1 text-center text-[13px] font-medium text-gray-800">
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold tracking-tight text-gray-900">
              실시간 인기 아트 네일
            </h2>
            <button type="button" className="text-[12px] font-medium text-gray-500">
              전체보기 {">"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex w-full flex-col gap-2">
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-gray-200 shadow-sm" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
