import fs from 'fs'

const p = 'src/pages/client/ClientNailDetailPage.tsx'
let s = fs.readFileSync(p, 'utf8')

const pairs = [
  ['aria-label="뒤로 가기"', 'aria-label={isEnglish ? "Go back" : "뒤로 가기"}'],
  ['aria-label="홈으로 이동"', 'aria-label={isEnglish ? "Go home" : "홈으로 이동"}'],
  ['aria-label="이미지 확대"', 'aria-label={isEnglish ? "Zoom image" : "이미지 확대"}'],
  ['aria-label="이미지 확대 보기"', 'aria-label={isEnglish ? "View enlarged image" : "이미지 확대 보기"}'],
  ['aria-label="확대 이미지 닫기"', 'aria-label={isEnglish ? "Close enlarged image" : "확대 이미지 닫기"}'],
  ['{isEnglish ? "Share Design" : "네일 디자인 공유"}', '{isEnglish ? "Share" : "네일 디자인 공유"}'],
  [
    'const message = error?.trim() || "데이터를 찾을 수 없습니다.";',
    'const message = error?.trim() || (isEnglish ? "Data not found." : "데이터를 찾을 수 없습니다.");',
  ],
  // already-partial edits / corruption recovery
  ['aria-label={isEnglish ? "Go back" : "뒤로 가기"}', 'aria-label={isEnglish ? "Go back" : "뒤로 가기"}'],
  ['aria-label={isEnglish ? "Go back" : "?? ??"}', 'aria-label={isEnglish ? "Go back" : "뒤로 가기"}'],
  ['aria-label="??? ??"', 'aria-label={isEnglish ? "Go home" : "홈으로 이동"}'],
  ['aria-label="??? ??"', 'aria-label={isEnglish ? "Zoom image" : "이미지 확대"}'],
  ['aria-label="??? ?? ??"', 'aria-label={isEnglish ? "View enlarged image" : "이미지 확대 보기"}'],
  ['aria-label="?? ??? ??"', 'aria-label={isEnglish ? "Close enlarged image" : "확대 이미지 닫기"}'],
]

for (const [from, to] of pairs) {
  if (s.includes(from)) s = s.split(from).join(to)
}

fs.writeFileSync(p, s, 'utf8')
console.log(
  'ok',
  s.includes('뒤로 가기'),
  s.includes('Share" : "네일'),
  s.includes('Data not found'),
  !s.includes('Share Design'),
)
