import { formatTextArrayForDisplay } from '@/shared/lib/formatTextArrayField'
import type { NailDesignRow } from '@/shared/types/database.types'

function splitToTokens(value: unknown): string[] {
  const csv = formatTextArrayForDisplay(value)
  if (!csv) return []
  return csv
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function toHashtag(label: string): string {
  const t = label.trim().replace(/^#/, '')
  return t ? `#${t}` : ''
}

/** 상세 페이지 해시태그 칩용 (중복 제거) */
export function buildNailDetailHashtags(row: NailDesignRow): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const add = (raw: string) => {
    const tag = toHashtag(raw)
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) return
    seen.add(key)
    out.push(tag)
  }

  for (const t of splitToTokens(row.situations)) add(t)
  for (const t of splitToTokens(row.styles)) add(t)
  for (const t of splitToTokens(row.tags)) add(t)

  const scalars = [
    row.color,
    row.nail_length,
    row.mood,
    row.design_technique,
    row.design_elements,
  ]
  for (const s of scalars) {
    if (typeof s === 'string' && s.trim()) add(s)
  }

  return out
}

/** 디자인 포인트 카드 텍스트 (최대 4개) */
export function buildNailDesignPointLabels(row: NailDesignRow): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const push = (raw: string) => {
    const t = raw.trim()
    const key = t.toLowerCase()
    if (!t || seen.has(key)) return
    seen.add(key)
    out.push(t)
  }

  if (row.design_elements?.trim()) push(row.design_elements)
  if (row.design_technique?.trim()) push(row.design_technique)
  for (const t of splitToTokens(row.styles)) {
    push(t)
    if (out.length >= 4) break
  }

  return out.slice(0, 4)
}
