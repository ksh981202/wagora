import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../shared/api/supabaseClient'
import type { NailDesignRow } from '../../shared/types/database.types'

const NAIL_DESIGN_COLUMNS =
  'id,created_at,title,title_en,image_url,image_r2_key,category,tags,tags_en,popularity,saves'

const POP_POOL = 20
const LATEST_POOL = 30

function isMissingLookbookTable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'PGRST205'
  )
}

function shuffleNails(rows: NailDesignRow[]): NailDesignRow[] {
  return [...rows].sort(() => Math.random() - 0.5)
}

/**
 * 메인 홈 전용: `useNailQuery` 무한목록 로직은 건드리지 않고,
 * 동일 컬럼·동일 정렬 규칙으로 상위 행만 가져와 섹션별로 나눕니다.
 */
export function useClientHomeFeed() {
  return useQuery({
    queryKey: ['nail-designs', 'home-feed', 'supabase'],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<{
      recommend: NailDesignRow[]
      trend: NailDesignRow[]
      popular: NailDesignRow[]
    }> => {
      const popQ = supabase
        .from('wagora_lookbooks')
        .select(NAIL_DESIGN_COLUMNS)
        .order('popularity', { ascending: false })
        .order('id', { ascending: false })
        .limit(POP_POOL)
        .abortSignal(signal)

      const latestQ = supabase
        .from('wagora_lookbooks')
        .select(NAIL_DESIGN_COLUMNS)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(LATEST_POOL)
        .abortSignal(signal)

      const [{ data: popRows, error: e1 }, { data: latestRows, error: e2 }] =
        await Promise.all([popQ, latestQ])

      if (isMissingLookbookTable(e1) || isMissingLookbookTable(e2)) {
        return { recommend: [], trend: [], popular: [] }
      }
      if (e1) throw e1
      if (e2) throw e2

      const pop = (popRows ?? []) as NailDesignRow[]
      const latest = (latestRows ?? []) as NailDesignRow[]

      const recommend = shuffleNails(latest).slice(0, 5)
      const heroIds = new Set(recommend.map((n) => n.id))
      const trend = latest.filter((n) => !heroIds.has(n.id)).slice(0, 3)
      const popular = pop.filter((n) => !heroIds.has(n.id)).slice(0, 4)

      return { recommend, trend, popular }
    },
  })
}
