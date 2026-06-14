import { fetchNailDesignsBySearch } from '@/entities/nail-design/api/fetchNailDesignsBySearch'
import { usePopularSearchTrends } from '@/entities/nail-design/api/usePopularSearchTrends'
import { useLanguageContext } from '@/contexts/LanguageContext'
import { supabase } from '@/shared/api/supabaseClient'
import { ALLOWED_NAIL_KEYWORDS } from '@/shared/constants/allowedNailKeywords'
import { NAIL_KEYWORD_EN_DICTIONARY } from '@/shared/constants/nailKeywords'
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from '@/shared/lib/recentSearchStorage'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const TREND_SKELETON_ROWS = 5

const SKELETON_COUNT = 6

function PopularTrendStatusIcon({ index }: { index: number }) {
  return (
    <div className="flex w-10 shrink-0 items-center justify-end">
      {(index === 0 || index === 1) && (
        <TrendingUp className="h-5 w-5 text-rose-400" strokeWidth={2} aria-hidden />
      )}
      {index === 2 && (
        <span className="rounded-sm border border-rose-400 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
          NEW
        </span>
      )}
      {index === 3 && <span className="text-base font-medium leading-none text-gray-300">-</span>}
      {index === 4 && (
        <TrendingDown className="h-5 w-5 text-gray-400" strokeWidth={2} aria-hidden />
      )}
    </div>
  )
}

function SearchResultSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <article key={`search-skel-${i}`} className="flex flex-col gap-2" aria-hidden>
          <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-gray-100" />
          <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        </article>
      ))}
    </>
  )
}

export default function SearchMainPage() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q')?.trim() ?? ''
  const hasQuery = q.length > 0

  const [draft, setDraft] = useState(q)
  const [isEditing, setIsEditing] = useState(!q)
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearches())
  const [suggestedStyles, setSuggestedStyles] = useState<string[]>([])

  const showResultHeader = !isEditing && q.length > 0
  const displaySearchTerm = (term: string) => {
    if (!term) return ''
    return isEnglish ? (NAIL_KEYWORD_EN_DICTIONARY[term] || term) : term
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSuggestedStyles([...ALLOWED_NAIL_KEYWORDS].sort(() => 0.5 - Math.random()).slice(0, 5))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!q) return
    addRecentSearch(q)
  }, [q])

  const submitSearch = useCallback(
    (keyword?: string) => {
      const term = (keyword ?? draft).trim()
      if (!term) {
        setSearchParams({}, { replace: true })
        setDraft('')
        setIsEditing(true)
        return
      }
      addRecentSearch(term)
      setRecentSearches(getRecentSearches())
      setDraft(term)
      setSearchParams({ q: term })

      const isValidNailKeyword = ALLOWED_NAIL_KEYWORDS.some((kw) => term.includes(kw))
      if (isValidNailKeyword) {
        void (async () => {
          const { error } = await supabase.rpc('log_search_keyword', { search_term: term })
          void error
        })()
      }

      setIsEditing(false)
    },
    [draft, setSearchParams],
  )

  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['nail-designs', 'search', q],
    queryFn: () => fetchNailDesignsBySearch(q),
    enabled: hasQuery,
    staleTime: 30_000,
  })

  const {
    data: popularTrends = [],
    isLoading: isTrendsLoading,
    isError: isTrendsError,
  } = usePopularSearchTrends()

  const openDetail = (id: string, title: string, imageUrl: string) => {
    navigate(`/detail/${id}`, {
      state: {
        initialNailData: {
          id,
          imageUrl,
          title,
          color: '',
          mood: '',
        },
      },
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-gray-900">
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-gray-100 bg-white">
        {showResultHeader ? (
          <div className="flex h-14 w-full items-center gap-2 px-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-900"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2} />
            </button>
            <h1 className="min-w-0 flex-1 truncate px-1 text-center text-[16px] font-bold text-gray-900">
              {isEnglish ? `"${displaySearchTerm(q)}" Search Results` : `'${q}' 검색 결과`}
            </h1>
            <button
              type="button"
              onClick={() => {
                setDraft(q)
                setIsEditing(true)
              }}
              aria-label={isEnglish ? 'Search' : '검색'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 active:bg-gray-100"
            >
              <Search className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-full items-center px-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-900"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2} />
              </button>
              <h1 className="min-w-0 flex-1 pr-10 text-center text-[17px] font-bold text-gray-900">
                {isEnglish ? 'Search' : '검색'}
              </h1>
            </div>
            <div className="border-t border-gray-50 px-4 py-3">
              <div className="flex w-full items-center gap-2.5 rounded-full bg-gray-100 px-4 py-2.5">
                <Search className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
                <input
                  type="search"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitSearch()
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none"
                  placeholder={isEnglish ? 'Enter a search term' : '검색어를 입력하세요'}
                  aria-label={isEnglish ? 'Search nail designs' : '네일 디자인 검색'}
                />
              </div>
            </div>
          </>
        )}
      </header>

      <main
        className={`w-full min-w-0 flex-1 ${showResultHeader ? 'pt-14' : 'pt-[6.75rem]'}`}
      >
        {hasQuery ? (
          <>
            {!isLoading && !isError && results.length > 0 ? (
              <p className="px-5 pt-4 pb-2 text-[13px] font-medium text-gray-500">
                {isEnglish ? (
                  <>
                    Total <strong className="font-bold text-[#FF7D66]">{results.length}</strong>{' '}
                    designs
                  </>
                ) : (
                  <>
                    총 <strong className="font-bold text-[#FF7D66]">{results.length}</strong>개의
                    디자인
                  </>
                )}
              </p>
            ) : null}
            <div className="grid w-full min-w-0 grid-cols-2 gap-4 px-5 pt-4 pb-8">
            {isLoading ? (
              <SearchResultSkeleton />
            ) : isError ? (
              <p className="col-span-2 py-12 text-center text-sm text-gray-500">
                {isEnglish
                  ? 'An error occurred while searching...'
                  : '검색 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'}
              </p>
            ) : results.length === 0 ? (
              <p className="col-span-2 py-12 text-center text-sm text-gray-500">
                {isEnglish
                  ? `No designs found for "${displaySearchTerm(q)}".`
                  : `'${q}'에 맞는 디자인을 찾지 못했어요.`}
              </p>
            ) : (
              results.map((item) => {
              const koTitle = String(item.title ?? '').trim()
              const enTitle = String(item.title_en ?? '').trim()
              const title =
                isEnglish && enTitle
                  ? enTitle
                  : koTitle || enTitle || (isEnglish ? 'Nail Design' : '네일 디자인')
              const imageUrl = String(item.image_url ?? '').trim()
              return (
                <article
                  key={item.id}
                  className="flex cursor-pointer flex-col gap-2"
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(item.id, title, imageUrl)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openDetail(item.id, title, imageUrl)
                    }
                  }}
                >
                  <div className="aspect-[3/4] w-full min-h-0 overflow-hidden rounded-xl bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full min-h-0 rounded-xl object-cover object-center"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                  <p className="line-clamp-2 w-full px-1 text-center text-sm font-medium tracking-tight text-gray-800">
                    {title}
                  </p>
                </article>
              )
              })
            )}
            </div>
          </>
        ) : (
          <div className="w-full min-w-0 px-5 pt-4">
          <section className="mb-10">
            <div className="relative mx-auto mb-6 flex h-[200px] w-full max-w-[220px] items-center justify-center">
              <div
                className="absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-50"
                aria-hidden
              />
              <div className="relative z-10 flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-full bg-gray-100 shadow-sm">
                <img
                  src="/search/GL-0000358.jpg"
                  alt={isEnglish ? 'Search main nail design' : '검색 메인 네일'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
            <p className="whitespace-pre-line text-center text-lg font-bold leading-tight text-slate-900">
              {isEnglish
                ? 'What kind of nail design are you looking for?'
                : '어떤 네일을 찾고 싶으세요?'}
              {'\n'}
              {isEnglish ? 'Discover various designs' : '다양한 디자인을 찾아보세요'}
            </p>
          </section>

          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-gray-900">
                {isEnglish ? 'Recent Searches' : '최근 검색어'}
              </h2>
              {recentSearches.length > 0 ? (
                <button
                  type="button"
                  className="text-sm font-medium text-gray-500"
                  onClick={() => {
                    clearRecentSearches()
                    setRecentSearches([])
                  }}
                >
                  {isEnglish ? 'Clear All >' : '전체삭제 >'}
                </button>
              ) : null}
            </div>
            {recentSearches.length === 0 ? (
              <p className="text-sm text-gray-500">
                {isEnglish ? 'No recent searches.' : '최근 검색어가 없습니다'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => submitSearch(term)}
                    className="rounded-full bg-gray-100 px-3.5 py-1.5 text-[13px] font-medium text-gray-700"
                  >
                    {displaySearchTerm(term)}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-gray-900">
                {isEnglish ? 'Popular Search Trends' : '인기 검색어 트렌드'}
              </h2>
              <button
                type="button"
                className="text-sm font-medium text-gray-500"
                onClick={() => navigate('/search-trend-list')}
              >
                {isEnglish ? 'View All >' : '전체보기 >'}
              </button>
            </div>
            <div className="flex flex-col">
              {isTrendsLoading ? (
                Array.from({ length: TREND_SKELETON_ROWS }, (_, i) => (
                  <div
                    key={`trend-skel-${i}`}
                    className="flex items-center gap-3 border-b border-gray-50 py-3.5 last:border-0"
                    aria-hidden
                  >
                    <div className="h-5 w-6 shrink-0 animate-pulse rounded bg-gray-100" />
                    <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
                  </div>
                ))
              ) : isTrendsError ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  {isEnglish ? 'Failed to load popular trends.' : '인기 검색어를 불러오지 못했어요.'}
                </p>
              ) : popularTrends.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  {isEnglish
                    ? 'No popular trends available yet.'
                    : '아직 집계된 인기 검색어가 없어요.'}
                </p>
              ) : (
                popularTrends.map((item, index) => {
                  const rank = index + 1
                  const keyword = String(item.keyword ?? '').trim()
                  if (!keyword) return null
                  return (
                    <button
                      key={`${rank}-${keyword}`}
                      type="button"
                      onClick={() => submitSearch(keyword)}
                      className="flex w-full cursor-pointer items-center justify-between border-b border-gray-50 py-3.5 text-left last:border-0"
                    >
                      <span className="flex min-w-0 flex-1 items-center">
                        <span
                          className={`w-6 shrink-0 text-left text-[15px] font-bold ${
                            rank <= 3 ? 'text-[#FF7E67]' : 'text-gray-400'
                          }`}
                        >
                          {rank}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-gray-800">
                          {displaySearchTerm(keyword)}
                        </span>
                      </span>
                      <PopularTrendStatusIcon index={index} />
                    </button>
                  )
                })
              )}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-base font-bold text-gray-900">
              {isEnglish ? 'How about these styles?' : '이런 스타일은 어때요?'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {suggestedStyles.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => submitSearch(keyword)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-600 shadow-sm"
                >
                  #{isEnglish ? (NAIL_KEYWORD_EN_DICTIONARY[keyword] || keyword) : keyword}
                </button>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => navigate('/category')}
            className="flex w-full items-center justify-center gap-0.5 rounded-xl border border-gray-200 bg-white py-4 text-sm font-semibold text-gray-900 shadow-sm"
          >
            {isEnglish ? 'View All Categories >' : '카테고리 전체보기 >'}
          </button>
          </div>
        )}
      </main>
    </div>
  )
}
