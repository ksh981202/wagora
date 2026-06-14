import { useLanguageContext } from '@/contexts/LanguageContext'
import { supabase } from '@/shared/api/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Share2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type MagazineDetailPost = {
  id: string
  title: string | null
  title_en: string | null
  content: string | null
  content_en: string | null
  thumbnail_url: string | null
  created_at: string | null
}

const DEFAULT_OG_IMAGE = 'https://gelia.app/ogimage/og-image.webp'

async function fetchMagazinePost(id: string): Promise<MagazineDetailPost | null> {
  const { data, error } = await supabase
    .from('wagora_lookbooks')
    .select('id, title, title_en, content, content_en, thumbnail_url, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as MagazineDetailPost | null
}

function formatCreatedAt(raw: string | null, isEnglish: boolean): string {
  if (!raw) return ''

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function getPlainTextSummary(html: string | null): string {
  if (!html) return ''

  const container = document.createElement('div')
  container.innerHTML = html
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 150)
}

function upsertMetaTag(
  selector: string,
  attrName: 'property' | 'name',
  attrValue: string,
  content: string,
): HTMLMetaElement | null {
  const head = document.head
  if (!head) return null
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    head.appendChild(el)
  }
  el.setAttribute('content', content)
  return el
}

function getMetaContent(selector: string): string | null {
  return document.querySelector(selector)?.getAttribute('content') ?? null
}

function restoreMetaTag(
  selector: string,
  attrName: 'property' | 'name',
  attrValue: string,
  content: string | null,
) {
  if (content == null) {
    document.querySelector(selector)?.remove()
    return
  }
  upsertMetaTag(selector, attrName, attrValue, content)
}

async function copyCurrentUrl() {
  const url = window.location.href

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = url
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function MagazineDetailSkeleton({ isEnglish }: { isEnglish: boolean }) {
  return (
    <article
      aria-busy="true"
      aria-label={isEnglish ? 'Loading magazine article' : '매거진 게시글 로딩 중'}
      className="space-y-7"
    >
      <div className="aspect-[4/5] w-full animate-pulse rounded-3xl bg-gray-100 shadow-sm" />

      <div className="space-y-3">
        <div className="h-7 w-11/12 animate-pulse rounded-full bg-gray-100" />
        <div className="h-7 w-3/5 animate-pulse rounded-full bg-gray-100" />
        <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100" />
      </div>

      <div className="space-y-3 rounded-3xl bg-white p-5 shadow-sm">
        <div className="h-4 w-full animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-11/12 animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-10/12 animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-gray-100" />
      </div>
    </article>
  )
}

export default function ClientMagazineDetailPage() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const navigate = useNavigate()
  const { id } = useParams()
  const {
    data: post,
    isPending,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['magazine-post', id],
    queryFn: () => fetchMagazinePost(id ?? ''),
    enabled: Boolean(id),
  })
  const showLoading = isPending || isLoading || isFetching

  const handleShareClick = async () => {
    try {
      await copyCurrentUrl()
      alert(isEnglish ? 'Link copied to clipboard.' : '링크가 복사되었습니다')
    } catch (error) {
      console.error('링크 복사 실패:', error)
      alert(isEnglish ? 'Failed to copy the link.' : '링크 복사에 실패했습니다.')
    }
  }

  const title =
    (isEnglish && post?.title_en ? post.title_en : post?.title)?.trim() ||
    (isEnglish ? 'Untitled' : '제목 없음')
  const content = isEnglish && post?.content_en ? post.content_en : post?.content
  const createdAt = formatCreatedAt(post?.created_at ?? null, isEnglish)

  useEffect(() => {
    if (!post) return

    const originalTitle = document.title
    const originalDescription = getMetaContent('meta[name="description"]')
    const originalOgType = getMetaContent('meta[property="og:type"]')
    const originalOgTitle = getMetaContent('meta[property="og:title"]')
    const originalOgDescription = getMetaContent('meta[property="og:description"]')
    const originalOgImage = getMetaContent('meta[property="og:image"]')
    const originalOgUrl = getMetaContent('meta[property="og:url"]')
    const localizedTitle = isEnglish && post.title_en ? post.title_en : post.title
    const localizedContent = isEnglish && post.content_en ? post.content_en : post.content
    const seoTitle = `${localizedTitle?.trim() || (isEnglish ? 'Untitled' : '제목 없음')} | GELIA Magazine`
    const description =
      getPlainTextSummary(localizedContent) ||
      (isEnglish
        ? 'Read the latest nail trend article from GELIA Magazine.'
        : '젤리아 매거진에서 최신 네일 트렌드 콘텐츠를 확인해 보세요.')
    const ogImage = post.thumbnail_url?.trim() || DEFAULT_OG_IMAGE
    const ogUrl = window.location.href

    document.title = seoTitle
    upsertMetaTag('meta[name="description"]', 'name', 'description', description)
    upsertMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', seoTitle)
    upsertMetaTag('meta[property="og:description"]', 'property', 'og:description', description)
    upsertMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    upsertMetaTag('meta[property="og:url"]', 'property', 'og:url', ogUrl)

    return () => {
      document.title = originalTitle
      restoreMetaTag('meta[name="description"]', 'name', 'description', originalDescription)
      restoreMetaTag('meta[property="og:type"]', 'property', 'og:type', originalOgType)
      restoreMetaTag('meta[property="og:title"]', 'property', 'og:title', originalOgTitle)
      restoreMetaTag(
        'meta[property="og:description"]',
        'property',
        'og:description',
        originalOgDescription,
      )
      restoreMetaTag('meta[property="og:image"]', 'property', 'og:image', originalOgImage)
      restoreMetaTag('meta[property="og:url"]', 'property', 'og:url', originalOgUrl)
    }
  }, [post, isEnglish])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-background/90 px-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm"
          aria-label={isEnglish ? 'Go back' : '뒤로가기'}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-900">
          {isEnglish ? "Editor's Pick" : '에디터 픽'}
        </h2>
        <button
          type="button"
          onClick={() => void handleShareClick()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm"
          aria-label={isEnglish ? 'Share' : '공유하기'}
        >
          <Share2 className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </header>

      <main className="px-5 pb-10 pt-5">
        {showLoading ? (
          <MagazineDetailSkeleton isEnglish={isEnglish} />
        ) : isError ? (
          <p className="py-16 text-center text-sm font-semibold text-gray-500">
            {isEnglish ? 'Unable to load the article.' : '게시글을 불러오지 못했습니다.'}
          </p>
        ) : post ? (
          <article>
            <h1 className="text-2xl font-bold leading-snug text-gray-900">{title}</h1>
            {createdAt ? (
              <time dateTime={post.created_at ?? undefined} className="mt-3 block text-xs font-medium text-gray-400">
                {createdAt}
              </time>
            ) : null}
            <div
              className="mt-8 whitespace-pre-wrap break-words break-all overflow-hidden text-base leading-relaxed text-gray-700 [&_a]:text-[#FF7D66] [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_img]:my-5 [&_img]:max-w-full [&_img]:rounded-2xl [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-5 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: content ?? '' }}
            />
          </article>
        ) : (
          <p className="py-16 text-center text-sm font-semibold text-gray-500">
            {isEnglish ? 'Article not found.' : '게시글을 찾을 수 없습니다.'}
          </p>
        )}
      </main>
    </div>
  )
}
