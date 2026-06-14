import fs from 'fs'

const v1Path =
  'C:/Users/vlvlz/Desktop/프로그램 개발/깃허브 다운파일/nailbook-studio-main-main/src/pages/LoginPage.tsx'
let s = fs.readFileSync(v1Path, 'utf8')

s = s.replace(
  `import { getSupabaseBrowserClient } from '../lib/supabaseBrowserClient';
import { mergeGuestRecentViewedToUser } from "../lib/recentViewedStorage";

export default function LoginPage()`,
  `import { supabase } from '@/shared/api/supabaseClient';
import { mergeGuestRecentViewedToUser } from '@/shared/lib/recentViewedStorage';

export default function ClientLoginPage()`,
)

s = s.replace(/const supabase = getSupabaseBrowserClient\(\);\s*\n\s*if \(!supabase\) return;\s*\n/g, '')
s = s.replace(/const supabase = getSupabaseBrowserClient\(\);\s*\n/g, '')

fs.writeFileSync('src/pages/client/ClientLoginPage.tsx', s, 'utf8')
const check = fs.readFileSync('src/pages/client/ClientLoginPage.tsx', 'utf8')
console.log({
  ok: check.includes('네일북 가입하기') && check.includes('2258') && check.includes('@/shared/api/supabaseClient'),
})
