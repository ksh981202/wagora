import { supabase } from '@/shared/api/supabaseClient'
import type { NailDesignRow } from '@/shared/types/database.types'
import { useQuery } from '@tanstack/react-query'

const RECOMMEND_HUB_COLUMNS =
  'id,created_at,title,title_en,image_url,category,tags,situations,color,mood,styles,nail_length,design_elements,description,popularity,views,saves,likes'

const RECOMMEND_HUB_POOL_SIZE = 100

export function useRecommendHubQuery() {
  return useQuery({
    queryKey: ['nail-designs', 'recommend-hub', RECOMMEND_HUB_POOL_SIZE],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<NailDesignRow[]> => {
      const { data, error } = await supabase
        .from('wagora_lookbooks')
        .select(RECOMMEND_HUB_COLUMNS)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(RECOMMEND_HUB_POOL_SIZE)
        .abortSignal(signal)

      if (error) throw error
      return (data ?? []) as NailDesignRow[]
    },
  })
}
