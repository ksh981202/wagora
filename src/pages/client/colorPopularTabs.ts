/** 실시간 인기 컬러 네일 리스트(`ClientColorPopularListPage`) 탭 라벨 */
export const COLOR_POPULAR_TABS = [
  '전체',
  '🤍 화이트/누드',
  '🌸 핑크/코랄',
  '🍒 레드/버건디',
  '💙 블루/네이비',
  '🖤 블랙/무채색',
] as const

export type ColorPopularTabLabel = (typeof COLOR_POPULAR_TABS)[number]
