import { supabase } from '@/shared/api/supabaseClient'
import type { NailDesignRow } from '@/shared/types/database.types'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

export const GALLERY_PAGE_SIZE = 10
export const DEFAULT_GALLERY_TAB = '전체'
export const DEFAULT_GALLERY_SORT = '인기순'

const GALLERY_COLUMNS =
  'id,created_at,title,title_en,image_url,category,tags,tags_en,popularity,saves,situations,styles,nail_length,color,mood,design_elements'
const ARRAY_TEXT_FILTER_INDEXES = [0, 1, 2, 3, 4, 5] as const
const NAIL_SYNONYMS: Record<string, string[]> = {
  형광: ['네온', '비비드', '팝', '원색', 'neon', 'vivid', 'fluorescent', '형광'],
  올드머니: ['고급스러운', '클래식', '우아한', '심플한', '단정한', 'old money', '올드머니'],
  시크: ['모던', '블랙', '도도한', '무채색', '도시적인', 'chic', '시크'],
  은하수: ['우주', '별', '갤럭시', '글리터', '밤하늘', '마그네틱', '은하수'],
  소라: ['스카이블루', '하늘색', '연하늘', '파스텔블루', '소라'],
  '시크 파스텔': ['모던 파스텔', '톤다운 파스텔', '뮤트', '시크 파스텔'],
  겨울: ['니트', '눈', '크리스마스', '포근한', '연말', '겨울'],
  테라조: ['대리석', '메추리알', '도트', '점박이', '테라조'],
  딥한: ['다크', '진한', '가을', '블랙', '딥'],
  엠보: ['입체', '3D', '니트', '물방울', '볼록', '엠보'],
  맑은: ['시럽', '투명', '클리어', '유리알', '수채화', '맑은'],
  동물: ['호피', '레오파드', '고양이', '강아지', '곰돌이', '베어', '동물'],
  은박: ['호일', '메탈릭', '실버포인트', '은박'],
}

function isMissingLookbookTable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'PGRST205'
  )
}

/** PostgREST `.or()` 구분자(`,`) 및 `ilike` 와일드카드 충돌 방지 */
function escapePostgrestIlikePattern(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, ' ')
    .trim()
}

function expandSynonymTokens(normalizedTab: string, tokens: string[]): string[] {
  const expanded = new Set<string>(tokens)

  for (const synonym of NAIL_SYNONYMS[normalizedTab] ?? []) {
    const normalizedSynonym = synonym.trim()
    if (normalizedSynonym) expanded.add(normalizedSynonym)
  }

  for (const token of tokens) {
    for (const synonym of NAIL_SYNONYMS[token] ?? []) {
      const normalizedSynonym = synonym.trim()
      if (normalizedSynonym) expanded.add(normalizedSynonym)
    }
  }

  return [...expanded]
}

function buildTabOrFilter(tab: string): string {
  const normalized = tab
    .replace(/\//g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized) return ''

  const baseTokens = normalized
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== DEFAULT_GALLERY_TAB)
  const tokens = [
    ...new Set(
      expandSynonymTokens(normalized, baseTokens)
        .map((part) => escapePostgrestIlikePattern(part))
        .filter((ilike) => ilike.length > 0),
    ),
  ]

  if (tokens.length === 0) return ''

  const parts: string[] = []
  for (const ilike of tokens) {
    parts.push(
      `title.ilike.%${ilike}%`,
      `category.ilike.%${ilike}%`,
      `nail_length.ilike.%${ilike}%`,
      `color.ilike.%${ilike}%`,
      `mood.ilike.%${ilike}%`,
      `design_elements.ilike.%${ilike}%`,
    )
    for (const index of ARRAY_TEXT_FILTER_INDEXES) {
      parts.push(
        `situations->>${index}.ilike.%${ilike}%`,
        `styles->>${index}.ilike.%${ilike}%`,
        `tags->>${index}.ilike.%${ilike}%`,
      )
    }
  }
  return parts.join(',')
}

function applyGallerySort<T extends { order: (column: string, options: { ascending: boolean }) => T }>(
  query: T,
  sort: string,
): T {
  if (sort === '최신순') {
    return query.order('created_at', { ascending: false }).order('id', { ascending: false })
  }
  if (sort === '저장 많은 순') {
    return query.order('saves', { ascending: false }).order('id', { ascending: false })
  }
  return query.order('popularity', { ascending: false }).order('id', { ascending: false })
}

export function normalizeGallerySort(raw: string | null): string {
  if (raw === 'realtime' || raw === 'weekly' || raw === 'monthly' || raw === 'alltime') {
    return raw
  }
  if (raw === '최신순' || raw === '저장 많은 순' || raw === '인기순') return raw
  return DEFAULT_GALLERY_SORT
}

type GalleryQueryOptions = {
  enabled?: boolean
  baseTab?: string
}

export function useGalleryInfiniteQuery(tab: string, sort: string, options?: GalleryQueryOptions) {
  const normalizedTab = tab.trim() || DEFAULT_GALLERY_TAB
  const normalizedSort = normalizeGallerySort(sort)
  const normalizedBaseTab = options?.baseTab?.trim() ?? ''

  return useInfiniteQuery({
    queryKey: [
      'nail-designs',
      'gallery',
      'infinite',
      { tab: normalizedTab, sort: normalizedSort, baseTab: normalizedBaseTab },
    ],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const page = pageParam as number
      const from = (page - 1) * GALLERY_PAGE_SIZE
      const to = page * GALLERY_PAGE_SIZE - 1

      let query = supabase.from('wagora_lookbooks').select(GALLERY_COLUMNS)

      if (normalizedBaseTab && normalizedBaseTab !== DEFAULT_GALLERY_TAB) {
        const baseFilter = buildTabOrFilter(normalizedBaseTab)
        if (baseFilter) query = query.or(baseFilter)
      }

      if (normalizedTab !== DEFAULT_GALLERY_TAB) {
        const orFilter = buildTabOrFilter(normalizedTab)
        if (orFilter && normalizedTab !== normalizedBaseTab) query = query.or(orFilter)
      }

      query = applyGallerySort(query, normalizedSort)

      const { data, error } = await query.range(from, to).abortSignal(signal)
      if (isMissingLookbookTable(error)) return []
      if (error) throw error
      return (data ?? []) as NailDesignRow[]
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < GALLERY_PAGE_SIZE) return undefined
      return (lastPageParam as number) + 1
    },
  })
}

export function useGalleryCountQuery(tab: string, options?: GalleryQueryOptions) {
  const normalizedTab = tab.trim() || DEFAULT_GALLERY_TAB
  const normalizedBaseTab = options?.baseTab?.trim() ?? ''

  return useQuery({
    queryKey: ['nail-designs', 'gallery', 'count', { tab: normalizedTab, baseTab: normalizedBaseTab }],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
    queryFn: async ({ signal }) => {
      let query = supabase
        .from('wagora_lookbooks')
        .select('*', { count: 'exact', head: true })

      if (normalizedBaseTab && normalizedBaseTab !== DEFAULT_GALLERY_TAB) {
        const baseFilter = buildTabOrFilter(normalizedBaseTab)
        if (baseFilter) query = query.or(baseFilter)
      }

      if (normalizedTab !== DEFAULT_GALLERY_TAB) {
        const orFilter = buildTabOrFilter(normalizedTab)
        if (orFilter && normalizedTab !== normalizedBaseTab) query = query.or(orFilter)
      }

      const { count, error } = await query.abortSignal(signal)
      if (isMissingLookbookTable(error)) return 0
      if (error) throw error
      return count ?? 0
    },
  })
}
