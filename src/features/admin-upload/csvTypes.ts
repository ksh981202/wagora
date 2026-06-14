/** CSV 한 행 — V1 22컬럼 상세 필드 (Supabase nail_designs 1:1) */
export type CsvDesignRow = {
  image_filename: string
  title: string
  title_en: string
  description: string
  description_en: string
  color: string
  color_en: string
  nail_length: string
  length_en: string
  hand_type: string
  hand_type_en: string
  mood: string
  mood_en: string
  situations: string
  occasion_en: string
  styles: string
  styles_en: string
  design_technique: string
  technique_en: string
  design_elements: string
  design_point_en: string
  procedure_guide: string
  guide_en: string
}

export type MatchedRow = {
  csv: CsvDesignRow
  imageFile: File | null
  matched: boolean
}

export function emptyCsvDesignRow(image_filename = ''): CsvDesignRow {
  return {
    image_filename,
    title: '',
    title_en: '',
    description: '',
    description_en: '',
    color: '',
    color_en: '',
    nail_length: '',
    length_en: '',
    hand_type: '',
    hand_type_en: '',
    mood: '',
    mood_en: '',
    situations: '',
    occasion_en: '',
    styles: '',
    styles_en: '',
    design_technique: '',
    technique_en: '',
    design_elements: '',
    design_point_en: '',
    procedure_guide: '',
    guide_en: '',
  }
}
