/** 가장 많이 찾은 스타일 BEST 전용 리스트(`ClientStyleBestListPage`) 탭 라벨 */
export const STYLE_BEST_TAB_LABELS = [
  '🔥 실시간 급상승',
  '👑 주간 베스트',
  '🏆 월간 랭킹',
  '⭐ 역대 누적 BEST',
] as const

export type StyleBestTabLabel = (typeof STYLE_BEST_TAB_LABELS)[number]
