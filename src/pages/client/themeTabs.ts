/** 테마 허브/리스트 공통 V1 탭 라벨 */
export const THEME_TAB_LABELS = [
  '전체',
  '🌿 데일리',
  '💖 데이트',
  '💼 오피스',
  '💐 하객',
  '✈️ 여행',
  '🌴 바캉스',
  '🎪 페스티벌',
  '🎉 파티',
] as const

export type ThemeTabLabel = (typeof THEME_TAB_LABELS)[number]
