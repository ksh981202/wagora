import { supabase } from '../../../shared/api/supabaseClient'
import type { NailDesignRow } from '../../../shared/types/database.types'

const BY_IDS_COLUMNS = 'id,title,title_en,image_url'

/** 요청 ID 순서를 유지한 채 `nail_designs` 행을 반환합니다. */
export async function fetchNailDesignsByIds(ids: string[]): Promise<NailDesignRow[]> {
  const normalizedIds = ids.map((id) => id?.trim()).filter((id): id is string => Boolean(id))
  if (normalizedIds.length === 0) return []

  const dedupedIds: string[] = []
  const seen = new Set<string>()
  for (const id of normalizedIds) {
    if (seen.has(id)) continue
    seen.add(id)
    dedupedIds.push(id)
  }

  const { data, error } = await supabase
    .from('wagora_lookbooks')
    .select(BY_IDS_COLUMNS)
    .in('id', dedupedIds)

  if (error) throw error

  const byId = new Map<string, NailDesignRow>()
  for (const row of data ?? []) {
    if (row?.id?.trim()) byId.set(row.id, row as NailDesignRow)
  }

  return dedupedIds
    .map((id) => byId.get(id))
    .filter((row): row is NailDesignRow => Boolean(row))
}
