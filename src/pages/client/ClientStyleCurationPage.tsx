import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery'
import { useLanguageContext } from '@/contexts/LanguageContext'
import type { NailDesignRow } from '@/shared/types/database.types'
import { CurationFallback } from '@/shared/ui/CurationFallback'
import { ChevronLeft, Search } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom'
import { STYLE_TAB_LABELS, type StyleTabLabel } from './styleTabs'

/** V1 `NailOverlayTitle` 히어로 제목 — `ClientPage`와 동일 */
const NAIL_HERO_BANNER_TITLE_CLASS =
  'text-white font-sans text-lg font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]'

const STYLE_HERO_BANNER_FRAME =
  'relative mb-0 aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-lg'

const STYLE_TAB_LABEL_EN: Record<StyleTabLabel, string> = {
  전체: 'All',
  '✨ 심플': '✨ Simple',
  '💎 화려한': '💎 Glamorous',
  '🌙 프렌치': '🌙 French',
  '🖍️ 드로잉': '🖍️ Drawing',
  '🌈 그라데이션': '🌈 Gradient',
}

const STYLE_BASE_KEYWORD_MAPPING: Record<string, string> = {
  심플: '심플 데일리 원컬러 깔끔 베이직 무지',
  화려한: '화려한 풀파츠 글리터 스톤 큐빅 파티 맥시멀',
  프렌치: '프렌치 라인 둥근프렌치 하트프렌치 투톤',
  드로잉: '드로잉 수채화 라인 생화 꽃 펜 아트',
  그라데이션: '그라데이션 그라 옴브레 투톤 시럽 치크 블러셔 몽환',
}

function extractPureStyleKeyword(raw: string): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveStyleKeywords(keyword: string): string[] {
  const pure = extractPureStyleKeyword(keyword)
  const raw = STYLE_BASE_KEYWORD_MAPPING[pure] ?? pure
  return Array.from(
    new Set(
      raw
        .split(/\s+/)
        .map((part) => extractPureStyleKeyword(part))
        .filter(Boolean),
    ),
  )
}

function hubFieldIncludesKeyword(value: string | string[] | null | undefined, keyword: string): boolean {
  const needle = String(keyword ?? '').trim().toLowerCase()
  if (!needle) return false
  if (Array.isArray(value)) {
    return value.some((part) => String(part ?? '').toLowerCase().includes(needle))
  }
  return String(value ?? '').toLowerCase().includes(needle)
}

function hubItemMatchesKeywords(item: NailDesignRow, keywords: readonly string[]): boolean {
  if (keywords.length === 0 || keywords.includes('전체')) return true
  return keywords.some((keyword) => {
    if (hubFieldIncludesKeyword(item.category, keyword)) return true
    if (hubFieldIncludesKeyword(item.title, keyword)) return true
    if (hubFieldIncludesKeyword(item.title_en ?? '', keyword)) return true
    if (hubFieldIncludesKeyword(item.color, keyword)) return true
    if (hubFieldIncludesKeyword(item.mood, keyword)) return true
    if (hubFieldIncludesKeyword(item.design_elements, keyword)) return true
    if (hubFieldIncludesKeyword(item.tags ?? [], keyword)) return true
    if (hubFieldIncludesKeyword(item.situations ?? [], keyword)) return true
    if (hubFieldIncludesKeyword(item.styles ?? [], keyword)) return true
    return false
  })
}

function findFirstHubMatch(pool: NailDesignRow[], keywords: readonly string[]): NailDesignRow | undefined {
  if (pool.length === 0) return undefined
  if (keywords.length === 0 || keywords.includes('전체')) return pool[0]
  return pool.find((item) => hubItemMatchesKeywords(item, keywords))
}

function nailDisplayTitle(nail: NailDesignRow | undefined, isEnglish: boolean): string | null {
  if (!nail) return null
  const en = nail.title_en?.trim()
  const ko = nail.title?.trim()
  if (isEnglish && en) return en
  return ko || en || null
}

function displayStyleTabLabel(label: StyleTabLabel, isEnglish: boolean): string {
  return isEnglish ? STYLE_TAB_LABEL_EN[label] : label
}

function resolveStyleTabIndex(searchParams: URLSearchParams): number {
  const rawTab = searchParams.get('tab')?.trim()
  if (!rawTab) return 0

  const pureTab = extractPureStyleKeyword(rawTab)
  const byTab = STYLE_TAB_LABELS.findIndex((label) => {
    const pureLabel = extractPureStyleKeyword(label)
    return (
      label === rawTab ||
      pureLabel === pureTab ||
      (pureLabel !== '전체' &&
        (pureTab.includes(pureLabel) || pureLabel.includes(pureTab)))
    )
  })

  return byTab >= 0 ? byTab : 0
}

/** V1 `OccasionNailThumb` — `ClientPage`와 동일 퍼블리싱 */
function StyleNailThumbShell({
  title,
  variant,
  imageUrl,
  onActivate,
}: {
  title: string
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
      ? 'w-40 shrink-0 cursor-pointer'
      : 'flex cursor-pointer flex-col gap-0'

  const frameExtra =
    variant === 'carousel' ? 'bg-muted shadow-sm' : 'shadow-sm'

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
            alt={title}
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
        <span className={CAPTION}>{title}</span>
      </div>
    </div>
  )
}

/**
 * V1 스타일 큐레이션 서브 홈 UI (`/style-curation`).
 */
export default function ClientStyleCurationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabContainerRef = useRef<HTMLDivElement | null>(null)
  const { data: hubData = [] } = useRecommendHubQuery()
  const { language } = useLanguageContext()

  const isEnglish = language === 'en'
  const viewAllLabel = isEnglish ? 'View All >' : '전체보기 >'

  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [location.pathname, navigationType])

  const active = resolveStyleTabIndex(searchParams)

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
    active >= 0 && active < STYLE_TAB_LABELS.length ? active : 0
  const activeTabLabel = STYLE_TAB_LABELS[tabIndex]!

  const activeKeyword = extractPureStyleKeyword(activeTabLabel)
  const activeKeywords = useMemo(() => resolveStyleKeywords(activeKeyword), [activeKeyword])

  const heroNail = useMemo(
    () => findFirstHubMatch(hubData, activeKeywords),
    [hubData, activeKeywords],
  )

  const bestStyleMatches = useMemo(
    () =>
      [...hubData]
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, 4),
    [hubData],
  )

  const galleryItems = useMemo(
    () =>
      hubData
        .filter((item) => hubItemMatchesKeywords(item, activeKeywords))
        .slice(0, 4),
    [hubData, activeKeywords],
  )

  const gallerySlots = useMemo<(NailDesignRow | undefined)[]>(() => {
    const slots: (NailDesignRow | undefined)[] = [...galleryItems]
    while (slots.length < 4) slots.push(undefined)
    return slots
  }, [galleryItems])

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
    nailDisplayTitle(heroNail, isEnglish) ?? (isEnglish ? 'Style preview' : '스타일 미리보기')

  return (
    <div className="relative w-full bg-white">
      <header className="sticky top-0 z-[100] flex h-14 w-full shrink-0 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="relative flex h-full w-full min-w-0 items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
            className="-ml-2 shrink-0 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
          </button>

          <h1 className="pointer-events-none absolute left-1/2 max-w-[min(100%-5rem,18rem)] -translate-x-1/2 truncate text-center text-lg font-bold tracking-tight text-gray-900">
            {isEnglish
              ? 'Style Perfect, Nails by Vibe'
              : '취향 저격, 스타일별 네일'}
          </h1>

          <Link
            to="/gallery"
            className="-mr-2 shrink-0 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
            aria-label={isEnglish ? 'Search' : '검색'}
          >
            <Search className="h-6 w-6 text-gray-900" strokeWidth={2} />
          </Link>
        </div>
      </header>

      <main className="px-0 pb-8">
        <div className="mb-5 mt-6 flex items-end justify-between px-5">
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            {isEnglish ? 'View by Style' : '스타일별 모아보기'}
          </h2>
          <Link
            to={{
              pathname: '/style-list',
              search: searchParams.toString() ? `?${searchParams.toString()}` : '',
            }}
            className="cursor-pointer text-sm font-medium text-gray-500"
          >
            {viewAllLabel}
          </Link>
        </div>

        <nav
          ref={tabContainerRef}
          className="min-w-0 flex w-full flex-nowrap gap-2 overflow-x-auto whitespace-nowrap border-b border-gray-100 px-4 pb-1 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {STYLE_TAB_LABELS.map((label, idx) => {
            const isActive = active === idx
            return (
              <button
                key={label}
                type="button"
                data-active-tab={isActive ? 'true' : 'false'}
                onClick={() => {
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev)
                      if (label === '전체') {
                        next.delete('tab')
                      } else {
                        next.set('tab', extractPureStyleKeyword(label))
                      }
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
                aria-label={`${displayStyleTabLabel(label, isEnglish)} ${isEnglish ? 'tab' : '탭'}`}
              >
                {displayStyleTabLabel(label, isEnglish)}
              </button>
            )
          })}
          <div className="w-10 shrink-0" aria-hidden="true" />
        </nav>

        <section className="mb-0 mt-5 px-5" aria-label="스타일 히어로">
          <div
            className={`${STYLE_HERO_BANNER_FRAME} cursor-pointer`}
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
                <CurationFallback isEnglish={isEnglish} />
              )}
            </div>
            {heroImageUrl ? (
              <div className="absolute inset-x-5 bottom-5 z-10">
                <div className="relative z-10">
                  <h2
                    className={`${NAIL_HERO_BANNER_TITLE_CLASS} truncate leading-tight`}
                  >
                    {heroTitle}
                  </h2>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="mb-0 px-5">
          <div className="mb-5 mt-12 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish
                ? 'Most Popular Styles BEST ✨'
                : '가장 많이 찾은 스타일 BEST ✨'}
            </h2>
            <Link
              to={{
                pathname: '/style-best-list',
                search: searchParams.toString() ? `?${searchParams.toString()}` : '',
              }}
              className="cursor-pointer text-sm font-medium text-gray-500"
            >
              {viewAllLabel}
            </Link>
          </div>

          <section className="-mx-5 min-w-0 flex snap-x snap-mandatory gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="contents">
              {bestStyleMatches.map((nail) => (
                <StyleNailThumbShell
                  key={nail.id}
                  variant="carousel"
                  title={nailDisplayTitle(nail, isEnglish) ?? ''}
                  imageUrl={nail.image_url?.trim() ?? null}
                  onActivate={() => goDetail(nail)}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="mb-0 px-5">
          <div className="mb-5 mt-12 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Style Nail Gallery' : '스타일별 네일 갤러리'}
            </h2>
            <Link
              to={{
                pathname: '/style-gallery-list',
                search: searchParams.toString() ? `?${searchParams.toString()}` : '',
              }}
              className="cursor-pointer text-sm font-medium text-gray-500"
            >
              {viewAllLabel}
            </Link>
          </div>

          <div className="mb-0 grid grid-cols-2 gap-4 pb-0">
            {gallerySlots.map((nail, index) => (
              <StyleNailThumbShell
                key={nail?.id ?? `style-placeholder-${index}`}
                variant="grid"
                title={
                  nailDisplayTitle(nail, isEnglish) ??
                  (isEnglish ? `Style gallery ${index + 1}` : `스타일 갤러리 ${index + 1}`)
                }
                imageUrl={nail?.image_url?.trim() ?? null}
                onActivate={() => goDetail(nail)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
