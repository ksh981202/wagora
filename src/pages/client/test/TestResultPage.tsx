import { supabase } from "@/shared/api/supabaseClient";
import type { NailDesignRow } from "@/shared/types/database.types";
import { useLanguageContext } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LENGTH_KEYWORDS: Record<string, string[]> = {
  "length-short": ["짧은", "숏", "쇼트", "short"],
  "length-medium": ["중간", "미디엄", "medium"],
  "length-long": ["긴", "롱", "long"],
};

const HAND_TYPE_KEYWORDS: Record<string, string[]> = {
  "short-finger": ["짧은 손가락", "세로", "롱", "그라데이션", "프렌치"],
  "long-finger": ["긴 손가락", "스퀘어", "포인트", "볼드"],
  "plump-hand": ["통통", "시럽", "누드", "라운드"],
  "slim-hand": ["마른", "미니멀", "심플", "파츠"],
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  simple: ["심플", "깔끔", "미니멀", "단정"],
  delicate: ["여리", "청순", "시럽", "파스텔", "단아"],
  cute: ["귀여운", "러블리", "키치", "하이틴"],
  elegant: ["우아", "고급", "진주", "누드", "오피스"],
  glamorous: ["화려", "블링", "글리터", "스톤", "파츠"],
  unique: ["유니크", "힙", "드로잉", "체크", "마블"],
};

const COLOR_KEYWORDS: Record<string, string[]> = {
  pink: ["핑크", "로즈", "피치"],
  nude: ["누드", "베이지", "밀키", "샴페인"],
  red: ["레드", "버건디", "와인"],
  black: ["블랙", "다크", "모노톤"],
  pastel: ["파스텔", "라벤더", "소라", "민트"],
  glitter: ["글리터", "펄", "반짝", "스파클"],
};

const DIAGNOSIS_NAIL_COLUMNS =
  "id,created_at,title,title_en,image_url,category,tags,situations,styles,nail_length,hand_type,color,mood,design_elements,popularity,views,saves,likes";

const RESULT_META: Record<string, { styleTag: string; styleTag_en: string; description: string; description_en: string }> = {
  simple: {
    styleTag: "Clean & Minimal Style",
    styleTag_en: "Clean & Minimal Style",
    description:
      "군더더기 없이 정돈된 디자인을 가장 잘 소화하는 타입이에요.\n깔끔한 컬러와 은은한 포인트를 고르면 손끝이 더 단정하고 세련돼 보여요.",
    description_en:
      "You suit clean, polished designs without unnecessary details.\nChoose neat colors and subtle accents to make your fingertips look refined.",
  },
  delicate: {
    styleTag: "Soft & Delicate Style",
    styleTag_en: "Soft & Delicate Style",
    description:
      "맑고 부드러운 분위기를 자연스럽게 살리는 타입이에요.\n시럽 질감이나 파스텔 톤처럼 은은하게 비치는 디자인이 잘 어울려요.",
    description_en:
      "You naturally bring out a soft and delicate mood.\nSheer syrup textures and gentle pastel tones will suit you beautifully.",
  },
  cute: {
    styleTag: "Lovely & Kitsch Style",
    styleTag_en: "Lovely & Kitsch Style",
    description:
      "사랑스럽고 생기 있는 포인트를 잘 소화하는 타입이에요.\n작은 파츠나 키치한 디테일을 더하면 손끝에 기분 좋은 개성이 살아나요.",
    description_en:
      "You suit lovely, lively accents very well.\nSmall charms or kitschy details will add cheerful personality to your nails.",
  },
  elegant: {
    styleTag: "Elevated & Elegant Style",
    styleTag_en: "Elevated & Elegant Style",
    description:
      "차분하면서도 고급스러운 분위기를 가장 잘 소화하는 타입이에요.\n손끝 라인을 정돈해 보이는 디자인과 은은한 누드 톤이 세련미를 높여줘요.",
    description_en:
      "You suit calm, refined styles with an elevated mood.\nClean silhouettes and subtle nude tones will make your nails look more sophisticated.",
  },
  glamorous: {
    styleTag: "Glamorous Point Style",
    styleTag_en: "Glamorous Point Style",
    description:
      "빛나는 포인트와 화려한 디테일이 잘 어울리는 타입이에요.\n글리터, 스톤, 파츠처럼 시선을 모으는 요소를 더하면 특별한 무드가 완성돼요.",
    description_en:
      "Sparkling accents and glamorous details suit you well.\nGlitter, stones, and charms will create a special, eye-catching mood.",
  },
  unique: {
    styleTag: "Unique & Hip Style",
    styleTag_en: "Unique & Hip Style",
    description:
      "개성 있는 패턴과 감각적인 디테일을 잘 소화하는 타입이에요.\n마블, 체크, 드로잉처럼 시그니처가 있는 디자인으로 손끝의 존재감을 살려보세요.",
    description_en:
      "You suit expressive patterns and stylish details.\nTry signature designs like marble, check, or artsy drawings to make your nails stand out.",
  },
};

type DiagnosisSelections = {
  moodId: string;
  colorId: string;
  lengthId: string;
  handTypeId: string;
};

function uniqueKeywords(...groups: string[][]): string[] {
  return [...new Set(groups.flat().map((keyword) => keyword.trim()).filter(Boolean))];
}

function readDiagnosisSelections(): DiagnosisSelections {
  return {
    moodId: sessionStorage.getItem("diagnosis.moodId") || "elegant",
    colorId: sessionStorage.getItem("diagnosis.colorId") || "nude",
    lengthId: sessionStorage.getItem("diagnosis.lengthId") || "length-medium",
    handTypeId: sessionStorage.getItem("diagnosis.handTypeId") || "slim-hand",
  };
}

function displayItemTitle(item: NailDesignRow, isEnglish = false): string {
  const ko = String(item.title ?? "").trim();
  const en = String(item.title_en ?? "").trim();
  return (isEnglish ? en || ko : ko || en) || (isEnglish ? "Nail Design" : "네일 디자인");
}

function itemSearchText(item: NailDesignRow): string {
  return [
    item.title,
    item.title_en,
    item.category,
    item.color,
    item.mood,
    item.nail_length,
    item.hand_type,
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
  if (keywords.length === 0) return true;
  const haystack = itemSearchText(item);
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function rankNails(items: NailDesignRow[]): NailDesignRow[] {
  return [...items].sort((a, b) => {
    const popularityDiff = Number(b.popularity ?? 0) - Number(a.popularity ?? 0);
    if (popularityDiff !== 0) return popularityDiff;
    return Number(b.saves ?? 0) - Number(a.saves ?? 0);
  });
}

function addUnique(target: NailDesignRow[], source: NailDesignRow[], limit: number) {
  const seen = new Set(target.map((item) => item.id));
  for (const item of source) {
    if (seen.has(item.id)) continue;
    target.push(item);
    seen.add(item.id);
    if (target.length >= limit) break;
  }
}

function pickDiagnosisNailsBySelections(items: NailDesignRow[], selections: DiagnosisSelections): NailDesignRow[] {
  const lengthKeywords = uniqueKeywords(
    LENGTH_KEYWORDS[selections.lengthId] ?? [],
    HAND_TYPE_KEYWORDS[selections.handTypeId] ?? [],
  );
  const moodKeywords = MOOD_KEYWORDS[selections.moodId] ?? MOOD_KEYWORDS.elegant;
  const colorKeywords = COLOR_KEYWORDS[selections.colorId] ?? COLOR_KEYWORDS.nude;
  const rankedItems = rankNails(items);
  const picked: NailDesignRow[] = [];

  addUnique(
    picked,
    rankedItems.filter(
      (item) =>
        matchesAnyKeyword(item, lengthKeywords) &&
        matchesAnyKeyword(item, moodKeywords) &&
        matchesAnyKeyword(item, colorKeywords),
    ),
    7,
  );
  addUnique(
    picked,
    rankedItems.filter((item) => matchesAnyKeyword(item, moodKeywords) && matchesAnyKeyword(item, colorKeywords)),
    7,
  );
  addUnique(
    picked,
    rankedItems.filter((item) => matchesAnyKeyword(item, colorKeywords)),
    7,
  );
  addUnique(picked, rankedItems, 7);

  return picked;
}

function calculateNailResult(selections: DiagnosisSelections) {
  const base = RESULT_META[selections.moodId] ?? RESULT_META.elegant;
  return {
    styleTag: `✨ ${base.styleTag}`,
    styleTag_en: `✨ ${base.styleTag_en || base.styleTag}`,
    description: base.description,
    description_en: base.description_en || base.description,
  };
}

function useDiagnosisNailsQuery() {
  return useQuery({
    queryKey: ["nail-designs", "diagnosis-result", 200],
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<NailDesignRow[]> => {
      const { data, error } = await supabase
        .from("wagora_lookbooks")
        .select(DIAGNOSIS_NAIL_COLUMNS)
        .order("popularity", { ascending: false })
        .order("saves", { ascending: false })
        .limit(200)
        .abortSignal(signal);

      if (error) throw error;
      return (data ?? []) as NailDesignRow[];
    },
  });
}

const TestResultPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguageContext();
  const isEnglish = language === "en";
  const selections = useMemo(() => readDiagnosisSelections(), []);
  const result = useMemo(() => calculateNailResult(selections), [selections]);
  const { data: nailData = [], isLoading, isError } = useDiagnosisNailsQuery();
  const recommendedNails = useMemo(
    () => pickDiagnosisNailsBySelections(nailData, selections),
    [nailData, selections],
  );
  const mainNails = recommendedNails.slice(0, 4);
  const subNails = recommendedNails.slice(4, 7);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openDetail = (item: NailDesignRow) => {
    navigate(`/detail/${item.id}`, {
      state: { initialNailData: { ...item, imageUrl: item.image_url, title: displayItemTitle(item, isEnglish) } },
    });
  };

  const renderImage = (item: NailDesignRow, className: string) => (
    item.image_url ? (
      <img
        src={item.image_url}
        alt={displayItemTitle(item, isEnglish)}
        className={className}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.parentElement?.classList.add("bg-gray-200");
        }}
      />
    ) : null
  );

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col overflow-x-hidden bg-[#FCFAF7] pb-32">
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={isEnglish ? "Go back" : "뒤로가기"}
          className="p-1 text-gray-700"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="min-w-0 truncate text-lg font-bold text-gray-900">
          {isEnglish ? "Diagnosis Results" : "진단 결과"}
        </h1>
        <button type="button" aria-label={isEnglish ? "Share" : "공유하기"} className="p-1 text-gray-700">
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 px-4">
        <h2 className="mt-8 text-center text-[22px] font-semibold leading-snug text-gray-900 sm:text-[24px]">
          {isEnglish ? "Nails Perfect for You" : "당신에게 어울리는 네일"}
        </h2>
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center justify-center rounded-full bg-[#FFEFE9] px-4 py-1.5 text-[13px] font-bold text-[#FF826E] sm:text-[14px]">
            {isEnglish && result.styleTag_en ? result.styleTag_en : result.styleTag}
          </span>
        </div>

        <div className="mb-8 mt-6 rounded-2xl border border-[#FFE4DB] bg-[#FFF7F3] p-5">
          <p className="mb-2 text-[15px] font-bold text-[#FF826E]">
            {isEnglish ? "💡 Reason for Recommendation" : "💡 추천 이유"}
          </p>
          <p className="break-keep text-[14px] font-medium leading-relaxed text-gray-700 whitespace-pre-line">
            {isEnglish && result.description_en ? result.description_en : result.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={`diagnosis-main-skel-${index}`} className="flex w-full flex-col text-inherit" aria-hidden>
                <div className="aspect-[3/4] w-full animate-pulse overflow-hidden rounded-2xl bg-gray-200 shadow-sm" />
                <div className="mx-auto mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
            ))
          ) : isError || mainNails.length === 0 ? (
            <p className="col-span-2 py-8 text-center text-[14px] font-medium text-gray-500">
              {isEnglish ? "We couldn't load the recommended nail images." : "추천 네일 이미지를 불러오지 못했어요."}
            </p>
          ) : (
            mainNails.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openDetail(item)}
                className="flex w-full cursor-pointer flex-col border-0 bg-transparent p-0 text-inherit"
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
                  {renderImage(item, "h-full w-full object-cover object-center")}
                </div>
                <p className="mt-2 text-center text-[14px] font-medium text-gray-800 sm:text-[15px]">{displayItemTitle(item, isEnglish)}</p>
              </button>
            ))
          )}
        </div>

        <section className="mt-12" aria-labelledby="more-styles-heading">
          <h3
            id="more-styles-heading"
            className="mt-10 mb-4 text-[18px] font-semibold text-gray-900 sm:text-[20px]"
          >
            {isEnglish ? "How about these styles?" : "이런 스타일은 어때요?"}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {isLoading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div key={`diagnosis-sub-skel-${index}`} className="flex w-full flex-col gap-2 text-inherit" aria-hidden>
                  <div className="aspect-[3/4] w-full animate-pulse rounded-2xl border border-gray-100 bg-gray-200 object-cover object-center" />
                  <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                </div>
              ))
            ) : subNails.length === 0 ? (
              <p className="col-span-3 py-6 text-center text-[13px] font-medium text-gray-500">
                {isEnglish ? "We're preparing more style images." : "추가 스타일 이미지를 준비 중이에요."}
              </p>
            ) : (
              subNails.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openDetail(item)}
                  className="flex w-full cursor-pointer flex-col gap-2 border-0 bg-transparent p-0 text-inherit"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-200 object-cover object-center">
                    {renderImage(item, "h-full w-full object-cover object-center")}
                  </div>
                  <p className="text-center break-keep text-[12px] font-medium text-gray-800 sm:text-[13px]">
                    {displayItemTitle(item, isEnglish)}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TestResultPage;
