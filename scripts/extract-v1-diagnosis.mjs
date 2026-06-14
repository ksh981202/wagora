import fs from 'fs'

const transcriptPath =
  'C:/Users/vlvlz/.cursor/projects/c-Users-vlvlz-OneDrive-nailbook-studio-main/agent-transcripts/0397de11-fc08-4b38-bc81-dfdfc9bcae1d/0397de11-fc08-4b38-bc81-dfdfc9bcae1d.jsonl'

const line = fs.readFileSync(transcriptPath, 'utf8').split('\n')[32]
const obj = JSON.parse(line)
const tu = obj.message.content.find((c) => c.type === 'tool_use')
const raw = Object.values(tu.input).join('')
const body = raw
  .split('\n')
  .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
  .map((l) => l.slice(1))
  .join('\n')

fs.writeFileSync('C:/Users/vlvlz/Desktop/gelia-v2/.v1-nailDiagnosis.ts', body)
console.log('wrote nailDiagnosis', body.length)
