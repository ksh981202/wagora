import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery'
import { useLanguageContext } from '@/contexts/LanguageContext'
import type { NailDesignRow } from '@/shared/types/database.types'
import { CurationFallback } from '@/shared/ui/CurationFallback'
import { ChevronLeft, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const SEASON_TABS = ['🌸 봄', '🌊 여름', '🍁 가을', '❄️ 겨울'] as const

const SEASON_KEYS = ['봄', '여름', '가을', '겨울'] as const

const SEASON_TAB_LABEL_EN: Record<(typeof SEASON_TABS)[number], string> = {
  '🌸 봄': '🌸 Spring',
  '🌊 여름': '🌊 Summer',
  '🍁 가을': '🍁 Autumn',
  '❄️ 겨울': '❄️ Winter',
}

const SEASON_BASE_KEYWORD_MAPPING: Record<string, string> = {
  봄: '봄 spring 스프링 파스텔 웜톤 화사한 생화',
  여름: '여름 summer 썸머 바다 휴양지 바캉스 네온 실버',
  가을: '가을 autumn 아텀 폴 fall 딥톤 버건디 호피',
  겨울: '겨울 winter 윈터 눈 연말 파티 크리스마스 니트 쿨톤',
}

const VACATION_KEYWORDS = ['바캉스', '휴양지', '여행', '여름'] as const

function extractPureSeasonKeyword(raw: string | null): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveSeasonIndex(rawTab: string | null): number {
  const pure = extractPureSeasonKeyword(rawTab)
  const index = SEASON_KEYS.findIndex((season) => season === pure)
  return index >= 0 ? index : 0
}

function resolveSeasonKeywords(season: string): string[] {
  const raw = SEASON_BASE_KEYWORD_MAPPING[season] ?? season
  return Array.from(
    new Set(
      raw
        .split(/\s+/)
        .map((keyword) => extractPureSeasonKeyword(keyword))
        .filter(Boolean),
    ),
  )
}

function itemFieldIncludesKeyword(value: string | string[] | null | undefined, keyword: string): boolean {
  const needle = String(keyword ?? '').trim().toLowerCase()
  if (!needle) return false
  if (Array.isArray(value)) {
    return value.some((part) => String(part ?? '').toLowerCase().includes(needle))
  }
  return String(value ?? '').toLowerCase().includes(needle)
}

function itemMatchesKeywords(item: NailDesignRow, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => {
    if (itemFieldIncludesKeyword(item.category, keyword)) return true
    if (itemFieldIncludesKeyword(item.title, keyword)) return true
    if (itemFieldIncludesKeyword(item.title_en ?? '', keyword)) return true
    if (itemFieldIncludesKeyword(item.color, keyword)) return true
    if (itemFieldIncludesKeyword(item.mood, keyword)) return true
    if (itemFieldIncludesKeyword(item.design_elements, keyword)) return true
    if (itemFieldIncludesKeyword(item.tags ?? [], keyword)) return true
    if (itemFieldIncludesKeyword(item.situations ?? [], keyword)) return true
    if (itemFieldIncludesKeyword(item.styles ?? [], keyword)) return true
    return false
  })
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

function displaySeasonTabLabel(label: (typeof SEASON_TABS)[number], isEnglish: boolean): string {
  return isEnglish ? SEASON_TAB_LABEL_EN[label] : label
}

export default function ClientSeasonCurationPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: hubData = [] } = useRecommendHubQuery()
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  const viewAllLabel = isEnglish ? 'View All >' : '전체보기 >'
  const activeIdx = resolveSeasonIndex(searchParams.get('tab'))
  const currentSeason = SEASON_KEYS[activeIdx] ?? SEASON_KEYS[0]
  const currentTabSearch = `?tab=${encodeURIComponent(currentSeason)}`
  const seasonPopularSearch = `?season=${encodeURIComponent(currentSeason)}&tab=${encodeURIComponent(currentSeason)}`
  const seasonKeywords = useMemo(() => resolveSeasonKeywords(currentSeason), [currentSeason])

  const seasonItems = useMemo(
    () => hubData.filter((item) => itemMatchesKeywords(item, seasonKeywords)),
    [hubData, seasonKeywords],
  )
  const heroNail = seasonItems[0]
  const vacationItems = useMemo(
    () => hubData.filter((item) => itemMatchesKeywords(item, VACATION_KEYWORDS)).slice(0, 4),
    [hubData],
  )
  const popularItems = useMemo(() => seasonItems.slice(0, 4), [seasonItems])

  const setSeasonTab = (season: string) => {
    setSearchParams({ tab: season }, { replace: true })
  }

  const goDetail = (item?: NailDesignRow) => {
    if (!item?.id) return
    navigate(`/detail/${item.id}`, {
      state: {
        initialNailData: {
          id: item.id,
          imageUrl: item.image_url,
          title: displayItemTitle(item, isEnglish),
          color: '',
          mood: '',
        },
      },
    })
  }

  return (
    <div className="relative w-full bg-white">
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between bg-white/95 px-5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
          className="-ml-2 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </button>

        <h1 className="pointer-events-none absolute left-1/2 max-w-[min(100%-5rem,18rem)] -translate-x-1/2 truncate text-center text-lg font-bold tracking-tight text-gray-900">
          {isEnglish ? 'Seasonal Custom Nails' : '계절별 맞춤 네일'}
        </h1>

        <Link
          to="/gallery"
          className="-mr-2 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
          aria-label={isEnglish ? 'Search' : '검색'}
        >
          <Search className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </Link>
      </header>

      <main className="px-0 pb-8">
        <section className="mb-0 mt-6 px-5" aria-label={isEnglish ? 'View by Season' : '시즌별 모아보기'}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? 'View by Season' : '시즌별 모아보기'}
            </h2>
            <Link
              to={{ pathname: '/season-list', search: currentTabSearch }}
              className="text-sm text-gray-500"
            >
              {viewAllLabel}
            </Link>
          </div>

          <nav
            className="mb-4 grid w-full grid-cols-4 items-center border-b border-gray-100 px-1 sm:px-4"
            aria-label={isEnglish ? 'Season' : '시즌'}
          >
            {SEASON_TABS.map((t, idx) => {
              const isActive = idx === activeIdx
              return (
                <button
                  key={t}
                  type="button"
                  data-active-tab={isActive ? 'true' : 'false'}
                  onClick={() => setSeasonTab(SEASON_KEYS[idx] ?? SEASON_KEYS[0])}
                  className="relative flex w-full flex-col items-center justify-center pb-2"
                >
                  <span
                    className={`whitespace-nowrap text-[12px] min-[380px]:text-[13px] sm:text-[14px] ${
                      isActive
                        ? 'font-bold text-gray-900'
                        : 'font-medium text-gray-500'
                    }`}
                  >
                    {displaySeasonTabLabel(t, isEnglish)}
                  </span>
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                      isActive ? 'bg-black' : 'bg-transparent'
                    }`}
                  />
                </button>
              )
            })}
          </nav>

          <div
            className={`${heroNail ? 'cursor-pointer' : ''} relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100 sm:aspect-[4/5]`}
            role={heroNail ? 'button' : undefined}
            tabIndex={heroNail ? 0 : undefined}
            onClick={() => goDetail(heroNail)}
            onKeyDown={(e) => {
              if (!heroNail) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                goDetail(heroNail)
              }
            }}
          >
            {heroNail?.image_url ? (
              <img
                src={heroNail.image_url}
                alt={displayItemTitle(heroNail, isEnglish)}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <CurationFallback isEnglish={isEnglish} />
            )}
            {heroNail?.image_url ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="truncate text-lg font-bold text-white drop-shadow-md">
                    {displayItemTitle(heroNail, isEnglish)}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section
          className="mb-0 mt-12 px-5"
          aria-label={isEnglish ? 'Perfect for Vacation! Vacation Nails' : '휴양지에서 인생샷 보장! 바캉스 네일'}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Perfect for Vacation! Vacation Nails ✈️' : '휴양지에서 인생샷 보장! 바캉스 네일 ✈️'}
            </h2>
            <Link
              to={{ pathname: '/vacation-list', search: currentTabSearch }}
              className="text-sm text-gray-500"
            >
              {viewAllLabel}
            </Link>
          </div>

          <div className="-mx-5 min-w-0 flex snap-x snap-mandatory gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {vacationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goDetail(item)}
                className="flex w-40 shrink-0 flex-col gap-2 text-left"
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={item.image_url}
                    alt={displayItemTitle(item, isEnglish)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="truncate text-center text-[13px] text-gray-800">
                  {displayItemTitle(item, isEnglish)}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section
          className="mb-0 mt-12 px-5"
          aria-label={isEnglish ? 'Popular Seasonal Nails' : '내 손끝에 찰떡, 계절 인기 네일 모음'}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Popular Seasonal Nails' : '내 손끝에 찰떡, 계절 인기 네일 모음'}
            </h2>
            <Link
              to={{ pathname: '/season-popular-list', search: seasonPopularSearch }}
              className="text-sm text-gray-500"
            >
              {viewAllLabel}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {popularItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goDetail(item)}
                className="flex flex-col gap-2 text-left"
              >
                <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={item.image_url}
                    alt={displayItemTitle(item, isEnglish)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="truncate text-center text-sm text-gray-800">
                  {displayItemTitle(item, isEnglish)}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
