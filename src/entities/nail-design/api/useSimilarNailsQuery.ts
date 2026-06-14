import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../shared/api/supabaseClient'
import type { NailDesignRow } from '../../../shared/types/database.types'

const SIMILAR_COLUMNS = 'id,title,title_en,image_url,created_at'
const SIMILAR_LIMIT = 5

export type SimilarNailRow = Pick<
  NailDesignRow,
  'id' | 'title' | 'title_en' | 'image_url' | 'created_at'
>

/** 현재 네일을 제외한 최신 네일 N건 (유사도 계산 없음) */
export function useSimilarNailsQuery(excludeId: string | undefined) {
  const trimmedExclude = excludeId?.trim() || undefined

  return useQuery({
    queryKey: ['nail-designs', 'similar-latest', trimmedExclude, SIMILAR_LIMIT],
    enabled: Boolean(trimmedExclude),
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<SimilarNailRow[]> => {
      const fetchLimit = SIMILAR_LIMIT + 1
      const { data, error } = await supabase
        .from('wagora_lookbooks')
        .select(SIMILAR_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)
        .abortSignal(signal)

      if (error) throw error

      return (data ?? [])
        .filter((row) => row.id !== trimmedExclude)
        .slice(0, SIMILAR_LIMIT) as SimilarNailRow[]
    },
  })
}
