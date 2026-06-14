/** 스타일별 네일 갤러리 전용 리스트(`ClientStyleGalleryListPage`) 탭 라벨 */
export const STYLE_GALLERY_TAB_LABELS = [
  '✨ 전체',
  '🍒 귀여운 숏네일',
  '🦢 우아한 롱/연장',
  '🧊 스퀘어 쉐입',
  '💧 아몬드/오발',
] as const

export type StyleGalleryTabLabel = (typeof STYLE_GALLERY_TAB_LABELS)[number]
