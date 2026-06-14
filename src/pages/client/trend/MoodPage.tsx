import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery';
import { useLanguageContext } from '@/contexts/LanguageContext';
import type { NailDesignRow } from '@/shared/types/database.types';
import { CurationFallback } from '@/shared/ui/CurationFallback';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

const MOOD_TABS = ["🎀 발레코어", "🎧 Y2K/키치", "🥂 올드머니/시크"] as const;

const MOOD_TAB_LABEL_EN: Record<(typeof MOOD_TABS)[number], string> = {
  "🎀 발레코어": "🎀 Balletcore",
  "🎧 Y2K/키치": "🎧 Y2K/Kitsch",
  "🥂 올드머니/시크": "🥂 Old Money/Chic",
};

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? "")
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveActiveMoodTab(rawTab: string | null): (typeof MOOD_TABS)[number] {
  const pure = extractPureThemeKeyword(rawTab ?? "");
  return MOOD_TABS.find((tab) => tab === rawTab || extractPureThemeKeyword(tab) === pure) ?? MOOD_TABS[0];
}

function displayMoodTabLabel(tab: (typeof MOOD_TABS)[number], isEnglish: boolean): string {
  return isEnglish ? MOOD_TAB_LABEL_EN[tab] : tab;
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? "Nail Design" : "네일 디자인");
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
    .join(" ")
    .toLowerCase();
}

function matchesAnyKeyword(item: NailDesignRow, keywords: string[]): boolean {
  const haystack = itemSearchText(item);
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function filterMoodItems(items: NailDesignRow[], keyword: string): NailDesignRow[] {
  const normalized = extractPureThemeKeyword(keyword).toLowerCase();
  if (!normalized) return items;

  const searchTokens = normalized.split(/\s+/).filter(Boolean);
  if (searchTokens.length === 0) return items;

  return items.filter((item) => {
    const targetText = itemSearchText(item);
    return searchTokens.some((token) => targetText.includes(token));
  });
}

function compareByPopularity(a: NailDesignRow, b: NailDesignRow): number {
  return Number(b.popularity ?? 0) - Number(a.popularity ?? 0);
}

export default function MoodPage() {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => resolveActiveMoodTab(searchParams.get("tab")), [searchParams]);
  const activeTabKeyword = extractPureThemeKeyword(activeTab);
  const { data: hubData = [] } = useRecommendHubQuery();

  const filteredMoodItems = useMemo(() => filterMoodItems(hubData, activeTab), [activeTab, hubData]);
  const heroItem = filteredMoodItems[0];
  const minimalChicItems = useMemo(
    () => hubData.filter((item) => matchesAnyKeyword(item, ["미니멀", "시크", "블랙", "모노톤"])).slice(0, 4),
    [hubData],
  );
  const popularMoodItems = useMemo(() => {
    const usedIds = new Set([heroItem?.id, ...minimalChicItems.map((item) => item.id)].filter(Boolean));
    return hubData
      .filter((item) => !usedIds.has(item.id))
      .sort(compareByPopularity)
      .slice(0, 4);
  }, [heroItem, hubData, minimalChicItems]);

  useEffect(() => {
    if (searchParams.get("tab")) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", activeTabKeyword);
    setSearchParams(next, { replace: true });
  }, [activeTabKeyword, searchParams, setSearchParams]);

  const setActiveTab = (tab: (typeof MOOD_TABS)[number]) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", extractPureThemeKeyword(tab));
    setSearchParams(next, { replace: true });
  };

  const openDetail = (item?: NailDesignRow) => {
    if (!item) return;
    navigate(`/detail/${item.id}`, {
      state: { initialNailData: { ...item, imageUrl: item.image_url, title: displayItemTitle(item, isEnglish) } },
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-white text-[#333] antialiased">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 relative flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-gray-900 transition-colors hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-bold tracking-tight text-gray-900">
          {isEnglish ? "Hot Trend Mood" : "핫 트렌드 무드"}
        </h1>
        <button type="button" className="p-1 -mr-1 text-gray-900 transition-colors hover:bg-gray-100 rounded-full">
          <Search className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>

      <main className="w-full bg-white pb-8">
        
        {/* 섹션 1: 무드별 모아보기 (알약 탭) */}
        <section className="mt-2">
          <div className="mb-3 mt-6 flex items-end justify-between gap-2 px-4">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "View by Mood" : "무드별 모아보기"}
            </h3>
            <button type="button" className="shrink-0 text-sm font-medium text-gray-500" onClick={() => navigate(`/mood-list?tab=${encodeURIComponent(activeTabKeyword)}`)}>
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="min-w-0 mb-0 flex overflow-x-auto whitespace-nowrap gap-2 px-4 scrollbar-hide [&::-webkit-scrollbar]:hidden pb-2">
            {MOOD_TABS.map((label) => {
              const isActive = activeTab === label;
              return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveTab(label)}
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600"
                }`}
              >
                {displayMoodTabLabel(label, isEnglish)}
              </button>
              );
            })}
            <div className="w-4 shrink-0" />
          </div>
        </section>

        {/* 섹션 2: 히어로 배너 */}
        <section className="mb-0 mt-5 px-5 pt-0">
          <div className="relative mb-0 aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-sm" onClick={() => openDetail(heroItem)}>
            {heroItem?.image_url ? (
              <img
                alt={displayItemTitle(heroItem, isEnglish)}
                className="absolute inset-0 h-full w-full object-cover object-center"
                src={heroItem.image_url}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement?.classList.add("bg-gray-100");
                }}
              />
            ) : (
              <CurationFallback isEnglish={isEnglish} />
            )}
            {heroItem?.image_url ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-6 pb-6 pt-20 pointer-events-none">
                <div className="relative z-10">
                  <h2 className="text-lg font-bold text-white drop-shadow-md truncate leading-tight">
                    {displayItemTitle(heroItem, isEnglish)}
                  </h2>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* 섹션 3: 세련된 미니멀 시크 BEST (가로 스크롤) */}
        <section className="mb-0 px-5">
          <div className="mt-12 mb-4 flex w-full items-center justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Hottest Minimal Chic BEST 🖤" : "세련된 미니멀 시크 BEST 🖤"}
            </h3>
            <button type="button" className="shrink-0 text-sm font-medium text-gray-500" onClick={() => navigate('/chic-best-list')}>
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {minimalChicItems.map((item) => (
              <button key={item.id} type="button" onClick={() => openDetail(item)} className="flex w-32 shrink-0 flex-col bg-transparent p-0 text-left">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5 shadow-sm mb-2">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={displayItemTitle(item, isEnglish)}
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement?.classList.add("bg-gray-100");
                      }}
                    />
                  ) : null}
                </div>
                <div className="flex w-full flex-col items-center justify-center">
                  <span className="w-full min-w-0 text-center text-sm font-medium tracking-tight truncate text-gray-800">
                    {displayItemTitle(item, isEnglish)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 섹션 4: 실시간 인기 무드 (2열 그리드) */}
        <section className="mb-0 px-5">
          <div className="mt-12 mb-4 flex w-full items-center justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Real-time Popular Mood" : "실시간 인기 무드"}
            </h3>
            <button type="button" className="shrink-0 text-sm font-medium text-gray-500" onClick={() => navigate('/popular-mood-list')}>
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="mb-0 grid grid-cols-2 gap-4 pb-10">
            {popularMoodItems.map((item) => (
              <article key={item.id} className="flex flex-col gap-0 cursor-pointer" onClick={() => openDetail(item)}>
                <div className="aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5 shadow-sm mb-2 bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={displayItemTitle(item, isEnglish)}
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement?.classList.add("bg-gray-100");
                      }}
                    />
                  ) : null}
                </div>
                <div className="flex w-full flex-col items-center justify-center">
                  <span className="w-full min-w-0 text-center text-sm font-medium tracking-tight truncate text-gray-800">
                    {displayItemTitle(item, isEnglish)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
