import {
  DEFAULT_GALLERY_SORT,
  DEFAULT_GALLERY_TAB,
  normalizeGallerySort,
  useGalleryCountQuery,
  useGalleryInfiniteQuery,
} from '@/entities/nail-design/api/useGalleryInfiniteQuery'
import { useLanguageContext } from '@/contexts/LanguageContext'
import type { NailDesignRow } from '@/shared/types/database.types'
import { PageContainer } from '@/shared/ui/PageContainer'
import { ChevronDown, ChevronLeft, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom'
import { STYLE_GALLERY_TAB_LABELS, type StyleGalleryTabLabel } from './styleGalleryTabs'

const SORT_MENU_OPTIONS = [
  { value: '인기순', label: '인기순' },
  { value: '최신순', label: '최신순' },
  { value: '저장 많은 순', label: '저장 많은 순' },
] as const

type SortValue = (typeof SORT_MENU_OPTIONS)[number]['value']

const STYLE_GALLERY_TAB_LABEL_EN: Record<StyleGalleryTabLabel, string> = {
  '✨ 전체': 'All',
  '🍒 귀여운 숏네일': '🍒 Cute Short',
  '🦢 우아한 롱/연장': '🦢 Elegant Long/Ext',
  '🧊 스퀘어 쉐입': '🧊 Square',
  '💧 아몬드/오발': '💧 Almond/Oval',
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

function resolveActiveStyleGalleryTabLabel(rawTab: string | null): StyleGalleryTabLabel {
  const trimmed = rawTab?.trim()
  if (!trimmed || trimmed === DEFAULT_GALLERY_TAB) return STYLE_GALLERY_TAB_LABELS[0]

  const pure = extractPureThemeKeyword(trimmed)
  const found = STYLE_GALLERY_TAB_LABELS.find(
    (label) =>
      label === trimmed ||
      extractPureThemeKeyword(label) === pure ||
      extractPureThemeKeyword(label) === trimmed ||
      (extractPureThemeKeyword(label) !== DEFAULT_GALLERY_TAB &&
        pure.includes(extractPureThemeKeyword(label))),
  )
  return found ?? STYLE_GALLERY_TAB_LABELS[0]
}

function styleGalleryTabKeywordForQuery(label: StyleGalleryTabLabel): string {
  const pure = extractPureThemeKeyword(label)
  if (pure === DEFAULT_GALLERY_TAB) return DEFAULT_GALLERY_TAB
  return pure
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

function displayStyleGalleryTabLabel(label: StyleGalleryTabLabel, isEnglish: boolean): string {
  return isEnglish ? STYLE_GALLERY_TAB_LABEL_EN[label] : label
}

function displaySortLabel(label: SortValue, isEnglish: boolean): string {
  if (!isEnglish) return label
  if (label === '최신순') return 'Newest'
  if (label === '저장 많은 순') return 'Most Saved'
  return 'Popular'
}

export default function ClientStyleGalleryListPage() {
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSortOpen, setIsSortOpen] = useState(false)
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null)
  const sortMenuRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<HTMLDivElement | null>(null)

  const activeTabLabel = useMemo(
    () => resolveActiveStyleGalleryTabLabel(searchParams.get('tab')),
    [searchParams],
  )
  const activeTabKeyword = styleGalleryTabKeywordForQuery(activeTabLabel)

  const sortType: SortValue = useMemo(() => {
    const normalized = normalizeGallerySort(searchParams.get('sort'))
    return isSortValue(normalized) ? normalized : '인기순'
  }, [searchParams])

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGalleryInfiniteQuery(activeTabKeyword, sortType)

  const galleryItems = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  )
  const { data: totalCount } = useGalleryCountQuery(activeTabKeyword)
  const totalCountLabel = totalCount == null ? '-' : totalCount.toLocaleString()

  // PUSH/REPLACE로 새 메뉴 진입 시에만 위로 올리고, POP(뒤로가기) 시에는 앱이 스크롤을 건드리지 않는다.
  useEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo(0, 0)
  }, [location.pathname, navigationType])

  const sortMenuSelection =
    SORT_MENU_OPTIONS.find((o) => o.value === sortType) ?? SORT_MENU_OPTIONS[0]

  const setStyleGalleryTab = useCallback(
    (label: StyleGalleryTabLabel) => {
      const next = new URLSearchParams(searchParams)
      const pure = extractPureThemeKeyword(label)
      if (pure === DEFAULT_GALLERY_TAB) {
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
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  ])

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <div className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <header className="flex h-14 w-full shrink-0 items-center justify-between bg-white/95 px-5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
            className="-ml-2 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
          </button>

          <h1 className="pointer-events-none absolute left-1/2 max-w-[min(100%-5rem,16rem)] -translate-x-1/2 truncate text-center text-lg font-bold tracking-tight text-gray-900">
            {isEnglish ? 'Style Nail Gallery' : '스타일별 네일 갤러리'}
          </h1>

          <Link
            to="/gallery"
            className="-mr-2 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
            aria-label={isEnglish ? 'Search' : '검색'}
          >
            <Search className="h-6 w-6 text-gray-900" strokeWidth={2} />
          </Link>
        </header>

        <section
          className="scrollbar-hide flex w-full min-w-0 flex-nowrap gap-2 overflow-x-auto scroll-smooth whitespace-nowrap px-4 pb-2 pt-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          aria-label={isEnglish ? 'Gallery' : '갤러리'}
        >
          {STYLE_GALLERY_TAB_LABELS.map((label) => {
            const active = activeTabLabel === label
            return (
              <button
                ref={active ? activeTabButtonRef : undefined}
                key={label}
                type="button"
                data-active-tab={active ? 'true' : 'false'}
                onClick={() => setStyleGalleryTab(label)}
                className={
                  active
                    ? 'shrink-0 whitespace-nowrap rounded-full bg-[#FF7E67] px-4 py-1.5 text-sm font-medium text-white'
                    : 'shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600'
                }
              >
                {displayStyleGalleryTabLabel(label, isEnglish)}
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

      <div className="min-h-0 flex-1">
        <PageContainer className="!mx-0 !w-full !max-w-full bg-white !px-0 !py-0 sm:!px-0 lg:!px-0">
          <div className="w-full min-w-0 bg-white text-slate-900">
            <p className="sr-only">{isEnglish ? 'Gallery' : '갤러리'}</p>
            <ul className="grid grid-cols-2 gap-4 px-5 pb-8 pt-4">
              {isLoading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <li key={`style-gallery-list-skel-${i}`} aria-hidden>
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
                          <p className="line-clamp-2 w-full text-center text-sm font-medium tracking-tight text-gray-800">
                            {displayItemTitle(item, isEnglish)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                  {isFetchingNextPage
                    ? [0, 1].map((i) => (
                        <li key={`style-gallery-list-next-skel-${i}`} aria-hidden>
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
        </PageContainer>
      </div>
    </div>
  )
}
