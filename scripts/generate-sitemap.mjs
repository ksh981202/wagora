import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://gelia.app')
  .replace(/\/+$/, '')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const PAGE_SIZE = 1000
const MAGAZINE_POST_TYPES = ['magazine', 'magazine_editor', 'magazine_brand', 'magazine_shopping']

const staticRoutes = [
  '/',
  '/category',
  '/recommend',
  '/gallery',
  '/ranking',
  '/magazine',
  '/search',
  '/my',
  '/theme',
  '/theme-list',
  '/situation-list',
  '/style-curation',
  '/style-list',
  '/style-best-list',
  '/style-gallery-list',
  '/color-curation',
  '/color-list',
  '/color-theme-list',
  '/color-popular-list',
  '/today-special',
  '/season-curation',
  '/season-list',
  '/vacation-list',
  '/season-popular-list',
  '/popular-design',
  '/period-best-list',
  '/reaction-best-list',
  '/shape-best-list',
  '/search-trend-list',
  '/trend',
  '/texture',
  '/texture-list',
  '/syrup-best',
  '/texture-gallery',
  '/parts',
  '/parts-list',
  '/stone-best-list',
  '/marble-best-list',
  '/popular-art-list',
  '/chic-best-list',
  '/full-parts-list',
  '/art',
  '/pattern',
  '/pattern-list',
  '/mood',
  '/mood-list',
  '/popular-mood-list',
  '/faq',
  '/support',
  '/notice',
  '/terms',
  '/privacy',
]

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizeLastmod(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function buildUrlEntry({ loc, lastmod, changefreq = 'weekly', priority = '0.7' }) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    `    <lastmod>${xmlEscape(lastmod)}</lastmod>`,
    `    <changefreq>${xmlEscape(changefreq)}</changefreq>`,
    `    <priority>${xmlEscape(priority)}</priority>`,
    '  </url>',
  ].join('\n')
}

function isMissingLookbookTable(error) {
  return error?.code === 'PGRST205'
}

async function fetchAllNailDesigns() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('wagora_lookbooks')
      .select('id,created_at')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (isMissingLookbookTable(error)) {
      console.warn('[generate-sitemap] wagora_lookbooks is not visible in the Supabase schema cache; skipping detail URLs.')
      return []
    }
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }

  return rows
    .map((row) => ({
      id: String(row.id ?? '').trim(),
      created_at: row.created_at,
    }))
    .filter((row) => row.id)
}

async function fetchAllMagazinePosts() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })

  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('wagora_lookbooks')
      .select('id,created_at')
      .in('post_type', MAGAZINE_POST_TYPES)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (isMissingLookbookTable(error)) {
      console.warn('[generate-sitemap] wagora_lookbooks is not visible in the Supabase schema cache; skipping magazine URLs.')
      return []
    }
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }

  return rows
    .map((row) => ({
      id: String(row.id ?? '').trim(),
      created_at: row.created_at,
    }))
    .filter((row) => row.id)
}

function generateSitemapXml(nails, magazines) {
  const today = new Date().toISOString().slice(0, 10)
  const staticEntries = staticRoutes.map((route) =>
    buildUrlEntry({
      loc: `${SITE_URL}${route === '/' ? '' : route}`,
      lastmod: today,
      changefreq: route === '/' || route === '/gallery' || route === '/ranking' ? 'daily' : 'weekly',
      priority: route === '/' ? '1.0' : route === '/gallery' || route === '/ranking' ? '0.9' : '0.7',
    }),
  )

  const detailEntries = nails.map((nail) =>
    buildUrlEntry({
      loc: `${SITE_URL}/detail/${encodeURIComponent(nail.id)}`,
      lastmod: normalizeLastmod(nail.created_at),
      changefreq: 'monthly',
      priority: '0.6',
    }),
  )

  const magazineEntries = magazines.map((post) =>
    buildUrlEntry({
      loc: `${SITE_URL}/magazine/${encodeURIComponent(post.id)}`,
      lastmod: normalizeLastmod(post.created_at),
      changefreq: 'monthly',
      priority: '0.6',
    }),
  )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...detailEntries,
    ...magazineEntries,
    '</urlset>',
    '',
  ].join('\n')
}

async function main() {
  assertEnv()
  const [nails, magazines] = await Promise.all([fetchAllNailDesigns(), fetchAllMagazinePosts()])
  const sitemap = generateSitemapXml(nails, magazines)
  const outputPath = resolve(projectRoot, 'public', 'sitemap.xml')

  writeFileSync(outputPath, sitemap, 'utf8')
  console.log(
    `Generated sitemap.xml with ${staticRoutes.length} static URLs, ${nails.length} detail URLs, and ${magazines.length} magazine URLs.`,
  )
}

main().catch((error) => {
  console.error('[generate-sitemap] Failed to generate sitemap.xml')
  console.error(error)
  process.exit(1)
})
