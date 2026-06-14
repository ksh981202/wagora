/**
 * 탭/태그 비교용: 공백·이모지·특수문자 제거 후 소문자(호환용) 정규화.
 * 한글 등은 `\p{L}` 로 유지됩니다.
 */
export function normalizeForFilter(text: string): string {
  const compact = text.normalize('NFKC').replace(/\s+/g, '')
  const withoutEmoji = compact.replace(
    /\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu,
    '',
  )
  return withoutEmoji
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase()
}
