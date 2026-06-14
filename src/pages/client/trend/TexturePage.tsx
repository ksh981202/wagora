import { useRecommendHubQuery } from '@/entities/nail-design/api/useRecommendHubQuery';
import { useLanguageContext } from '@/contexts/LanguageContext';
import type { NailDesignRow } from '@/shared/types/database.types';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

const TEXTURE_CATEGORIES = [
  { label: "시럽", img: "/texture/syrup.jpg" },
  { label: "무광", img: "/texture/matte.jpg" },
  { label: "글리터", img: "/texture/glitter.jpg" },
  { label: "자석", img: "/texture/magnetic.jpg" },
  { label: "미러파우더", img: "/texture/mirror.jpg" },
] as const;

const TEXTURE_LABEL_EN: Record<(typeof TEXTURE_CATEGORIES)[number]["label"], string> = {
  시럽: "Syrup",
  무광: "Matte",
  글리터: "Glitter",
  자석: "Magnetic",
  미러파우더: "Mirror Powder",
};

function extractPureTextureKeyword(raw: string): string {
  return String(raw ?? "")
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveActiveTextureTab(rawTab: string | null): (typeof TEXTURE_CATEGORIES)[number]["label"] {
  const pure = extractPureTextureKeyword(rawTab ?? "");
  return TEXTURE_CATEGORIES.find((category) => category.label === rawTab || category.label === pure)?.label ?? "시럽";
}

function displayTextureLabel(label: (typeof TEXTURE_CATEGORIES)[number]["label"], isEnglish: boolean): string {
  return isEnglish ? TEXTURE_LABEL_EN[label] : label;
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

function filterTextureItems(items: NailDesignRow[], keyword: string): NailDesignRow[] {
  const normalized = extractPureTextureKeyword(keyword).toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => itemSearchText(item).includes(normalized));
}

function isSyrupBestItem(item: NailDesignRow): boolean {
  const haystack = itemSearchText(item);
  return haystack.includes("시럽") || haystack.includes("과즙") || haystack.includes("누드");
}

export default function TexturePage() {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => resolveActiveTextureTab(searchParams.get("tab")), [searchParams]);
  const { data: hubData = [] } = useRecommendHubQuery();

  const filteredItems = useMemo(() => filterTextureItems(hubData, activeTab), [activeTab, hubData]);
  const heroItem = filteredItems[0];
  const syrupBestItems = useMemo(() => hubData.filter(isSyrupBestItem).slice(0, 3), [hubData]);
  const recommendGalleryItems = useMemo(() => {
    const syrupBestIds = new Set(syrupBestItems.map((item) => item.id));
    return hubData.filter((item) => !syrupBestIds.has(item.id)).slice(0, 4);
  }, [hubData, syrupBestItems]);
  const textureListPath = `/texture-list?tab=${encodeURIComponent(activeTab)}`;

  useEffect(() => {
    if (searchParams.get("tab")) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", activeTab);
    setSearchParams(next, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  const setActiveTab = (tab: (typeof TEXTURE_CATEGORIES)[number]["label"]) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
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
      <header className="sticky top-0 z-50 relative flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-gray-900 transition-colors hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap">
          {isEnglish ? "Texture Trend" : "텍스처 트렌드"}
        </h1>
        <button type="button" className="p-1 -mr-1 text-gray-900 transition-colors hover:bg-gray-100 rounded-full" onClick={() => navigate('/search')}>
          <Search className="w-5 h-5" strokeWidth={2} />
        </button>
      </header>

      <main className="w-full bg-white pb-8 text-gray-900">
        
        {/* 섹션 1: 텍스처별 모아보기 (원형 탭) */}
        <section className="pt-6 pb-5">
          <div className="mb-5 flex items-baseline justify-between gap-2 px-5">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "View by Texture" : "텍스처별 모아보기"}
            </h3>
            <button
              type="button"
              onClick={() => navigate(textureListPath)}
              className="shrink-0 text-sm font-medium text-gray-500 cursor-pointer"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="min-w-0 flex flex-nowrap items-start gap-4 overflow-x-auto scrollbar-hide px-5 pb-1.5 pt-1 [&::-webkit-scrollbar]:hidden">
            {TEXTURE_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.label;
              return (
              <button key={cat.label} type="button" onClick={() => setActiveTab(cat.label)} className="flex shrink-0 flex-col items-center gap-2.5">
                <div className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-gray-100 shadow-sm ${isActive ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-white" : ""}`}>
                  <img alt={displayTextureLabel(cat.label, isEnglish)} className="absolute inset-0 h-full w-full object-cover object-center" src={cat.img} loading="lazy" decoding="async" />
                </div>
                <span className={`font-sans text-[13px] tracking-tight ${isActive ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                  {displayTextureLabel(cat.label, isEnglish)}
                </span>
              </button>
              );
            })}
          </div>
        </section>

        {/* 섹션 2: 히어로 배너 */}
        <section className="mb-0 px-5">
          <div className="relative mb-0 block w-full aspect-[3/4] overflow-hidden rounded-[2rem] shadow-lg shadow-black/5" onClick={() => openDetail(heroItem)}>
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
                }}
              />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 px-8 pb-8 pt-0">
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-white drop-shadow-md truncate leading-tight">
                  {heroItem
                    ? displayItemTitle(heroItem, isEnglish)
                    : isEnglish
                      ? `${displayTextureLabel(activeTab, isEnglish)} Nails`
                      : `${activeTab} 네일`}
                </h2>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 3: 지금 가장 핫한 시럽 BEST */}
        <section className="mb-0 px-5">
          <div className="mt-12 mb-4 flex items-baseline justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Hottest Syrup BEST" : "지금 가장 핫한 시럽 BEST"}
            </h3>
            <button
              type="button"
              onClick={() => navigate('/syrup-best')}
              className="shrink-0 cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {syrupBestItems.map((item) => (
              <button key={item.id} type="button" onClick={() => openDetail(item)} className="w-44 shrink-0 text-left">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5 shadow-sm">
                  <img
                    alt={displayItemTitle(item, isEnglish)}
                    className="h-full w-full object-cover object-center"
                    src={item.image_url}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="mt-2 flex w-full flex-col items-center justify-center">
                  <span className="w-full min-w-0 text-center text-sm font-medium tracking-tight truncate text-gray-800">
                    {displayItemTitle(item, isEnglish)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 섹션 4: 추천 갤러리 */}
        <section className="mb-0 px-5">
          <div className="mt-12 mb-4 flex w-full items-center justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Recommended Gallery" : "추천 갤러리"}
            </h3>
            <button
              type="button"
              onClick={() => navigate('/texture-list?title=' + encodeURIComponent('추천 갤러리'))}
              className="shrink-0 cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="mb-0 grid grid-cols-2 gap-x-4 gap-y-8">
            {recommendGalleryItems.map((item) => (
              <article key={item.id} className="group flex flex-col gap-0">
                <button type="button" onClick={() => openDetail(item)} className="text-left">
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5 shadow-sm">
                    <img
                      alt={displayItemTitle(item, isEnglish)}
                      className="h-full w-full object-cover object-center"
                      src={item.image_url}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="mt-2 flex w-full flex-col items-center justify-center">
                    <span className="w-full min-w-0 text-center text-sm font-medium tracking-tight truncate text-gray-800">
                      {displayItemTitle(item, isEnglish)}
                    </span>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
