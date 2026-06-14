import { useLanguageContext } from '@/contexts/LanguageContext'
import { supabase } from '@/shared/api/supabaseClient'
import type { NailDesignRow } from '@/shared/types/database.types'
import { PageContainer } from '@/shared/ui/PageContainer'
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
import { STYLE_BEST_TAB_LABELS, type StyleBestTabLabel } from './styleBestTabs'

const PERIOD_PARAM_BY_TAB = {
  '🔥 실시간 급상승': 'realtime',
  '👑 주간 베스트': 'weekly',
  '🏆 월간 랭킹': 'monthly',
  '⭐ 역대 누적 BEST': 'alltime',
} as const satisfies Record<StyleBestTabLabel, string>

const STYLE_BEST_TAB_LABEL_EN: Record<StyleBestTabLabel, string> = {
  '🔥 실시간 급상승': '🔥 Real-time',
  '👑 주간 베스트': '👑 Weekly Best',
  '🏆 월간 랭킹': '🥇 Monthly Ranking',
  '⭐ 역대 누적 BEST': '⭐ All-Time Best',
}

type RankingPeriod = (typeof PERIOD_PARAM_BY_TAB)[StyleBestTabLabel]

const DEFAULT_RANKING_PERIOD: RankingPeriod = 'realtime'
const STYLE_BEST_SCROLL_Y_KEY = 'gelia_style_best_scroll_y'

const MAX_LIMIT_BY_PERIOD = {
  realtime: 30,
  weekly: 50,
  monthly: 100,
  alltime: 100,
} as const satisfies Record<RankingPeriod, number>

type RankingNailRow = NailDesignRow & {
  ranking_score: number
}

function isRankingPeriod(value: string | null): value is RankingPeriod {
  return Object.values(PERIOD_PARAM_BY_TAB).some((period) => period === value)
}

function resolveActiveStyleBestTab(period: RankingPeriod): StyleBestTabLabel {
  return (
    STYLE_BEST_TAB_LABELS.find((label) => PERIOD_PARAM_BY_TAB[label] === period) ??
    STYLE_BEST_TAB_LABELS[0]
  )
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

function displayStyleBestTabLabel(label: StyleBestTabLabel, isEnglish: boolean): string {
  return isEnglish ? STYLE_BEST_TAB_LABEL_EN[label] : label
}

function useStyleBestRankingQuery(period: string, maxLimit: number) {
  return useQuery({
    queryKey: ['nail-designs', 'style-best-ranking', { period, maxLimit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<RankingNailRow[]> => {
      const { data, error } = await supabase
        .rpc('get_ranking_nails', { p_period: period, p_limit: maxLimit })
        .abortSignal(signal)

      if (error) throw error
      return (data ?? []) as RankingNailRow[]
    },
  })
}

export default function ClientStyleBestListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const [searchParams, setSearchParams] = useSearchParams()
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'

  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null)

  const period: RankingPeriod = useMemo(() => {
    const raw = searchParams.get('period')
    return isRankingPeriod(raw) ? raw : DEFAULT_RANKING_PERIOD
  }, [searchParams])

  const activeTabLabel = useMemo(() => resolveActiveStyleBestTab(period), [period])

  const setRankingPeriod = useCallback(
    (label: StyleBestTabLabel) => {
      const next = new URLSearchParams(searchParams)
      next.set('period', PERIOD_PARAM_BY_TAB[label])
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const maxLimit = MAX_LIMIT_BY_PERIOD[period]

  const {
    data,
    isLoading,
    isError,
  } = useStyleBestRankingQuery(period, maxLimit)

  const rawRankingItems = useMemo(
    () => data?.slice(0, maxLimit) ?? [],
    [data, maxLimit],
  )

  const rankingItems = rawRankingItems

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(STYLE_BEST_SCROLL_Y_KEY, window.scrollY.toString())
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, [])

  useEffect(() => {
    if (isRankingPeriod(searchParams.get('period'))) return
    const next = new URLSearchParams(searchParams)
    next.set('period', DEFAULT_RANKING_PERIOD)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

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
    if (navigationType !== 'POP') return
    if (isLoading || rankingItems.length === 0) return

    const savedY = sessionStorage.getItem(STYLE_BEST_SCROLL_Y_KEY)
    if (!savedY) return

    const y = Number.parseInt(savedY, 10)
    if (Number.isNaN(y)) return

    const timer = window.setTimeout(() => {
      window.scrollTo(0, y)
      sessionStorage.removeItem(STYLE_BEST_SCROLL_Y_KEY)
    }, 100)

    return () => window.clearTimeout(timer)
  }, [navigationType, location.pathname, isLoading, rankingItems.length])

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <div className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <header className="flex h-14 w-full shrink-0 border-b border-gray-100 bg-white text-gray-900 backdrop-blur-md">
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
              {isEnglish ? 'Most Popular Styles BEST ✨' : '가장 많이 찾은 스타일 BEST ✨'}
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
          aria-label={isEnglish ? 'Style BEST' : '스타일 BEST'}
        >
          {STYLE_BEST_TAB_LABELS.map((label) => {
            const active = activeTabLabel === label
            return (
              <button
                ref={active ? activeTabButtonRef : undefined}
                key={label}
                type="button"
                data-active-tab={active ? 'true' : 'false'}
                onClick={() => setRankingPeriod(label)}
                className={
                  active
                    ? 'shrink-0 whitespace-nowrap rounded-full bg-[#FF7E67] px-4 py-1.5 text-sm font-medium text-white'
                    : 'shrink-0 whitespace-nowrap rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600'
                }
              >
                {displayStyleBestTabLabel(label, isEnglish)}
              </button>
            )
          })}
          <div className="w-10 shrink-0" aria-hidden="true" />
        </section>

        <div className="relative flex w-full min-w-0 items-center justify-between px-4 pb-3 pt-2">
          <span className="text-sm text-gray-500">
            {isEnglish ? (
              <>
                Total <strong className="font-bold text-pink-500">{maxLimit}</strong> designs
              </>
            ) : (
              <>
                총 <strong className="font-bold text-pink-500">{maxLimit}</strong>개의 디자인
              </>
            )}
          </span>
          <span className="text-[11px] text-gray-400">
            {isEnglish ? 'Based on Views, Saves, Likes' : '조회·저장·좋아요 합산 기준'}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <PageContainer className="!mx-0 !w-full !max-w-full bg-white !px-0 !py-0 sm:!px-0 lg:!px-0">
          <div className="w-full min-w-0 bg-white text-slate-900">
            <p className="sr-only">{isEnglish ? 'Style BEST' : '스타일 BEST'}</p>
            <ul className="grid grid-cols-2 gap-4 px-5 pb-8 pt-4">
              {isLoading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <li key={`style-best-list-skel-${i}`} aria-hidden>
                    <div className="flex flex-col gap-2">
                      <div className="aspect-[3/4] w-full min-h-0 animate-pulse rounded-xl bg-gray-100" />
                      <div className="mx-auto mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                    </div>
                  </li>
                ))
              ) : isError ? (
                <li className="col-span-2 py-12 text-center text-sm text-gray-500">
                  {isEnglish ? 'Failed to load rankings.' : '랭킹을 불러오지 못했습니다.'}
                </li>
              ) : rankingItems.length === 0 ? (
                <li className="col-span-2 py-12 text-center text-sm text-gray-500">
                  {isEnglish ? 'No ranking data yet.' : '집계된 랭킹 데이터가 없습니다.'}
                </li>
              ) : (
                <>
                  {rankingItems.map((item, index) => {
                    const rank = index + 1
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
                              color: '',
                              mood: '',
                            },
                          }}
                          className="relative flex cursor-pointer flex-col gap-2"
                        >
                          <div className="absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded bg-gray-900/90 text-[12px] font-bold text-white shadow-sm">
                            {rank}
                          </div>
                          <div className="aspect-[3/4] w-full min-h-0 overflow-hidden rounded-xl bg-gray-100">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={title}
                                className="h-full w-full min-h-0 rounded-xl object-cover object-center"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : null}
                          </div>
                          <div className="mt-2 flex w-full flex-col items-center justify-center px-1">
                            <p className="line-clamp-2 w-full text-center text-sm font-medium tracking-tight text-gray-800">
                              {title}
                            </p>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </>
              )}
            </ul>
            <div className="h-10 px-4 pb-4" aria-hidden />
          </div>
        </PageContainer>
      </div>
    </div>
  )
}
