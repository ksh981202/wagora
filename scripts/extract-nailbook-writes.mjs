import fs from 'fs'
import path from 'path'

const roots = [
  'C:/Users/vlvlz/.cursor/projects/c-Users-vlvlz-OneDrive-nailbook-studio-main/agent-transcripts',
]

const targets = [
  'TestIntroPage',
  'TestStep1Page',
  'TestStep2Page',
  'TestStep3Page',
  'TestResultPage',
]

const best = Object.fromEntries(targets.map((t) => [t, null]))

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (ent.name.endsWith('.jsonl')) scan(p)
  }
}

function scan(filePath) {
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    if (!line.includes('nailbook-studio-main')) continue
    let obj
    try {
      obj = JSON.parse(line)
    } catch {
      continue
    }
    for (const c of obj.message?.content ?? []) {
      if (c.type !== 'tool_use' || c.name !== 'Write') continue
      const p = c.input?.path ?? ''
      if (!p.includes('nailbook-studio-main')) continue
      const contents = c.input?.contents ?? ''
      for (const t of targets) {
        if (!p.includes(`${t}.tsx`)) continue
        const score =
          (contents.includes('/diagnosis/') ? 1000 : 0) +
          (contents.includes('nailDiagnosis') ? 500 : 0) +
          (contents.includes('sessionStorage') ? 300 : 0) +
          contents.length
        const prev = best[t]
        if (!prev || score > prev.score) {
          best[t] = { contents, score, path: p }
        }
      }
    }
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) walk(root)
}

for (const t of targets) {
  const item = best[t]
  if (!item) {
    console.log('missing', t)
    continue
  }
  fs.writeFileSync(`C:/Users/vlvlz/Desktop/gelia-v2/.v1-${t}.tsx`, item.contents)
  console.log('wrote', t, item.score, item.contents.length)
}
