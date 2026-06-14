import { useLanguageContext } from '@/contexts/LanguageContext'
import { useCurrentUserId } from '@/features/my-page/useCurrentUserId'
import { supabase } from '@/shared/api/supabaseClient'
import type { NailDesignRow } from '@/shared/types/database.types'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type ListType = 'recent' | 'liked' | 'saved'
type UserActivityTable = 'user_recent_views' | 'user_likes' | 'user_saves'

const LIST_TITLES: Record<ListType, { ko: string; en: string }> = {
  recent: { ko: '최근 본 디자인', en: 'Recently Viewed' },
  liked: { ko: '좋아요 한 네일', en: 'Liked Nails' },
  saved: { ko: '내가 저장한 네일', en: 'Saved Nails' },
}

const LIST_PAGE_SIZE = 10
const MY_LIST_NAIL_COLUMNS = 'id,title,title_en,image_url'

const ACTIVITY_TABLE_BY_TYPE: Record<ListType, { table: UserActivityTable; orderColumn: string }> = {
  recent: { table: 'user_recent_views', orderColumn: 'viewed_at' },
  liked: { table: 'user_likes', orderColumn: 'created_at' },
  saved: { table: 'user_saves', orderColumn: 'created_at' },
}

type MyNailListPage = {
  items: NailDesignRow[]
  totalCount: number
}

function isListType(value: string | undefined): value is ListType {
  return value === 'recent' || value === 'liked' || value === 'saved'
}

function nailDisplayTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  return (isEnglish && en ? en : ko || en) || (isEnglish ? 'Nail Design' : '네일 디자인')
}

async function fetchMyNailListPage(
  type: ListType,
  userId: string | null,
  page: number,
): Promise<MyNailListPage> {
  if (!userId) return { items: [], totalCount: 0 }

  const { table, orderColumn } = ACTIVITY_TABLE_BY_TYPE[type]
  const from = (page - 1) * LIST_PAGE_SIZE
  const to = page * LIST_PAGE_SIZE - 1

  const { data: activityRows, count, error: activityError } = await supabase
    .from(table)
    .select('nail_id', { count: 'exact' })
    .eq('user_id', userId)
    .order(orderColumn, { ascending: false })
    .range(from, to)

  if (activityError) throw activityError

  const nailIds =
    activityRows
      ?.map((row) => String((row as { nail_id?: unknown }).nail_id ?? '').trim())
      .filter(Boolean) ?? []

  if (nailIds.length === 0) return { items: [], totalCount: count ?? 0 }

  const { data: nailRows, error: nailError } = await supabase
    .from('wagora_lookbooks')
    .select(MY_LIST_NAIL_COLUMNS)
    .in('id', nailIds)

  if (nailError) throw nailError

  const byId = new Map<string, NailDesignRow>()
  for (const row of nailRows ?? []) {
    const id = String(row.id ?? '').trim()
    if (id) byId.set(id, row as NailDesignRow)
  }

  return {
    items: nailIds
      .map((id) => byId.get(id))
      .filter((row): row is NailDesignRow => Boolean(row)),
    totalCount: count ?? 0,
  }
}

export default function ClientMyNailListPage() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const navigate = useNavigate()
  const { type: typeParam } = useParams<{ type: string }>()
  const currentUserId = useCurrentUserId()
  const observerRef = useRef<HTMLDivElement | null>(null)

  const listType = isListType(typeParam) ? typeParam : null
  const pageTitle = listType ? LIST_TITLES[listType][isEnglish ? 'en' : 'ko'] : ''

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login', { replace: true })
      }
    }
    void checkAuth()
  }, [navigate])

  useEffect(() => {
    if (!isListType(typeParam)) {
      navigate('/my', { replace: true })
    }
  }, [typeParam, navigate])

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['my-nail-list', listType, currentUserId],
    queryFn: ({ pageParam }) =>
      listType
        ? fetchMyNailListPage(listType, currentUserId, pageParam as number)
        : Promise.resolve({ items: [], totalCount: 0 }),
    enabled: Boolean(listType) && Boolean(currentUserId),
    initialPageParam: 1,
    staleTime: 30_000,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.items.length, 0)
      if (loadedCount >= lastPage.totalCount || lastPage.items.length < LIST_PAGE_SIZE) return undefined
      return (lastPageParam as number) + 1
    },
  })

  const nails = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  )
  const totalCount = data?.pages[0]?.totalCount ?? 0

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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, listType])

  const openDetail = (nailId: string, title: string, imageUrl: string) => {
    navigate(`/detail/${nailId}`, {
      state: {
        initialNailData: {
          id: nailId,
          imageUrl,
          title,
          color: '',
          mood: '',
        },
      },
    })
  }

  const handleEdit = () => {}

  if (!listType) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 mx-auto flex h-14 w-full max-w-md items-center border-b border-gray-100 bg-white px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-50"
          aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-bold text-gray-900">
          {pageTitle}
        </h1>
        <button
          type="button"
          onClick={handleEdit}
          className="flex h-10 shrink-0 items-center justify-center px-1 text-[15px] font-semibold text-gray-800"
        >
          {isEnglish ? 'Edit' : '편집'}
        </button>
      </header>

      <main className="w-full pb-10 pt-14">
        <p className="px-5 pb-4 pt-5 text-[14px] text-gray-600">
          {isEnglish ? 'Total ' : '총 '}
          <span className="font-bold text-[#FF7D66]">{totalCount}</span>
          {isEnglish ? ' designs' : '개의 디자인'}
        </p>

        <div className="grid grid-cols-2 gap-4 px-5">
          {isLoading ? (
            Array.from({ length: 6 }, (_, index) => (
              <article key={`my-nail-list-skel-${index}`} className="flex flex-col" aria-hidden>
                <div className="aspect-[3/4] w-full animate-pulse overflow-hidden rounded-2xl border border-black/5 bg-gray-100 shadow-sm" />
                <div className="mx-auto mt-2.5 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              </article>
            ))
          ) : isError ? (
            <p className="col-span-2 py-12 text-center text-sm text-gray-500">
              {isEnglish ? 'Failed to load designs.' : '디자인을 불러오지 못했어요.'}
            </p>
          ) : nails.length === 0 ? (
            <p className="col-span-2 py-12 text-center text-sm text-gray-500">
              {isEnglish ? 'No designs saved yet.' : '아직 등록된 디자인이 없어요.'}
            </p>
          ) : nails.map((item) => {
            const title = nailDisplayTitle(item, isEnglish)
            const imageUrl = String(item.image_url ?? '').trim()
            return (
              <article
                key={item.id}
                className="flex cursor-pointer flex-col"
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
                <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-black/5 bg-gray-100 shadow-sm">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="mt-2.5 flex w-full flex-col items-center justify-center">
                  <span className="line-clamp-1 w-full text-center text-sm font-medium tracking-tight text-gray-800">
                    {title}
                  </span>
                </div>
              </article>
            )
          })}
          {isFetchingNextPage
            ? [0, 1].map((index) => (
              <article key={`my-nail-list-next-skel-${index}`} className="flex flex-col" aria-hidden>
                <div className="aspect-[3/4] w-full animate-pulse overflow-hidden rounded-2xl border border-black/5 bg-gray-100 shadow-sm" />
                <div className="mx-auto mt-2.5 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              </article>
            ))
            : null}
        </div>
        <div ref={observerRef} className="h-10 px-5 pb-4" aria-hidden />
      </main>
    </div>
  )
}
