/** 계절별 맞춤 네일 전용 리스트(`ClientSeasonListPage`) 탭 라벨 */
export const SEASON_TABS = [
  '전체',
  '🌸 봄',
  '🌊 여름',
  '🍁 가을',
  '❄️ 겨울',
] as const

export type SeasonTabLabel = (typeof SEASON_TABS)[number]
