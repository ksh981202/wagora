import fs from 'fs'

const p = 'src/pages/client/ClientNailDetailPage.tsx'
let s = fs.readFileSync(p, 'utf8')

const oldImports = `import { useLocation, useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import LanguageToggle from "@/components/LanguageToggle";
import OptimizedImage from "@/components/OptimizedImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowserClient";
import { isNailLikedInStorage, persistNailLikeState } from "@/lib/likedNailsStorage";
import { pushRecentViewedNailId } from "@/lib/recentViewedStorage";
import { isNailSavedInStorage, persistNailSaveState } from "@/lib/savedNailsStorage";
import { fetchNailPhotoCatalog, normalizeTagTokens } from "@/lib/nailPhotoApi";
import {
  buildSimilarDisplayStrip,
  dedupeSimilarNailsById,
  mergeCatalogAndDetailPoolForSimilarity,
  type SimilarDisplayRow,
  type SimilarityNail,
} from "@/lib/nailSimilarity";
import { expandTagTokensFromChips } from "@/lib/nailRowTagMatch";`

const newImports = `import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useNailDetailQuery } from "@/entities/nail-design/api/useNailDetailQuery";
import { isNailLikedInStorage, persistNailLikeState } from "@/shared/lib/likedNailsStorage";
import { pushRecentViewedNailId } from "@/shared/lib/recentViewedStorage";
import { isNailSavedInStorage, persistNailSaveState } from "@/shared/lib/savedNailsStorage";
import { supabase } from "@/shared/api/supabaseClient";`

if (!s.includes(oldImports)) {
  console.error('import block not found')
  process.exit(1)
}
s = s.replace(oldImports, newImports)

// Remove legacy pool / counter helpers (between splitLooseTokens and ProcedureSection)
s = s.replace(
  /\r?\nconst SIMILAR_POOL_LIMIT[\s\S]*?\r?\n\r?\ntype ProcedureSection = \{/,
  '\n\nfunction expandTagTokensFromChips(chips: string[]): string[] {\n  return chips.flatMap((chip) => {\n    const t = String(chip ?? "").trim();\n    if (!t) return [];\n    return t\n      .split(/[,\\s，、;；|｜\\/／]+/)\n      .map((x) => x.replace(/^#+/, "").trim())\n      .filter(Boolean);\n  });\n}\n\ntype ProcedureSection = {',
)

s = s.replace(/\r?\nfunction getSupabaseEnv\(\)[\s\S]*?\r?\n\r?\nfunction toStr/, '\n\nfunction toStr')

// Component: language + query wiring
s = s.replace(
  'const Detail = () => {\n  const { language } = useLanguage();\n  const isEnglish = language === "en";',
  'const Detail = () => {\n  const [language, setLanguage] = useState<"ko" | "en">("ko");\n  const isEnglish = language === "en";',
)

s = s.replace(
  `  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<NailPhotoDetail | null>(null);
  const [similar, setSimilar] = useState<SimilarDisplayRow[]>([]);`,
  `  const { data: nailRow, isLoading: queryLoading, isError: queryError } = useNailDetailQuery(
    nailId || undefined,
  );
  const [error, setError] = useState<string | null>(null);
  const fetchedRow = useMemo(
    () => (nailRow ? normalizeNailRow(nailRow) : null),
    [nailRow],
  );`,
)

s = s.replace(
  `  const similarDisplay = useMemo(
    () => similar.slice(0, SIMILAR_DISPLAY_COUNT),
    [similar],
  );`,
  '  const similarDisplay = useMemo(() => [] as { id: string; image_url: string; title: string; title_en?: string | null }[], []);',
)

// Remove load() function block
s = s.replace(/\r?\n  const load = useCallback\(async \(nailId: string\) => \{[\s\S]*?\r?\n  \}, \[\]\);\r?\n/, '\n')

// Replace nailId useEffect
s = s.replace(
  `  useEffect(() => {
    if (!nailId) {
      setError("잘못된 주소예요.");
      setIsLoading(false);
      setRow(null);
      setSimilar([]);
      return;
    }
    setRow(initialNailData);
    setSimilar([]);
    void load(nailId);
  }, [nailId, load, initialNailData]);`,
  `  useEffect(() => {
    if (!nailId) {
      setError("잘못된 주소예요.");
      return;
    }
    if (queryError) {
      setError("네일 정보를 불러오지 못했어요.");
      return;
    }
    if (fetchedRow?.id === nailId) {
      setError(null);
      return;
    }
    if (!queryLoading && !fetchedRow) {
      setError(null);
    }
  }, [nailId, queryError, queryLoading, fetchedRow]);`,
)

// Remove view increment effect
s = s.replace(
  /\r?\n  useEffect\(\(\) => \{\r?\n    if \(!displayRow\?\.id\) return;\r?\n    const now = Date\.now\(\);[\s\S]*?\r?\n  \}, \[displayRow\?\.id\]\);\r?\n/,
  '\n',
)

// Session: getSupabaseBrowserClient -> supabase
s = s.replace(/getSupabaseBrowserClient\(\)/g, 'supabase')

// displayRow uses fetchedRow
s = s.replace(
  `  const displayRow = useMemo((): NailPhotoDetail | null => {
    if (!nailId) return null;
    if (row?.id === nailId) return row;
    if (initialNailData?.id === nailId) return initialNailData;
    return null;
  }, [row, initialNailData, nailId]);`,
  `  const displayRow = useMemo((): NailPhotoDetail | null => {
    if (!nailId) return null;
    if (fetchedRow?.id === nailId) return fetchedRow;
    if (initialNailData?.id === nailId) return initialNailData;
    return null;
  }, [fetchedRow, initialNailData, nailId]);

  const isLoading = queryLoading && !displayRow;`,
)

// Simplify toggleSave - remove patchNailCounters block
s = s.replace(
  `  const toggleSave = useCallback(() => {
    if (!displayRow?.id) return;
    if (!currentUserId) {
      setShowLoginModal(true);
      return;
    }
    const env = getSupabaseEnv();
    const prevSaved = isSaved;
    const nextSaved = !prevSaved;
    const previousSaves = Math.max(0, Number(displayRow.saves ?? 0));
    const nextSaves = Math.max(0, previousSaves + (nextSaved ? 1 : -1));

    setIsSaved(nextSaved);
    persistNailSaveState(displayRow.id, nextSaved, currentUserId);
    setRow((prev) => {
      if (!prev || prev.id !== displayRow.id) return prev;
      return { ...prev, saves: nextSaves };
    });

    void (async () => {
      const updated = await patchNailCountersById(displayRow.id, {
        savesDelta: nextSaved ? 1 : -1,
      });
      if (updated) {
        setRow((prev) => {
          if (!prev || prev.id !== displayRow.id) return prev;
          return { ...prev, saves: updated.saves };
        });
        return;
      }

      // DB 반영 실패 시 로컬 상태를 원복해 데이터 정합성을 맞춘다.
      setIsSaved(prevSaved);
      persistNailSaveState(displayRow.id, prevSaved, currentUserId);
      setRow((prev) => {
        if (!prev || prev.id !== displayRow.id) return prev;
        return { ...prev, saves: previousSaves };
      });
    })();
  }, [displayRow, currentUserId, isSaved]);`,
  `  const toggleSave = useCallback(() => {
    if (!displayRow?.id) return;
    if (!currentUserId) {
      setShowLoginModal(true);
      return;
    }
    setIsSaved((v) => {
      const next = !v;
      persistNailSaveState(displayRow.id, next, currentUserId);
      return next;
    });
  }, [displayRow, currentUserId]);`,
)

// Routes (ASCII only)
s = s.replace('navigate(`/tag/${encoded}`);', 'navigate(`/client/search?q=${encoded}`);')
s = s.replace('onClick={() => navigate("/")}', 'onClick={() => navigate("/client")}')
s = s.replace('navigate("/login");', 'navigate("/client/login");')
s = s.replace(
  'onClick={() => navigate(`/similar/${displayRow.id}`)}',
  'onClick={() => navigate("/client/gallery")}',
)
s = s.replace(
  'onClick={() => navigate(`/detail/${item.id}`)}',
  'onClick={() => navigate(`/client/detail/${item.id}`)}',
)

// LanguageToggle -> inline EN/KO
s = s.replace(
  '<LanguageToggle compact />',
  `<button
            type="button"
            onClick={() => setLanguage((l) => (l === "ko" ? "en" : "ko"))}
            className="mr-1 flex h-7 min-h-[28px] min-w-[44px] items-center justify-center gap-1 rounded-full bg-gray-100 px-2.5 text-[11px] font-bold text-gray-700"
            aria-label={isEnglish ? "Switch to Korean" : "Switch to English"}
          >
            <span aria-hidden>{isEnglish ? "KO" : "EN"}</span>
          </button>`,
)

s = s.replace(/\r?\n        <BottomNav \/>\r?\n/, '\n')

// Main OptimizedImage -> img
s = s.replace(
  `        {imageSrc ? (
          <OptimizedImage
            src={imageSrc}
            alt={displayTitle}
            priority
            unoptimized
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
            className="mx-auto block h-full w-full object-cover object-center"
            draggable={false}
            onDoubleClick={handleMainImageDoubleClick}
          />
        ) : (`,
  `        {imageSrc ? (
          <img
            src={imageSrc}
            alt={displayTitle}
            className="mx-auto block h-full w-full object-cover object-center"
            draggable={false}
            onDoubleClick={handleMainImageDoubleClick}
            decoding="async"
          />
        ) : (`,
)

// Similar OptimizedImage -> img or skeleton only
s = s.replace(
  `                {simSrc ? (
                  <OptimizedImage
                    src={simSrc}
                    alt={pickLocalized(item.title, item.title_en) || (isEnglish ? "Nail" : "네일")}
                    unoptimized
                    placeholder="blur"
                    blurDataURL={IMAGE_BLUR_DATA_URL}
                    wrapperClassName="aspect-[3/4] w-full overflow-hidden rounded-2xl"
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <motionless />
                )`,
  `                {simSrc ? (
                  <img
                    src={simSrc}
                    alt={pickLocalized(item.title, item.title_en) || (isEnglish ? "Nail" : "네일")}
                    className="aspect-[3/4] h-full w-full rounded-2xl object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (`,
)

// Fix botched similar replace if motionless slipped in
s = s.replace(
  `                ) : (
                  <motionless />
                )`,
  `                ) : (
                  <motionless />`,
)

// Actually fix similar block properly - read file after partial
if (s.includes('OptimizedImage')) {
  s = s.replace(
    /                \{simSrc \? \(\s*<OptimizedImage[\s\S]*?\/>\s*\) : \(\s*<div className="aspect-\[3\/4\][\s\S]*?\/>\s*\)/,
    `                {simSrc ? (
                  <img
                    src={simSrc}
                    alt={pickLocalized(item.title, item.title_en) || (isEnglish ? "Nail" : "네일")}
                    className="aspect-[3/4] h-full w-full rounded-2xl object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <motionless />`,
  )
}

// Remove unused constants if still present
s = s.replace(/\r?\nconst IMAGE_BLUR_DATA_URL[\s\S]*?;\r?\nconst VIEW_INCREMENT[\s\S]*?;\r?\nconst lastViewIncrement[\s\S]*?;\r?\n/, '\n')

// SimilarityNail type import - nailSimilarity may not exist in V2
if (!fs.existsSync('src/lib/nailSimilarity.ts')) {
  s = s.replace('import type { SimilarityNail } from "@/lib/nailSimilarity";\n', 'type SimilarityNail = NailPhotoDetail;\n')
  // NailPhotoDetail is defined after imports - move type alias inside file
  s = s.replace('type NailPhotoDetail = SimilarityNail;', 'type NailPhotoDetail = {\n  id: string;\n  image_url: string;\n  title: string;\n  description: string;\n  situations: string[] | null;\n  styles: string[] | null;\n  color: string;\n  nail_length: string;\n  hand_type: string;\n  mood: string;\n  design_technique: string;\n  design_elements: string;\n  procedure_guide: string;\n  title_en: string | null;\n  description_en: string | null;\n  color_en: string | null;\n  length_en: string | null;\n  hand_type_en: string | null;\n  mood_en: string | null;\n  occasion_en: string | null;\n  styles_en: string | null;\n  technique_en: string | null;\n  design_point_en: string | null;\n  guide_en: string | null;\n  views: number;\n  saves: number;\n  likes: number;\n  created_at?: string;\n};\n')
}

fs.writeFileSync(p, s, 'utf8')
console.log('wired', {
  hasOptimizedImage: s.includes('OptimizedImage'),
  hasUseNailDetailQuery: s.includes('useNailDetailQuery'),
  hasFetchCatalog: s.includes('fetchNailPhotoCatalog'),
  hasPatch: s.includes('patchNailCounters'),
})
