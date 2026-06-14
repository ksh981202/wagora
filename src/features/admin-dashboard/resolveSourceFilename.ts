const UUID_PREFIX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}_/i

const UUID_ONLY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** `uploads/{uuid}_{원본파일명}` 형태 R2 키에서 CSV 원본 파일명 추출 */
export function extractOriginalFilenameFromR2Key(imageR2Key: string): string | null {
  const base = imageR2Key.split('/').filter(Boolean).pop()?.trim()
  if (!base || UUID_ONLY.test(base)) return null

  if (UUID_PREFIX.test(base)) {
    const name = base.replace(UUID_PREFIX, '').trim()
    return name || null
  }

  const underscore = base.indexOf('_')
  if (underscore > 0 && underscore < base.length - 1) {
    const name = base.slice(underscore + 1).trim()
    return name || null
  }

  return null
}

export function resolveSourceFilename(
  sourceFilename: string | null | undefined,
  imageR2Key: string,
): string | null {
  const fromDb = sourceFilename?.trim()
  if (fromDb && !UUID_ONLY.test(fromDb)) return fromDb

  return extractOriginalFilenameFromR2Key(imageR2Key)
}
