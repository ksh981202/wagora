import { supabase } from '../../../shared/api/supabaseClient'
import type { NailDesignRow } from '../../../shared/types/database.types'

const SEARCH_COLUMNS = 'id,title,title_en,image_url'
const SEARCH_LIMIT = 60

/** PostgREST `.or()` 구분자(`,`) 및 `ilike` 와일드카드 충돌 방지 */
function escapePostgrestIlikePattern(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, ' ')
    .trim()
}

function buildSearchOrFilter(query: string): string {
  const needle = escapePostgrestIlikePattern(query)
  if (!needle) return ''
  const pattern = `%${needle}%`
  return [
    `title.ilike.${pattern}`,
    `color.ilike.${pattern}`,
    `mood.ilike.${pattern}`,
    `design_elements.ilike.${pattern}`,
    `title_en.ilike.${pattern}`,
    `color_en.ilike.${pattern}`,
    `mood_en.ilike.${pattern}`,
    `design_point_en.ilike.${pattern}`,
  ].join(',')
}

export type NailDesignSearchRow = Pick<NailDesignRow, 'id' | 'title' | 'title_en' | 'image_url'>

export async function fetchNailDesignsBySearch(query: string): Promise<NailDesignSearchRow[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const orFilter = buildSearchOrFilter(trimmed)
  if (!orFilter) return []

  const { data, error } = await supabase
    .from('wagora_lookbooks')
    .select(SEARCH_COLUMNS)
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(SEARCH_LIMIT)

  if (error) throw error
  return (data ?? []) as NailDesignSearchRow[]
}
