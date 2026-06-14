import { useGalleryInfiniteQuery } from '@/entities/nail-design/api/useGalleryInfiniteQuery'
import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery'
import { useLanguageContext } from '@/contexts/LanguageContext'
import type { NailDesignRow } from '@/shared/types/database.types'
import { CurationFallback } from '@/shared/ui/CurationFallback'
import { ChevronLeft, Search } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams, type To } from 'react-router-dom'
import {
  COLOR_CURATION_TABS,
  DEFAULT_COLOR_CURATION,
} from './colorCurationTabs'

const H_SCROLLBAR_HIDE =
  "scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"

const SPRING_THEME_KEYWORDS = ['봄', '핑크', '피치', '벚꽃', '플라워', '코랄'] as const

const COLOR_CURATION_TAB_LABEL_EN: Record<string, string> = {
  '🌸 핑크': '🌸 Pink',
  '🍒 레드': '🍒 Red',
  '🤎 누드': '🤎 Nude',
  '🎨 파스텔': '🎨 Pastel',
  '🌊 블루': '🌊 Blue',
  '☁️ 화이트': '☁️ White',
  '🖤 블랙': '🖤 Black',
  '✨ 글리터': '✨ Glitter',
}

const COLOR_KEYWORD_MAPPING: Record<string, string> = {
  핑크: '핑크 분홍 피치 베이비핑크 코랄 핫핑크',
  레드: '레드 빨강 빨간색 버건디 와인 체리',
  누드: '누드 베이지 살구 스킨 투명 시럽',
  파스텔: '파스텔 연보라 연노랑 민트 소프트 마카롱',
  블루: '블루 파랑 파란색 하늘 소라 네이비 청',
  화이트: '화이트 흰색 백 아이보리 크림',
  블랙: '블랙 검정 검은색 다크 시크',
  글리터: '글리터 펄 은박 금박 반짝이 홀로그램 자석',
  전체: '핑크 레드 누드 파스텔 블루 화이트 블랙 글리터',
}

function extractPureThemeKeyword(raw: string | null): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveColorIndex(searchParams: URLSearchParams): number {
  const raw = searchParams.get('color') ?? searchParams.get('tab')
  const pure = extractPureThemeKeyword(raw)
  const idx = COLOR_CURATION_TABS.findIndex(
    (tab) =>
      tab.value === pure ||
      tab.label === raw ||
      extractPureThemeKeyword(tab.label) === pure,
  )
  return idx >= 0 ? idx : 0
}

function itemFieldIncludesKeyword(
  value: string | string[] | null | undefined,
  keyword: string,
): boolean {
  const needle = keyword.trim()
  if (!needle) return false
  if (Array.isArray(value)) {
    return value.some((part) => String(part ?? '').includes(needle))
  }
  return String(value ?? '').includes(needle)
}

function itemMatchesKeywords(item: NailDesignRow, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => {
    if (itemFieldIncludesKeyword(item.color, keyword)) return true
    if (itemFieldIncludesKeyword(item.mood, keyword)) return true
    if (itemFieldIncludesKeyword(item.category, keyword)) return true
    if (itemFieldIncludesKeyword(item.title, keyword)) return true
    if (itemFieldIncludesKeyword(item.title_en ?? '', keyword)) return true
    if (itemFieldIncludesKeyword(item.tags ?? [], keyword)) return true
    if (itemFieldIncludesKeyword(item.situations ?? [], keyword)) return true
    if (itemFieldIncludesKeyword(item.styles ?? [], keyword)) return true
    if (itemFieldIncludesKeyword(item.nail_length, keyword)) return true
    if (itemFieldIncludesKeyword(item.design_elements, keyword)) return true
    return false
  })
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

function detailState(item: NailDesignRow, isEnglish: boolean) {
  return {
    initialNailData: {
      id: item.id,
      imageUrl: item.image_url,
      title: displayItemTitle(item, isEnglish),
      color: item.color ?? '',
      mood: item.mood ?? '',
    },
  }
}

function displayColorTabLabel(label: string, isEnglish: boolean): string {
  return isEnglish ? COLOR_CURATION_TAB_LABEL_EN[label] ?? label : label
}

function EmptyPreviewCards({
  count,
  variant,
}: {
  count: number
  variant: 'carousel' | 'grid'
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`color-curation-empty-${variant}-${index}`}
          className={
            variant === 'carousel'
              ? 'flex w-40 shrink-0 flex-col gap-2'
              : 'flex flex-col gap-2'
          }
          aria-hidden
        >
          <div
            className={
              variant === 'carousel'
                ? 'aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100'
                : 'aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100'
            }
          />
        </div>
      ))}
    </>
  )
}

function HorizontalPreviewSection({
  title,
  viewAllTo,
  items,
  ariaLabel,
  isEnglish,
}: {
  title: string
  viewAllTo: To
  items: readonly NailDesignRow[]
  ariaLabel: string
  isEnglish: boolean
}) {
  const viewAllLabel = isEnglish ? 'View All >' : '전체보기 >'

  return (
    <section className="mb-0 mt-12 px-5" aria-label={ariaLabel}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">{title}</h2>
        <Link to={viewAllTo} className="text-sm text-gray-500">
          {viewAllLabel}
        </Link>
      </div>
      <div className="-mx-5 min-w-0 flex snap-x snap-mandatory gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.id}
              to={`/detail/${item.id}`}
              state={detailState(item, isEnglish)}
              className="flex w-40 shrink-0 flex-col gap-2"
            >
              <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={displayItemTitle(item, isEnglish)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
              </div>
              <p className="truncate text-center text-[13px] text-gray-800">
                {displayItemTitle(item, isEnglish)}
              </p>
            </Link>
          ))
        ) : (
          <EmptyPreviewCards count={4} variant="carousel" />
        )}
      </div>
    </section>
  )
}

/**
 * V1 `ColorPage.tsx` 큐레이션 서브 홈 — 기존 UI에 추천 허브 실데이터를 연결한다.
 */
export default function ClientColorCurationPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabContainerRef = useRef<HTMLElement | null>(null)
  const { data: hubData = [] } = useRecommendHubQuery()
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  const activeIdx = useMemo(
    () => resolveColorIndex(searchParams),
    [searchParams],
  )
  const currentColor =
    COLOR_CURATION_TABS[activeIdx]?.value ?? DEFAULT_COLOR_CURATION
  const currentTabSearch = `?tab=${encodeURIComponent(currentColor)}`

  const colorListHref: To = {
    pathname: '/color-list',
    search: currentTabSearch,
  }
  const colorThemeListHref: To = {
    pathname: '/color-theme-list',
  }
  const colorPopularListHref: To = {
    pathname: '/color-popular-list',
  }

  const heroQueryKeyword = COLOR_KEYWORD_MAPPING[currentColor] ?? currentColor
  const { data: heroData } = useGalleryInfiniteQuery(heroQueryKeyword, '인기순')
  const heroNail = heroData?.pages[0]?.[0]
  const themeItems = useMemo(
    () =>
      hubData
        .filter((item) => itemMatchesKeywords(item, SPRING_THEME_KEYWORDS))
        .slice(0, 4),
    [hubData],
  )
  const popularItems = useMemo(
    () =>
      [...hubData]
        .sort((a, b) => {
          const aScore = Number(a.popularity ?? 0) + Number(a.views ?? 0)
          const bScore = Number(b.popularity ?? 0) + Number(b.views ?? 0)
          return bScore - aScore
        })
        .slice(0, 4),
    [hubData],
  )

  const setColorTab = (idx: number) => {
    const next = COLOR_CURATION_TABS[idx]
    if (!next) return
    setSearchParams({ tab: next.value }, { replace: true })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const el = tabContainerRef.current?.querySelector(
        '[data-active-tab="true"]',
      )
      el?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [activeIdx])

  const viewAllLabel = isEnglish ? 'View All >' : '전체보기 >'

  return (
    <div className="relative w-full bg-[#FDFBF7]">
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
          {isEnglish ? 'Recommended Color Nails' : '추천 컬러 네일'}
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
        <section className="mb-0 mt-6 px-5" aria-label={isEnglish ? 'View by Color' : '컬러별 모아보기'}>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? 'View by Color' : '컬러별 모아보기'}
            </h2>
            <Link to={colorListHref} className="text-sm text-gray-500">
              {viewAllLabel}
            </Link>
          </div>

          <nav
            ref={tabContainerRef}
            className={`min-w-0 mb-4 flex w-full flex-nowrap gap-2 overflow-x-auto border-b border-gray-100 px-4 pb-0 ${H_SCROLLBAR_HIDE}`}
            aria-label={isEnglish ? 'Color' : '컬러'}
          >
            {COLOR_CURATION_TABS.map((tab, idx) => {
              const isActive = idx === activeIdx
              return (
                <button
                  key={tab.value}
                  type="button"
                  data-active-tab={isActive ? 'true' : 'false'}
                  onClick={() => setColorTab(idx)}
                  className="group relative flex shrink-0 flex-col items-center justify-center px-1 pb-2"
                >
                  <span
                    className={`whitespace-nowrap text-[14px] ${
                      isActive
                        ? 'font-bold text-gray-900'
                        : 'font-medium text-gray-500'
                    }`}
                  >
                    {displayColorTabLabel(tab.label, isEnglish)}
                  </span>
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                      isActive ? 'bg-black' : 'bg-transparent'
                    }`}
                  />
                </button>
              )
            })}
            <div className="w-10 shrink-0" aria-hidden="true" />
          </nav>

          <Link
            to={heroNail ? `/detail/${heroNail.id}` : '#'}
            state={heroNail ? detailState(heroNail, isEnglish) : undefined}
            onClick={(e) => {
              if (!heroNail) e.preventDefault()
            }}
            className="relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-xl sm:aspect-[4/5]"
            aria-disabled={!heroNail}
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
          </Link>
        </section>

        <HorizontalPreviewSection
          title={isEnglish ? 'Spring Hits, Cherry Blossom Pink & Peach' : '올봄을 강타한, 벚꽃 핑크 & 피치'}
          viewAllTo={colorThemeListHref}
          items={themeItems}
          ariaLabel={isEnglish ? 'Spring hits recommendation' : '특정 테마 추천'}
          isEnglish={isEnglish}
        />

        <section
          className="mb-0 mt-12 px-5"
          aria-label={isEnglish ? 'Real-time Popular Color Nails' : '실시간 인기 컬러 네일'}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Real-time Popular Color Nails' : '실시간 인기 컬러 네일'}
            </h2>
            <Link to={colorPopularListHref} className="text-sm text-gray-500">
              {viewAllLabel}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {popularItems.length > 0 ? (
              popularItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/detail/${item.id}`}
                  state={detailState(item, isEnglish)}
                  className="flex flex-col gap-2"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={displayItemTitle(item, isEnglish)}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                  <p className="truncate text-center text-sm text-gray-800">
                    {displayItemTitle(item, isEnglish)}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyPreviewCards count={4} variant="grid" />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
