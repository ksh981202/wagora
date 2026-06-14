/** 벚꽃 핑크 & 피치 테마 리스트(`ClientColorThemeListPage`) 탭 라벨 */
export const COLOR_THEME_TABS = [
  '🌸 전체',
  '🍑 피치 시럽',
  '🌷 수채화/생화',
  '💧 여리여리',
  '💗 러블리',
] as const

export type ColorThemeTabLabel = (typeof COLOR_THEME_TABS)[number]
