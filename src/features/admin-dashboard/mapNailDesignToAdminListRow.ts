import type { NailDesignRow } from '@/shared/types/database.types'
import { formatTextArrayForDisplay } from '@/shared/lib/formatTextArrayField'
import { resolveSourceFilename } from './resolveSourceFilename'

/** 관리자 «등록 네일 관리» 목록·수정 폼용 (Supabase nail_designs → UI 행) */
export type AdminNailListRow = {
  id: string
  image_url: string
  image_r2_key: string
  title: string
  source_filename?: string | null
  created_at: string
  title_en?: string | null
  description?: string
  color?: string
  nail_length?: string
  hand_type?: string
  mood?: string
  situations?: string
  styles?: string
  design_technique?: string
  design_elements?: string
  procedure_guide?: string
  description_en?: string | null
  color_en?: string | null
  length_en?: string | null
  hand_type_en?: string | null
  mood_en?: string | null
  occasion_en?: string | null
  styles_en?: string | null
  technique_en?: string | null
  design_point_en?: string | null
  guide_en?: string | null
}

function textField(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return formatTextArrayForDisplay(value)
  return value?.trim() ?? ''
}

function arrayField(value: unknown, legacyFallback?: unknown): string {
  const direct = formatTextArrayForDisplay(value)
  if (direct) return direct
  return formatTextArrayForDisplay(legacyFallback)
}

export function mapNailDesignToAdminListRow(row: NailDesignRow): AdminNailListRow {
  const source_filename = resolveSourceFilename(row.source_filename, row.image_r2_key)
  const mood = textField(row.mood) || textField(row.category)

  return {
    id: row.id,
    image_url: row.image_url,
    image_r2_key: row.image_r2_key,
    title: row.title,
    title_en: textField(row.title_en) || null,
    created_at: row.created_at,
    source_filename,
    description: textField(row.description),
    description_en: textField(row.description_en) || null,
    color: textField(row.color),
    color_en: textField(row.color_en) || null,
    nail_length: textField(row.nail_length),
    length_en: textField(row.length_en) || null,
    hand_type: textField(row.hand_type),
    hand_type_en: textField(row.hand_type_en) || null,
    mood,
    mood_en: textField(row.mood_en) || null,
    situations: arrayField(row.situations, row.tags),
    occasion_en: arrayField(row.occasion_en) || null,
    styles: arrayField(row.styles, row.tags),
    styles_en: arrayField(row.styles_en, row.tags_en) || null,
    design_technique: textField(row.design_technique),
    technique_en: textField(row.technique_en) || null,
    design_elements: textField(row.design_elements),
    design_point_en: textField(row.design_point_en) || null,
    procedure_guide: textField(row.procedure_guide),
    guide_en: textField(row.guide_en) || null,
  }
}
