import {
  DEFAULT_GALLERY_SORT,
  useGalleryCountQuery,
  useGalleryInfiniteQuery,
} from "@/entities/nail-design/api/useGalleryInfiniteQuery";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { usePopularSearchTrends } from "@/entities/nail-design/api/usePopularSearchTrends";
import { NAIL_KEYWORD_EN_DICTIONARY } from "@/shared/constants/nailKeywords";
import type { NailDesignRow } from "@/shared/types/database.types";
import { ChevronDown, ChevronLeft, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from "react-router-dom";

const TREND_LIMIT = 20;
const SEARCH_TREND_SCROLL_Y_KEY = "gelia_search_trend_scroll_y";
const SEARCH_TREND_SCROLL_ITEMS_KEY = "gelia_search_trend_scroll_items";

function normalizeKeyword(raw: string | null | undefined): string {
  return String(raw ?? "").trim();
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? "Nail Design" : "네일 디자인");
}

export default function SearchTrendListPage() {
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: popularTrends = [],
    isLoading: isTrendsLoading,
    isError: isTrendsError,
  } = usePopularSearchTrends(TREND_LIMIT);

  const firstKeyword = useMemo(
    () => normalizeKeyword(popularTrends.find((trend) => normalizeKeyword(trend.keyword))?.keyword),
    [popularTrends],
  );
  const keywordParam = normalizeKeyword(searchParams.get("keyword"));
  const activeKeyword = keywordParam || firstKeyword;
  const isGalleryEnabled = activeKeyword.length > 0;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGalleryInfiniteQuery(activeKeyword, DEFAULT_GALLERY_SORT, { enabled: isGalleryEnabled });

  const galleryItems = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );
  const { data: totalCount } = useGalleryCountQuery(activeKeyword, { enabled: isGalleryEnabled });
  const totalCountLabel = totalCount == null ? "-" : totalCount.toLocaleString();

  const setActiveKeyword = useCallback(
    (keyword: string) => {
      const nextKeyword = normalizeKeyword(keyword);
      if (!nextKeyword) return;
      const next = new URLSearchParams(searchParams);
      next.set("keyword", nextKeyword);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(SEARCH_TREND_SCROLL_Y_KEY, window.scrollY.toString());
      sessionStorage.setItem(SEARCH_TREND_SCROLL_ITEMS_KEY, galleryItems.length.toString());
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, [galleryItems.length]);

  useEffect(() => {
    if (keywordParam || !firstKeyword) return;
    const next = new URLSearchParams(searchParams);
    next.set("keyword", firstKeyword);
    setSearchParams(next, { replace: true });
  }, [firstKeyword, keywordParam, searchParams, setSearchParams]);

  useEffect(() => {
    const el = activeTabButtonRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeKeyword]);

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasNextPage || !isGalleryEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isFetchingNextPage) return;
        void fetchNextPage();
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeKeyword, fetchNextPage, hasNextPage, isFetchingNextPage, isGalleryEnabled]);

  useEffect(() => {
    if (navigationType !== "POP") return;

    const savedY = sessionStorage.getItem(SEARCH_TREND_SCROLL_Y_KEY);
    if (!savedY) return;

    const savedItemsRaw = sessionStorage.getItem(SEARCH_TREND_SCROLL_ITEMS_KEY);
    const savedItems = savedItemsRaw ? Number.parseInt(savedItemsRaw, 10) : 0;
    const hasEnoughItems =
      galleryItems.length > 0 &&
      (Number.isNaN(savedItems) || savedItems <= 0 || galleryItems.length >= savedItems);

    if (!hasEnoughItems && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
      return;
    }

    if (!hasEnoughItems) return;

    const y = Number.parseInt(savedY, 10);
    if (Number.isNaN(y)) return;

    const timer = window.setTimeout(() => {
      window.scrollTo(0, y);
      sessionStorage.removeItem(SEARCH_TREND_SCROLL_Y_KEY);
      sessionStorage.removeItem(SEARCH_TREND_SCROLL_ITEMS_KEY);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [
    fetchNextPage,
    galleryItems.length,
    hasNextPage,
    isFetchingNextPage,
    location.pathname,
    location.search,
    navigationType,
  ]);

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900">
      <div className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
        <header className="relative flex h-14 w-full items-center justify-between bg-white px-5">
          <button type="button" onClick={() => navigate(-1)} className="z-10 p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 max-w-[62%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-lg font-bold text-gray-900 whitespace-nowrap">
            {isEnglish ? "Popular Search Trends" : "인기 검색어 트렌드"}
          </h1>
          <button type="button" className="z-10 p-2 -mr-2" onClick={() => navigate("/search")}>
            <Search className="w-6 h-6 text-gray-900" />
          </button>
        </header>

        <section className="min-w-0 w-full flex flex-nowrap gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 pb-2 pt-3 whitespace-nowrap scroll-smooth [-webkit-overflow-scrolling:touch]">
          {isTrendsLoading ? (
            Array.from({ length: 5 }, (_, index) => (
              <div key={`trend-tab-skel-${index}`} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-gray-100" aria-hidden />
            ))
          ) : (
            popularTrends.map((trend, index) => {
              const keyword = normalizeKeyword(trend.keyword);
              if (!keyword) return null;
              const isActive = activeKeyword === keyword;
              const displayKeyword = isEnglish ? (NAIL_KEYWORD_EN_DICTIONARY[keyword] || keyword) : keyword;
              return (
                <button
                  ref={isActive ? activeTabButtonRef : undefined}
                  key={`${index + 1}-${keyword}`}
                  type="button"
                  onClick={() => setActiveKeyword(keyword)}
                  className={
                    isActive
                      ? "shrink-0 whitespace-nowrap rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition-colors"
                      : "shrink-0 whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  }
                >
                  {isEnglish ? `Rank ${index + 1} ${displayKeyword}` : `${index + 1}위 ${displayKeyword}`}
                </button>
              );
            })
          )}
          <div className="w-4 shrink-0" aria-hidden="true" />
        </section>

        <div className="relative flex items-center justify-between px-4 pb-3 pt-2">
          <span className="text-sm text-gray-500">
            {isEnglish ? (
              <>
                Total <strong className="font-bold text-[#FF7E67]">{totalCountLabel}</strong> designs
              </>
            ) : (
              <>
                총 <strong className="font-bold text-[#FF7E67]">{totalCountLabel}</strong>개의 디자인
              </>
            )}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
            <span>{isEnglish ? "Popular" : "인기순"}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </span>
        </div>
      </div>

      <main className="grid w-full min-w-0 grid-cols-2 gap-4 px-5 pt-4 pb-8">
        {isTrendsError ? (
          <div className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? "Failed to load trend data." : "트렌드 데이터를 불러오지 못했습니다."}
          </div>
        ) : !isGalleryEnabled && !isTrendsLoading ? (
          <div className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? "No trend data has been collected yet." : "아직 집계된 인기 검색어가 없습니다."}
          </div>
        ) : isLoading || (isTrendsLoading && !isGalleryEnabled) ? (
          Array.from({ length: 8 }, (_, index) => (
            <div key={`search-trend-skel-${index}`} aria-hidden>
              <div className="flex w-full min-w-0 flex-col gap-2">
                <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? "Failed to load designs." : "디자인을 불러오지 못했습니다."}
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? "No nails found for this keyword." : "해당 키워드의 네일이 없어요."}
          </div>
        ) : (
          <>
            {galleryItems.map((item, index) => {
              const title = displayItemTitle(item, isEnglish);
              return (
                <article key={item.id}>
                  <Link
                    to={`/detail/${item.id}`}
                    state={{ initialNailData: { ...item, imageUrl: item.image_url, title } }}
                    onClick={saveListScrollPosition}
                    className="flex min-w-0 cursor-pointer flex-col gap-2"
                  >
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-black/5">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={title}
                          className="h-full w-full object-cover object-center transition-transform hover:scale-105"
                          loading={index < 4 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={index < 4 ? "high" : undefined}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement?.classList.add("animate-pulse", "bg-gray-100");
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="mt-2 flex w-full flex-col items-center justify-center px-1">
                      <p className="w-full truncate text-center text-sm font-medium tracking-tight text-gray-800">{title}</p>
                    </div>
                  </Link>
                </article>
              );
            })}
            {isFetchingNextPage
              ? [0, 1].map((index) => (
                  <div key={`search-trend-next-skel-${index}`} aria-hidden>
                    <div className="flex w-full min-w-0 flex-col gap-2">
                      <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-gray-100" />
                      <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))
              : null}
          </>
        )}
      </main>
      <div ref={observerRef} className="h-10" aria-hidden />
    </div>
  );
}
