import fs from 'fs'

const p = 'src/pages/client/ClientNailDetailPage.tsx'
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)

const replacements = {
  311: '    const markerPattern = /\\[\\s*(베이스|base|아트|art|마무리|finishing|finish|final)\\s*\\]/gi;',
  313: '    const stepTitles = language === "en" ? ["Base", "Art", "Finish"] : ["베이스", "아트", "마무리"];',
  318: '      if (m === "베이스" || m === "base") return 0;',
  319: '      if (m === "아트" || m === "art") return 1;',
  320: '      if (m === "마무리" || m === "finishing" || m === "finish" || m === "final") return 2;',
  364: '    const stepTitles = language === "en" ? ["Base", "Art", "Finish"] : ["베이스", "아트", "마무리"];',
}

for (const [idx, text] of Object.entries(replacements)) {
  const i = Number(idx)
  if (lines[i] !== undefined) lines[i] = text
}

fs.writeFileSync(p, lines.join('\n'), 'utf8')
console.log('line312', lines[311])
