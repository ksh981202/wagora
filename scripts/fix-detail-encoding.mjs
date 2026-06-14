import fs from 'fs'
import path from 'path'

const p = 'src/pages/client/ClientNailDetailPage.tsx'
let lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)

const splitDesignLine = '    .split(/[,\s・;\\|/]+/)'
const splitLooseLine = '    .split(/[,\\n\\r\\t・;\\|/]+/)'

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (line.includes('.split(/[,\\s') && line.includes(']+/)')) {
    lines[i] = line.startsWith('      ') ? '      ' + splitDesignLine.trim() : splitDesignLine
  }
  if (line.includes('.split(/[,\\n\\r\\t') && line.includes(']+/)')) {
    lines[i] = splitLooseLine
  }
}

let s = lines.join('\n')

s = s.replace(
  /<span className="shrink-0" aria-hidden>\s*\?\?\s*<\/span>/,
  `<span className="shrink-0" aria-hidden>
                      💡
                    </span>`,
)

s = s.replace(/isEnglish \? "Login required \?"/g, 'isEnglish ? "Login required ✨"')

const v1Path = path.resolve(
  'C:/Users/vlvlz/Desktop/프로그램 개발/깃허브 다운파일/nailbook-studio-main-main/src/pages/Detail.tsx',
)
const v1 = fs.readFileSync(v1Path, 'utf8')
const block = v1.match(/function splitProcedureSteps[\s\S]*?\n\}\n\nfunction upsertMetaTag/)
if (!block) {
  console.error('V1 splitProcedureSteps missing')
  process.exit(1)
}
s = s.replace(/function splitProcedureSteps[\s\S]*?\n\}\n\nfunction upsertMetaTag/, block[0])

fs.writeFileSync(p, s, 'utf8')

const check = fs.readFileSync(p, 'utf8')
const ok =
  check.includes('split(/[,\s・;\\|/]+/)') &&
  check.includes('split(/[,\\n\\r\\t・;\\|/]+/)') &&
  check.includes('💡') &&
  check.includes('Login required ✨') &&
  check.includes('(베이스|base|아트|art|마무리')
console.log('ok', ok)
if (!ok) process.exit(1)
