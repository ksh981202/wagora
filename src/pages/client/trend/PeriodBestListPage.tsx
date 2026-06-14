import { supabase } from "@/shared/api/supabaseClient";
import { useLanguageContext } from "@/contexts/LanguageContext";
import type { NailDesignRow } from "@/shared/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from "react-router-dom";

const PERIOD_TABS = ["🔥 일간", "👑 주간", "🏆 월간"] as const;
const PERIOD_SCROLL_Y_KEY = "gelia_period_best_scroll_y";

type RankingNailRow = NailDesignRow & { ranking_score?: number };

const PERIOD_TAB_LABEL_EN: Record<(typeof PERIOD_TABS)[number], string> = {
  "🔥 일간": "🔥 Daily",
  "👑 주간": "👑 Weekly",
  "🏆 월간": "🏆 Monthly",
};

const PERIOD_PARAM_BY_TAB: Record<string, string> = {
  일간: "realtime",
  주간: "weekly",
  월간: "monthly",
};

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? "")
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveActiveTab(rawTab: string | null): (typeof PERIOD_TABS)[number] {
  const pure = extractPureThemeKeyword(rawTab ?? "");
  return PERIOD_TABS.find((tab) => extractPureThemeKeyword(tab) === pure) ?? PERIOD_TABS[0];
}

function displayPeriodTabLabel(tab: (typeof PERIOD_TABS)[number], isEnglish: boolean): string {
  return isEnglish ? PERIOD_TAB_LABEL_EN[tab] : tab;
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? "Nail Design" : "네일 디자인");
}

function useStyleBestRankingQuery(period: string, maxLimit: number) {
  return useQuery({
    queryKey: ["nail-designs", "period-best-ranking", { period, maxLimit }],
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

export default function PeriodBestListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null);

  const activeTab = useMemo(() => resolveActiveTab(searchParams.get("tab")), [searchParams]);
  const rankingPeriod = PERIOD_PARAM_BY_TAB[extractPureThemeKeyword(activeTab)] ?? "realtime";
  const maxLimit = 30;
  const { data = [], isLoading, isError } = useStyleBestRankingQuery(rankingPeriod, maxLimit);
  const rankingItems = data.slice(0, maxLimit);

  const setActiveTab = useCallback(
    (tab: (typeof PERIOD_TABS)[number]) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", extractPureThemeKeyword(tab));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(PERIOD_SCROLL_Y_KEY, window.scrollY.toString());
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("tab")) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", extractPureThemeKeyword(PERIOD_TABS[0]));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    activeTabButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab]);

  useEffect(() => {
    if (navigationType !== "POP" || isLoading || rankingItems.length === 0) return;
    const savedY = sessionStorage.getItem(PERIOD_SCROLL_Y_KEY);
    if (!savedY) return;
    const y = Number.parseInt(savedY, 10);
    if (Number.isNaN(y)) return;
    const timer = window.setTimeout(() => {
      window.scrollTo(0, y);
      sessionStorage.removeItem(PERIOD_SCROLL_Y_KEY);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [navigationType, location.pathname, isLoading, rankingItems.length]);

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900">
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white backdrop-blur-sm">
        <div className="relative flex h-14 w-full items-center justify-between px-5">
          <button type="button" onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap">
            {isEnglish ? "Period BEST Nails" : "기간별 BEST 네일"}
          </h1>
          <button type="button" className="p-1 -mr-1" onClick={() => navigate("/search")}>
            <Search className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        <div className="min-w-0 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-2 pt-1 mt-2 mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth [-webkit-overflow-scrolling:touch]">
          {PERIOD_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                ref={isActive ? activeTabButtonRef : undefined}
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  isActive
                    ? "shrink-0 whitespace-nowrap rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors"
                    : "shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/90"
                }
              >
                {displayPeriodTabLabel(tab, isEnglish)}
              </button>
            );
          })}
          <div className="w-4 shrink-0" aria-hidden="true" />
        </div>

        <div className="relative flex items-center justify-between px-4 pb-3 pt-2">
          <span className="text-sm text-gray-500">
            {isEnglish ? (
              <>Total <strong className="text-gray-900">{maxLimit}</strong> designs</>
            ) : (
              <>총 <strong className="text-gray-900">{maxLimit}</strong>개의 디자인</>
            )}
          </span>
          <span className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700">
            <span>{isEnglish ? "Popular" : "인기순"}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </span>
        </div>
      </header>

      <main className="grid grid-cols-2 gap-4 px-5 pt-4 pb-8">
        {isLoading ? (
          Array.from({ length: 8 }, (_, index) => (
            <article key={`period-skel-${index}`} className="flex w-full min-w-0 flex-col gap-2" aria-hidden>
              <div className="aspect-[3/4] w-full animate-pulse rounded-[20px] bg-gray-100" />
              <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            </article>
          ))
        ) : isError ? (
          <p className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? "Failed to load rankings." : "랭킹을 불러오지 못했습니다."}
          </p>
        ) : rankingItems.length === 0 ? (
          <p className="col-span-2 py-12 text-center text-sm text-gray-500">
            {isEnglish ? "No nails registered yet." : "등록된 네일이 없어요."}
          </p>
        ) : (
          rankingItems.map((item, index) => {
            const title = displayItemTitle(item, isEnglish);
            return (
              <article key={item.id} className="flex w-full min-w-0 cursor-pointer flex-col items-stretch gap-0">
                <Link
                  to={`/detail/${item.id}`}
                  state={{ initialNailData: { ...item, imageUrl: item.image_url, title } }}
                  onClick={saveListScrollPosition}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5 bg-gray-200 shadow-sm">
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
                    <span className="absolute left-2 top-2 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-gray-900/85 px-2 text-xs font-bold text-white shadow-sm backdrop-blur-[2px]">
                      {index + 1}
                    </span>
                  </div>
                  <div className="mt-2 flex w-full min-w-0 justify-center text-center px-1">
                    <span className="block w-full min-w-0 truncate text-center text-sm font-medium tracking-tight text-gray-800">
                      {title}
                    </span>
                  </div>
                </Link>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
