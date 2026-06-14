/** 컬러 큐레이션(`ClientColorCurationPage`) 탭 — `?color=` SSOT 값 */
export const COLOR_CURATION_TABS = [
  { label: '🌸 핑크', value: '핑크' },
  { label: '🍒 레드', value: '레드' },
  { label: '🤎 누드', value: '누드' },
  { label: '🎨 파스텔', value: '파스텔' },
  { label: '🌊 블루', value: '블루' },
  { label: '☁️ 화이트', value: '화이트' },
  { label: '🖤 블랙', value: '블랙' },
  { label: '✨ 글리터', value: '글리터' },
] as const

export const DEFAULT_COLOR_CURATION = COLOR_CURATION_TABS[0].value

export const COLOR_HERO_CAPTIONS: Record<string, string> = {
  핑크: '로맨틱 핑크 무드',
  레드: '레드 네일 베스트 트렌드',
  누드: '내추럴 누드 베이지',
  파스텔: '파스텔 드림 컬러',
  블루: '시원한 블루 포인트',
  화이트: '클린 화이트 무드',
  블랙: '시크 블랙 네일',
  글리터: '반짝 글리터 포인트',
}

export function resolveColorCurationIndex(color: string | null): number {
  if (!color) return 0
  const idx = COLOR_CURATION_TABS.findIndex((t) => t.value === color)
  return idx >= 0 ? idx : 0
}
