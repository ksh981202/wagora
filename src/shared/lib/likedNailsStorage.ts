export const LIKED_NAILS_CHANGED_EVENT = 'nailbook-liked-nails-changed'

export type LikedNailEntry = {
  id: string
  likedAt: string
}

function parseEntries(raw: string | null): LikedNailEntry[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw) as unknown
    if (!Array.isArray(p)) return []
    const out: LikedNailEntry[] = []
    for (const x of p) {
      if (!x || typeof x !== 'object') continue
      const id = String((x as { id?: unknown }).id ?? '').trim()
      if (!id) continue
      const likedAt =
        typeof (x as { likedAt?: unknown }).likedAt === 'string'
          ? (x as { likedAt: string }).likedAt
          : new Date().toISOString()
      out.push({ id, likedAt })
    }
    return out
  } catch {
    return []
  }
}

function likedStorageKey(userId?: string | null): string {
  const normalized = userId?.trim()
  return `likedNails_${normalized || '__guest__'}`
}

export function readLikedNailEntries(userId?: string | null): LikedNailEntry[] {
  if (typeof window === 'undefined') return []
  return parseEntries(localStorage.getItem(likedStorageKey(userId)))
}

export function getLikedNailsCount(userId?: string | null): number {
  return readLikedNailEntries(userId).length
}

export function isNailLikedInStorage(id: string, userId?: string | null): boolean {
  const tid = id?.trim()
  if (!tid) return false
  return readLikedNailEntries(userId).some((e) => e.id === tid)
}

function writeEntries(entries: LikedNailEntry[], userId?: string | null): void {
  localStorage.setItem(likedStorageKey(userId), JSON.stringify(entries))
  window.dispatchEvent(new CustomEvent(LIKED_NAILS_CHANGED_EVENT))
}

export function persistNailLikeState(
  nailId: string,
  liked: boolean,
  userId?: string | null,
): void {
  const tid = nailId?.trim()
  if (!tid || typeof window === 'undefined') return
  const rest = readLikedNailEntries(userId).filter((e) => e.id !== tid)
  if (liked) {
    writeEntries([{ id: tid, likedAt: new Date().toISOString() }, ...rest], userId)
  } else {
    writeEntries(rest, userId)
  }
}
