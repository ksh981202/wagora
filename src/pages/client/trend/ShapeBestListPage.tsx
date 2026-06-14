import { supabase } from "@/shared/api/supabaseClient";
import { useLanguageContext } from "@/contexts/LanguageContext";
import type { NailDesignRow } from "@/shared/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from "react-router-dom";

const SHAPE_TABS = ["전체", "⚪ 라운드", "🧊 스퀘어", "🌰 오발/아몬드"] as const;
const SHAPE_SCROLL_Y_KEY = "gelia_shape_best_scroll_y";
const ARRAY_TEXT_FILTER_INDEXES = [0, 1, 2, 3, 4, 5] as const;
const SHAPE_BEST_COLUMNS =
  "id,created_at,title,title_en,image_url,category,tags,situations,styles,nail_length,color,mood,design_elements,popularity,views,saves,likes";

const SHAPE_TAB_LABEL_EN: Record<(typeof SHAPE_TABS)[number], string> = {
  전체: "All",
  "⚪ 라운드": "⚪ Round",
  "🧊 스퀘어": "🧊 Square",
  "🌰 오발/아몬드": "🌰 Oval/Almond",
};

const SHAPE_KEYWORD_MAPPING: Record<string, string> = {
  전체: "",
  라운드: "라운드 round 둥근 오벌라운드",
  스퀘어: "스퀘어 square 각 직사각 라운드스퀘어",
  "오발/아몬드": "오발 아몬드 oval almond 타원 뾰족 뾰족한",
};

function extractPureThemeKeyword(raw: string): string {
  return String(raw ?? "")
    .replace(/[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
      `title.ilike.%${token}%`,
      `category.ilike.%${token}%`,
      `nail_length.ilike.%${token}%`,
      `color.ilike.%${token}%`,
      `mood.ilike.%${token}%`,
      `design_elements.ilike.%${token}%`,
    );

    for (const index of ARRAY_TEXT_FILTER_INDEXES) {
      parts.push(
        `situations->>${index}.ilike.%${token}%`,
        `styles->>${index}.ilike.%${token}%`,
        `tags->>${index}.ilike.%${token}%`,
      );
    }
  }

  return parts.join(",");
}

function resolveActiveTab(rawTab: string | null): (typeof SHAPE_TABS)[number] {
  const pure = extractPureThemeKeyword(rawTab ?? "");
  return SHAPE_TABS.find((tab) => tab === rawTab || extractPureThemeKeyword(tab) === pure) ?? SHAPE_TABS[0];
}

function shapeTabKeywordForQuery(tab: (typeof SHAPE_TABS)[number]): string {
  const mappingKey = tab.replace(/^[^\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9]+/, "").trim();
  return SHAPE_KEYWORD_MAPPING[mappingKey] ?? extractPureThemeKeyword(tab);
}

function displayShapeTabLabel(tab: (typeof SHAPE_TABS)[number], isEnglish: boolean): string {
  return isEnglish ? SHAPE_TAB_LABEL_EN[tab] : tab;
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? "Nail Design" : "네일 디자인");
}

function useShapeBestQuery(shapeKeyword: string, maxLimit: number) {
  return useQuery({
    queryKey: ["nail-designs", "shape-best-ranking", { shapeKeyword, maxLimit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<NailDesignRow[]> => {
      let query = supabase.from("wagora_lookbooks").select(SHAPE_BEST_COLUMNS);

      if (shapeKeyword !== "전체") {
        const shapeFilter = buildShapeOrFilter(shapeKeyword);
        if (shapeFilter) query = query.or(shapeFilter);
      }

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

export default function ShapeBestListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabButtonRef = useRef<HTMLButtonElement | null>(null);

  const activeTab = useMemo(() => resolveActiveTab(searchParams.get("tab")), [searchParams]);
  const rankingPeriod = shapeTabKeywordForQuery(activeTab);
  const maxLimit = 30;
  const { data = [], isLoading, isError } = useShapeBestQuery(rankingPeriod, maxLimit);
  const rankingItems = data.slice(0, maxLimit);

  const setActiveTab = useCallback(
    (tab: (typeof SHAPE_TABS)[number]) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", extractPureThemeKeyword(tab));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(SHAPE_SCROLL_Y_KEY, window.scrollY.toString());
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("tab")) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", extractPureThemeKeyword(SHAPE_TABS[0]));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    activeTabButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab]);

  useEffect(() => {
    if (navigationType !== "POP" || isLoading || rankingItems.length === 0) return;
    const savedY = sessionStorage.getItem(SHAPE_SCROLL_Y_KEY);
    if (!savedY) return;
    const y = Number.parseInt(savedY, 10);
    if (Number.isNaN(y)) return;
    const timer = window.setTimeout(() => {
      window.scrollTo(0, y);
      sessionStorage.removeItem(SHAPE_SCROLL_Y_KEY);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [navigationType, location.pathname, isLoading, rankingItems.length]);

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900">
      <div className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
        <header className="relative flex h-14 w-full items-center justify-between bg-white px-5">
          <button type="button" onClick={() => navigate(-1)} className="z-10 p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 max-w-[62%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-lg font-bold text-gray-900 whitespace-nowrap">
            {isEnglish ? "Shape BEST Nails" : "손톱 형태별 인기 네일"}
          </h1>
          <button type="button" className="z-10 p-2 -mr-2" onClick={() => navigate("/search")}>
            <Search className="w-6 h-6 text-gray-900" />
          </button>
        </header>

        <section className="min-w-0 w-full flex flex-nowrap gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 pb-2 pt-3 whitespace-nowrap scroll-smooth [-webkit-overflow-scrolling:touch]">
          {SHAPE_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                ref={isActive ? activeTabButtonRef : undefined}
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  isActive
                    ? "shrink-0 whitespace-nowrap rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition-colors"
                    : "shrink-0 whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                }
              >
                {displayShapeTabLabel(tab, isEnglish)}
              </button>
            );
          })}
          <div className="w-4 shrink-0" aria-hidden="true" />
        </section>

        <div className="relative flex items-center justify-between px-4 pb-3 pt-2">
          <span className="text-sm text-gray-500">
            {isEnglish ? (
              <>Total <span className="font-bold text-[#FF7E67]">{maxLimit}</span> designs</>
            ) : (
              <>총 <span className="font-bold text-[#FF7E67]">{maxLimit}</span>개의 디자인</>
            )}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
            <span>{isEnglish ? "Popular" : "인기순"}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </span>
        </div>
      </div>

      <main className="grid grid-cols-2 gap-4 px-5 pt-4 pb-8">
        {isLoading ? (
          Array.from({ length: 8 }, (_, index) => (
            <article key={`shape-skel-${index}`} className="flex w-full min-w-0 flex-col gap-2" aria-hidden>
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
              <article key={item.id} className="flex flex-col gap-2 cursor-pointer">
                <Link
                  to={`/detail/${item.id}`}
                  state={{ initialNailData: { ...item, imageUrl: item.image_url, title } }}
                  onClick={saveListScrollPosition}
                >
                  <div className="w-full aspect-[3/4] rounded-[20px] overflow-hidden bg-gray-100 border border-black/5">
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
          })
        )}
      </main>
    </div>
  );
}
