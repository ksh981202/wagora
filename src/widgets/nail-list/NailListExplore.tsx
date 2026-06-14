import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../shared/ui/PageContainer'

export type NailListQueryScope =
  | 'theme'
  | 'gallery'
  | 'ranking'
  | 'situation'
  | 'style'
  | 'season'
  | 'season-popular'
  | 'vacation'
  | 'color'
  | 'color-theme'
  | 'color-popular'

export type NailListExploreProps = {
  tabs: readonly string[]
  tabsSectionLabel: string
  queryScope: NailListQueryScope
  /** 랭킹: 첫 줄 버튼이 `sort`(인기순/저장순)만 바꿈 */
  rankingSortTabs?: boolean
  /** 순위 배지(1, 2, 3…) */
  showRankBadge?: boolean
}

const SORT_MENU_OPTIONS = [
  { value: '인기순', label: '인기순' },
  { value: '최신순', label: '최신순' },
  { value: '저장순', label: '저장 많은 순' },
] as const

const DUMMY_ITEMS = Array.from({ length: 12 }, (_, index) => ({
  id: `dummy-${index + 1}`,
  title: `네일 디자인 ${index + 1}`,
}))

export function NailListExplore({
  tabs,
  tabsSectionLabel,
  rankingSortTabs = false,
  showRankBadge = false,
}: NailListExploreProps) {
  const [activeTab, setActiveTab] = useState(() => tabs[0] ?? '전체')
  const [sort, setSort] = useState<(typeof SORT_MENU_OPTIONS)[number]['value']>('인기순')
  const [isSortOpen, setIsSortOpen] = useState(false)

  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null)
  const sortMenuRef = useRef<HTMLDivElement | null>(null)

  const sortMenuSelection =
    SORT_MENU_OPTIONS.find((o) => o.value === sort) ?? SORT_MENU_OPTIONS[0]

  useEffect(() => {
    if (tabs.length === 0) return
    const el = activeTabButtonRef.current
    if (!el) return
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeTab, tabs.length])

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

  return (
    <PageContainer className="!mx-auto !w-full !max-w-full bg-white !px-0 !py-0 sm:!px-0 lg:!px-0">
      <div className="w-full min-w-0 bg-white text-slate-900">
        <p className="sr-only">{tabsSectionLabel}</p>
        <div className="sticky top-0 z-50 w-full min-w-0 bg-white shadow-sm">
          {tabs.length > 0 && (
            <section
              className="scrollbar-hide flex w-full min-w-0 flex-nowrap gap-2 overflow-x-auto scroll-smooth whitespace-nowrap px-4 pb-2 pt-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              aria-label={tabsSectionLabel}
            >
              {tabs.map((label) => {
                const active = activeTab === label
                return (
                  <button
                    ref={active ? activeTabButtonRef : undefined}
                    key={label}
                    type="button"
                    data-active-tab={active ? 'true' : 'false'}
                    onClick={() => setActiveTab(label)}
                    className={
                      active
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
          )}

          {!rankingSortTabs && (
            <div className="relative flex w-full min-w-0 items-center justify-between px-4 pb-3 pt-2">
              <span className="text-sm text-gray-500">
                총{' '}
                <span className="font-bold text-pink-500">{DUMMY_ITEMS.length}</span>{' '}
                개의 디자인
              </span>
              <div ref={sortMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100"
                  aria-haspopup="menu"
                  aria-expanded={isSortOpen}
                  aria-label="정렬"
                >
                  <span>{sortMenuSelection.label}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
                {isSortOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[148px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    {SORT_MENU_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSort(opt.value)
                          setIsSortOpen(false)
                        }}
                        className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                          sort === opt.value
                            ? 'bg-gray-100 font-medium text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-4 px-4 pb-6 pt-4">
          {DUMMY_ITEMS.map((item, index) => (
            <li key={item.id}>
              <Link
                to={`/detail/${item.id}`}
                className={`flex cursor-pointer flex-col gap-2 ${
                  showRankBadge ? 'relative' : ''
                }`}
              >
                {showRankBadge && (
                  <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-gray-900 text-xs font-semibold text-white shadow-sm">
                    {index + 1}
                  </div>
                )}
                <div className="aspect-[3/4] w-full min-h-0 rounded-xl bg-gray-200" />
                <div className="mt-2 flex w-full flex-col items-center justify-center px-1">
                  <p className="line-clamp-2 w-full text-center text-sm font-medium tracking-tight text-gray-800">
                    {item.title}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  )
}
