import fs from 'fs'
import path from 'path'

const roots = [
  'C:/Users/vlvlz/.cursor/projects/c-Users-vlvlz-OneDrive-nailbook-studio-main/agent-transcripts',
  'C:/Users/vlvlz/.cursor/projects/c-Users-vlvlz-Desktop-gelia-v2/agent-transcripts',
]

const files = [
  'TestIntroPage',
  'TestStep1Page',
  'TestStep2Page',
  'TestStep3Page',
  'TestResultPage',
]

const latest = Object.fromEntries(files.map((f) => [f, { contents: null, path: '' }]))

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (ent.name.endsWith('.jsonl')) scan(p)
  }
}

function scan(filePath) {
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    if (!line.includes('Write') || !line.includes('Test')) continue
    let obj
    try {
      obj = JSON.parse(line)
    } catch {
      continue
    }
    for (const c of obj.message?.content ?? []) {
      if (c.type !== 'tool_use' || c.name !== 'Write') continue
      const p = c.input?.path ?? ''
      for (const f of files) {
        if (p.includes(`${f}.tsx`) && c.input?.contents?.includes('export')) {
          latest[f] = { contents: c.input.contents, path: p }
        }
      }
    }
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) walk(root)
}

for (const f of files) {
  const item = latest[f]
  if (!item.contents) {
    console.log('missing', f)
    continue
  }
  const out = `C:/Users/vlvlz/Desktop/gelia-v2/.v1-${f}.tsx`
  fs.writeFileSync(out, item.contents)
  console.log('wrote', f, item.contents.length, 'from', item.path.slice(-60))
}
