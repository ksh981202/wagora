export const MAX_RECENT_SEARCHES = 10
const RECENT_SEARCHES_KEY = 'gelia_recent_searches'

function writeRecentSearches(terms: string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(terms.slice(0, MAX_RECENT_SEARCHES)),
    )
  } catch {
    /* localStorage unavailable */
  }
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean)
  } catch {
    return []
  }
}

export function addRecentSearch(term: string): void {
  const normalized = term.trim()
  if (!normalized) return
  const prev = getRecentSearches()
  const next = [normalized, ...prev.filter((t) => t !== normalized)].slice(0, MAX_RECENT_SEARCHES)
  writeRecentSearches(next)
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch {
    /* localStorage unavailable */
  }
}
