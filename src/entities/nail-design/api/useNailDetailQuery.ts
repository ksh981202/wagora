import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../shared/api/supabaseClient'
import type { NailDesignRow } from '../../../shared/types/database.types'

const NAIL_DESIGN_COLUMNS = [
  'id',
  'created_at',
  'title',
  'title_en',
  'image_url',
  'image_r2_key',
  'source_filename',
  'description',
  'description_en',
  'color',
  'color_en',
  'nail_length',
  'length_en',
  'hand_type',
  'hand_type_en',
  'mood',
  'mood_en',
  'situations',
  'occasion_en',
  'styles',
  'styles_en',
  'design_technique',
  'technique_en',
  'design_elements',
  'design_point_en',
  'procedure_guide',
  'guide_en',
  'category',
  'tags',
  'tags_en',
  'popularity',
  'views',
  'likes',
  'saves',
].join(',')

export function useNailDetailQuery(nailId: string | undefined) {
  return useQuery({
    queryKey: ['nail-design', 'detail', 'supabase', nailId],
    queryFn: async (): Promise<NailDesignRow | null> => {
      if (!nailId) return null
      const { data, error } = await supabase
        .from('wagora_lookbooks')
        .select(NAIL_DESIGN_COLUMNS)
        .eq('id', nailId)
        .single()
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
      }
      return data as unknown as NailDesignRow
    },
    enabled: Boolean(nailId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
