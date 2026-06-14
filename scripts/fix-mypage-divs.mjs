import fs from 'fs'
const p = 'src/pages/client/ClientMyPage.tsx'
let s = fs.readFileSync(p, 'utf8')
s = s.replace(/motionless/g, 'div')
fs.writeFileSync(p, s, 'utf8')
