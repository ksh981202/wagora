import { supabase } from "@/shared/api/supabaseClient";
import { useLanguageContext } from "@/contexts/LanguageContext";
import type { NailDesignRow } from "@/shared/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Search } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useNavigationType } from "react-router-dom";

const MARBLE_BEST_LIMIT = 30;
const MARBLE_BEST_SKELETON_COUNT = 8;
const MARBLE_BEST_SCROLL_Y_KEY = "gelia_marble_best_scroll_y";
const MARBLE_KEYWORDS = ["마블", "대리석"] as const;
const MARBLE_BEST_COLUMNS =
  "id,created_at,title,title_en,image_url,category,tags,situations,styles,nail_length,color,mood,design_elements,popularity,views,saves,likes";
const ARRAY_TEXT_FILTER_INDEXES = [0, 1, 2, 3, 4, 5] as const;

function escapePostgrestIlikePattern(raw: string): string {
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/,/g, " ")
    .trim();
}

function buildMarbleOrFilter(): string {
  const parts: string[] = [];

  for (const keyword of MARBLE_KEYWORDS) {
    const token = escapePostgrestIlikePattern(keyword);
    parts.push(`title.ilike.%${token}%`, `design_elements.ilike.%${token}%`);

    for (const index of ARRAY_TEXT_FILTER_INDEXES) {
      parts.push(`tags->>${index}.ilike.%${token}%`);
    }
  }

  return parts.join(",");
}

function displayItemTitle(item: NailDesignRow, isEnglish: boolean): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  if (isEnglish && en) return en;
  return ko || en || (isEnglish ? "Nail Design" : "네일 디자인");
}

function useMarbleBestQuery(maxLimit: number) {
  return useQuery({
    queryKey: ["nail-designs", "marble-best", { maxLimit }],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<NailDesignRow[]> => {
      const { data, error } = await supabase
        .from("wagora_lookbooks")
        .select(MARBLE_BEST_COLUMNS)
        .or(buildMarbleOrFilter())
        .order("popularity", { ascending: false })
        .order("saves", { ascending: false })
        .order("views", { ascending: false })
        .order("id", { ascending: false })
        .limit(maxLimit)
        .abortSignal(signal);

      if (error) throw error;
      return (data ?? []) as NailDesignRow[];
    },
  });
}

export default function MarbleBestListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";

  const { data = [], isLoading, isError } = useMarbleBestQuery(MARBLE_BEST_LIMIT);
  const rankingItems = useMemo(() => data.slice(0, MARBLE_BEST_LIMIT), [data]);

  const saveListScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(MARBLE_BEST_SCROLL_Y_KEY, window.scrollY.toString());
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, []);

  useEffect(() => {
    if (navigationType !== "POP" || isLoading || rankingItems.length === 0) return;
    const savedY = sessionStorage.getItem(MARBLE_BEST_SCROLL_Y_KEY);
    if (!savedY) return;
    const y = Number.parseInt(savedY, 10);
    if (Number.isNaN(y)) return;
    const timer = window.setTimeout(() => {
      window.scrollTo(0, y);
      sessionStorage.removeItem(MARBLE_BEST_SCROLL_Y_KEY);
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
          <h1 className="absolute left-1/2 top-1/2 max-w-[70%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-lg font-bold text-gray-900 whitespace-nowrap">
            {isEnglish ? "Hottest Marble BEST" : "지금 가장 핫한 마블 BEST"}
          </h1>
          <button type="button" className="z-10 p-2 -mr-2" onClick={() => navigate("/search")}>
            <Search className="w-6 h-6 text-gray-900" />
          </button>
        </header>

        <div className="relative flex items-center justify-between px-4 pb-3 pt-2">
          <span className="text-sm text-gray-500">
            {isEnglish ? (
              <>Total <span className="font-bold text-[#FF7E67]">{MARBLE_BEST_LIMIT}</span> designs</>
            ) : (
              <>총 <span className="font-bold text-[#FF7E67]">{MARBLE_BEST_LIMIT}</span>개의 디자인</>
            )}
          </span>
        </div>
      </div>

      <main className="grid grid-cols-2 gap-4 px-5 pb-8 pt-4">
        {isLoading ? (
          Array.from({ length: MARBLE_BEST_SKELETON_COUNT }, (_, index) => (
            <article key={`marble-best-skel-${index}`} className="flex flex-col gap-2" aria-hidden>
              <div className="w-full aspect-[3/4] rounded-lg bg-gray-100 animate-pulse" />
              <div className="mt-2 flex w-full flex-col gap-1 px-1">
                <div className="h-3.5 w-full rounded bg-gray-200 animate-pulse" />
                <div className="h-3.5 w-2/3 rounded bg-gray-200 animate-pulse" />
              </div>
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
                  onClick={saveListScrollPosition}
                  state={{ initialNailData: { ...item, imageUrl: item.image_url, title } }}
                  className="relative flex cursor-pointer flex-col gap-2"
                >
                  <div className="absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded bg-gray-900/90 text-[12px] font-bold text-white shadow-sm">
                    {index + 1}
                  </div>
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={title}
                        className="h-full w-full object-cover object-center transition-transform hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement?.classList.add("animate-pulse", "bg-gray-100");
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="mt-2 flex w-full flex-col items-center justify-center px-1">
                    <p className="w-full text-center text-sm font-medium tracking-tight text-gray-800 line-clamp-2">{title}</p>
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
