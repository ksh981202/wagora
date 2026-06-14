import type { NailDesignRow } from '../../../shared/types/database.types'
import { normalizeForFilter } from '../../../shared/utils/normalizeForFilter'

const ALL_TAB = '전체'

export function isAllTab(tab: string): boolean {
  return (
    tab === ALL_TAB ||
    normalizeForFilter(tab) === normalizeForFilter(ALL_TAB)
  )
}

export function filterByTab(
  items: NailDesignRow[],
  tab: string,
): NailDesignRow[] {
  if (isAllTab(tab)) return items
  const needle = normalizeForFilter(tab)
  if (!needle) return items
  return items.filter((item) => {
    const haystacks = [
      ...item.tags,
      item.category,
      item.title,
      item.title_en,
    ]
    return haystacks.some((h) => normalizeForFilter(h).includes(needle))
  })
}

export function sortNails(
  items: NailDesignRow[],
  sort: string,
): NailDesignRow[] {
  const copy = [...items]
  copy.sort((a, b) => {
    if (sort === '최신순') {
      const byTime =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (byTime !== 0) return byTime
    } else {
      if (b.popularity !== a.popularity) return b.popularity - a.popularity
    }
    return b.id.localeCompare(a.id)
  })
  return copy
}
