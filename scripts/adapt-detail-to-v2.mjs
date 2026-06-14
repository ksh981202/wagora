import fs from 'fs'
import path from 'path'

const v1Path = path.resolve(
  'C:/Users/vlvlz/Desktop/프로그램 개발/깃허브 다운파일/nailbook-studio-main-main/src/pages/Detail.tsx',
)
const outPath = 'src/pages/client/ClientNailDetailPage.tsx'

let s = fs.readFileSync(v1Path, 'utf8')

s = s.replace(/const Detail = \(\) =>/, 'export default function ClientNailDetailPage()')
s = s.replace(/\nexport default Detail;\s*$/, '\n')

const stripImports = [
  'BottomNav',
  'LanguageToggle',
  'OptimizedImage',
  'useLanguage',
  'getSupabaseBrowserClient',
  'likedNailsStorage',
  'recentViewedStorage',
  'savedNailsStorage',
  'nailPhotoApi',
  'nailSimilarity',
  'nailRowTagMatch',
]
for (const key of stripImports) {
  s = s.replace(new RegExp(`^import[^;]*${key}[^;]*;\\n`, 'gm'), '')
}

s = s.replace(
  'import { useCallback, useEffect, useMemo, useRef, useState } from "react";',
  `import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNailDetailQuery } from "@/entities/nail-design/api/useNailDetailQuery";
import { formatTextArrayForDisplay } from "@/shared/lib/formatTextArrayField";
import type { NailDesignRow } from "@/shared/types/database.types";`,
)

s = s.replace(/import { useLocation, useNavigate, useParams }/, 'import { useNavigate, useParams }')

s = s.replace(
  /type NailPhotoDetail = SimilarityNail;\n/,
  `type NailPhotoDetail = {
  id: string;
  image_url: string;
  title: string;
  description: string;
  situations: string[] | null;
  styles: string[] | null;
  color: string;
  nail_length: string;
  hand_type: string;
  mood: string;
  design_technique: string;
  design_elements: string;
  procedure_guide: string;
  title_en: string | null;
  description_en: string | null;
  color_en: string | null;
  length_en: string | null;
  hand_type_en: string | null;
  mood_en: string | null;
  occasion_en: string | null;
  styles_en: string | null;
  technique_en: string | null;
  design_point_en: string | null;
  guide_en: string | null;
  views: number;
  saves: number;
  likes: number;
  created_at?: string;
};
`,
)

s = s.replace(
  /const { language } = useLanguage\(\);\n  const isEnglish = language === "en";/,
  `const [isEnglish, setIsEnglish] = useState(false);
  const language: "ko" | "en" = isEnglish ? "en" : "ko";`,
)

s = s.replace(/\s*const location = useLocation\(\);\n/, '\n')

s = s.replace(/type DetailLocationState[\s\S]*?\} \| null;\n\n/, '')

s = s.replace(/function getSupabaseEnv\(\)[\s\S]*?\}\n\n/, '')
s = s.replace(/function normalizeInitialNailData[\s\S]*?\}\n\n/, '')
s = s.replace(/function normalizeTagKeyword[\s\S]*?\}\n\nfunction prioritizeTagTokens[\s\S]*?\}\n\n/, '')

s = s.replace(/const SIMILAR_POOL_LIMIT[\s\S]*?async function patchNailCountersById[\s\S]*?\}\n\n/, '')
s = s.replace(/function upsertMetaTag\([\s\S]*?\}\n\n/, '')
s = s.replace(/const IMAGE_BLUR_DATA_URL[\s\S]*?;\n/, '')
s = s.replace(/const VIEW_INCREMENT_DEDUP_WINDOW_MS[\s\S]*?;\n/, '')

const mapper = `
function mapNailDesignRowToDetail(row: NailDesignRow): NailPhotoDetail {
  const toArr = (v: unknown) => {
    const csv = formatTextArrayForDisplay(v);
    if (!csv) return null;
    const arr = csv.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
    return arr.length ? arr : null;
  };
  return {
    id: row.id,
    image_url: row.image_url ?? "",
    title: row.title ?? "",
    description: row.description ?? "",
    situations: toArr(row.situations),
    styles: toArr(row.styles),
    color: row.color ?? "",
    nail_length: row.nail_length ?? "",
    hand_type: row.hand_type ?? "",
    mood: row.mood ?? "",
    design_technique: row.design_technique ?? "",
    design_elements: apiLongTextField(row.design_elements),
    procedure_guide: apiLongTextField(row.procedure_guide),
    title_en: toStr(row.title_en) || null,
    description_en: toStr(row.description_en) || null,
    color_en: toStr(row.color_en) || null,
    length_en: toStr(row.length_en) || null,
    hand_type_en: toStr(row.hand_type_en) || null,
    mood_en: toStr(row.mood_en) || null,
    occasion_en: formatTextArrayForDisplay(row.occasion_en) || null,
    styles_en: formatTextArrayForDisplay(row.styles_en) || null,
    technique_en: toStr(row.technique_en) || null,
    design_point_en: apiLongTextField(row.design_point_en) || null,
    guide_en: apiLongTextField(row.guide_en) || null,
    views: 0,
    saves: Number.isFinite(row.saves) ? row.saves : 0,
    likes: Number.isFinite(row.popularity) ? row.popularity : 0,
    created_at: row.created_at,
  };
}

`
s = s.replace('/** API 원본을 안전한 레코드로 변환', mapper + '/** API 원본을 안전한 레코드로 변환')
s = s.replace(/function normalizeNailRow\([\s\S]*?\}\n\nfunction formatCount/, 'function formatCount')

s = s.replace(
  /const locationState = location\.state as DetailLocationState;\n\s*const initialNailData = useMemo\([\s\S]*?\[nailId, location\.state\],\n\s*\);\n\n/,
  '',
)

s = s.replace(
  /const \[isLoading, setIsLoading\] = useState\(true\);\n  const \[error, setError\] = useState<string \| null>\(null\);\n  const \[row, setRow\] = useState<NailPhotoDetail \| null>\(null\);\n  const \[similar, setSimilar\] = useState<SimilarDisplayRow\[\]>\(\[\]\);/,
  `const { data: nailRow, isLoading, isError } = useNailDetailQuery(nailId || undefined);
  const [error, setError] = useState<string | null>(null);
  const row = useMemo((): NailPhotoDetail | null => {
    if (!nailRow) return null;
    return mapNailDesignRowToDetail(nailRow);
  }, [nailRow]);`,
)

s = s.replace(/const \[currentUserId[\s\S]*?useState\(false\);\n/, '')

s = s.replace(
  /const displayRow = useMemo\(\(\): NailPhotoDetail \| null => \{[\s\S]*?\}, \[row, initialNailData, nailId\]\);/,
  'const displayRow = row;',
)

s = s.replace(/const sourceTag = useMemo\([\s\S]*?\[location\.state\],\n  \);\n/, '')
s = s.replace(
  /const displayTagTokens = useMemo\(\n    \(\) => prioritizeTagTokens\(expandTagTokensFromChips\(tagChips\), sourceTag\),\n    \[tagChips, sourceTag\],\n  \);/,
  'const displayTagTokens = useMemo(() => tagChips, [tagChips]);',
)
s = s.replace(
  /if \(enChips\.length === 0\) return displayTagTokens;\n    const enTokens = prioritizeTagTokens\(expandTagTokensFromChips\(enChips\), sourceTag\);\n    return enTokens\.length > 0 \? enTokens : displayTagTokens;\n  \}, \[displayRow, isEnglish, displayTagTokens, sourceTag\]\);/,
  'return enChips.length > 0 ? enChips : displayTagTokens;\n  }, [displayRow, isEnglish, displayTagTokens]);',
)

s = s.replace(
  /const similarDisplay = useMemo\(\n    \(\) => similar\.slice\(0, SIMILAR_DISPLAY_COUNT\),\n    \[similar\],\n  \);/,
  'const similarDisplay: { id: string; image_url: string; title: string; title_en: string | null }[] = [];',
)

s = s.replace(/const load = useCallback\(async \(nailId: string\) => \{[\s\S]*?\}, \[\]\);\n\n/, '')

s = s.replace(
  /useEffect\(\(\) => \{\n    if \(!nailId\) \{[\s\S]*?void load\(nailId\);\n  \}, \[nailId, load, initialNailData\]\);\n\n/,
  `useEffect(() => {
    if (!nailId) setError(isEnglish ? "Invalid URL." : "잘못된 주소예요.");
    else if (isError) setError(isEnglish ? "Could not load nail details." : "네일 정보를 불러오지 못했어요.");
    else setError(null);
  }, [nailId, isError, isEnglish]);

`,
)

s = s.replace(/useEffect\(\(\) => \{\n    if \(!displayRow\?\.id\) return;\n    if \(currentUserId === undefined\) return;[\s\S]*?\}, \[displayRow\?\.id, currentUserId\]\);\n\n/g, '')
s = s.replace(/useEffect\(\(\) => \{\n    if \(!displayRow\?\.id \|\| currentUserId === undefined\) return;\n    pushRecentViewedNailId[\s\S]*?\}, \[displayRow\?\.id, currentUserId\]\);\n\n/, '')
s = s.replace(/useEffect\(\(\) => \{\n    if \(!displayRow\?\.id\) return;\n    const now = Date\.now\(\);[\s\S]*?\}, \[displayRow\?\.id\]\);\n\n/, '')
s = s.replace(/useEffect\(\(\) => \{\n    const supabase = getSupabaseBrowserClient\(\);[\s\S]*?\}, \[\]\);\n\n/, '')
s = s.replace(/useEffect\(\(\) => \{\n    if \(!displayRow\?\.id\) return;\n    const originalTitle[\s\S]*?\}, \[displayRow\?\.id, displayRow\?\.image_url, displayTitle, isEnglish\]\);\n\n/, '')

s = s.replace(
  /const toggleLike = useCallback\(\(\) => \{[\s\S]*?\}, \[displayRow, currentUserId\]\);/,
  'const toggleLike = useCallback(() => setIsLiked((v) => !v), []);',
)
s = s.replace(
  /const toggleSave = useCallback\(\(\) => \{[\s\S]*?\}, \[displayRow, currentUserId, isSaved\]\);/,
  'const toggleSave = useCallback(() => setIsSaved((v) => !v), []);',
)
s = s.replace(/if \(!currentUserId\) \{\n      setShowLoginModal\(true\);\n      return;\n    }\n/g, '')
s = s.replace(/, currentUserId/g, '')

s = s.replace('<LanguageToggle compact />', `<button
            type="button"
            onClick={() => setIsEnglish((v) => !v)}
            className="mr-1 flex h-7 min-h-[28px] min-w-[44px] items-center justify-center gap-1 rounded-full bg-gray-100 px-2.5 text-[11px] font-bold text-gray-700"
            aria-label={isEnglish ? "Switch to Korean" : "Switch to English"}
          >
            <span aria-hidden>{isEnglish ? "KO" : "EN"}</span>
          </button>`)

s = s.replace(/navigate\("\/"\)/g, 'navigate("/client")')
s = s.replace(/navigate\(`\/tag\/\$\{encoded\}`\)/, 'navigate(`/client/search?q=${encoded}`)')
s = s.replace(/navigate\(`\/detail\//g, 'navigate(`/client/detail/')
s = s.replace(/navigate\(`\/similar\/\$\{displayRow\.id\}`\)/, 'navigate("/client/gallery")')

s = s.replace(
  /<OptimizedImage\n            src=\{imageSrc\}\n            alt=\{displayTitle\}\n            priority\n            unoptimized\n            placeholder="blur"\n            blurDataURL=\{IMAGE_BLUR_DATA_URL\}\n            className="mx-auto block h-full w-full object-cover object-center"\n            draggable=\{false\}\n            onDoubleClick=\{handleMainImageDoubleClick\}\n          \/>/,
  `<img
            src={imageSrc}
            alt={displayTitle}
            className="mx-auto block h-full w-full object-cover object-center"
            draggable={false}
            onDoubleClick={handleMainImageDoubleClick}
          />`,
)

s = s.replace(
  /<OptimizedImage\n                    src=\{simSrc\}\n                    alt=\{pickLocalized\(item\.title, item\.title_en\) \|\| \(isEnglish \? "Nail" : "네일"\)\}\n                    unoptimized\n                    placeholder="blur"\n                    blurDataURL=\{IMAGE_BLUR_DATA_URL\}\n                    wrapperClassName="aspect-\[3\/4\] w-full overflow-hidden rounded-2xl"\n                    className="h-full w-full object-cover object-center"\n                  \/>/,
  `<img
                    src={simSrc}
                    alt={pickLocalized(item.title, item.title_en) || (isEnglish ? "Nail" : "네일")}
                    className="aspect-[3/4] w-full overflow-hidden rounded-2xl object-cover object-center"
                  />`,
)

s = s.replace(/\n        <BottomNav \/>\n/, '\n')
s = s.replace(/\n        \{showLoginModal \? \([\s\S]*?\) : null\}\n/, '\n')

fs.writeFileSync(outPath, s, 'utf8')
console.log('written', outPath, 'bytes', s.length)
