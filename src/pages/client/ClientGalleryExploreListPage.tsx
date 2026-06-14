import {
  DEFAULT_GALLERY_SORT,
  DEFAULT_GALLERY_TAB,
  normalizeGallerySort,
  useGalleryCountQuery,
  useGalleryInfiniteQuery,
} from '@/entities/nail-design/api/useGalleryInfiniteQuery'
import type { NailDesignRow } from '@/shared/types/database.types'
import { ChevronDown, ChevronLeft, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { THEME_TAB_LABELS, type ThemeTabLabel } from './themeTabs'

const SORT_VALUES = ['인기순', '최신순', '저장 많은 순'] as const
type SortValue = (typeof SORT_VALUES)[number]

function isSortValue(value: string): value is SortValue {
  return (SORT_VALUES as readonly string[]).includes(value)
}

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveActiveThemeTabLabel(rawTab: string | null): ThemeTabLabel {
  const trimmed = rawTab?.trim()
  if (!trimmed || trimmed === DEFAULT_GALLERY_TAB) return '전체'

  const pure = extractPureThemeKeyword(trimmed)
  const found = THEME_TAB_LABELS.find(
    (label) =>
      label === trimmed ||
      extractPureThemeKeyword(label) === pure ||
      extractPureThemeKeyword(label) === trimmed,
  )
  return found ?? '전체'
}

function themeTabKeywordForQuery(label: ThemeTabLabel): string {
  if (label === '전체') return DEFAULT_GALLERY_TAB
  return extractPureThemeKeyword(label)
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

export default function ClientGalleryExploreListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isEnglish, setIsEnglish] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  const tabContainerRef = useRef<HTMLDivElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  const activeTabLabel = useMemo(
    () => resolveActiveThemeTabLabel(searchParams.get('tab')),
    [searchParams],
  )
  const activeTabKeyword = themeTabKeywordForQuery(activeTabLabel)

  const sortType: SortValue = useMemo(() => {
    const normalized = normalizeGallerySort(searchParams.get('sort'))
    return isSortValue(normalized) ? normalized : '인기순'
  }, [searchParams])

  const setThemeTab = useCallback(
    (label: ThemeTabLabel) => {
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
  } = useGalleryInfiniteQuery(activeTabKeyword, sortType)

  const galleryItems = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  )
  const { data: totalCount } = useGalleryCountQuery(activeTabKeyword)
  const totalCountLabel = totalCount == null ? '-' : totalCount.toLocaleString()

  const sortLabel = (value: SortValue) => {
    if (value === '인기순') return isEnglish ? 'Popular' : '인기순'
    if (value === '최신순') return isEnglish ? 'Newest' : '최신순'
    return isEnglish ? 'Most Saved' : '저장 많은 순'
  }

  const openDetail = (item: NailDesignRow) => {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = tabContainerRef.current?.querySelector('[data-active-tab="true"]')
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }, 150)
    return () => clearTimeout(timer)
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, activeTabKeyword, sortType])

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white text-slate-900">
      <header className="fixed top-0 left-0 right-0 z-[100] flex h-14 w-full shrink-0 border-b border-gray-100 bg-white/95 backdrop-blur-md">
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
            {isEnglish ? 'Explore Gallery' : '갤러리 탐색'}
          </h1>

          <div className="-mr-2 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEnglish((v) => !v)}
              className="rounded-full px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
              aria-label={isEnglish ? 'Switch to Korean' : 'Switch to English'}
            >
              {isEnglish ? 'KO' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
              aria-label={isEnglish ? 'Search' : '검색'}
            >
              <Search className="h-6 w-6 text-gray-900" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <div className="pt-[140px]">
        <div className="fixed top-14 left-0 right-0 z-40 mx-auto w-full bg-white border-b border-gray-100">
        <section
          ref={tabContainerRef}
          className="min-w-0 scrollbar-hide flex w-full flex-nowrap gap-2 overflow-x-auto scroll-smooth whitespace-nowrap px-4 pt-3 pb-2 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          aria-label="테마"
        >
          {THEME_TAB_LABELS.map((label) => {
            const isActive = activeTabLabel === label
            return (
              <button
                key={label}
                type="button"
                data-active-tab={isActive ? 'true' : 'false'}
                onClick={() => setThemeTab(label)}
                className={
                  isActive
                    ? 'shrink-0 whitespace-nowrap rounded-full bg-[#FF7E67] px-4 py-1.5 text-sm font-medium text-white'
                    : 'shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600'
                }
              >
                {label}
              </button>
            )
          })}
          <div className="w-10 shrink-0" aria-hidden="true" />
        </section>

        <div className="relative flex items-center justify-between px-4 pt-2 pb-3">
          <span className="text-sm text-gray-500">
            {isEnglish ? 'Total ' : '총 '}
            <span className="font-bold text-pink-500">{totalCountLabel}</span>{' '}
            {isEnglish ? 'designs' : '개의 디자인'}
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
              <span>{sortLabel(sortType)}</span>
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            {isSortOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[120px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {SORT_VALUES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setGallerySort(option)
                      setIsSortOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm ${
                      sortType === option
                        ? 'bg-gray-100 font-medium text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {sortLabel(option)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      <main className="grid grid-cols-2 gap-4 px-5 pb-8">
        {isLoading ? (
          <div className="col-span-2 flex flex-col items-center justify-center gap-2 py-16 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF7E67]" aria-hidden />
            <p className="text-sm">{isEnglish ? 'Loading designs…' : '디자인을 불러오는 중…'}</p>
          </div>
        ) : isError ? (
          <p className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? 'Could not load designs.' : '디자인을 불러오지 못했습니다.'}
          </p>
        ) : galleryItems.length === 0 ? (
          <p className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? 'No designs to show.' : '표시할 네일이 없습니다.'}
          </p>
        ) : (
          <>
            {galleryItems.map((item, index) => (
              <article
                key={item.id}
                className="flex cursor-pointer flex-col gap-2"
                role="button"
                tabIndex={0}
                onClick={() => openDetail(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openDetail(item)
                  }
                }}
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
              </article>
            ))}
            {isFetchingNextPage ? (
              <>
                {[0, 1].map((i) => (
                  <article
                    key={`theme-gallery-next-skel-${i}`}
                    className="flex flex-col gap-2"
                    aria-hidden
                  >
                    <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-gray-100" />
                    <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                  </article>
                ))}
              </>
            ) : null}
          </>
        )}
        <div ref={observerRef} className="col-span-2 h-10" aria-hidden />
      </main>
    </div>
  )
}
