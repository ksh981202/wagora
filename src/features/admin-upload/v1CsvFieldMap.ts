/** V1 CSV 헤더 별칭 허용 (BOM·공백·표기 차이) */
export function pickCsvCell(raw: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const direct = raw[key]
    if (direct != null && String(direct).trim() !== '') {
      return String(direct).trim()
    }
  }
  return ''
}

/** AdminUploadPage CSV_COLUMN_LABELS 22개 → DB 컬럼 1:1 */
export function mapV1RawRowToDetailFields(raw: Record<string, string>) {
  return {
    image_filename: pickCsvCell(raw, '파일명', '\uFEFF파일명'),
    title: pickCsvCell(raw, '썸네일 제목', '썸네일제목'),
    title_en: pickCsvCell(raw, '썸네일 제목(EN)', '썸네일제목(EN)'),
    description: pickCsvCell(raw, '상세 설명', '상세설명'),
    description_en: pickCsvCell(raw, '상세 설명(EN)', '상세설명(EN)'),
    color: pickCsvCell(raw, '컬러'),
    color_en: pickCsvCell(raw, '컬러(EN)', '컬러 (EN)'),
    nail_length: pickCsvCell(raw, '손톱길이', '손톱 길이'),
    length_en: pickCsvCell(raw, '손톱 길이(EN)', '손톱길이(EN)'),
    hand_type: pickCsvCell(raw, '추천 손타입', '추천손타입'),
    hand_type_en: pickCsvCell(raw, '추천 손타입(EN)', '추천손타입(EN)'),
    mood: pickCsvCell(raw, '무드/분위기', '무드', '무드/분위기 '),
    mood_en: pickCsvCell(raw, '무드/분위기(EN)', '무드(EN)'),
    situations: pickCsvCell(raw, '상세 상황', '상황'),
    occasion_en: pickCsvCell(raw, '상세 상황(EN)', '상황(EN)'),
    styles: pickCsvCell(raw, '스타일 태그', '스타일태그'),
    styles_en: pickCsvCell(raw, '스타일 태그(EN)', '스타일태그(EN)'),
    design_technique: pickCsvCell(raw, '디자인/기법', '디자인/ 기법'),
    technique_en: pickCsvCell(raw, '디자인/기법(EN)', '디자인/ 기법(EN)'),
    design_elements: pickCsvCell(
      raw,
      '디자인 요소 (또는 디자인 포인트)',
      '디자인 요소',
      '디자인요소',
    ),
    design_point_en: pickCsvCell(raw, '디자인 요소(EN)', '디자인요소(EN)'),
    procedure_guide: pickCsvCell(raw, '시술 가이드', '시술가이드'),
    guide_en: pickCsvCell(raw, '시술 가이드(EN)', '시술가이드(EN)'),
  }
}
