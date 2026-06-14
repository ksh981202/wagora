import { supabase } from '../../../shared/api/supabaseClient'
import { compressImageForUpload, toWebpFilename } from '../compressImageForUpload'
import type { CsvDesignRow } from '../csvTypes'
import {
  parseCsvTagList,
  resolveStylesEnFromCsv,
  resolveStylesFromCsv,
} from '../parseCsvTagList'
import type { NailDesignInsert } from '../../../shared/types/database.types'

type PresignedUploadResponse = {
  uploadUrl?: string
  publicUrl?: string
}

type PresignedDeleteResponse = {
  deleteUrl?: string
}

function safeFileStem(name: string): string {
  const base = name.replace(/^.*[/\\]/, '')
  const cleaned = base.replace(/[^\w.-]+/g, '_')
  return (cleaned || 'image').slice(0, 120)
}

export async function uploadToR2(file: File): Promise<{
  image_r2_key: string
  image_url: string
}> {
  const compressed = await compressImageForUpload(file)
  const image_r2_key = `uploads/${crypto.randomUUID()}_${safeFileStem(compressed.name)}`
  const { data, error } = await supabase.functions.invoke<PresignedUploadResponse>(
    'get-presigned-url',
    {
      body: {
        fileName: image_r2_key,
        contentType: 'image/webp',
      },
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.uploadUrl || !data.publicUrl) {
    throw new Error('Presigned URL 응답에 uploadUrl 또는 publicUrl이 없습니다.')
  }

  const uploadResponse = await fetch(data.uploadUrl, {
    method: 'PUT',
    body: compressed,
    headers: {
      'Content-Type': 'image/webp',
    },
  })

  if (!uploadResponse.ok) {
    throw new Error(`R2 업로드에 실패했습니다. (${uploadResponse.status})`)
  }

  return { image_r2_key, image_url: data.publicUrl }
}

export async function deleteFromR2(imageR2Key: string): Promise<void> {
  const key = imageR2Key.trim()
  if (!key) return

  const { data, error } = await supabase.functions.invoke<PresignedDeleteResponse>(
    'get-presigned-url',
    {
      body: {
        fileName: key,
        operation: 'delete',
      },
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.deleteUrl) {
    throw new Error('Presigned URL 응답에 deleteUrl이 없습니다.')
  }

  const deleteResponse = await fetch(data.deleteUrl, { method: 'DELETE' })
  if (!deleteResponse.ok) {
    throw new Error(`R2 삭제에 실패했습니다. (${deleteResponse.status})`)
  }
}

/** CSV V1 상세 → Supabase insert (필드 1:1, category/tags는 레거시 최소값만) */
export function buildNailInsertFromCsv(
  csv: CsvDesignRow,
  image_url: string,
  image_r2_key: string,
): NailDesignInsert {
  const title = csv.title.trim() || csv.image_filename
  const title_en = csv.title_en.trim() || title

  return {
    title,
    title_en,
    image_url,
    image_r2_key,
    source_filename: toWebpFilename(csv.image_filename.trim()),
    description: csv.description,
    description_en: csv.description_en,
    color: csv.color,
    color_en: csv.color_en,
    nail_length: csv.nail_length,
    length_en: csv.length_en,
    hand_type: csv.hand_type,
    hand_type_en: csv.hand_type_en,
    mood: csv.mood,
    mood_en: csv.mood_en,
    situations: parseCsvTagList(csv.situations),
    occasion_en: parseCsvTagList(csv.occasion_en),
    styles: resolveStylesFromCsv(csv),
    styles_en: resolveStylesEnFromCsv(csv),
    design_technique: csv.design_technique,
    technique_en: csv.technique_en,
    design_elements: csv.design_elements,
    design_point_en: csv.design_point_en,
    procedure_guide: csv.procedure_guide,
    guide_en: csv.guide_en,
    category: csv.mood.trim() || csv.color.trim() || '미분류',
    tags: [],
    tags_en: [],
    popularity: 0,
    saves: 0,
  }
}

export async function insertToSupabase(
  data: NailDesignInsert,
): Promise<{ id: string }> {
  const { data: row, error } = await supabase
    .from('wagora_lookbooks')
    .insert(data)
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }
  if (!row?.id) {
    throw new Error('Supabase insert 응답에 id가 없습니다.')
  }
  return { id: row.id as string }
}
