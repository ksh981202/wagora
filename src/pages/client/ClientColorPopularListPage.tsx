import { useLanguageContext } from '@/contexts/LanguageContext'
import { supabase } from '@/shared/api/supabaseClient'
import type { NailDesignRow } from '@/shared/types/database.types'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom'

const COLOR_POPULAR_TABS = [
  '전체',
  '🤍 화이트/누드',
  '🌸 핑크/코랄',
  '🍒 레드/버건디',
  '💙 블루/네이비',
  '🖤 블랙/무채색',
] as const

type ColorPopularTabLabel = (typeof COLOR_POPULAR_TABS)[number]

const COLOR_POPULAR_LIMIT = 50
const COLOR_POPULAR_LIST_SCROLL_Y_KEY = 'gelia_color_popular_list_scroll_y'

const COLOR_POPULAR_COLUMNS =
  'id,created_at,title,title_en,image_url,category,tags,tags_en,popularity,saves,situations,styles,nail_length,color,mood,design_elements'

const COLOR_POPULAR_TAB_LABEL_EN: Record<ColorPopularTabLabel, string> = {
  전체: 'All',
  '🤍 화이트/누드': '🤍 White/Nude',
  '🌸 핑크/코랄': '🌸 Pink/Coral',
  '🍒 레드/버건디': '🍒 Red/Burgundy',
  '💙 블루/네이비': '💙 Blue/Navy',
  '🖤 블랙/무채색': '🖤 Black/Achromatic',
}

const COLOR_POPULAR_KEYWORDS: Record<ColorPopularTabLabel, readonly string[]> = {
  전체: [],
  '🤍 화이트/누드': ['화이트', '흰색', '백', '아이보리', '크림', '누드', '베이지', '살구', '스킨', '투명', '시럽'],
  '🌸 핑크/코랄': ['핑크', '분홍', '피치', '베이비핑크', '코랄', '핫핑크', '봄'],
  '🍒 레드/버건디': ['레드', '빨강', '빨간색', '버건디', '와인', '체리', '가을'],
  '💙 블루/네이비': ['블루', '파랑', '파란색', '하늘', '소라', '네이비', '청', '민트', '여름'],
  '🖤 블랙/무채색': ['블랙', '검정', '검은색', '다크', '시크', '무채색', '그레이', '회색', '겨울'],
}

const ARRAY_TEXT_FILTER_INDEXES = [0, 1, 2, 3, 4, 5] as const

function escapePostgrestIlikePattern(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, ' ')
    .trim()
}

function extractPureThemeKeyword(raw: string | null): string {
  return String(raw ?? '')
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveActiveColorPopularTabLabel(rawTab: string | null): ColorPopularTabLabel {
  const trimmed = rawTab?.trim()
  if (!trimmed) return '전체'

  const pure = extractPureThemeKeyword(trimmed)
  const found = COLOR_POPULAR_TABS.find(
    (label) =>
      label === trimmed ||
      extractPureThemeKeyword(label) === pure ||
      extractPureThemeKeyword(label) === trimmed,
  )
  return found ?? '전체'
}

function buildColorPopularOrFilter(tab: ColorPopularTabLabel): string {
  const keywords = COLOR_POPULAR_KEYWORDS[tab] ?? []
  if (keywords.length === 0) return ''

  const parts: string[] = []
  for (const keyword of keywords) {
    const ilike = escapePostgrestIlikePattern(keyword)
    if (!ilike) continue
    parts.push(
      `title.ilike.%${ilike}%`,
      `category.ilike.%${ilike}%`,
      `color.ilike.%${ilike}%`,
      `mood.ilike.%${ilike}%`,
      `design_elements.ilike.%${ilike}%`,
    )
    for (const index of ARRAY_TEXT_FILTER_INDEXES) {
      parts.push(
        `tags->>${index}.ilike.%${ilike}%`,
        `tags_en->>${index}.ilike.%${ilike}%`,
        `situations->>${index}.ilike.%${ilike}%`,
        `styles->>${index}.ilike.%${ilike}%`,
      )
    }
  }
  return parts.join(',')
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

function displayColorPopularTabLabel(label: ColorPopularTabLabel, isEnglish: boolean): string {
  return isEnglish ? COLOR_POPULAR_TAB_LABEL_EN[label] : label
}

function useColorPopularNailsQuery(tab: ColorPopularTabLabel) {
  return useQuery({
    queryKey: ['nail-designs', 'color-popular-list', { tab, limit: COLOR_POPULAR_LIMIT }],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }): Promise<NailDesignRow[]> => {
      let query = supabase
        .from('wagora_lookbooks')
        .select(COLOR_POPULAR_COLUMNS)
        .order('popularity', { ascending: false })
        .order('saves', { ascending: false })
        .order('id', { ascending: false })
        .limit(COLOR_POPULAR_LIMIT)

      const orFilter = buildColorPopularOrFilter(tab)
      if (orFilter) query = query.or(orFilter)

      const { data, error } = await query.abortSignal(signal)
      if (error) throw error
      return (data ?? []) as NailDesignRow[]
    },
  })
}

export default function ClientColorPopularListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const [searchParams, setSearchParams] = useSearchParams()
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null)

  const activeTabLabel = useMemo(
    () => resolveActiveColorPopularTabLabel(searchParams.get('tab')),
    [searchParams],
  )

  const { data: popularItems = [], isLoading, isError } = useColorPopularNailsQuery(activeTabLabel)
  const totalCountLabel = popularItems.length.toLocaleString()

  const setColorPopularTab = useCallback(
    (label: ColorPopularTabLabel) => {
      const next = new URLSearchParams(searchParams)
      const pure = extractPureThemeKeyword(label)
      if (label === '전체') {
        next.delete('tab')
      } else {
        next.set('tab', pure)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(COLOR_POPULAR_LIST_SCROLL_Y_KEY, window.scrollY.toString())
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, [])

  useEffect(() => {
    if (navigationType !== 'POP') return
    if (isLoading || popularItems.length === 0) return

    const savedY = sessionStorage.getItem(COLOR_POPULAR_LIST_SCROLL_Y_KEY)
    if (!savedY) return

    const y = Number.parseInt(savedY, 10)
    if (Number.isNaN(y)) return

    const timer = window.setTimeout(() => {
      window.scrollTo(0, y)
      sessionStorage.removeItem(COLOR_POPULAR_LIST_SCROLL_Y_KEY)
    }, 100)

    return () => window.clearTimeout(timer)
  }, [navigationType, location.pathname, isLoading, popularItems.length])

  useEffect(() => {
    const el = activeTabButtonRef.current
    if (!el) return
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeTabLabel])

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <div className="sticky top-0 z-50 w-full bg-white shadow-sm">
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

            <h1 className="pointer-events-none absolute left-1/2 max-w-[min(100%-5rem,16rem)] -translate-x-1/2 truncate text-center text-[17px] font-bold text-gray-900">
              {isEnglish ? 'Real-time Popular Color Nails' : '실시간 인기 컬러 네일'}
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
          aria-label={isEnglish ? 'Popular Color' : '인기 컬러'}
        >
          {COLOR_POPULAR_TABS.map((label) => {
            const active = activeTabLabel === label
            return (
              <button
                ref={active ? activeTabButtonRef : undefined}
                key={label}
                type="button"
                data-active-tab={active ? 'true' : 'false'}
                onClick={() => setColorPopularTab(label)}
                className={
                  active
                    ? 'shrink-0 whitespace-nowrap rounded-full bg-[#FF7E67] px-4 py-1.5 text-sm font-medium text-white'
                    : 'shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600'
                }
              >
                {displayColorPopularTabLabel(label, isEnglish)}
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
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <div className="w-full min-w-0 bg-white text-slate-900">
          <p className="sr-only">{isEnglish ? 'Popular Color' : '인기 컬러'}</p>
          <ul className="grid grid-cols-2 gap-4 px-5 pb-8 pt-4">
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => (
                <li key={`color-popular-list-skel-${i}`} aria-hidden>
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
            ) : popularItems.length === 0 ? (
              <li className="col-span-2 py-12 text-center text-sm text-gray-500">
                {isEnglish ? 'No popular nails in this color yet.' : '해당 컬러의 인기 네일이 없어요.'}
              </li>
            ) : (
              popularItems.map((item, index) => {
                const title = displayItemTitle(item, isEnglish)
                return (
                  <li key={item.id}>
                    <Link
                      to={`/detail/${item.id}`}
                      onClick={saveListScrollPosition}
                      state={{
                        initialNailData: {
                          id: item.id,
                          imageUrl: item.image_url,
                          title,
                          color: item.color ?? '',
                          mood: item.mood ?? '',
                        },
                      }}
                      className="flex cursor-pointer flex-col gap-2"
                    >
                      <div className="aspect-[3/4] w-full min-h-0 overflow-hidden rounded-xl bg-gray-100">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={title}
                            className="h-full w-full min-h-0 rounded-xl object-cover object-center"
                            loading={index < 4 ? 'eager' : 'lazy'}
                            fetchPriority={index < 4 ? 'high' : undefined}
                            decoding="async"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="mt-2 flex w-full flex-col items-center justify-center px-1">
                        <p className="w-full truncate text-center text-sm font-medium tracking-tight text-gray-800">
                          {title}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
          <div className="h-10 px-4 pb-4" aria-hidden />
        </div>
      </div>
    </div>
  )
}
