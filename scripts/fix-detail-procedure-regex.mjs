import fs from 'fs'

const p = 'src/pages/client/ClientNailDetailPage.tsx'
let s = fs.readFileSync(p, 'utf8')

s = s.replace(
  /const markerPattern = \/\\\[\\s\*\([^)]+\)\\s\*\\\]\/gi;/,
  'const markerPattern = /\\[\\s*(베이스|base|아트|art|마무리|finishing|finish|final)\\s*\\]/gi;',
)

s = s.replace(
  /const stepTitles = language === "en" \? \["Base", "Art", "Finish"\] : \[[^\]]+\];/,
  'const stepTitles = language === "en" ? ["Base", "Art", "Finish"] : ["베이스", "아트", "마무리"];',
)

s = s.replace(/if \(m === "\?\?\?" \|\| m === "base"\)/, 'if (m === "베이스" || m === "base")')
s = s.replace(/if \(m === "\?\?" \|\| m === "art"\)/, 'if (m === "아트" || m === "art")')
s = s.replace(
  /if \(m === "\?\?\?" \|\| m === "finishing"/,
  'if (m === "마무리" || m === "finishing"',
)

fs.writeFileSync(p, s, 'utf8')
console.log('fixed procedure regex')
