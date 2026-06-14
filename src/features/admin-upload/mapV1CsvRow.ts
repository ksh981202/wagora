import type { CsvDesignRow } from './csvTypes'
import { mapV1RawRowToDetailFields } from './v1CsvFieldMap'

/** AdminUploadPage(V1) Papa Parse 행 → nail_designs insert용 (22컬럼 1:1) */
export function mapV1CsvRowToDesignRow(raw: Record<string, string>): CsvDesignRow | null {
  const fields = mapV1RawRowToDetailFields(raw)
  if (!fields.image_filename) return null

  return {
    image_filename: fields.image_filename,
    title: fields.title,
    title_en: fields.title_en,
    description: fields.description,
    description_en: fields.description_en,
    color: fields.color,
    color_en: fields.color_en,
    nail_length: fields.nail_length,
    length_en: fields.length_en,
    hand_type: fields.hand_type,
    hand_type_en: fields.hand_type_en,
    mood: fields.mood,
    mood_en: fields.mood_en,
    situations: fields.situations,
    occasion_en: fields.occasion_en,
    styles: fields.styles,
    styles_en: fields.styles_en,
    design_technique: fields.design_technique,
    technique_en: fields.technique_en,
    design_elements: fields.design_elements,
    design_point_en: fields.design_point_en,
    procedure_guide: fields.procedure_guide,
    guide_en: fields.guide_en,
  }
}

export function mapV1CsvRowsToDesignRows(rows: Record<string, string>[]): CsvDesignRow[] {
  return rows
    .map((raw) => mapV1CsvRowToDesignRow(raw))
    .filter((row): row is CsvDesignRow => row != null)
}
