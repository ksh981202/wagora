/** 계절 인기 네일 전용 리스트(`ClientSeasonPopularListPage`) — `?season=` 별 탭 */
export const SEASON_POPULAR_TABS: Record<string, string[]> = {
  봄: ['전체', '🌸 벚꽃/플라워', '🍑 피치/코랄', '🌿 파스텔/생기'],
  여름: ['전체', '🏄 바다/해변', '🧊 시럽/투명', '🌟 네온/비비드'],
  가을: ['전체', '🍁 낙엽/브릭', '🤎 매트/무광', '🐆 레오파드/호피'],
  겨울: ['전체', '❄️ 눈꽃/니트', '🎄 크리스마스', '🍷 버건디/벨벳'],
}

export const SEASON_POPULAR_SEASON_KEYS = ['봄', '여름', '가을', '겨울'] as const

export type SeasonPopularSeasonKey = (typeof SEASON_POPULAR_SEASON_KEYS)[number]

export function resolveSeasonPopularTabs(season: string | null): string[] {
  if (season && SEASON_POPULAR_TABS[season]) {
    return SEASON_POPULAR_TABS[season]
  }
  return SEASON_POPULAR_TABS['봄']
}
