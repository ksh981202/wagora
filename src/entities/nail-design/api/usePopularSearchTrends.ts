import { supabase } from '@/shared/api/supabaseClient'
import { useQuery } from '@tanstack/react-query'

export type PopularSearchTrendRow = {
  keyword: string
  search_count: number
}

export function usePopularSearchTrends(limit = 5) {
  return useQuery({
    queryKey: ['popular-search-trends', { limit }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_stats')
        .select('keyword, search_count')
        .order('search_count', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data ?? []) as PopularSearchTrendRow[]
    },
    staleTime: 3 * 60 * 1000,
  })
}
