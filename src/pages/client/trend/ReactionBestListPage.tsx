import { supabase } from "@/shared/api/supabaseClient";
import { useLanguageContext } from "@/contexts/LanguageContext";
import type { NailDesignRow } from "@/shared/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from "react-router-dom";

const TAB_ITEMS = [
  { id: "save", name: "📌 압도적 저장", period: "압도적 저장" },
  { id: "like", name: "❤️ 독보적 하트", period: "독보적 하트" },
] as const;
const REACTION_SCROLL_Y_KEY = "gelia_reaction_best_scroll_y";
const REACTION_BEST_COLUMNS =
  "id,created_at,title,title_en,image_url,category,tags,situations,styles,nail_length,color,mood,design_elements,popularity,views,saves,likes";

type ReactionBestSortColumn = "saves" | "likes";

const TAB_LABEL_EN: Record<(typeof TAB_ITEMS)[number]["id"], string> = {
  save: "📌 Most Saved",
  like: "❤️ Most Liked",
};

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? "")
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayTabLabel(tab: (typeof TAB_ITEMS)[number], isEnglish: boolean): string {
  return isEnglish ? TAB_LABEL_EN[tab.id] : tab.name;
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? "Nail Design" : "네일 디자인");
}

function resolveActiveTab(rawTab: string | null): (typeof TAB_ITEMS)[number] {
  const pure = extractPureThemeKeyword(rawTab ?? "");
  return TAB_ITEMS.find((tab) => tab.id === rawTab || extractPureThemeKeyword(tab.name) === pure || tab.period === pure) ?? TAB_ITEMS[0];
}

function useReactionBestQuery(sortBy: ReactionBestSortColumn, maxLimit: number) {
  return useQuery({
    queryKey: ["nail-designs", "reaction-best", { sortBy, maxLimit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<NailDesignRow[]> => {
      const { data, error } = await supabase
        .from("wagora_lookbooks")
        .select(REACTION_BEST_COLUMNS)
        .order(sortBy, { ascending: false })
        .order("id", { ascending: false })
        .limit(maxLimit)
        .abortSignal(signal);
      if (error) throw error;
      return (data ?? []) as NailDesignRow[];
    },
  });
}

export default function ReactionBestListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null);

  const activeTab = useMemo(() => resolveActiveTab(searchParams.get("tab")), [searchParams]);
  const maxLimit = 30;
  const sortBy: ReactionBestSortColumn = activeTab.id === "like" ? "likes" : "saves";
  const { data = [], isLoading, isError } = useReactionBestQuery(sortBy, maxLimit);
  const top1 = data[0];
  const remainingList = data.slice(1);

  const setActiveTab = useCallback(
    (tab: (typeof TAB_ITEMS)[number]) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", extractPureThemeKeyword(tab.name));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(REACTION_SCROLL_Y_KEY, window.scrollY.toString());
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("tab")) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", extractPureThemeKeyword(TAB_ITEMS[0].name));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    activeTabButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab]);

  useEffect(() => {
    if (navigationType !== "POP" || isLoading || data.length === 0) return;
    const savedY = sessionStorage.getItem(REACTION_SCROLL_Y_KEY);
    if (!savedY) return;
    const y = Number.parseInt(savedY, 10);
    if (Number.isNaN(y)) return;
    const timer = window.setTimeout(() => {
      window.scrollTo(0, y);
      sessionStorage.removeItem(REACTION_SCROLL_Y_KEY);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [navigationType, location.pathname, isLoading, data.length]);

  const detailState = (item: NailDesignRow) => ({
    initialNailData: { ...item, imageUrl: item.image_url, title: displayItemTitle(item, isEnglish) },
  });

  return (
    <div className="relative min-h-screen w-full bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
        <div className="relative flex h-14 w-full items-center justify-between px-5">
          <button type="button" className="z-10 p-1 text-gray-800" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-bold tracking-tight text-gray-900">
            {isEnglish ? "User Reaction BEST" : "유저 반응 BEST"}
          </h1>
          <button type="button" className="z-10 p-1 text-gray-800" onClick={() => navigate("/search")}>
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 mt-2 flex w-full border-t border-gray-50 px-2 sm:px-4">
          {TAB_ITEMS.map((tab) => (
            <button
              ref={activeTab.id === tab.id ? activeTabButtonRef : undefined}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex min-h-[3rem] min-w-0 flex-1 items-center justify-center px-2 py-3 text-center text-sm font-medium leading-tight transition-colors ${
                activeTab.id === tab.id
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {displayTabLabel(tab, isEnglish)}
            </button>
          ))}
        </div>
      </header>

      <main className="w-full min-w-0 flex-1 pt-4 pb-8">
        {isLoading ? (
          <>
            <div className="px-5" aria-hidden>
              <div className="aspect-[3/4] w-full animate-pulse rounded-[20px] bg-gray-100 shadow-sm" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 px-5">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={`reaction-skel-${index}`} className="flex w-full min-w-0 flex-col gap-2" aria-hidden>
                  <div className="aspect-[3/4] w-full animate-pulse rounded-[20px] bg-gray-100" />
                  <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </>
        ) : isError ? (
          <>
            <div className="px-5" aria-hidden>
              <div className="aspect-[3/4] w-full rounded-[20px] bg-gray-100 shadow-sm" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 px-5">
              <p className="col-span-2 py-6 text-center text-sm text-gray-500">
                {isEnglish ? "Failed to load rankings." : "랭킹을 불러오지 못했습니다."}
              </p>
            </div>
          </>
        ) : !top1 ? (
          <>
            <div className="px-5" aria-hidden>
              <div className="aspect-[3/4] w-full rounded-[20px] bg-gray-100 shadow-sm" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 px-5">
              <p className="col-span-2 py-6 text-center text-sm text-gray-500">
                {isEnglish ? "No reaction data yet." : "집계된 유저 반응 데이터가 없습니다."}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="px-5">
              <Link
                to={`/detail/${top1.id}`}
                state={detailState(top1)}
                onClick={saveListScrollPosition}
                className="relative block w-full cursor-pointer overflow-hidden rounded-[20px] border border-black/5 bg-gray-200 shadow-sm aspect-[3/4] text-left"
              >
                <img
                  alt={displayItemTitle(top1, isEnglish)}
                  className="h-full w-full object-cover object-center"
                  src={top1.image_url}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement?.classList.add("animate-pulse", "bg-gray-100");
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] min-h-[45%] bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden />
                <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                  <span>👑</span>
                  <span>1</span>
                </div>
                <div className="absolute bottom-4 left-4 z-10 flex w-[calc(100%-2rem)] flex-col items-start">
                  <h2 className="w-full min-w-0 text-left text-lg font-bold leading-snug tracking-tight text-white">
                    {displayItemTitle(top1, isEnglish)}
                  </h2>
                </div>
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 px-5">
              {remainingList.map((item, index) => {
                const rank = index + 2;
                const title = displayItemTitle(item, isEnglish);
                return (
                  <Link
                    key={item.id}
                    to={`/detail/${item.id}`}
                    state={detailState(item)}
                    onClick={saveListScrollPosition}
                    className="group flex min-w-0 cursor-pointer flex-col gap-0 text-left"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-black/5 bg-gray-200 shadow-sm">
                      <img
                        alt={title}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        src={item.image_url}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement?.classList.add("animate-pulse", "bg-gray-100");
                        }}
                      />
                      <div className="absolute left-2 top-2 z-10 flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-gray-900/85 px-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                        {rank}
                      </div>
                    </div>
                    <div className="mt-2 flex w-full flex-col items-center justify-center px-1">
                      <p className="line-clamp-2 w-full text-center text-sm font-medium tracking-tight text-gray-800">
                        {title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
