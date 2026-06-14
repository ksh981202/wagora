import type { CsvDesignRow } from './csvTypes'

/** CSV 셀(쉼표·세미콜론 구분) → Postgres text[] insert용 */
export function parseCsvTagList(raw: string): string[] {
  const text = raw?.trim() ?? ''
  if (!text) return []
  return text
    .split(/[,，;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 여러 CSV 셀을 split 후 순서 유지·중복 제거 병합 */
export function mergeCsvTagLists(...rawParts: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of rawParts) {
    for (const token of parseCsvTagList(part)) {
      const key = token.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(token)
    }
  }
  return out
}

/**
 * V1: '스타일 태그' 컬럼이 없으면 디자인/기법 + 디자인 요소를 합쳐 styles[] 생성
 */
export function resolveStylesFromCsv(csv: CsvDesignRow): string[] {
  const fromColumn = parseCsvTagList(csv.styles)
  if (fromColumn.length > 0) return fromColumn
  return mergeCsvTagLists(csv.design_technique, csv.design_elements)
}

/** V1: 스타일 태그(EN) 없으면 디자인/기법(EN) + 디자인 요소(EN) 병합 */
export function resolveStylesEnFromCsv(csv: CsvDesignRow): string[] {
  const fromColumn = parseCsvTagList(csv.styles_en)
  if (fromColumn.length > 0) return fromColumn
  return mergeCsvTagLists(csv.technique_en, csv.design_point_en)
}