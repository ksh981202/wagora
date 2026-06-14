/** 스타일 허브/리스트 공통 V1 탭 라벨 */
export const STYLE_TAB_LABELS = [
  '전체',
  '✨ 심플',
  '💎 화려한',
  '🌙 프렌치',
  '🖍️ 드로잉',
  '🌈 그라데이션',
] as const

export type StyleTabLabel = (typeof STYLE_TAB_LABELS)[number]
