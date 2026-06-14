import {
  DEFAULT_GALLERY_SORT,
  DEFAULT_GALLERY_TAB,
  normalizeGallerySort,
  useGalleryCountQuery,
  useGalleryInfiniteQuery,
} from '@/entities/nail-design/api/useGalleryInfiniteQuery'
import { useLanguageContext } from '@/contexts/LanguageContext'
import type { NailDesignRow } from '@/shared/types/database.types'
import { ChevronDown, ChevronLeft, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom'
import { resolveSeasonPopularTabs } from './seasonPopularTabs'

const SORT_MENU_OPTIONS = [
  { value: '인기순', label: '인기순' },
  { value: '최신순', label: '최신순' },
  { value: '저장 많은 순', label: '저장 많은 순' },
] as const

type SortValue = (typeof SORT_MENU_OPTIONS)[number]['value']

const SEASON_POPULAR_LIST_SCROLL_Y_KEY = 'gelia_season_popular_list_scroll_y'
const SEASON_POPULAR_LIST_SCROLL_ITEMS_KEY = 'gelia_season_popular_list_scroll_items'

const SEASON_TITLE_EN: Record<string, string> = {
  봄: 'Spring Popular Nails',
  여름: 'Summer Popular Nails',
  가을: 'Autumn Popular Nails',
  겨울: 'Winter Popular Nails',
}

const SEASON_POPULAR_TAB_LABEL_EN: Record<string, string> = {
  전체: 'All',
  '🌸 벚꽃/플라워': '🌸 Cherry Blossom/Flora',
  '🍑 피치/코랄': '🍑 Peach/Coral',
  '🌿 파스텔/생기': '🌿 Pastel/Vitality',
  '🏄 바다/해변': '🏄 Sea/Beach',
  '🧊 시럽/투명': '🧊 Syrup/Clear',
  '🌟 네온/비비드': '🌟 Neon/Vivid',
  '🍁 낙엽/브릭': '🍁 Fallen Leaves/Brick',
  '🤎 매트/무광': '🤎 Matte',
  '🐆 레오파드/호피': '🐆 Leopard',
  '❄️ 눈꽃/니트': '❄️ Snowflake/Knit',
  '🎄 크리스마스': '🎄 Christmas',
  '🍷 버건디/벨벳': '🍷 Burgundy/Velvet',
}

const SEASON_BASE_KEYWORD_MAPPING: Record<string, string> = {
  봄: '봄 spring 스프링 파스텔 웜톤 화사한',
  여름: '여름 summer 썸머 바다 휴양지 바캉스',
  가을: '가을 autumn fall 무화과 버건디 브라운 웜톤',
  겨울: '겨울 winter 눈 크리스마스 니트 트위드 쿨톤',
}

const SEASON_SUBTAB_KEYWORD_MAPPING: Record<string, string> = {
  전체: '',
  '벚꽃/플라워': '벚꽃 플라워 꽃 생화 봄꽃 플로럴',
  '피치/코랄': '피치 코랄 살구 복숭아 오렌지 웜톤',
  '파스텔/생기': '파스텔 생기 민트 연보라 레몬 마카롱 솜사탕',
  '바다/해변': '바다 해변 오션 휴양지 바캉스 파도 청량',
  '시럽/투명': '시럽 투명 클리어 젤리 맑은 물방울 얼음',
  '네온/비비드': '네온 비비드 형광 팝 원색 썸머',
  '낙엽/브릭': '낙엽 브릭 단풍 테라코타 어텀 오렌지',
  '매트/무광': '매트 무광 벨벳 보송한 가을',
  '레오파드/호피': '레오파드 호피 애니멀 표범 패턴',
  '눈꽃/니트': '눈꽃 니트 스노우 눈 화이트 포근한',
  크리스마스: '크리스마스 연말 홀리데이 트리 파티',
  '버건디/벨벳': '버건디 벨벳 와인 딥 레드 겨울',
}

function isSortValue(value: string): value is SortValue {
  return (SORT_MENU_OPTIONS as readonly { value: string }[]).some((o) => o.value === value)
}

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveActiveSeasonPopularTabLabel(
  rawTab: string | null,
  tabs: readonly string[],
  season: string,
): string {
  const trimmed = rawTab?.trim()
  if (!trimmed || trimmed === DEFAULT_GALLERY_TAB || trimmed === season) return '전체'

  const pure = extractPureThemeKeyword(trimmed)
  const found = tabs.find(
    (label) =>
      label === trimmed ||
      extractPureThemeKeyword(label) === pure ||
      extractPureThemeKeyword(label) === trimmed,
  )
  return found ?? '전체'
}

function seasonPopularTabKeywordForQuery(label: string): string {
  const mappingKey = extractPureThemeKeyword(label)
  if (mappingKey === '전체') return DEFAULT_GALLERY_TAB
  return SEASON_SUBTAB_KEYWORD_MAPPING[mappingKey] ?? mappingKey
}

function seasonBaseKeywordForQuery(season: string): string {
  const mappingKey = extractPureThemeKeyword(season)
  return SEASON_BASE_KEYWORD_MAPPING[mappingKey] ?? mappingKey
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

function displaySeasonPopularTitle(season: string, isEnglish: boolean): string {
  if (isEnglish) return SEASON_TITLE_EN[season] ?? 'Seasonal Popular Nails'
  return `${season} 인기 네일 모음`
}

function displaySeasonPopularTabLabel(label: string, isEnglish: boolean): string {
  return isEnglish ? SEASON_POPULAR_TAB_LABEL_EN[label] ?? label : label
}

function displaySortLabel(label: SortValue, isEnglish: boolean): string {
  if (!isEnglish) return label
  if (label === '최신순') return 'Newest'
  if (label === '저장 많은 순') return 'Most Saved'
  return 'Popular'
}

export default function ClientSeasonPopularListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSortOpen, setIsSortOpen] = useState(false)
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null)
  const sortMenuRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<HTMLDivElement | null>(null)

  const season = searchParams.get('season') ?? '봄'
  const tabs = useMemo(() => resolveSeasonPopularTabs(season), [season])
  const activeTabLabel = useMemo(
    () => resolveActiveSeasonPopularTabLabel(searchParams.get('tab'), tabs, season),
    [searchParams, tabs, season],
  )
  const activeTabKeyword = seasonPopularTabKeywordForQuery(activeTabLabel)
  const seasonBaseKeyword = seasonBaseKeywordForQuery(season)
  const finalQueryKeyword = [seasonBaseKeyword, activeTabKeyword]
    .filter((keyword) => keyword && keyword !== DEFAULT_GALLERY_TAB)
    .join(' ')
    .trim() || DEFAULT_GALLERY_TAB

  const sortType: SortValue = useMemo(() => {
    const normalized = normalizeGallerySort(searchParams.get('sort'))
    return isSortValue(normalized) ? normalized : '인기순'
  }, [searchParams])

  const sortMenuSelection =
    SORT_MENU_OPTIONS.find((o) => o.value === sortType) ?? SORT_MENU_OPTIONS[0]

  const setSeasonPopularTab = useCallback(
    (label: string) => {
      const next = new URLSearchParams(searchParams)
      const pure = extractPureThemeKeyword(label)
      if (label === '전체' || pure === DEFAULT_GALLERY_TAB) {
        next.delete('tab')
      } else {
        next.set('tab', pure)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const setGallerySort = useCallback(
    (sort: SortValue) => {
      const next = new URLSearchParams(searchParams)
      if (sort === DEFAULT_GALLERY_SORT) {
        next.delete('sort')
      } else {
        next.set('sort', sort)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGalleryInfiniteQuery(finalQueryKeyword, sortType)

  const galleryItems = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  )
  const { data: totalCount } = useGalleryCountQuery(finalQueryKeyword)
  const totalCountLabel = totalCount == null ? '-' : totalCount.toLocaleString()

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(SEASON_POPULAR_LIST_SCROLL_Y_KEY, window.scrollY.toString())
      sessionStorage.setItem(SEASON_POPULAR_LIST_SCROLL_ITEMS_KEY, galleryItems.length.toString())
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, [galleryItems.length])

  useEffect(() => {
    if (navigationType !== 'POP') return

    const savedY = sessionStorage.getItem(SEASON_POPULAR_LIST_SCROLL_Y_KEY)
    if (!savedY) return

    const savedItemsRaw = sessionStorage.getItem(SEASON_POPULAR_LIST_SCROLL_ITEMS_KEY)
    const savedItems = savedItemsRaw ? Number.parseInt(savedItemsRaw, 10) : 0
    const hasEnoughItems =
      galleryItems.length > 0 &&
      (Number.isNaN(savedItems) || savedItems <= 0 || galleryItems.length >= savedItems)

    if (!hasEnoughItems && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
      return
    }

    if (!hasEnoughItems) return

    const y = Number.parseInt(savedY, 10)
    if (Number.isNaN(y)) return

    const timer = window.setTimeout(() => {
      window.scrollTo(0, y)
      sessionStorage.removeItem(SEASON_POPULAR_LIST_SCROLL_Y_KEY)
      sessionStorage.removeItem(SEASON_POPULAR_LIST_SCROLL_ITEMS_KEY)
    }, 100)

    return () => window.clearTimeout(timer)
  }, [
    navigationType,
    location.pathname,
    location.search,
    galleryItems.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ])

  useEffect(() => {
    const el = activeTabButtonRef.current
    if (!el) return
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeTabLabel])

  useEffect(() => {
    if (!isSortOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const root = sortMenuRef.current
      if (!root || root.contains(e.target as Node)) return
      setIsSortOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSortOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isSortOpen])

  useEffect(() => {
    const target = observerRef.current
    if (!target || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isFetchingNextPage) return
        void fetchNextPage()
      },
      { root: null, rootMargin: '200px', threshold: 0 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, finalQueryKeyword, sortType])

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <div className="min-h-0 flex-1">
        <div className="w-full min-w-0 bg-white text-slate-900">
          <p className="sr-only">{isEnglish ? 'Seasonal Popular' : '계절 인기'}</p>
          <div className="sticky top-0 z-50 w-full bg-white">
            <header className="flex h-14 w-full shrink-0 bg-white/95 backdrop-blur-md">
              <div className="relative flex h-full w-full min-w-0 items-center justify-between px-5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
                  className="-ml-2 shrink-0 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
                </button>

                <h1 className="pointer-events-none absolute left-1/2 max-w-[min(100%-5rem,16rem)] -translate-x-1/2 truncate text-center text-lg font-bold tracking-tight text-gray-900">
                  {displaySeasonPopularTitle(season, isEnglish)}
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

            <section
              className="scrollbar-hide flex w-full min-w-0 flex-nowrap gap-2 overflow-x-auto scroll-smooth whitespace-nowrap px-4 pb-2 pt-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              aria-label={isEnglish ? 'Seasonal Popular' : '계절 인기'}
            >
              {tabs.map((label) => {
                const active = activeTabLabel === label
                return (
                  <button
                    ref={active ? activeTabButtonRef : undefined}
                    key={label}
                    type="button"
                    data-active-tab={active ? 'true' : 'false'}
                    onClick={() => setSeasonPopularTab(label)}
                    className={
                      active
                        ? 'shrink-0 whitespace-nowrap rounded-full bg-[#FF7E67] px-4 py-1.5 text-sm font-medium text-white'
                        : 'shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600'
                    }
                  >
                    {displaySeasonPopularTabLabel(label, isEnglish)}
                  </button>
                )
              })}
              <div className="w-10 shrink-0" aria-hidden="true" />
            </section>

            <div className="relative flex w-full min-w-0 items-center justify-between px-4 pb-3 pt-2">
              <span className="text-sm text-gray-500">
                {isEnglish ? (
                  <>
                    Total <strong className="font-bold text-pink-500">{totalCountLabel}</strong> designs
                  </>
                ) : (
                  <>
                    총 <strong className="font-bold text-pink-500">{totalCountLabel}</strong>개의 디자인
                  </>
                )}
              </span>
              <div ref={sortMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100"
                  aria-haspopup="menu"
                  aria-expanded={isSortOpen}
                  aria-label={isEnglish ? 'Sort' : '정렬'}
                >
                  <span>{displaySortLabel(sortMenuSelection.label, isEnglish)}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
                {isSortOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[148px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    {SORT_MENU_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setGallerySort(opt.value)
                          setIsSortOpen(false)
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                          sortType === opt.value
                            ? 'bg-gray-100 font-medium text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {displaySortLabel(opt.label, isEnglish)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-4 px-5 pb-8 pt-4">
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => (
                <li key={`season-popular-list-skel-${i}`} aria-hidden>
                  <div className="flex flex-col gap-2">
                    <div className="aspect-[3/4] w-full min-h-0 animate-pulse rounded-xl bg-gray-100" />
                    <div className="mx-auto mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                  </div>
                </li>
              ))
            ) : isError ? (
              <li className="col-span-2 py-12 text-center text-sm text-gray-500">
                {isEnglish ? 'Failed to load designs.' : '디자인을 불러오지 못했습니다.'}
              </li>
            ) : galleryItems.length === 0 ? (
              <li className="col-span-2 py-12 text-center text-sm text-gray-500">
                {isEnglish ? 'No nails registered yet.' : '등록된 네일이 없어요.'}
              </li>
            ) : (
              <>
                {galleryItems.map((item, index) => (
                  <li key={item.id}>
                    <Link
                      to={`/detail/${item.id}`}
                      onClick={saveListScrollPosition}
                      state={{
                        initialNailData: {
                          id: item.id,
                          imageUrl: item.image_url,
                          title: displayItemTitle(item, isEnglish),
                          color: '',
                          mood: '',
                        },
                      }}
                      className="flex cursor-pointer flex-col gap-2"
                    >
                      <div className="aspect-[3/4] w-full min-h-0 overflow-hidden rounded-xl bg-gray-100">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={displayItemTitle(item, isEnglish)}
                            className="h-full w-full min-h-0 rounded-xl object-cover object-center"
                            loading={index < 4 ? 'eager' : 'lazy'}
                            fetchPriority={index < 4 ? 'high' : undefined}
                            decoding="async"
                          />
                        ) : null}
                      </div>
                      <div className="mt-2 flex w-full flex-col items-center justify-center px-1">
                        <p className="w-full truncate text-center text-sm font-medium tracking-tight text-gray-800">
                          {displayItemTitle(item, isEnglish)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
                {isFetchingNextPage
                  ? [0, 1].map((i) => (
                      <li key={`season-popular-list-next-skel-${i}`} aria-hidden>
                        <div className="flex flex-col gap-2">
                          <div className="aspect-[3/4] w-full min-h-0 animate-pulse rounded-xl bg-gray-100" />
                          <div className="mx-auto mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                        </div>
                      </li>
                    ))
                  : null}
              </>
            )}
          </ul>
          <div ref={observerRef} className="h-10 px-4 pb-4" aria-hidden />
        </div>
      </div>
    </div>
  )
}
