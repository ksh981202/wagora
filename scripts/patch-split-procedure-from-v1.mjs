import fs from 'fs'
import path from 'path'

const v1Path = path.resolve(
  'C:/Users/vlvlz/Desktop/프로그램 개발/깃허브 다운파일/nailbook-studio-main-main/src/pages/Detail.tsx',
)
const targetPath = 'src/pages/client/ClientNailDetailPage.tsx'

const v1 = fs.readFileSync(v1Path, 'utf8')
const block = v1.match(/function splitProcedureSteps[\s\S]*?\n\}\n\nfunction upsertMetaTag/)
if (!block) {
  console.error('V1 splitProcedureSteps not found')
  process.exit(1)
}

let s = fs.readFileSync(targetPath, 'utf8')
const next = s.replace(/function splitProcedureSteps[\s\S]*?\n\}\n\nfunction upsertMetaTag/, block[0])
if (next === s) {
  console.error('target replace failed')
  process.exit(1)
}
fs.writeFileSync(targetPath, next, 'utf8')
console.log('patched splitProcedureSteps')
