export const SAVED_NAILS_CHANGED_EVENT = 'nailbook-saved-nails-changed'

export type SavedNailEntry = {
  id: string
  savedAt: string
}

function parseEntries(raw: string | null): SavedNailEntry[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw) as unknown
    if (!Array.isArray(p)) return []
    const out: SavedNailEntry[] = []
    for (const x of p) {
      if (!x || typeof x !== 'object') continue
      const id = String((x as { id?: unknown }).id ?? '').trim()
      if (!id) continue
      const savedAt =
        typeof (x as { savedAt?: unknown }).savedAt === 'string'
          ? (x as { savedAt: string }).savedAt
          : new Date().toISOString()
      out.push({ id, savedAt })
    }
    return out
  } catch {
    return []
  }
}

function savedStorageKey(userId?: string | null): string {
  const normalized = userId?.trim()
  return `savedNails_${normalized || '__guest__'}`
}

export function readSavedNailEntries(userId?: string | null): SavedNailEntry[] {
  if (typeof window === 'undefined') return []
  return parseEntries(localStorage.getItem(savedStorageKey(userId)))
}

export function getSavedNailsCount(userId?: string | null): number {
  return readSavedNailEntries(userId).length
}

export function isNailSavedInStorage(id: string, userId?: string | null): boolean {
  const tid = id?.trim()
  if (!tid) return false
  return readSavedNailEntries(userId).some((e) => e.id === tid)
}

function writeEntries(entries: SavedNailEntry[], userId?: string | null): void {
  localStorage.setItem(savedStorageKey(userId), JSON.stringify(entries))
  window.dispatchEvent(new CustomEvent(SAVED_NAILS_CHANGED_EVENT))
}

export function persistNailSaveState(
  nailId: string,
  saved: boolean,
  userId?: string | null,
): void {
  const tid = nailId?.trim()
  if (!tid || typeof window === 'undefined') return
  const rest = readSavedNailEntries(userId).filter((e) => e.id !== tid)
  if (saved) {
    writeEntries([{ id: tid, savedAt: new Date().toISOString() }, ...rest], userId)
  } else {
    writeEntries(rest, userId)
  }
}
