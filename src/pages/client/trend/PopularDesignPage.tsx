import { useRecommendHubQuery } from "@/entities/nail-design/api/useRecommendHubQuery";
import { usePopularSearchTrends } from "@/entities/nail-design/api/usePopularSearchTrends";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { supabase } from "@/shared/api/supabaseClient";
import type { NailDesignRow } from "@/shared/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

// 공통 썸네일 클래스
const NAIL_THUMB_IMAGE_FRAME = "aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5";
const NAIL_THUMB_TITLE = "block w-full min-w-0 max-w-full text-center text-sm font-medium tracking-tight text-gray-800 truncate mt-2";
const TREND_SKELETON_ROWS = 5;
const SHAPE_PREVIEW_KEYWORD = "라운드 스퀘어 오발 아몬드 코핀 발레리나";
const ARRAY_TEXT_FILTER_INDEXES = [0, 1, 2, 3, 4, 5] as const;
const POPULAR_DESIGN_SHAPE_COLUMNS =
  "id,created_at,title,title_en,image_url,category,tags,situations,styles,nail_length,color,mood,design_elements,popularity,views,saves,likes";

type RankingNailRow = NailDesignRow & { ranking_score?: number };

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? "Nail Design" : "네일 디자인");
}

function metric(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function engagementScore(item: NailDesignRow): number {
  return Math.max(metric(item.views), metric(item.saves), metric(item.likes));
}

function compareByEngagementThenNewest(a: NailDesignRow, b: NailDesignRow): number {
  const byEngagement = engagementScore(b) - engagementScore(a);
  if (byEngagement !== 0) return byEngagement;

  const aTime = new Date(a.created_at ?? 0).getTime();
  const bTime = new Date(b.created_at ?? 0).getTime();
  return bTime - aTime;
}

function escapePostgrestIlikePattern(raw: string): string {
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/,/g, " ")
    .trim();
}

function buildShapeOrFilter(shapeKeyword: string): string {
  const tokens = [
    ...new Set(
      shapeKeyword
        .split(/\s+/)
        .map((part) => escapePostgrestIlikePattern(part))
        .filter((part) => part.length > 0 && part !== "전체"),
    ),
  ];

  const parts: string[] = [];
  for (const token of tokens) {
    parts.push(
      `nail_length.ilike.%${token}%`,
      `title.ilike.%${token}%`,
      `design_elements.ilike.%${token}%`,
    );

    for (const index of ARRAY_TEXT_FILTER_INDEXES) {
      parts.push(`tags->>${index}.ilike.%${token}%`);
    }
  }

  return parts.join(",");
}

function usePopularPeriodBestQuery(period: string, maxLimit: number) {
  return useQuery({
    queryKey: ["nail-designs", "popular-design-period-best", { period, maxLimit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<RankingNailRow[]> => {
      const { data, error } = await supabase
        .rpc("get_ranking_nails", { p_period: period, p_limit: maxLimit })
        .abortSignal(signal);

      if (error) throw error;
      return (data ?? []) as RankingNailRow[];
    },
  });
}

function usePopularShapeBestQuery(shapeKeyword: string, maxLimit: number) {
  return useQuery({
    queryKey: ["nail-designs", "popular-design-shape-best", { shapeKeyword, maxLimit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<NailDesignRow[]> => {
      let query = supabase.from("wagora_lookbooks").select(POPULAR_DESIGN_SHAPE_COLUMNS);

      const shapeFilter = buildShapeOrFilter(shapeKeyword);
      if (shapeFilter) query = query.or(shapeFilter);

      const { data, error } = await query
        .order("popularity", { ascending: false })
        .order("saves", { ascending: false })
        .order("id", { ascending: false })
        .limit(maxLimit)
        .abortSignal(signal);

      if (error) throw error;
      return (data ?? []) as NailDesignRow[];
    },
  });
}

function initialNailData(item: NailDesignRow, isEnglish: boolean) {
  return {
    ...item,
    imageUrl: item.image_url,
    title: displayItemTitle(item, isEnglish),
  };
}

function PopularTrendStatusIcon({ index }: { index: number }) {
  return (
    <div className="w-10 flex justify-end">
      {(index === 0 || index === 1) && <TrendingUp className="w-5 h-5 text-[#FF7E67]" />}
      {index === 2 && (
        <span className="text-[10px] font-bold text-[#FF7E67] border border-[#FF7E67] rounded px-1.5 py-0.5">
          NEW
        </span>
      )}
      {index === 3 && <Minus className="w-5 h-5 text-gray-300" />}
      {index === 4 && <TrendingDown className="w-5 h-5 text-gray-400" />}
    </div>
  );
}

export default function PopularDesignPage() {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const { data: hubData = [] } = useRecommendHubQuery();
  const {
    data: popularTrends = [],
    isLoading: isTrendsLoading,
    isError: isTrendsError,
  } = usePopularSearchTrends();
  const { data: periodBest = [] } = usePopularPeriodBestQuery("weekly", 6);
  const { data: shapeBest = [] } = usePopularShapeBestQuery(SHAPE_PREVIEW_KEYWORD, 6);

  const engagementFallback = useMemo(
    () => [...hubData].sort(compareByEngagementThenNewest),
    [hubData],
  );

  const reactionBest = useMemo(
    () => {
      const liked = [...hubData]
        .filter((item) => metric(item.likes) > 0)
        .sort((a, b) => metric(b.likes) - metric(a.likes))
        .slice(0, 6);

      if (liked.length >= 4) return liked;

      const seen = new Set(liked.map((item) => item.id));
      const fallback = engagementFallback
        .slice(2, 8)
        .filter((item) => !seen.has(item.id));
      return [...liked, ...fallback].slice(0, 6);
    },
    [hubData, engagementFallback],
  );

  const goDetail = (item: NailDesignRow) => {
    navigate(`/detail/${item.id}`, {
      state: { initialNailData: initialNailData(item, isEnglish) },
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-white font-sans text-slate-900 antialiased">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur-md">
        <button type="button" aria-label="뒤로 가기" className="z-10 p-1 -ml-1" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-bold tracking-tight text-gray-900">
          {isEnglish ? "Popular Designs" : "인기 네일 디자인"}
        </h1>
        <button type="button" aria-label="검색" className="z-10 p-1 -mr-1" onClick={() => navigate("/search")}>
          <Search className="w-6 h-6 text-gray-900" strokeWidth={2} />
        </button>
      </header>

      <main className="mt-4 flex flex-col gap-10 overflow-x-hidden pb-8">
        {/* 1. 기간별 BEST 네일 */}
        <section className="w-full px-5">
          <div className="mb-4 flex w-full items-center justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Period BEST Nails" : "기간별 BEST 네일"}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/period-best-list')}
              className="cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          {/* 스크롤바 완벽 숨김 처리 */}
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {periodBest.map((item, index) => (
              <article
                key={item.id}
                className="flex w-32 flex-none cursor-pointer flex-col"
                onClick={() => goDetail(item)}
              >
                <div className={`relative ${NAIL_THUMB_IMAGE_FRAME} bg-gray-100`}>
                  <img
                    src={item.image_url}
                    alt={displayItemTitle(item, isEnglish)}
                    className="h-full w-full object-cover object-center"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : undefined}
                  />
                </div>
                <span className={NAIL_THUMB_TITLE}>{displayItemTitle(item, isEnglish)}</span>
              </article>
            ))}
          </div>
        </section>

        {/* 2. 유저 반응 BEST */}
        <section className="w-full px-5">
          <div className="mb-4 flex w-full items-center justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "User Reaction BEST" : "유저 반응 BEST"}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/reaction-best-list')}
              className="cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {reactionBest.map((item) => (
              <article
                key={item.id}
                className="flex w-44 shrink-0 cursor-pointer flex-col"
                onClick={() => goDetail(item)}
              >
                <div className={`${NAIL_THUMB_IMAGE_FRAME} bg-gray-100`}>
                  <img
                    src={item.image_url}
                    alt={displayItemTitle(item, isEnglish)}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span className={NAIL_THUMB_TITLE}>{displayItemTitle(item, isEnglish)}</span>
              </article>
            ))}
          </div>
        </section>

        {/* 3. 손톱 모양별 BEST 네일 */}
        <section className="w-full px-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Shape BEST Nails" : "손톱 모양별 BEST 네일"}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/shape-best-list')}
              className="cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="-mx-5 min-w-0 flex gap-4 overflow-x-auto pl-5 pr-5 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {shapeBest.map((item) => (
              <article
                key={item.id}
                className="flex w-32 flex-none cursor-pointer flex-col"
                onClick={() => goDetail(item)}
              >
                <div className={`${NAIL_THUMB_IMAGE_FRAME} bg-gray-100`}>
                  <img
                    src={item.image_url}
                    alt={displayItemTitle(item, isEnglish)}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span className={NAIL_THUMB_TITLE}>{displayItemTitle(item, isEnglish)}</span>
              </article>
            ))}
          </div>
        </section>

        {/* 4. 인기 검색어 트렌드 (독립 컴포넌트 인라인 정적 처리) */}
        <section className="w-full px-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              {isEnglish ? "Popular Search Trends" : "인기 검색어 트렌드"}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/search-trend-list')}
              className="cursor-pointer text-sm font-medium text-gray-500"
            >
              {isEnglish ? "View All >" : "전체보기 >"}
            </button>
          </div>
          <div className="flex flex-col">
            {isTrendsLoading ? (
              Array.from({ length: TREND_SKELETON_ROWS }, (_, index) => (
                <div
                  key={`popular-design-trend-skel-${index}`}
                  className="flex items-center gap-3 border-b border-gray-50 py-3.5 last:border-0"
                  aria-hidden
                >
                  <div className="h-5 w-6 shrink-0 animate-pulse rounded bg-gray-100" />
                  <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
                </div>
              ))
            ) : isTrendsError ? (
              <p className="py-6 text-center text-sm text-gray-500">
                {isEnglish ? "Failed to load popular searches." : "인기 검색어를 불러오지 못했어요."}
              </p>
            ) : popularTrends.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                {isEnglish ? "No popular search data yet." : "아직 집계된 인기 검색어가 없어요."}
              </p>
            ) : (
              popularTrends.map((item, index) => {
                const rank = index + 1;
                const keyword = String(item.keyword ?? "").trim();
                if (!keyword) return null;
                return (
                  <button
                    key={`${rank}-${keyword}`}
                    type="button"
                    onClick={() => navigate(`/search?q=${encodeURIComponent(keyword)}`)}
                    className="flex w-full items-center py-3.5 border-b border-gray-50 last:border-0 cursor-pointer text-left"
                  >
                    <span className={`w-8 text-center text-lg font-bold ${rank <= 3 ? 'text-[#FF7E67]' : 'text-gray-400'}`}>
                      {rank}
                    </span>
                    <span className="flex-1 ml-3 truncate text-[15px] font-medium text-gray-800">{keyword}</span>
                    <PopularTrendStatusIcon index={index} />
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
