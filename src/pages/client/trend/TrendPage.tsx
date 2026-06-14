import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery';
import { useLanguageContext } from '@/contexts/LanguageContext';
import type { NailDesignRow } from '@/shared/types/database.types';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

const TEXTURE_CAPTIONS = ['시럽 네일', '자석 네일', '미러파우더 네일'] as const;
const PARTS_CAPTIONS = ['스톤/큐빅 네일', '리본 네일', '진주 네일', '메탈/체인 네일'] as const;
const PATTERN_CAPTIONS = ['프렌치 네일', '마블 네일', '그라데이션 네일'] as const;

const TREND_CAPTION_EN: Record<string, string> = {
  '시럽 네일': 'Syrup Nails',
  '자석 네일': 'Magnet Nails',
  '미러파우더 네일': 'Mirror Powder Nails',
  '스톤/큐빅 네일': 'Stone & Cubic Nails',
  '리본 네일': 'Ribbon Nails',
  '진주 네일': 'Pearl Nails',
  '메탈/체인 네일': 'Metal & Chain Nails',
  '프렌치 네일': 'French Nails',
  '마블 네일': 'Marble Nails',
  '그라데이션 네일': 'Gradient Nails',
};

type TrendCardItem = {
  id: string;
  name: string;
  item?: NailDesignRow;
};

function captionKeyword(caption: string): string {
  return caption.replace(/\s*네일\s*$/g, '').trim();
}

function displayTrendCardName(item: TrendCardItem, isEnglish: boolean): string {
  if (!isEnglish) return item.name;
  return TREND_CAPTION_EN[item.name] ?? item.item?.title_en ?? item.item?.title ?? item.name;
}

function itemSearchText(item: NailDesignRow): string {
  return [
    item.title,
    item.title_en,
    item.category,
    item.color,
    item.mood,
    item.nail_length,
    item.design_elements,
    item.description,
    ...(item.tags ?? []),
    ...(item.situations ?? []),
    ...(item.styles ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function findMatchingNail(pool: NailDesignRow[], caption: string): NailDesignRow | undefined {
  const keyword = captionKeyword(caption).toLowerCase();
  const tokens = keyword.split(/[/\s]+/).filter(Boolean);
  return pool.find((item) => {
    const haystack = itemSearchText(item);
    return haystack.includes(keyword) || tokens.some((token) => haystack.includes(token));
  });
}

function buildTrendCards(captions: readonly string[], pool: NailDesignRow[]): TrendCardItem[] {
  return captions.map((caption) => ({
    id: caption,
    name: caption,
    item: findMatchingNail(pool, caption),
  }));
}

function findMoodHero(pool: NailDesignRow[]): NailDesignRow | undefined {
  return pool.find((item) => {
    const haystack = itemSearchText(item);
    return haystack.includes('힙한') || haystack.includes('유니크');
  });
}

export default function TrendPage() {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === 'en';
  const { data: hubData = [] } = useRecommendHubQuery();

  const textureItems = useMemo(() => buildTrendCards(TEXTURE_CAPTIONS, hubData), [hubData]);
  const partsItems = useMemo(() => buildTrendCards(PARTS_CAPTIONS, hubData), [hubData]);
  const patternItems = useMemo(() => buildTrendCards(PATTERN_CAPTIONS, hubData), [hubData]);
  const moodHeroItem = useMemo(() => findMoodHero(hubData), [hubData]);

  const openDetail = (item?: NailDesignRow) => {
    if (!item) return;
    navigate(`/detail/${item.id}`, {
      state: { initialNailData: item },
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-50 text-gray-900">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-[#F2E8DA]/40 bg-gray-50 px-5">
        <button
          type="button"
          className="p-2 -ml-2 text-gray-900 transition-colors hover:bg-gray-100 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-900 whitespace-nowrap">
          {isEnglish ? 'Trend Nails' : '트렌드 네일'}
        </h1>
        <button
          type="button"
          className="p-2 -mr-2 text-gray-900 transition-colors hover:bg-gray-100 rounded-full"
          onClick={() => navigate('/search')}
        >
          <Search className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </button>
      </header>

      <main className="w-full bg-gray-50 px-0 pb-8 text-gray-900">
        
        {/* 섹션 1: 텍스처 트렌드 */}
        <section className="px-5 pt-6">
          <div className="mb-5 flex w-full items-center justify-between gap-2">
            <h2 className="text-[20px] font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Texture Trend' : '텍스처 트렌드'}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/texture')}
              className="text-[13px] font-medium text-gray-500 cursor-pointer"
            >
              {isEnglish ? 'View All >' : '전체보기 >'}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {textureItems.map(item => (
              <button key={item.id} type="button" onClick={() => openDetail(item.item)} className="flex w-44 shrink-0 flex-col bg-transparent p-0 text-left">
                <div className="w-full aspect-[3/4] rounded-2xl bg-gray-100 shadow-sm overflow-hidden">
                  {item.item?.image_url ? (
                    <img
                      src={item.item.image_url}
                      alt={displayTrendCardName(item, isEnglish)}
                      className="w-full aspect-[3/4] object-cover object-center rounded-2xl shadow-sm"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>
                <span className="mt-3 w-full text-center text-sm font-medium text-gray-800 line-clamp-1">
                  {displayTrendCardName(item, isEnglish)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 섹션 2: 포인트 파츠 트렌드 */}
        <section className="mt-12 px-5">
          <div className="mb-5 flex w-full items-center justify-between gap-2">
            <h2 className="text-[20px] font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Point Parts Trend' : '포인트 파츠 트렌드'}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/parts')}
              className="text-sm font-medium text-gray-500 cursor-pointer"
            >
              {isEnglish ? 'View All >' : '전체보기 >'}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {partsItems.map(item => (
              <button key={item.id} type="button" onClick={() => openDetail(item.item)} className="flex w-32 shrink-0 flex-col bg-transparent p-0 text-left">
                <div className="w-full aspect-[3/4] rounded-2xl bg-gray-100 shadow-sm overflow-hidden">
                  {item.item?.image_url ? (
                    <img
                      src={item.item.image_url}
                      alt={displayTrendCardName(item, isEnglish)}
                      className="w-full aspect-[3/4] rounded-2xl object-cover object-center shadow-sm"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>
                <p className="font-sans font-medium text-[13px] sm:text-[14px] text-gray-800 tracking-tight text-center mt-2.5">
                  {displayTrendCardName(item, isEnglish)}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* 섹션 3: 아트 & 패턴 트렌드 */}
        <section className="mt-12 px-5">
          <div className="mb-5 flex w-full items-center justify-between gap-2">
            <h2 className="text-[20px] font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Art & Pattern Trend' : '아트 & 패턴 트렌드'}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/pattern')}
              className="text-sm font-medium text-gray-500 cursor-pointer"
            >
              {isEnglish ? 'View All >' : '전체보기 >'}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {patternItems.map(item => (
              <button key={item.id} type="button" onClick={() => openDetail(item.item)} className="flex w-32 shrink-0 flex-col bg-transparent p-0 text-left">
                <div className="w-full aspect-[3/4] rounded-2xl bg-gray-100 shadow-sm overflow-hidden">
                  {item.item?.image_url ? (
                    <img
                      src={item.item.image_url}
                      alt={displayTrendCardName(item, isEnglish)}
                      className="w-full aspect-[3/4] object-cover object-center rounded-2xl shadow-sm"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>
                <span className="mt-3 w-full text-center text-sm font-medium text-gray-800 line-clamp-1">
                  {displayTrendCardName(item, isEnglish)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 섹션 4: 핫 트렌드 무드 */}
        <section className="mb-6 mt-8 w-full px-5">
          <div className="mb-5 flex w-full items-center justify-between gap-2">
            <h2 className="text-[20px] font-bold tracking-tight text-gray-900">
              {isEnglish ? 'Hot Trend Mood' : '핫 트렌드 무드'}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/mood')}
              className="text-sm font-medium text-gray-500 cursor-pointer"
            >
              {isEnglish ? 'View All >' : '전체보기 >'}
            </button>
          </div>
          <div className="w-full">
            <div className="relative w-full h-[180px] rounded-2xl overflow-hidden bg-gray-100 shadow-sm" onClick={() => openDetail(moodHeroItem)}>
              {moodHeroItem?.image_url ? (
                <img
                  src={moodHeroItem.image_url}
                  alt={isEnglish ? 'Hot Trend Mood' : '핫 트렌드 무드'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
                <span className="font-sans font-bold text-[13px] tracking-widest text-white/90 drop-shadow-md mb-1.5">
                  AESTHETIC MOOD
                </span>
                <h3 className="font-sans text-lg font-bold text-white drop-shadow-lg mb-4">
                  {isEnglish ? 'The Hottest Nail Mood Now' : '요즘 가장 핫한 네일 무드'}
                </h3>
                <div className="px-5 py-2 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-bold rounded-full shadow-md">
                  View Moodboard
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
