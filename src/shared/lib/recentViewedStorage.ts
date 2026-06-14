export const RECENT_VIEWED_CHANGED_EVENT = 'recent_viewed_nails_changed'
export const MAX_RECENT_VIEWED_NAILS = 20
const GUEST_RECENT_VIEWS_KEY = 'recentViews_guest'

function recentStorageKey(userId?: string | null): string {
  const normalized = userId?.trim()
  return normalized ? `recentViews_${normalized}` : GUEST_RECENT_VIEWS_KEY
}

export function readRecentViewedIds(userId?: string | null): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(recentStorageKey(userId))
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

function writeRecentViewedIds(ids: string[], userId?: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const bounded = ids.slice(0, MAX_RECENT_VIEWED_NAILS)
    window.localStorage.setItem(recentStorageKey(userId), JSON.stringify(bounded))
    window.dispatchEvent(new Event(RECENT_VIEWED_CHANGED_EVENT))
  } catch {
    /* localStorage unavailable */
  }
}

export function pushRecentViewedNailId(nailId: string, userId?: string | null): void {
  const id = nailId?.trim()
  if (!id) return
  const prev = readRecentViewedIds(userId)
  const next = [id, ...prev.filter((v) => v !== id)].slice(0, MAX_RECENT_VIEWED_NAILS)
  writeRecentViewedIds(next, userId)
}

export function mergeGuestRecentViewedToUser(userId: string): void {
  const normalizedUserId = userId?.trim()
  if (!normalizedUserId || typeof window === 'undefined') return

  const guestIds = readRecentViewedIds(null)
  if (guestIds.length === 0) return

  const userIds = readRecentViewedIds(normalizedUserId)
  const merged = [...guestIds, ...userIds].filter(
    (id, idx, arr) => arr.indexOf(id) === idx,
  )

  writeRecentViewedIds(merged.slice(0, MAX_RECENT_VIEWED_NAILS), normalizedUserId)
  window.localStorage.removeItem(GUEST_RECENT_VIEWS_KEY)
}
