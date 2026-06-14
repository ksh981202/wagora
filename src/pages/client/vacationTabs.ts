/** 바캉스 네일 전용 리스트(`ClientVacationListPage`) 탭 라벨 */
export const VACATION_TABS = [
  '전체',
  '🏝️ 섬머/여름',
  '🎉 페스티벌',
  '✈️ 여행',
] as const

export type VacationTabLabel = (typeof VACATION_TABS)[number]
