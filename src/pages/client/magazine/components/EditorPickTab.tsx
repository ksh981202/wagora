import { useLanguageContext } from '@/contexts/LanguageContext'
import { supabase } from '@/shared/api/supabaseClient'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 10

type EditorPickPost = {
  id: string
  title: string | null
  title_en: string | null
  thumbnail_url: string | null
  created_at: string | null
}

async function fetchEditorPickPosts(page: number): Promise<EditorPickPost[]> {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error } = await supabase
    .from('wagora_lookbooks')
    .select('id, title, title_en, thumbnail_url, created_at')
    .eq('post_type', 'magazine_editor')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return (data ?? []) as EditorPickPost[]
}

function renderHighlightedTitle(title: string) {
  const match = title.match(/^(\[[^\]]+\])\s*(.*)$/)

  if (!match) return title

  return (
    <>
      <span className="mr-1 font-bold text-rose-500">{match[1]}</span>
      {match[2]}
    </>
  )
}

function getPostTitle(post: EditorPickPost, isEnglish: boolean): string {
  const primaryTitle = isEnglish ? post.title_en : post.title
  const fallbackTitle = isEnglish ? post.title : post.title_en

  return primaryTitle?.trim() || fallbackTitle?.trim() || (isEnglish ? 'Untitled' : '제목 없음')
}

function ThumbnailPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-semibold text-gray-400">
      GELIA
    </div>
  )
}

export default function EditorPickTab() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const sentinelRef = useRef<HTMLDivElement>(null)
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['magazine-editor-posts'],
    queryFn: ({ pageParam }) => fetchEditorPickPosts(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
  })

  const posts = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage()
      }
    })

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isLoading) {
    return (
      <section className="mt-8 rounded-3xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-500">
          {isEnglish ? 'Loading...' : '로딩 중...'}
        </p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="mt-8 rounded-3xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-500">
          {isEnglish ? 'Unable to load content.' : '콘텐츠를 불러오지 못했습니다.'}
        </p>
      </section>
    )
  }

  if (posts.length === 0) {
    return (
      <section className="mt-8 rounded-3xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-500">
          {isEnglish ? 'No content has been added.' : '등록된 콘텐츠가 없습니다.'}
        </p>
      </section>
    )
  }

  const [heroPost, ...listPosts] = posts
  const heroTitle = getPostTitle(heroPost, isEnglish)

  return (
    <section className="mt-8 space-y-6">
      <Link to={`/magazine/${heroPost.id}`} className="block cursor-pointer">
        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100">
          {heroPost.thumbnail_url ? (
            <img
              src={heroPost.thumbnail_url}
              alt={heroTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <ThumbnailPlaceholder />
          )}
        </div>
        <div className="mt-4 space-y-2">
          <h2 className="text-xl font-bold tracking-tight leading-snug text-gray-900 mt-4">
            {renderHighlightedTitle(heroTitle)}
          </h2>
        </div>
      </Link>

      {listPosts.length > 0 ? (
        <div className="space-y-4">
          {listPosts.map((post) => {
            const title = getPostTitle(post, isEnglish)

            return (
              <Link
                key={post.id}
                to={`/magazine/${post.id}`}
                className="flex cursor-pointer gap-4 border-t border-gray-100 pt-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold tracking-tight leading-snug text-gray-800 line-clamp-2">
                    {renderHighlightedTitle(title)}
                  </h3>
                </div>
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ThumbnailPlaceholder />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : null}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      {isFetchingNextPage ? (
        <p className="py-4 text-center text-xs font-semibold text-gray-400">
          {isEnglish ? 'Loading more content...' : '콘텐츠를 불러오는 중...'}
        </p>
      ) : null}
    </section>
  )
}
