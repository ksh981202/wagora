import { useLanguageContext } from "@/contexts/LanguageContext";
import { useGalleryInfiniteQuery } from "@/entities/nail-design/api/useGalleryInfiniteQuery";
import { useRecommendHubQuery } from "@/entities/nail-design/api/useRecommendHubQuery";
import type { NailDesignRow } from "@/shared/types/database.types";
import type { SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search } from "lucide-react";

const colorNailChips = [
  { label: "핑크", nameEn: "Pink", src: "/color/color-pink.png" },
  { label: "레드", nameEn: "Red", src: "/color/color-red.png" },
  { label: "누드", nameEn: "Nude", src: "/color/color-nude.png" },
  { label: "파스텔", nameEn: "Pastel", src: "/color/color-pastel.png" },
  { label: "블루", nameEn: "Blue", src: "/color/color-blue.png" },
  { label: "화이트", nameEn: "White", src: "/color/color-white.png" },
  { label: "블랙", nameEn: "Black", src: "/color/color-black.png" },
  { label: "글리터", nameEn: "Glitter", src: "/color/color-glitter.png" },
];

const seasonItems = [
  { label: "봄", nameEn: "Spring", bgColor: "bg-red-50", imageSrc: "/season/ic-season-spring.png" },
  { label: "여름", nameEn: "Summer", bgColor: "bg-blue-50", imageSrc: "/season/ic-season-summer.png" },
  { label: "가을", nameEn: "Autumn", bgColor: "bg-orange-50", imageSrc: "/season/ic-season-autumn.png" },
  { label: "겨울", nameEn: "Winter", bgColor: "bg-slate-50", imageSrc: "/season/ic-season-winter.png" },
];

const CUSTOM_THEME_PILLS = [
  { label: "🌿 데일리", nameEn: "🌿 Daily" },
  { label: "💍 웨딩", nameEn: "💍 Wedding" },
  { label: "💖 데이트", nameEn: "💖 Date" },
  { label: "💼 오피스", nameEn: "💼 Office" },
  { label: "✈️ 여행", nameEn: "✈️ Travel" },
  { label: "🎉 파티", nameEn: "🎉 Party" },
];

const styleItems = [
  { label: "심플 네일", titleEn: "Simple Nails", keyword: "심플" },
  { label: "화려한 네일", titleEn: "Glam Nails", keyword: "화려한" },
  { label: "프렌치 네일", titleEn: "French Nails", keyword: "프렌치" },
  { label: "드로잉 네일", titleEn: "Drawing Nails", keyword: "드로잉" },
];

const patternTrends = [
  { title: "마블 네일", titleEn: "Marble Nails", keyword: "마블" },
  { title: "그라데이션 네일", titleEn: "Gradient Nails", keyword: "그라데이션" },
  { title: "체크 네일", titleEn: "Check Nails", keyword: "체크" },
  { title: "트위드 네일", titleEn: "Tweed Nails", keyword: "트위드" },
];

type PatternTrendItem = (typeof patternTrends)[number];

const PATTERN_KEYWORD_MAPPING: Record<string, string> = {
  마블: '마블 마블링 대리석 수채화 번짐 잉크 뉘앙스',
  그라데이션: '그라데이션 그라 옴브레 투톤 시럽 치크 블러셔',
  체크: '체크 체크보드 아가일 깅엄 타탄 격자 선 하운드투스',
  트위드: '트위드 니트 겨울 포근한 털실 입체',
};

const textureTrends = [
  { title: "시럽 네일", titleEn: "Syrup Nails", keyword: "시럽" },
  { title: "무광 네일", titleEn: "Matte Nails", keyword: "무광" },
  { title: "자석 네일", titleEn: "Magnetic Nails", keyword: "자석" },
];

type TextureTrendItem = (typeof textureTrends)[number];

const TEXTURE_KEYWORD_MAPPING: Record<string, string> = {
  시럽: '시럽 투명 클리어 젤리 맑은 과즙',
  무광: '무광 매트 매트네일 벨벳 보송한',
  자석: '자석 마그넷 마그네틱 magnetic magnet 캣아이',
};

const partTrends = [
  { title: "스톤/큐빅 네일", titleEn: "Stone/Cubic Nails", keyword: "스톤 큐빅" },
  { title: "리본 네일", titleEn: "Ribbon Nails", keyword: "리본" },
  { title: "진주 네일", titleEn: "Pearl Nails", keyword: "진주" },
];

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? "")
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function findImageByKeyword(items: NailDesignRow[], keyword: string): string | undefined {
  const tokens = extractPureThemeKeyword(keyword)
    .split(/\s+/)
    .map((token) => token.toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return undefined;
  return items.find((item) => {
    const haystack = itemSearchText(item);
    return tokens.some((token) => haystack.includes(token));
  })?.image_url;
}

function handleImageError(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.removeAttribute("src");
  e.currentTarget.classList.add("bg-gray-100");
  e.currentTarget.parentElement?.classList.add("bg-gray-100");
}

function PatternTrendCard({
  item,
  isEnglish,
  onClick,
}: {
  item: PatternTrendItem;
  isEnglish: boolean;
  onClick: () => void;
}) {
  const queryKeyword = PATTERN_KEYWORD_MAPPING[item.keyword] ?? item.keyword;
  const { data } = useGalleryInfiniteQuery(queryKeyword, '인기순');
  const imageUrl = data?.pages[0]?.[0]?.image_url;
  const displayTitle = isEnglish ? item.titleEn : item.title;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col cursor-pointer text-left border-0 bg-transparent p-0"
    >
      {imageUrl ? (
        <img src={imageUrl} alt={displayTitle} className="w-full aspect-[4/5] object-cover rounded-2xl shadow-sm" loading="lazy" decoding="async" onError={handleImageError} />
      ) : (
        <div className="w-full aspect-[4/5] object-cover rounded-2xl shadow-sm bg-gray-100" aria-hidden="true" />
      )}
      <span className="mt-3 text-center text-sm font-medium text-gray-800">{displayTitle}</span>
    </button>
  );
}

function TextureTrendCard({
  item,
  isEnglish,
  onClick,
}: {
  item: TextureTrendItem;
  isEnglish: boolean;
  onClick: () => void;
}) {
  const queryKeyword = TEXTURE_KEYWORD_MAPPING[item.keyword] ?? item.keyword;
  const { data } = useGalleryInfiniteQuery(queryKeyword, '인기순');
  const imageUrl = data?.pages[0]?.[0]?.image_url;
  const displayTitle = isEnglish ? item.titleEn : item.title;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-40 shrink-0 cursor-pointer flex-col border-0 bg-transparent p-0 text-left"
    >
      {imageUrl ? (
        <img src={imageUrl} alt={displayTitle} className="w-full aspect-[4/5] object-cover rounded-2xl shadow-sm" loading="lazy" decoding="async" onError={handleImageError} />
      ) : (
        <div className="w-full aspect-[4/5] object-cover rounded-2xl shadow-sm bg-gray-100" aria-hidden="true" />
      )}
      <span className="mt-3 text-center text-sm font-medium text-gray-800">{displayTitle}</span>
    </button>
  );
}

export default function CategoryPage() {
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const navigate = useNavigate();
  const { data: hubData = [] } = useRecommendHubQuery();
  const viewAllLabel = isEnglish ? "View All >" : "전체보기 >";

  const goColorCuration = (keyword?: string) => navigate(keyword ? `/color-curation?color=${encodeURIComponent(keyword)}` : "/color-curation");

  const goSeasonCuration = (keyword?: string) => navigate(keyword ? `/season-curation?tab=${encodeURIComponent(keyword)}` : "/season-curation");

  const goStyleCuration = (keyword?: string) => navigate(keyword ? `/style-curation?tab=${encodeURIComponent(keyword)}` : "/style-curation");

  const goTheme = (keyword?: string) => navigate(keyword ? `/situation-list?tab=${encodeURIComponent(keyword)}` : "/situation-list");

  const goPattern = (keyword?: string) => navigate(keyword ? `/pattern?tab=${encodeURIComponent(keyword)}` : "/pattern");
  const goTexture = (keyword?: string) => navigate(keyword ? `/texture?tab=${encodeURIComponent(keyword)}` : "/texture");
  const goParts = (keyword?: string) => navigate(keyword ? `/parts?tab=${encodeURIComponent(keyword)}` : "/parts");

  return (
    <div className="relative min-h-screen w-full bg-white text-[#1A1A1A] antialiased">
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-50 bg-white px-5">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-900 rounded-full">
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 top-1/2 max-w-[60%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-lg font-bold text-gray-900 whitespace-nowrap">
          {isEnglish ? "Categories" : "카테고리 탐색"}
        </h1>
        <button type="button" onClick={() => navigate("/gallery")} className="p-2 -mr-2 text-gray-900 rounded-full">
          <Search className="h-6 w-6" strokeWidth={2} />
        </button>
      </header>

      <main className="flex flex-col gap-12 bg-white pt-4 pb-8">
        <section className="px-5">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{isEnglish ? "Color Nails" : "컬러 네일"}</h2>
            <button type="button" onClick={() => goColorCuration()} className="text-sm font-medium text-gray-500 cursor-pointer">
              {viewAllLabel}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {colorNailChips.map((chip) => {
              const displayName = isEnglish ? chip.nameEn : chip.label;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => goColorCuration(chip.label)}
                  className="flex cursor-pointer flex-col items-center rounded-xl border-0 bg-transparent p-0"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 relative mx-auto flex items-center justify-center rounded-full bg-gray-50 shadow-sm overflow-hidden">
                    <img src={chip.src} alt={displayName} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={handleImageError} />
                  </div>
                  <span className="mt-2 w-full text-center font-sans tracking-tight font-medium text-[13px] text-gray-700">
                    {displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="px-5">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{isEnglish ? "Seasonal Custom Nails" : "계절별 맞춤 네일"}</h2>
            <button type="button" onClick={() => goSeasonCuration()} className="text-sm font-medium text-gray-500 cursor-pointer">
              {viewAllLabel}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {seasonItems.map((season) => {
              const displayName = isEnglish ? season.nameEn : season.label;
              return (
                <button
                  key={season.label}
                  type="button"
                  onClick={() => goSeasonCuration(season.label)}
                  className={`${season.bgColor} border border-gray-100 rounded-2xl py-5 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer`}
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/50 shadow-sm">
                    <img
                      src={season.imageSrc}
                      alt={displayName}
                      className="h-20 w-20 scale-110 object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                    />
                  </div>
                  <span className="font-medium text-[14px] text-gray-800">{displayName}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="px-5">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {isEnglish ? "Style Perfect, Nails by Vibe" : "취향 저격, 스타일별 네일"}
            </h2>
            <button type="button" onClick={() => goStyleCuration()} className="text-sm font-medium text-gray-500 cursor-pointer">
              {viewAllLabel}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {styleItems.map((item) => {
              const imageUrl = findImageByKeyword(hubData, item.keyword);
              const displayTitle = isEnglish ? item.titleEn : item.label;
              return (
              <button
                key={item.label}
                type="button"
                onClick={() => goStyleCuration(item.keyword)}
                className="flex flex-col cursor-pointer border-0 bg-transparent p-0 text-left"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={displayTitle} className="w-full aspect-[4/5] object-cover object-center rounded-2xl shadow-sm" loading="lazy" decoding="async" onError={handleImageError} />
                ) : (
                  <div className="w-full aspect-[4/5] object-cover object-center rounded-2xl shadow-sm bg-gray-100" aria-hidden="true" />
                )}
                <span className="mt-3 text-center text-sm font-medium text-gray-800">{displayTitle}</span>
              </button>
              );
            })}
          </div>
        </section>

        <section className="px-5">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {isEnglish ? "Shining Moments, Custom Nails" : "빛나는 순간, 맞춤 네일"}
            </h2>
            <button type="button" onClick={() => goTheme()} className="text-sm font-medium text-gray-500 cursor-pointer">
              {viewAllLabel}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CUSTOM_THEME_PILLS.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => goTheme(extractPureThemeKeyword(pill.label))}
                className="flex-none px-5 py-2.5 bg-white rounded-full border border-stone-200 text-sm font-semibold shadow-sm hover:border-[#FF7F50]"
              >
                {isEnglish ? pill.nameEn : pill.label}
              </button>
            ))}
          </div>
        </section>

        <section className="px-5">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{isEnglish ? "Art & Pattern Trend" : "아트 & 패턴 트렌드"}</h2>
            <button type="button" onClick={() => goPattern()} className="text-sm font-medium text-gray-500 cursor-pointer">
              {viewAllLabel}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {patternTrends.map((item) => (
              <PatternTrendCard
                key={item.title}
                item={item}
                isEnglish={isEnglish}
                onClick={() => goPattern(item.keyword)}
              />
            ))}
          </div>
        </section>

        <section className="px-5">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{isEnglish ? "Texture Trend" : "텍스처 트렌드"}</h2>
            <button type="button" onClick={() => goTexture()} className="text-sm font-medium text-gray-500 cursor-pointer">
              {viewAllLabel}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {textureTrends.map((item) => (
              <TextureTrendCard
                key={item.title}
                item={item}
                isEnglish={isEnglish}
                onClick={() => goTexture(item.keyword)}
              />
            ))}
          </div>
        </section>

        <section className="px-5">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{isEnglish ? "Point Parts Nails" : "포인트 파츠 네일"}</h2>
            <button type="button" onClick={() => goParts()} className="text-sm font-medium text-gray-500 cursor-pointer">
              {viewAllLabel}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {partTrends.map((item) => {
              const imageUrl = findImageByKeyword(hubData, item.keyword);
              const displayTitle = isEnglish ? item.titleEn : item.title;
              return (
              <button
                key={item.title}
                type="button"
                onClick={() => goParts(item.keyword)}
                className="flex w-32 shrink-0 flex-col text-left cursor-pointer border-0 bg-transparent p-0"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={displayTitle} className="w-full aspect-[4/5] object-cover rounded-2xl shadow-sm" loading="lazy" decoding="async" onError={handleImageError} />
                ) : (
                  <div className="w-full aspect-[4/5] object-cover rounded-2xl shadow-sm bg-gray-100" aria-hidden="true" />
                )}
                <span className="mt-2.5 text-center text-[13px] font-medium text-gray-800">{displayTitle}</span>
              </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
