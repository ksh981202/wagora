import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery';
import { useLanguageContext } from '@/contexts/LanguageContext';
import type { NailDesignRow } from '@/shared/types/database.types';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

const PARTS_CATEGORIES = [
  { label: "스톤/큐빅", img: "/parts/cubic.jpg" },
  { label: "리본", img: "/parts/ribbon.jpg" },
  { label: "진주", img: "/parts/pearl.jpg" },
  { label: "메탈/체인", img: "/parts/metal.jpg" },
  { label: "나비", img: "/parts/butterfly.jpg" },
] as const;

const PARTS_LABEL_EN: Record<(typeof PARTS_CATEGORIES)[number]["label"], string> = {
  "스톤/큐빅": "Stone/Cubic",
  리본: "Ribbon",
  진주: "Pearl",
  "메탈/체인": "Metal/Chain",
  나비: "Butterfly",
};

function extractPurePartsKeyword(raw: string): string {
  return String(raw ?? "")
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveActivePartsTab(rawTab: string | null): (typeof PARTS_CATEGORIES)[number]["label"] {
  const pure = extractPurePartsKeyword(rawTab ?? "");
  return PARTS_CATEGORIES.find((category) => category.label === rawTab || extractPurePartsKeyword(category.label) === pure)?.label ?? "스톤/큐빅";
}

function displayPartsLabel(label: (typeof PARTS_CATEGORIES)[number]["label"], isEnglish: boolean): string {
  return isEnglish ? PARTS_LABEL_EN[label] : label;
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

function filterPartsItems(items: NailDesignRow[], keyword: string): NailDesignRow[] {
  const tokens = extractPurePartsKeyword(keyword).toLowerCase().split(" ").filter(Boolean);
  if (tokens.length === 0) return items;
  return items.filter((item) => matchesAnyKeyword(item, tokens));
}

export default function PartsPage() {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => resolveActivePartsTab(searchParams.get("tab")), [searchParams]);
  const activeTabKeyword = extractPurePartsKeyword(activeTab);
  const { data: hubData = [] } = useRecommendHubQuery();

  const filteredItems = useMemo(() => filterPartsItems(hubData, activeTab), [activeTab, hubData]);
  const heroItem = filteredItems[0];
  const stoneBestItems = useMemo(() => hubData.filter((item) => matchesAnyKeyword(item, ["스톤", "큐빅"])).slice(0, 3), [hubData]);
  const fullPartsItems = useMemo(() => hubData.filter((item) => matchesAnyKeyword(item, ["풀파츠", "파츠", "스와로브스키"])).slice(0, 4), [hubData]);

  useEffect(() => {
    if (searchParams.get("tab")) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", activeTabKeyword);
    setSearchParams(next, { replace: true });
  }, [activeTabKeyword, searchParams, setSearchParams]);

  const setActiveTab = (tab: (typeof PARTS_CATEGORIES)[number]["label"]) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", extractPurePartsKeyword(tab));
    setSearchParams(next, { replace: true });
  };

  const openDetail = (item?: NailDesignRow) => {
    if (!item) return;
    navigate(`/detail/${item.id}`, {
      state: { initialNailData: { ...item, imageUrl: item.image_url, title: displayItemTitle(item, isEnglish) } },
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-white text-[#1A1A1A]">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 relative flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-5 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-gray-900 transition-colors hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap">
          {isEnglish ? "Point Parts Trend" : "포인트 파츠 트렌드"}
        </h1>
        <button type="button" className="p-1 -mr-1 text-gray-900 transition-colors hover:bg-gray-100 rounded-full">
          <Search className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>

      <main className="w-full pb-8">
        {/* 섹션 1: 파츠별 모아보기 (원형 탭) */}
        <section className="pt-6 pb-5">
          <div className="mb-5 flex items-baseline justify-between gap-2 px-5">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "View by Parts" : "파츠별 모아보기"}
            </h3>
            <button
              type="button"
              onClick={() => navigate(`/parts-list?tab=${encodeURIComponent(activeTabKeyword)}`)}
              className="shrink-0 cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="min-w-0 flex items-start gap-4 overflow-x-auto px-5 pb-1.5 pt-1 scrollbar-hide [&::-webkit-scrollbar]:hidden">
            {PARTS_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.label;
              return (
              <button key={cat.label} type="button" onClick={() => setActiveTab(cat.label)} className="flex shrink-0 flex-col items-center gap-2.5">
                <div className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-gray-100 shadow-sm ${isActive ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-white" : ""}`}>
                  <img alt={displayPartsLabel(cat.label, isEnglish)} className="absolute inset-0 h-full w-full object-cover object-center" src={cat.img} loading="lazy" decoding="async" />
                </div>
                <span className={`font-sans text-[13px] tracking-tight ${isActive ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                  {displayPartsLabel(cat.label, isEnglish)}
                </span>
              </button>
              );
            })}
          </div>
        </section>

        {/* 섹션 2: 히어로 배너 */}
        <section className="mb-0 px-5">
          <div className="group relative mb-0 aspect-[3/4] w-full overflow-hidden rounded-[20px] shadow-lg" onClick={() => openDetail(heroItem)}>
            {heroItem?.image_url ? (
              <img
                alt={displayItemTitle(heroItem, isEnglish)}
                className="h-full w-full object-cover object-center"
                src={heroItem.image_url}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement?.classList.add("bg-gray-100");
                }}
              />
            ) : null}
            <div className="absolute inset-x-5 bottom-5">
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-white drop-shadow-md truncate leading-tight">
                  {heroItem
                    ? displayItemTitle(heroItem, isEnglish)
                    : isEnglish
                      ? `${displayPartsLabel(activeTab, isEnglish)} Nails`
                      : `${activeTab} 네일`}
                </h2>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 3: 지금 가장 핫한 스톤 BEST (가로 스크롤) */}
        <section className="mb-0 px-5">
          <div className="mt-12 mb-4 flex items-center justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Hottest Stone BEST" : "지금 가장 핫한 스톤 BEST"}
            </h3>
            <button
              type="button"
              onClick={() => navigate('/stone-best-list')}
              className="shrink-0 cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {stoneBestItems.map((item) => (
              <button key={item.id} type="button" onClick={() => openDetail(item)} className="flex w-44 shrink-0 flex-col bg-transparent p-0 text-center">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5 shadow-sm mb-2">
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
                </div>
                <span className="w-full min-w-0 text-[14px] font-medium tracking-tight truncate text-gray-800 px-1">
                  {displayItemTitle(item, isEnglish)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 섹션 4: 인기 풀파츠 스타일 (2열 그리드) */}
        <section className="mb-0 px-5">
          <div className="mt-12 mb-4 flex w-full items-center justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Popular Full Parts Style" : "인기 풀파츠 스타일"}
            </h3>
            <button
              type="button"
              onClick={() => navigate('/full-parts-list')}
              className="shrink-0 cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="mb-0 grid grid-cols-2 gap-4 pb-10">
            {fullPartsItems.map((item) => (
              <article key={item.id} className="flex flex-col gap-0 cursor-pointer" onClick={() => openDetail(item)}>
                <div className="aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5 shadow-sm mb-2">
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
                </div>
                <span className="w-full min-w-0 text-center text-[14px] font-medium tracking-tight truncate text-gray-800 px-1">
                  {displayItemTitle(item, isEnglish)}
                </span>
              </article>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
