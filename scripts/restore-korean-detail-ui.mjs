import fs from 'fs'

const p = 'src/pages/client/ClientNailDetailPage.tsx'
let s = fs.readFileSync(p, 'utf8')

/** Fix KO side of `isEnglish ? EN : KO` by matching stable EN literals */
const ternaries = [
  ['No description has been provided yet.', '등록된 상세 설명이 없어요.'],
  ['Nail Design', '네일 디자인'],
  ['Like', '좋아요'],
  ['Share', '공유하기'],
  ['Saved', '저장됨'],
  ['Save', '저장하기'],
  ['Share Design', '네일 디자인 공유'],
  ['Login required ✨', '로그인이 필요해요 ✨'],
  ['Login required ?', '로그인이 필요해요 ✨'],
  [
    'Would you like to save your favorite nail styles?',
    '나만의 네일 스타일을 모아보시겠어요?',
  ],
  ['Cancel', '취소'],
  ['Go to Login', '로그인하러 가기'],
  ['Loading...', '로딩 중…'],
  ['Fetching nail details.', '네일 정보를 불러오고 있어요.'],
  ['Go Home', '홈으로 가기'],
  ['Likes', '좋아요'],
  ['Views', '조회'],
  ['Saves', '저장'],
  ['No tags to display.', '표시할 태그가 없어요.'],
  ['Design Points', '디자인 포인트'],
  ['No design points have been added yet.', '등록된 디자인 요소가 없어요.'],
  ['Pro Styling Guide', '네일원장님을 위한 시술 가이드'],
  ['No styling guide has been added yet.', '등록된 시술 가이드가 없어요.'],
  ['Similar Nail Designs', '이 디자인과 비슷한 네일'],
  ['See All', '전체보기'],
  ['Nail', '네일'],
  [
    'This guide is a design reference and may differ from actual salon procedures.',
    '본 가이드는 참고용 디자인 레퍼런스로, 실제 시술 방식과 다를 수 있습니다.',
  ],
  [
    'Link copied! Share it with your friends ✨',
    '링크가 복사되었어요! 친구에게 공유해 보세요 ✨',
  ],
  [
    'Link copied! Share it with your friends ?',
    '링크가 복사되었어요! 친구에게 공유해 보세요 ✨',
  ],
  [
    'Found a nail style you love? Explore it in detail on GELIA. 💅',
    '마음에 쏙 드는 네일 디자인! 젤리아에서 자세히 확인해 보세요. 💅',
  ],
  [
    'Found a nail style you love? Explore it in detail on GELIA. ??',
    '마음에 쏙 드는 네일 디자인! 젤리아에서 자세히 확인해 보세요. 💅',
  ],
]

for (const [en, ko] of ternaries) {
  const enEsc = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  s = s.replace(
    new RegExp(`(isEnglish \\? "${enEsc}" : )"[^"]*"`, 'g'),
    `$1"${ko}"`,
  )
}

const literals = [
  ['setError("??? ????.");', 'setError("잘못된 주소예요.");'],
  ['setError("?? ??? ???? ????.");', 'setError("네일 정보를 불러오지 못했어요.");'],
  ['title: title || "?? ???",', 'title: title || "네일 디자인",'],
  ['aria-label="??? ??"', 'aria-label="이미지 확대"'],
  ['aria-label="??? ?? ??"', 'aria-label="이미지 확대 보기"'],
  ['aria-label="?? ??? ??"', 'aria-label="확대 이미지 닫기"'],
  ['aria-label="?? ??"', 'aria-label="뒤로 가기"'],
  ['document.title = `${title} | ??? (GELIA)`;', 'document.title = `${title} | 젤리아 (GELIA)`;'],
  [
    '"??? (GELIA) | ???? ?? ????"',
    '"젤리아 (GELIA) | 프리미엄 네일 큐레이션"',
  ],
  [
    '"?? ?? ?? ?????? ?? ????? ? ?? ?? ?????, ????? ?? ??? ?? ?????."',
    '"어떤 네일 할지 고민되나요? 핫한 트렌드부터 내 취향 맞춤 디자인까지, 젤리아에서 인생 네일을 쉽게 찾아보세요."',
  ],
]

for (const [from, to] of literals) {
  s = s.split(from).join(to)
}

const multilineKo = [
  [
    ': "??? ? ?? ?? ???! ????? ??? ??? ???. ??"',
    ': "마음에 쏙 드는 네일 디자인! 젤리아에서 자세히 확인해 보세요. 💅"',
  ],
  [
    ': "??? ??????! ???? ??? ??? ?"',
    ': "링크가 복사되었어요! 친구에게 공유해 보세요 ✨"',
  ],
  [
    '|| "???? ?? ? ????."',
    '|| "데이터를 찾을 수 없습니다."',
  ],
  [
    ': "? ???? ??? ??? ?????, ?? ?? ??? ?? ? ????."',
    ': "본 가이드는 참고용 디자인 레퍼런스로, 실제 시술 방식과 다를 수 있습니다."',
  ],
  [
    '"Found a nail style you love? Explore it in detail on GELIA. ??"',
    '"Found a nail style you love? Explore it in detail on GELIA. 💅"',
  ],
  [
    '"Link copied! Share it with your friends ?"',
    '"Link copied! Share it with your friends ✨"',
  ],
]

for (const [from, to] of multilineKo) {
  s = s.split(from).join(to)
}

fs.writeFileSync(p, s, 'utf8')

const ok = ['저장하기', '좋아요', '디자인 포인트', '조회', '젤리아'].every((k) => s.includes(k))
console.log('korean restored:', ok)
if (!ok) {
  console.error('missing expected Korean tokens')
  process.exit(1)
}
