import fs from 'fs'

const transcriptPath =
  'C:/Users/vlvlz/.cursor/projects/c-Users-vlvlz-OneDrive-nailbook-studio-main/agent-transcripts/694a6e89-4eb7-4da4-9a2a-2ce3bb3f3924/694a6e89-4eb7-4da4-9a2a-2ce3bb3f3924.jsonl'

const files = [
  'TestIntroPage',
  'TestStep1Page',
  'TestStep2Page',
  'TestStep3Page',
  'TestResultPage',
]

const latest = Object.fromEntries(files.map((f) => [f, null]))

for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
  if (!line.includes('Write')) continue
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
      if (p.includes(`${f}.tsx`) && c.input?.contents) {
        latest[f] = c.input.contents
      }
    }
  }
}

for (const f of files) {
  if (!latest[f]) {
    console.log('missing', f)
    continue
  }
  const out = `C:/Users/vlvlz/Desktop/gelia-v2/.v1-${f}.tsx`
  fs.writeFileSync(out, latest[f])
  console.log('wrote', f, latest[f].length)
}
