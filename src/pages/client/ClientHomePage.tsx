import {
  DEFAULT_GALLERY_SORT,
  DEFAULT_GALLERY_TAB,
  useGalleryInfiniteQuery,
} from "@/entities/nail-design/api/useGalleryInfiniteQuery";
import { useClientHomeFeed } from "@/features/client-home/useClientHomeFeed";
import { useLanguageContext } from "@/contexts/LanguageContext";
import type { NailDesignRow } from "@/shared/types/database.types";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { localizePath } from "@/shared/language/localizedRouting";

type HomeNailCard = { id: string; title: string; titleEn: string; image: string };

function toHomeNailCard(row: NailDesignRow): HomeNailCard {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en,
    image: row.image_url,
  };
}

const THEME_STYLES = [
  {
    label: "미니멀 시티",
    labelEn: "Minimal City",
    kicker: "Clean tailoring",
    to: "/style-curation",
  },
  {
    label: "프렌치 아틀리에",
    labelEn: "French Atelier",
    kicker: "Paris mood",
    to: "/pattern",
  },
  {
    label: "컬러 코드",
    labelEn: "Color Code",
    kicker: "Tone on tone",
    to: "/color-curation",
  },
  {
    label: "텍스처 믹스",
    labelEn: "Texture Mix",
    kicker: "Soft detail",
    to: "/texture",
  },
];

const SEASON_ESSENTIALS = [
  {
    label: "리조트 산책",
    labelEn: "Resort Walk",
    kicker: "Vacation edit",
    to: "/vacation-list",
  },
  {
    label: "레인 코트",
    labelEn: "Rain Coat",
    kicker: "Weather proof",
    to: "/season-curation",
  },
  {
    label: "윈터 니트",
    labelEn: "Winter Knit",
    kicker: "Cozy layer",
    to: "/season-list",
  },
  {
    label: "데일리 하네스",
    labelEn: "Daily Harness",
    kicker: "Everyday fit",
    to: "/theme",
  },
];

const FALLBACK_LOOKBOOK_CARD: HomeNailCard = {
  id: "wagora-fallback-lookbook",
  title: "WAGORA Atelier",
  titleEn: "WAGORA Atelier",
  image:
    "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=1200&q=80",
};

function homeNailTitle(nail: HomeNailCard, isEnglish: boolean) {
  const en = nail.titleEn?.trim();
  const ko = nail.title?.trim();
  return isEnglish && en ? en : ko || en || "";
}

export default function ClientHomePage() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const autoPlayIndexRef = useRef(0);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const { data: feed, isLoading } = useClientHomeFeed();
  const {
    data: discoverData,
    isLoading: isDiscoverLoading,
    isError: isDiscoverError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGalleryInfiniteQuery(DEFAULT_GALLERY_TAB, DEFAULT_GALLERY_SORT);
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const toLocalizedPath = (path: string) => localizePath(path, language);

  const recommendNails = useMemo(
    () => (feed?.recommend ?? []).map(toHomeNailCard),
    [feed?.recommend],
  );
  const lookbookNails = recommendNails.length > 0 ? recommendNails : [FALLBACK_LOOKBOOK_CARD];

  // LCP 최우선 프리페치 트릭 (가장 첫 번째 사진 멱살 잡기)
  useEffect(() => {
    const firstImage = recommendNails[0]?.image;
    if (!firstImage) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = firstImage;
    link.fetchPriority = "high";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [recommendNails]);

  const discoverItems = useMemo(
    () => discoverData?.pages.flatMap((page) => page) ?? [],
    [discoverData],
  );

  useEffect(() => {
    if (isLoading || isAutoPlayPaused || recommendNails.length <= 1) return;

    const timer = window.setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;

      const nextIndex = autoPlayIndexRef.current + 1;
      if (nextIndex >= recommendNails.length) {
        autoPlayIndexRef.current = 0;
        el.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      autoPlayIndexRef.current = nextIndex;
      el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isAutoPlayPaused, isLoading, recommendNails.length]);

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isFetchingNextPage) return;
        void fetchNextPage();
      },
      { root: null, rootMargin: "240px", threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const openDetail = (item: NailDesignRow) => {
    navigate(toLocalizedPath(`/detail/${item.id}`), {
      state: {
        initialNailData: {
          id: item.id,
          imageUrl: item.image_url,
          title: displayDiscoverTitle(item, isEnglish),
          color: "",
          mood: "",
        },
      },
    });
  };

  return (
    <div className="w-full flex flex-col min-h-screen overflow-x-hidden bg-white pb-4 text-[#17130f]">
      <section className="mt-2 px-5 pb-14">
        <SectionHeading
          title={isEnglish ? "Recommended Lookbook" : "추천 룩북"}
          actionLabel={isEnglish ? "See All >" : "전체보기 >"}
          onAction={() => navigate(toLocalizedPath("/magazine"))}
        />
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsAutoPlayPaused(true)}
          onMouseLeave={() => setIsAutoPlayPaused(false)}
          onTouchStart={() => setIsAutoPlayPaused(true)}
          onTouchEnd={() => setIsAutoPlayPaused(false)}
          className="min-w-0 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pl-5 pr-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {isLoading
            ? [0, 1, 2].map((i) => (
                <div
                  key={`rec-skel-${i}`}
                  className="relative w-full flex-none snap-center"
                  aria-hidden
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[30px] border border-black/5 bg-stone-200 shadow-sm animate-pulse" />
                </div>
              ))
            : lookbookNails.map((nail, index) => (
            <div
              key={nail.id}
              className="relative w-full flex-none snap-center cursor-pointer"
              onClick={() => {
                if (nail.id !== FALLBACK_LOOKBOOK_CARD.id) navigate(toLocalizedPath(`/detail/${nail.id}`));
              }}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[30px] border border-black/10 bg-stone-200 shadow-[0_24px_60px_rgba(37,28,20,0.18)]">
                <img src={nail.image} alt={homeNailTitle(nail, isEnglish)} fetchPriority={index === 0 ? "high" : undefined} loading={index > 0 ? "lazy" : undefined} decoding={index > 0 ? "async" : undefined} className="h-full w-full object-cover object-center" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-5 pt-12">
                  <div className="flex w-full flex-col items-start text-left text-white">
                    <span className="mb-2 inline-block rounded-full bg-[#FF7E67] px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                      PICK
                    </span>
                    <h3 className="w-full truncate text-lg font-bold text-white drop-shadow-md">
                      {homeNailTitle(nail, isEnglish)}
                    </h3>
                  </div>
                </div>
                {index > 0 && (
                  <button type="button" className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); const el = scrollRef.current; if (!el) return; el.scrollBy({ left: -el.clientWidth, behavior: "smooth" }); }}>
                    <ChevronLeft size={18} strokeWidth={2} />
                  </button>
                )}
                {index < lookbookNails.length - 1 && (
                  <button type="button" className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); const el = scrollRef.current; if (!el) return; el.scrollBy({ left: el.clientWidth, behavior: "smooth" }); }}>
                    <ChevronRight size={18} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="w-full mb-16 px-5">
        <div className="relative w-full overflow-hidden rounded-[28px] border border-rose-50 bg-gradient-to-br from-[#fffafa] to-[#f8f8fb] px-6 py-7 shadow-sm">
          <div className="relative z-10 flex flex-col items-start w-[65%]">
            <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b6d45]">
              {isEnglish ? "Fit Finder" : "핏 파인더"}
            </span>
            <h3 className="text-[18px] font-bold text-gray-950 leading-tight">{isEnglish ? "Find Your Dog's Best Fit" : "내 강아지 찰떡 핏 찾기"}</h3>
            <p className="mt-1.5 text-[13px] text-stone-500">{isEnglish ? "Discover a tailored pet look with a quick test" : "간단한 테스트로 체형과 무드에 맞는 룩 찾기"}</p>
            <button
              type="button"
              onClick={() => navigate(toLocalizedPath('/test-intro'))}
              className="mt-5 flex items-center justify-center rounded-full bg-[#17130f] px-4 py-2 text-[13px] font-bold text-white transition-transform active:scale-95"
            >
              {isEnglish ? "Start Finder" : "핏 찾기 시작"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </button>
          </div>
          <div className="absolute right-4 bottom-4 w-[100px] h-[100px] pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80px] h-[80px] rounded-full bg-white shadow-sm flex items-center justify-center text-[34px]">🐶</div>
            </div>
            <div className="absolute top-0 right-0 text-[24px]">✦</div>
          </div>
        </div>
      </div>

      <section className="mb-16">
        <SectionHeading
          className="px-5"
          title={isEnglish ? "Theme Style" : "테마 스타일"}
          actionLabel={isEnglish ? "See All >" : "전체보기 >"}
          onAction={() => navigate(toLocalizedPath("/category"))}
        />
        <HorizontalCategoryRail
          items={THEME_STYLES}
          isEnglish={isEnglish}
          onNavigate={(to) => navigate(toLocalizedPath(to))}
        />
      </section>

      <section className="mb-16">
        <SectionHeading
          className="px-5"
          title={isEnglish ? "Season Essentials" : "시즌 에센셜"}
          actionLabel={isEnglish ? "See All >" : "전체보기 >"}
          onAction={() => navigate(toLocalizedPath("/season-curation"))}
        />
        <HorizontalCategoryRail
          items={SEASON_ESSENTIALS}
          isEnglish={isEnglish}
          onNavigate={(to) => navigate(toLocalizedPath(to))}
        />
      </section>

      <section className="mb-16 px-5">
        <SectionHeading
          title={isEnglish ? "Discover" : "디스커버"}
          actionLabel={isEnglish ? "See All >" : "전체보기 >"}
          onAction={() => navigate(toLocalizedPath("/gallery"))}
        />
        <div className="grid grid-cols-2 gap-4">
          {isDiscoverLoading ? (
            Array.from({ length: 6 }, (_, i) => (
              <div key={`discover-skel-${i}`} className="flex flex-col gap-2" aria-hidden>
                <div className="aspect-[3/4] w-full animate-pulse rounded-[22px] bg-stone-200" />
                <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-stone-200" />
              </div>
            ))
          ) : isDiscoverError ? (
            <p className="col-span-2 py-10 text-center text-sm text-stone-500">
              {isEnglish ? "Could not load the discover feed." : "디스커버 피드를 불러오지 못했습니다."}
            </p>
          ) : discoverItems.length === 0 ? (
            <p className="col-span-2 py-10 text-center text-sm text-stone-500">
              {isEnglish ? "No styles to show." : "표시할 스타일이 없습니다."}
            </p>
          ) : (
            discoverItems.map((item, index) => (
              <article
                key={item.id}
                className="flex cursor-pointer flex-col gap-2"
                role="button"
                tabIndex={0}
                onClick={() => openDetail(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDetail(item);
                  }
                }}
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded-[22px] bg-stone-200 shadow-sm">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={displayDiscoverTitle(item, isEnglish)}
                      className="h-full w-full object-cover object-center"
                      loading={index < 4 ? "eager" : "lazy"}
                      fetchPriority={index < 4 ? "high" : undefined}
                      decoding="async"
                    />
                  ) : null}
                </div>
                <p className="line-clamp-2 px-1 text-center text-[13px] font-medium tracking-tight text-stone-800">
                  {displayDiscoverTitle(item, isEnglish)}
                </p>
              </article>
            ))
          )}
          {isFetchingNextPage ? (
            <div className="col-span-2 flex items-center justify-center gap-2 py-4 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEnglish ? "Loading more" : "더 불러오는 중"}
            </div>
          ) : null}
          <div ref={observerRef} className="col-span-2 h-8" aria-hidden />
        </div>
      </section>

      <footer className="w-full border-t border-gray-100 bg-white px-5 pb-8 pt-10 text-left font-sans">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 shadow-sm">
          <p className="text-center text-[13px] font-medium leading-[1.6] text-stone-700">
            {isEnglish ? "WAGORA curates refined pet fashion moments." : "WAGORA는 반려견의 취향 있는 일상을 큐레이션합니다."}<br />{isEnglish ? "Use every look as inspiration for your companion's wardrobe." : "작은 옷장에 어울리는 스타일 영감으로 참고해보세요."}
          </p>
        </div>
        <div className="mb-6">
          <button type="button" onClick={() => setIsFooterOpen(!isFooterOpen)} className="flex items-center gap-1 text-[14px] font-bold text-stone-900">
            {isEnglish ? "WAGORA Studio" : "와고라 스튜디오 (WAGORA Studio)"}
            {isFooterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isFooterOpen && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[13px] text-stone-500">{isEnglish ? "A global pet fashion magazine for modern companions" : "모던 반려견을 위한 글로벌 펫 패션 매거진"}</p>
              <p className="text-[13px] text-gray-500">{isEnglish ? "Contact: k981202@naver.com" : "문의: k981202@naver.com"}</p>
            </div>
          )}
        </div>
        <div className="mb-4 flex items-center gap-3 text-[13px] text-gray-500">
          <Link to={toLocalizedPath("/terms")} className="font-semibold text-gray-500 hover:underline">
            {isEnglish ? "Terms of Service" : "이용약관"}
          </Link>
          <span className="text-gray-300">|</span>
          <Link to={toLocalizedPath("/privacy")} className="font-bold text-gray-800 hover:underline">
            {isEnglish ? "Privacy Policy" : "개인정보처리방침"}
          </Link>
        </div>
        <p className="text-[11px] font-medium text-stone-400">&copy; 2026 WAGORA Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}

function displayDiscoverTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? "Pet Style" : "펫 스타일");
}

function SectionHeading({
  title,
  actionLabel,
  onAction,
  className = "",
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  className?: string;
}) {
  return (
    <div className={`mb-5 flex items-center justify-between ${className}`}>
      <h2 className="text-xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>
      <button
        type="button"
        onClick={onAction}
        className="cursor-pointer text-sm font-medium text-gray-500"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function HorizontalCategoryRail({
  items,
  isEnglish,
  onNavigate,
}: {
  items: typeof THEME_STYLES;
  isEnglish: boolean;
  onNavigate: (to: string) => void;
}) {
  return (
    <div className="flex min-w-0 gap-3 overflow-x-auto px-5 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {items.map((item) => (
        <button
          key={item.to}
          type="button"
          onClick={() => onNavigate(item.to)}
          className="group relative h-[170px] w-[138px] shrink-0 overflow-hidden rounded-[26px] bg-gray-200 text-left shadow-sm transition-transform active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.75),transparent_28%),linear-gradient(135deg,#f1f1f1,#cfcfcf)]" />
          <div className="absolute right-4 top-4 h-12 w-12 rounded-full border border-white/60 bg-white/35 backdrop-blur-sm" />
          <div className="absolute bottom-12 left-4 h-10 w-20 rounded-full border border-white/50 bg-white/25 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {item.kicker}
            </p>
            <p className="mt-1 text-[17px] font-bold leading-tight">
              {isEnglish ? item.labelEn : item.label}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
