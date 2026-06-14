import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery'
import { useLanguageContext } from '@/contexts/LanguageContext'
import type { NailDesignRow } from '@/shared/types/database.types'
import { Bookmark, ChevronLeft, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type DailySpecialPick = NailDesignRow & { dailyScore: number }

function formatTodayPickBadgeLabel(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `TODAY. ${m}.${day}`
}

function dateSeed(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? '').trim()
  const en = String(item.title_en ?? '').trim()
  if (isEnglish && en) return en
  return ko || en || (isEnglish ? 'Nail Design' : '네일 디자인')
}

function pickDailySpecialNails(
  rows: NailDesignRow[],
  count: number,
  d = new Date(),
): DailySpecialPick[] {
  const seed = dateSeed(d)
  return rows
    .filter((row) => row.id && row.image_url)
    .map((row) => ({
      ...row,
      dailyScore: hashString(`${seed}:${row.id}`),
    }))
    .sort((a, b) => a.dailyScore - b.dailyScore)
    .slice(0, count)
}

/** V1 에디토리얼 — 정적 매거진 UI (탭·무한 스크롤 없음) */
export default function ClientTodaySpecialPage() {
  const navigate = useNavigate()
  const { language } = useLanguageContext()
  const isEnglish = language === 'en'
  const today = useMemo(() => new Date(), [])
  const todayLabel = formatTodayPickBadgeLabel(today)
  const { data: hubData = [] } = useRecommendHubQuery()
  const editorPicks = useMemo(
    () => pickDailySpecialNails(hubData, 3, today),
    [hubData, today],
  )

  return (
    <div className="relative mx-auto w-full max-w-md bg-white">
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={isEnglish ? 'Go back' : '뒤로 가기'}
          className="-ml-2 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </button>

        <h1 className="pointer-events-none absolute left-1/2 max-w-[min(100%-5rem,16rem)] -translate-x-1/2 truncate text-center text-[17px] font-bold text-gray-900">
          {isEnglish ? "Today's Special Nails" : '오늘의 특별한 네일'}
        </h1>

        <Link
          to="/gallery"
          className="-mr-2 rounded-full p-2 text-gray-900 transition-colors hover:bg-gray-100"
          aria-label={isEnglish ? 'Search' : '검색'}
        >
          <Search className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </Link>
      </header>

      <div className="px-5 pb-6 pt-6">
        <span className="inline-block rounded-sm bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-600">
          {todayLabel}
        </span>
        <h2 className="mt-2 text-2xl font-bold leading-snug text-gray-900">
          {isEnglish ? (
            'Three Nails Picked by Our Editor Today ✨'
          ) : (
            <>
              오늘 하루, 에디터가 고른
              <br />
              네일 세 가지 ✨
            </>
          )}
        </h2>
        <p className="mt-2 text-[13px] text-gray-500">
          {isEnglish
            ? 'Meet a new combination every midnight from our highly viewed and saved collection.'
            : '매일 자정마다 조회·저장이 높은 작품 풀에서 새로운 조합으로 만나요.'}
        </p>
      </div>

      {editorPicks.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-gray-500">
          {isEnglish ? "Failed to load today's special nails." : '오늘의 네일을 불러오지 못했어요.'}
        </p>
      ) : (
      <div className="flex flex-col gap-10">
        {editorPicks.map((pick, index) => {
          const title = displayItemTitle(pick, isEnglish)
          return (
          <article key={pick.id} className="px-4">
            <Link
              to={`/detail/${pick.id}`}
              state={{
                initialNailData: {
                  ...pick,
                  title,
                },
              }}
              className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl"
            >
              <img
                src={pick.image_url}
                alt={title}
                className="h-full w-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : undefined}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span
                className="absolute right-4 top-4 rounded-full bg-white/70 p-2 backdrop-blur-sm"
                aria-label="북마크"
              >
                <Bookmark className="h-4 w-4 text-gray-800" strokeWidth={2} />
              </span>
              <span className="absolute bottom-10 left-4 rounded-sm bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                PICK
              </span>
              <h3 className="absolute bottom-4 left-4 text-lg font-bold text-white">
                {title}
              </h3>
            </Link>
          </article>
          )
        })}
      </div>
      )}
    </div>
  )
}
