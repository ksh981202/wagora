import { normalizeForFilter } from '../../shared/utils/normalizeForFilter'

/** 컬러별 모아보기 전용 리스트(`ClientColorListPage`) 탭 라벨 */
export const COLOR_LIST_TABS = [
  '전체',
  '🌸 핑크',
  '🍒 레드',
  '🤎 누드',
  '🎨 파스텔',
  '🌊 블루',
  '☁️ 화이트',
  '🖤 블랙',
  '✨ 글리터',
] as const

export type ColorListTabLabel = (typeof COLOR_LIST_TABS)[number]

export function resolveColorListHeaderTitle(tab: string): string {
  if (
    tab === '전체' ||
    normalizeForFilter(tab) === normalizeForFilter('전체')
  ) {
    return '컬러별 모아보기'
  }
  const match = COLOR_LIST_TABS.find(
    (label) =>
      label === tab || normalizeForFilter(label) === normalizeForFilter(tab),
  )
  return match ?? tab
}
