/** Postgres text[] / JSON 배열 / CSV 문자열 → 수정 폼용 "a, b, c" */
export function formatTextArrayForDisplay(value: unknown): string {
  if (value == null) return ''

  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter((v) => v && v !== '[]' && v !== '{}')
      .join(', ')
  }

  if (typeof value !== 'string') return ''

  const s = value.trim()
  if (!s || s === '[]' || s === '{}') return ''

  if (s.startsWith('{') && s.endsWith('}')) {
    return parsePostgresTextArrayLiteral(s).join(', ')
  }

  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const parsed: unknown = JSON.parse(s)
      if (Array.isArray(parsed)) {
        return formatTextArrayForDisplay(parsed)
      }
    } catch {
      /* fall through */
    }
  }

  if (s.includes(',') || s.includes('，')) {
    return s
      .split(/[,，]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ')
  }

  return s
}

function parsePostgresTextArrayLiteral(literal: string): string[] {
  const inner = literal.slice(1, -1).trim()
  if (!inner) return []

  const out: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]!
    if (c === '"') {
      inQuote = !inQuote
      continue
    }
    if (c === ',' && !inQuote) {
      pushToken(out, cur)
      cur = ''
      continue
    }
    cur += c
  }
  pushToken(out, cur)
  return out
}

function pushToken(out: string[], raw: string) {
  const t = raw.trim().replace(/^"|"$/g, '')
  if (t && t !== '[]') out.push(t)
}
