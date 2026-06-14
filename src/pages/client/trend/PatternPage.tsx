import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery';
import { useLanguageContext } from '@/contexts/LanguageContext';
import type { NailDesignRow } from '@/shared/types/database.types';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

const PATTERN_CATEGORIES = [
  { label: "프렌치", img: "/pattern/french.jpg" },
  { label: "마블", img: "/pattern/marble.jpg" },
  { label: "체크", img: "/pattern/check.png" },
  { label: "그라데이션", img: "/pattern/gradient.jpg" },
  { label: "트위드", img: "/pattern/tweed.png" },
] as const;

const PATTERN_LABEL_EN: Record<(typeof PATTERN_CATEGORIES)[number]["label"], string> = {
  프렌치: "French",
  마블: "Marble",
  체크: "Check",
  그라데이션: "Gradient",
  트위드: "Tweed",
};

const PATTERN_KEYWORD_MAPPING: Record<string, string> = {
  전체: '',
  프렌치: '프렌치 딥프렌치 둥근프렌치 하프프렌치 라인 라인아트 테두리',
  마블: '마블 마블링 대리석 수채화 번짐 잉크 뉘앙스 아트',
  체크: '체크 체크보드 체커보드 아가일 깅엄 타탄 격자 선 하운드투스',
  그라데이션: '그라데이션 그라 옴브레 투톤 시럽 치크 블러셔 몽환',
  트위드: '트위드 니트 겨울 포근한 털실 입체',
};

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? "")
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveActivePatternTab(rawTab: string | null): (typeof PATTERN_CATEGORIES)[number]["label"] {
  const pure = extractPureThemeKeyword(rawTab ?? "");
  return PATTERN_CATEGORIES.find((category) => category.label === rawTab || category.label === pure)?.label ?? "프렌치";
}

function patternTabKeywordForQuery(tab: (typeof PATTERN_CATEGORIES)[number]["label"]): string {
  const mappingKey = extractPureThemeKeyword(tab);
  return PATTERN_KEYWORD_MAPPING[mappingKey] ?? mappingKey;
}

function displayPatternLabel(label: (typeof PATTERN_CATEGORIES)[number]["label"], isEnglish: boolean): string {
  return isEnglish ? PATTERN_LABEL_EN[label] : label;
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

function pickRandomItem(items: NailDesignRow[]): NailDesignRow | undefined {
  if (items.length === 0) return undefined;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export default function PatternPage() {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [searchParams, setSearchParams] = useSearchParams();
  const [heroItem, setHeroItem] = useState<NailDesignRow | undefined>(undefined);
  const activeTab = useMemo(() => resolveActivePatternTab(searchParams.get("tab")), [searchParams]);
  const activeTabKeyword = extractPureThemeKeyword(activeTab);
  const heroKeywords = useMemo(
    () =>
      patternTabKeywordForQuery(activeTab)
        .split(/\s+/)
        .map((keyword) => extractPureThemeKeyword(keyword))
        .filter(Boolean),
    [activeTab],
  );
  const { data: hubData = [] } = useRecommendHubQuery();
  const marbleBestItems = useMemo(() => hubData.filter((item) => matchesAnyKeyword(item, ["마블", "대리석"])).slice(0, 3), [hubData]);
  const popularArtItems = useMemo(
    () =>
      hubData
        .filter((item) => matchesAnyKeyword(item, ["아트", "패턴", "프렌치", "마블", "체크", "그라데이션", "트위드", "드로잉", "자개", "생화"]))
        .sort((a, b) => Number(b.popularity ?? 0) - Number(a.popularity ?? 0))
        .slice(0, 4),
    [hubData],
  );

  useEffect(() => {
    if (searchParams.get("tab")) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", activeTabKeyword);
    setSearchParams(next, { replace: true });
  }, [activeTabKeyword, searchParams, setSearchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (hubData.length === 0) {
        setHeroItem(undefined);
        return;
      }

      const matchedItems = heroKeywords.length > 0
        ? hubData.filter((item) => matchesAnyKeyword(item, heroKeywords))
        : [];
      setHeroItem(pickRandomItem(matchedItems.length > 0 ? matchedItems : hubData));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hubData, heroKeywords]);

  useEffect(() => {
    const imageUrl = heroItem?.image_url;
    if (!imageUrl) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = imageUrl;
    link.fetchPriority = "high";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [heroItem?.image_url]);

  const setActiveTab = (tab: (typeof PATTERN_CATEGORIES)[number]["label"]) => {
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
    <div className="relative min-h-screen w-full bg-white text-neutral-800">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 relative flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-gray-900 transition-colors hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap">
          {isEnglish ? "Art & Pattern Trend" : "아트 & 패턴 트렌드"}
        </h1>
        <button type="button" className="p-1 -mr-1 text-gray-900 transition-colors hover:bg-gray-100 rounded-full" onClick={() => navigate('/search')}>
          <Search className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>

      <main className="w-full bg-white pb-8">
        
        {/* 섹션 1: 아트별 모아보기 (원형 탭) */}
        <section className="pt-6 pb-5">
          <div className="mb-5 flex items-baseline justify-between gap-2 px-5">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "View by Art" : "아트별 모아보기"}
            </h3>
            <button type="button" className="shrink-0 text-sm font-medium text-gray-500" onClick={() => navigate(`/pattern-list?tab=${encodeURIComponent(activeTabKeyword)}`)}>
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="min-w-0 flex flex-nowrap items-start gap-4 overflow-x-auto scrollbar-hide px-5 pb-1.5 pt-1 [&::-webkit-scrollbar]:hidden">
            {PATTERN_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.label;
              return (
              <button key={cat.label} type="button" onClick={() => setActiveTab(cat.label)} className="flex shrink-0 flex-col items-center gap-2.5">
                <div className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-gray-100 shadow-sm ${isActive ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-white" : ""}`}>
                  <img alt={displayPatternLabel(cat.label, isEnglish)} className="absolute inset-0 h-full w-full object-cover object-center" src={cat.img} loading="lazy" decoding="async" />
                </div>
                <span className={`font-sans text-[13px] tracking-tight ${isActive ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                  {displayPatternLabel(cat.label, isEnglish)}
                </span>
              </button>
              );
            })}
          </div>
        </section>

        {/* 섹션 2: 히어로 배너 */}
        <section className="mb-0 px-5">
          <div className="group relative mb-0 w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-lg" onClick={() => openDetail(heroItem)}>
            {heroItem?.image_url ? (
              <img
                alt={displayItemTitle(heroItem, isEnglish)}
                className="absolute inset-0 w-full h-full object-cover object-center"
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
            <div className="absolute inset-x-6 bottom-6">
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-white drop-shadow-md truncate leading-tight">
                  {heroItem
                    ? displayItemTitle(heroItem, isEnglish)
                    : isEnglish
                      ? `${displayPatternLabel(activeTab, isEnglish)} Nails`
                      : `${activeTab} 네일`}
                </h2>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 3: 지금 가장 핫한 마블 BEST */}
        <section className="mb-0 px-5">
          <div className="mt-12 mb-4 flex items-center justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Hottest Marble BEST" : "지금 가장 핫한 마블 BEST"}
            </h3>
            <button type="button" className="shrink-0 text-sm font-medium text-gray-500" onClick={() => navigate('/marble-best-list')}>
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {marbleBestItems.map((item) => (
              <button key={item.id} type="button" onClick={() => openDetail(item)} className="flex w-44 shrink-0 flex-col bg-transparent p-0 text-left">
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
                <span className="w-full min-w-0 text-center text-[13px] sm:text-sm font-medium tracking-tight truncate text-gray-800 px-1">
                  {displayItemTitle(item, isEnglish)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 섹션 4: 실시간 인기 아트 네일 (2열 그리드) */}
        <section className="mb-0 px-5">
          <div className="mt-12 mb-4 flex items-center justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Real-time Popular Art Nails" : "실시간 인기 아트 네일"}
            </h3>
            <button type="button" className="shrink-0 text-sm font-medium text-gray-500" onClick={() => navigate('/popular-art-list')}>
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="mb-0 grid grid-cols-2 gap-4 pb-10">
            {popularArtItems.map((item) => (
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
                <span className="w-full min-w-0 text-center text-sm font-medium tracking-tight truncate text-gray-800 px-1">
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
