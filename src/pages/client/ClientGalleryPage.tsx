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
import { useNavigate, useSearchParams } from 'react-router-dom'

const GALLERY_TABS = [
  { ko: '전체', en: 'All', keyword: '' },
  { ko: '시럽', en: 'Syrup', keyword: '시럽' },
  { ko: '프렌치', en: 'French', keyword: '프렌치' },
  { ko: '글리터', en: 'Glitter', keyword: '글리터' },
  { ko: '파츠', en: 'Parts', keyword: '파츠' },
  { ko: '그라데이션', en: 'Gradient', keyword: '그라데이션' },
] as const

const SORT_VALUES = ['인기순', '최신순', '저장 많은 순'] as const
type SortValue = (typeof SORT_VALUES)[number]

function isSortValue(value: string): value is SortValue {
  return (SORT_VALUES as readonly string[]).includes(value)
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

export default function ClientGalleryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const [isSortOpen, setIsSortOpen] = useState(false)

  const tabContainerRef = useRef<HTMLDivElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  const activeTabKo = searchParams.get('tab')?.trim() || DEFAULT_GALLERY_TAB
  const sortType: SortValue = useMemo(() => {
    const normalized = normalizeGallerySort(searchParams.get('sort'))
    return isSortValue(normalized) ? normalized : '인기순'
  }, [searchParams])

  const setGalleryTab = useCallback(
    (tabKo: string) => {
      const next = new URLSearchParams(searchParams)
      if (tabKo === DEFAULT_GALLERY_TAB) {
        next.delete('tab')
      } else {
        next.set('tab', tabKo)
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
  } = useGalleryInfiniteQuery(activeTabKo, sortType)

  const galleryItems = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  )
  const { data: totalCount } = useGalleryCountQuery(activeTabKo)
  const totalCountLabel = totalCount == null ? '-' : totalCount.toLocaleString()

  const pageTitle = isEnglish ? 'Explore Gallery' : '갤러리 탐색'

  const sortLabel = (value: SortValue) => {
    if (value === '인기순') return isEnglish ? 'Popular' : '인기순'
    if (value === '최신순') return isEnglish ? 'Newest' : '최신순'
    return isEnglish ? 'Most Saved' : '저장 많은 순'
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = tabContainerRef.current?.querySelector('[data-active-tab="true"]')
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }, 150)
    return () => clearTimeout(timer)
  }, [activeTabKo])

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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, activeTabKo, sortType])

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900">
      <div className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
        <header className="relative flex h-14 w-full items-center justify-between bg-white px-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-2 z-10 p-2"
            aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
          >
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 max-w-[52%] -translate-x-1/2 -translate-y-1/2 truncate whitespace-nowrap text-center text-lg font-bold text-gray-900">
            {pageTitle}
          </h1>
          <div className="-mr-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="p-2"
              aria-label={isEnglish ? 'Search' : '검색'}
            >
              <Search className="h-6 w-6 text-gray-900" />
            </button>
          </div>
        </header>

        <section
          ref={tabContainerRef}
          className="min-w-0 flex w-full overflow-x-auto whitespace-nowrap scrollbar-hide px-4 pb-2 pt-1 [&::-webkit-scrollbar]:hidden"
        >
          {GALLERY_TABS.map((tab) => {
            const isActive = activeTabKo === tab.ko
            return (
              <button
                key={tab.ko}
                type="button"
                data-active-tab={isActive ? 'true' : 'false'}
                onClick={() => setGalleryTab(tab.ko)}
                className={
                  isActive
                    ? 'shrink-0 whitespace-nowrap rounded-full bg-[#FF7E67] px-4 py-1.5 text-sm font-medium text-white mr-2'
                    : 'shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 mr-2'
                }
              >
                {isEnglish ? tab.en : tab.ko}
              </button>
            )
          })}
          <div className="w-4 shrink-0" />
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

      <main className="grid grid-cols-2 gap-4 px-5 pt-4 pb-8">
        {isLoading ? (
          <>
            {Array.from({ length: 8 }, (_, i) => (
              <article
                key={`gallery-initial-skel-${i}`}
                className="flex flex-col gap-2"
                aria-hidden
              >
                <div className="aspect-[3/4] w-full min-h-0 animate-pulse rounded-xl bg-gray-100" />
                <div className="mx-auto mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              </article>
            ))}
          </>
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
                onClick={() =>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
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
                    key={`gallery-next-skel-${i}`}
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
