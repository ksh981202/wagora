import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery'
import { useLanguageContext } from '@/contexts/LanguageContext'
import type { NailDesignRow } from '@/shared/types/database.types'
import { ChevronLeft, Search } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { THEME_TAB_LABELS, type ThemeTabLabel } from './themeTabs'

/** V1 `NailOverlayTitle` 히어로 제목 */
const NAIL_HERO_BANNER_TITLE_CLASS =
  'text-white font-sans text-lg font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]'

const OCCASION_HERO_BANNER_FRAME =
  'relative mb-0 aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-lg'

type OccasionThemeTab = {
  id: string
  label: ThemeTabLabel
  filterKeywords: string[]
}

const SITUATION_DEMO_CAPTIONS = ['🌿 데일리', '✈️ 여행', '🎉 파티'] as const

const THEME_TAB_LABEL_EN: Record<ThemeTabLabel, string> = {
  전체: 'All',
  '🌿 데일리': '🌿 Daily',
  '💖 데이트': '💖 Date',
  '💼 오피스': '💼 Office',
  '💐 하객': '💐 Guest',
  '✈️ 여행': '✈️ Travel',
  '🌴 바캉스': '🌴 Vacation',
  '🎪 페스티벌': '🎪 Festival',
  '🎉 파티': '🎉 Party',
}

const SITUATION_DEMO_CAPTION_EN: Record<(typeof SITUATION_DEMO_CAPTIONS)[number], string> = {
  '🌿 데일리': '🌿 Daily',
  '✈️ 여행': '✈️ Travel',
  '🎉 파티': '🎉 Party',
}

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const THEME_TABS: OccasionThemeTab[] = THEME_TAB_LABELS.map((label) => {
  const keyword = extractPureThemeKeyword(label)
  return {
    id: label === '전체' ? 'all' : keyword,
    label,
    filterKeywords: [keyword],
  }
})

function hubFieldIncludesKeyword(value: string, keyword: string): boolean {
  return String(value ?? '').includes(keyword)
}

function hubItemMatchesKeyword(item: NailDesignRow, keyword: string): boolean {
  const needle = keyword.trim()
  if (!needle) return false
  if (hubFieldIncludesKeyword(item.category, needle)) return true
  if (hubFieldIncludesKeyword(item.title, needle)) return true
  if ((item.tags ?? []).some((tag) => hubFieldIncludesKeyword(tag, needle))) return true
  if ((item.situations ?? []).some((situation) => hubFieldIncludesKeyword(situation, needle))) {
    return true
  }
  return false
}

function themeFilterKeywords(tab: OccasionThemeTab): string[] {
  return tab.filterKeywords.filter((k) => k !== '전체')
}

function hubItemMatchesThemeTab(item: NailDesignRow, tab: OccasionThemeTab): boolean {
  const keywords = themeFilterKeywords(tab)
  if (keywords.length === 0) return true
  return keywords.some((keyword) => hubItemMatchesKeyword(item, keyword))
}

function findFirstHubMatch(pool: NailDesignRow[], keyword: string): NailDesignRow | undefined {
  const needle = keyword.trim()
  if (!needle || pool.length === 0) return undefined
  return pool.find((item) => hubItemMatchesKeyword(item, needle))
}

function findFirstHubMatchByTab(pool: NailDesignRow[], tab: OccasionThemeTab): NailDesignRow | undefined {
  if (pool.length === 0) return undefined
  const keywords = themeFilterKeywords(tab)
  if (keywords.length === 0) return pool[0]
  return pool.find((item) => hubItemMatchesThemeTab(item, tab))
}

function nailDisplayTitle(nail: NailDesignRow | undefined, isEnglish: boolean): string | null {
  if (!nail) return null
  const en = nail.title_en?.trim()
  const ko = nail.title?.trim()
  if (isEnglish && en) return en
  return ko || en || null
}

function themeTabDisplayLabel(label: ThemeTabLabel, isEnglish: boolean): string {
  return isEnglish ? THEME_TAB_LABEL_EN[label] : label
}

function resolveThemeTabIndex(searchParams: URLSearchParams): number {
  const rawTheme = searchParams.get('theme')?.trim()
  if (rawTheme) {
    const pureTheme = extractPureThemeKeyword(rawTheme)
    const byTheme = THEME_TABS.findIndex(
      (tab) =>
        tab.label === pureTheme ||
        tab.filterKeywords.includes(rawTheme) ||
        tab.filterKeywords.includes(pureTheme),
    )
    if (byTheme >= 0) return byTheme
  }

  const rawTab = searchParams.get('tab')?.trim()
  if (rawTab) {
    const pureTab = extractPureThemeKeyword(rawTab)
    const byTab = THEME_TABS.findIndex(
      (tab) =>
        tab.label === pureTab ||
        tab.id === rawTab ||
        tab.filterKeywords.includes(rawTab) ||
        tab.filterKeywords.includes(pureTab),
    )
    if (byTab >= 0) return byTab
  }

  return 0
}

/** V1 `OccasionNailThumb` — 퍼블리싱만 (이미지 영역은 플레이스홀더) */
function OccasionNailThumbShell({
  caption,
  variant,
  imageUrl,
  onActivate,
}: {
  caption: string
  variant: 'carousel' | 'grid'
  imageUrl?: string | null
  onActivate: () => void
}) {
  const FRAME =
    'aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5'
  const CAPTION =
    'w-full min-w-0 truncate text-center text-sm font-medium tracking-tight text-gray-800'
  const CAPTION_GAP = 'mt-2'

  const outerClass =
    variant === 'carousel'
      ? 'w-32 flex-shrink-0 cursor-pointer'
      : 'flex cursor-pointer flex-col gap-0'

  const frameExtra = variant === 'carousel' ? 'bg-muted shadow-sm' : 'shadow-sm'

  return (
    <div
      className={outerClass}
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
    >
      <div className={`${FRAME} ${frameExtra}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={caption}
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-gray-100" aria-hidden />
        )}
      </div>
      <div
        className={`${CAPTION_GAP} flex w-full min-w-0 flex-col items-center justify-center`}
      >
        <span className={CAPTION}>{caption}</span>
      </div>
    </div>
  )
}

/**
 * V1 `OccasionPage.tsx` UI 이식 — `/theme`.
 */
export default function ClientPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabContainerRef = useRef<HTMLDivElement | null>(null)
  const { data: hubData = [] } = useRecommendHubQuery()
  const { language } = useLanguageContext()

  const isEnglish = language === 'en'
  const viewAllLabel = isEnglish ? 'View All >' : '전체보기 >'

  const active = resolveThemeTabIndex(searchParams)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!tabContainerRef.current) return
      const activeElement = tabContainerRef.current.querySelector(
        '[data-active-tab="true"]',
      )
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        })
      }
    }, 150)
    return () => window.clearTimeout(timer)
  }, [active])

  const tabIndex =
    active !== null && active >= 0 && active < THEME_TABS.length ? active : 0
  const activeTabDef = THEME_TABS[tabIndex]!

  const heroNail = useMemo(
    () => findFirstHubMatchByTab(hubData, activeTabDef),
    [hubData, activeTabDef],
  )

  const situationMatches = useMemo(
    () =>
      SITUATION_DEMO_CAPTIONS.map((cap) =>
        findFirstHubMatch(hubData, extractPureThemeKeyword(cap)),
      ),
    [hubData],
  )

  const galleryItems = useMemo(
    () => hubData.filter((item) => hubItemMatchesThemeTab(item, activeTabDef)).slice(0, 4),
    [hubData, activeTabDef],
  )

  const goDetail = (nail?: NailDesignRow) => {
    if (!nail?.id) return
    navigate(`/detail/${nail.id}`, {
      state: {
        initialNailData: {
          id: nail.id,
          imageUrl: nail.image_url,
          title: nailDisplayTitle(nail, isEnglish) ?? (isEnglish ? 'Nail Design' : '네일 디자인'),
          color: '',
          mood: '',
        },
      },
    })
  }

  const heroImageUrl = heroNail?.image_url?.trim() ?? null
  const heroTitle =
    nailDisplayTitle(heroNail, isEnglish) ?? (isEnglish ? 'Recommended nails' : '추천 네일')

  return (
    <div className="relative w-full bg-white">
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
          className="-ml-2 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </button>

        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-bold tracking-tight text-gray-900">
          {isEnglish
            ? 'Shining Moments, Custom Nails'
            : '빛나는 순간, 맞춤 네일'}
        </h1>

        <button
          type="button"
          aria-label={isEnglish ? 'Search' : '검색'}
          className="-mr-2 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
          onClick={() => navigate('/gallery')}
        >
          <Search className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </button>
      </header>

      <main className="px-0 pb-8">
        <div className="mb-5 mt-6 flex items-end justify-between px-5">
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            {isEnglish ? 'View by Theme' : '테마별 모아보기'}
          </h2>
          <Link
            to={`/theme-list?tab=${extractPureThemeKeyword(activeTabDef?.label || '전체')}`}
            className="cursor-pointer text-sm font-medium text-gray-500"
          >
            {viewAllLabel}
          </Link>
        </div>

        <nav
          ref={tabContainerRef}
          className="min-w-0 flex w-full flex-nowrap gap-2 overflow-x-auto whitespace-nowrap border-b border-gray-100 px-4 pb-1 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {THEME_TABS.map((tab, idx) => {
            const isActive = active === idx
            return (
              <button
                key={tab.label}
                type="button"
                data-active-tab={isActive ? 'true' : 'false'}
                onClick={() => {
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev)
                      const tabValue = extractPureThemeKeyword(tab.label)
                      if (tab.id === 'all') {
                        next.delete('tab')
                      } else {
                        next.set('tab', tabValue)
                      }
                      next.delete('theme')
                      return next
                    },
                    { replace: true },
                  )
                }}
                className={`shrink-0 px-2 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label={`${themeTabDisplayLabel(tab.label, isEnglish)} ${isEnglish ? 'tab' : '탭'}`}
              >
                {themeTabDisplayLabel(tab.label, isEnglish)}
              </button>
            )
          })}
          <div className="w-10 shrink-0" aria-hidden="true" />
        </nav>

        <section className="mb-0 mt-5 px-5" aria-label="테마 히어로">
          <div
            className={`${OCCASION_HERO_BANNER_FRAME} cursor-pointer`}
            onClick={() => goDetail(heroNail)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                goDetail(heroNail)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="absolute inset-0">
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt={heroTitle}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div
                  className="h-full w-full animate-pulse bg-gray-200"
                  aria-hidden
                />
              )}
            </div>
            <div className="absolute inset-x-5 bottom-5 z-10">
              <div className="relative z-10">
                <h2
                  className={`${NAIL_HERO_BANNER_TITLE_CLASS} truncate leading-tight`}
                >
                  {heroTitle}
                </h2>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-0 px-5">
          <div className="mb-5 mt-12 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Occasion Recommended Nails' : '상황별 추천 네일'}
            </h2>
            <Link
              to="/situation-list?tab=전체"
              className="cursor-pointer text-sm font-medium text-gray-500"
            >
              {viewAllLabel}
            </Link>
          </div>

          <section className="-mx-5 min-w-0 flex snap-x snap-mandatory gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="contents">
              {SITUATION_DEMO_CAPTIONS.map((cap, index) => {
                const nail = situationMatches[index]
                const caption =
                  nailDisplayTitle(nail, isEnglish) ?? (isEnglish ? SITUATION_DEMO_CAPTION_EN[cap] : cap)
                return (
                  <OccasionNailThumbShell
                    key={cap}
                    variant="carousel"
                    caption={caption}
                    imageUrl={nail?.image_url?.trim() ?? null}
                    onActivate={() => goDetail(nail)}
                  />
                )
              })}
            </div>
          </section>
        </div>

        <section className="mb-0 px-5">
          <div className="mb-5 mt-12 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Gallery Explore' : '갤러리 탐색'}
            </h2>
            <button
              type="button"
              className="cursor-pointer text-sm font-medium text-gray-500"
              onClick={() => navigate('/theme-list?tab=전체')}
            >
              {viewAllLabel}
            </button>
          </div>

          <div className="mb-0 grid grid-cols-2 gap-4 pb-0">
            {galleryItems.map((nail) => (
              <OccasionNailThumbShell
                key={nail.id}
                variant="grid"
                caption={nailDisplayTitle(nail, isEnglish) || (isEnglish ? 'Gallery' : '갤러리')}
                imageUrl={nail.image_url?.trim() ?? null}
                onActivate={() => goDetail(nail)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
