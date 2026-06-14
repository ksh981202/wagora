import { useLanguageContext } from '@/contexts/LanguageContext'
import { supabase } from '@/shared/api/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type BoardPostRow = {
  id: string
  title: string | null
  content: string | null
  title_en: string | null
  content_en: string | null
  created_at: string | null
}

function formatNoticeDate(raw: string | null): string {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export default function ClientNoticePage() {
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['board-posts', 'notice'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('wagora_lookbooks')
        .select('id,title,content,title_en,content_en,created_at')
        .eq('is_active', true)
        .eq('post_type', 'notice')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (rows ?? []) as BoardPostRow[]
    },
    staleTime: 30_000,
  })

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <header className="fixed top-0 left-0 right-0 z-50 mx-auto flex h-14 w-full max-w-md items-center border-b border-gray-100 bg-white px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-50"
          aria-label="뒤로 가기"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1 className="min-w-0 flex-1 text-center text-[17px] font-bold text-gray-900 pr-10">
          {isEnglish ? 'Notice' : '공지사항'}
        </h1>
      </header>

      <main className="w-full px-5 pb-10 pt-14">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          {isLoading ? (
            <div className="px-5 py-8 text-center text-[14px] text-gray-500">
              {isEnglish ? 'Loading posts...' : '글을 불러오는 중입니다.'}
            </div>
          ) : isError || data.length === 0 ? (
            <div className="px-5 py-8 text-center text-[14px] text-gray-500">
              {isEnglish ? 'No posts yet.' : '등록된 글이 없습니다.'}
            </div>
          ) : (
            data.map((item) => {
            const title = (isEnglish && item.title_en ? item.title_en : item.title) || ''
            const content = (isEnglish && item.content_en ? item.content_en : item.content) || ''
            const date = formatNoticeDate(item.created_at)
            const isOpen = expandedId === item.id
            return (
              <div key={item.id} className="border-b border-gray-50 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left active:bg-gray-50"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-gray-900">{title}</p>
                    {date ? <p className="mt-1 text-[12px] text-gray-400">{date}</p> : null}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <div className="border-t border-gray-50 bg-gray-50/80 px-5 py-4">
                    <div
                      className="whitespace-pre-wrap break-words break-all overflow-hidden text-[14px] leading-relaxed text-gray-600 [&_a]:text-[#FF7D66] [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc"
                      dangerouslySetInnerHTML={{ __html: content ?? '' }}
                    />
                  </div>
                ) : null}
              </div>
            )
          })
          )}
        </div>
      </main>
    </div>
  )
}
