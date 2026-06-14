/** 상황별 추천 네일 전용 리스트(`ClientSituationListPage`) 탭 */
export const SITUATION_TAB_LABELS = [
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

export type SituationTabLabel = (typeof SITUATION_TAB_LABELS)[number]
