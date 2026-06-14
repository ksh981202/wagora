import fs from 'fs'

const p = 'src/pages/client/ClientNailDetailPage.tsx'
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)
const start = lines.findIndex((l) => l.startsWith('function toStringArray'))
const end = lines.findIndex((l, i) => i > start && l.startsWith('function mapNailDesignRowToDetail'))
if (start >= 0 && end > start) lines.splice(start, end - start)

let s = lines.join('\n')

if (!s.includes('useSimilarNailsQuery')) {
  s = s.replace(
    'import { useNailDetailQuery } from "@/entities/nail-design/api/useNailDetailQuery";',
    `import { useNailDetailQuery } from "@/entities/nail-design/api/useNailDetailQuery";
import { useSimilarNailsQuery } from "@/entities/nail-design/api/useSimilarNailsQuery";`,
  )
  s = s.replace(
    'const { data: nailRow, isLoading, isError } = useNailDetailQuery(nailId || undefined);',
    `const { data: nailRow, isLoading, isError } = useNailDetailQuery(nailId || undefined);
  const { data: similarRows = [] } = useSimilarNailsQuery(nailId || undefined);`,
  )
  s = s.replace(
    'const similarDisplay: { id: string; image_url: string; title: string; title_en: string | null }[] = [];',
    `const similarDisplay = useMemo(
    () =>
      similarRows.map((row) => ({
        id: row.id,
        image_url: row.image_url ?? "",
        title: row.title ?? "",
        title_en: row.title_en ?? null,
      })),
    [similarRows],
  );`,
  )
}

fs.writeFileSync(p, s, 'utf8')
console.log('patched', s.includes('베이스'), s.includes('useSimilarNailsQuery'))
