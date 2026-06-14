export type ResultId = "elegant" | "cute" | "pure" | "chic" | "glam";

export type ScoreMap = Partial<Record<ResultId, number>>;

type DesignItem = {
  src: string;
  title: string;
};

export type NailResultType = {
  resultId: ResultId;
  title: string;
  styleTag: string;
  description: string;
  mainDesigns: DesignItem[];
  subDesigns: DesignItem[];
};

type OptionWithScores = {
  id: string;
  label?: string;
  title?: string;
  image?: string;
  src?: string;
  tone?: string;
  tags?: string;
  scores: ScoreMap;
};

export const nailLengthOptions = [
  { id: "length-short", label: "짧은 손톱", image: "/diagnosis/length-short.jpg", scores: { pure: 3, cute: 2, elegant: 1 } },
  { id: "length-medium", label: "중간 길이", image: "/diagnosis/length-medium.jpg", scores: { elegant: 2, pure: 2, chic: 1 } },
  { id: "length-long", label: "긴 손톱", image: "/diagnosis/length-long.jpg", scores: { chic: 2, glam: 2, elegant: 1 } },
] as const;

export const handTypeOptions = [
  { id: "short-finger", label: "🌷 손가락이 짧은 편", scores: { elegant: 2, pure: 1, chic: 1 } },
  { id: "long-finger", label: "🦢 손가락이 긴 편", scores: { chic: 2, elegant: 1, glam: 1 } },
  { id: "plump-hand", label: "☁️ 손이 통통한 편", scores: { cute: 2, pure: 2 } },
  { id: "slim-hand", label: "🩰 손이 마른 편", scores: { elegant: 2, chic: 2 } },
] as const;

// Mood scores are intentionally weighted highest.
export const styleOptions = [
  { id: "simple", label: "심플·깔끔", image: "/diagnosis/mood-simple.jpg", scores: { chic: 8, elegant: 5, pure: 2 } },
  { id: "delicate", label: "여리여리·청순", image: "/diagnosis/mood-delicate.jpg", scores: { pure: 8, cute: 4, elegant: 2 } },
  { id: "cute", label: "귀엽고 사랑스러운", image: "/diagnosis/mood-cute.jpg", scores: { cute: 8, pure: 3, glam: 1 } },
  { id: "elegant", label: "우아·고급스러운", image: "/diagnosis/mood-elegant.jpg", scores: { elegant: 8, chic: 4, glam: 2 } },
  { id: "glamorous", label: "화려한·블링블링", image: "/diagnosis/mood-glamorous.jpg", scores: { glam: 8, chic: 3, elegant: 2 } },
  { id: "unique", label: "유니크·힙한", image: "/diagnosis/mood-unique.jpg", scores: { chic: 7, glam: 4, cute: 1 } },
] as const;

export const colorOptions = [
  { id: "pink", title: "핑크", src: "/diagnosis/color-pink.png", tone: "🎀 쿨톤 추천", tags: "#여리여리 #러블리", scores: { cute: 3, pure: 3, elegant: 1 } },
  { id: "nude", title: "누드/베이지", src: "/diagnosis/color-nude.png", tone: "☀️ 웜톤 추천", tags: "#차분함 #오피스", scores: { elegant: 3, chic: 2, pure: 1 } },
  { id: "red", title: "레드 / 버건디", src: "/diagnosis/color-red.png", tone: "🍎 매혹적인 포인트", tags: "#강렬함 #섹시 #포인트", scores: { glam: 3, chic: 2, elegant: 1 } },
  { id: "black", title: "블랙 / 다크", src: "/diagnosis/color-black.png", tone: "🕶️ 시크한 매력", tags: "#시크 #도도 #걸크러쉬", scores: { chic: 3, glam: 2, elegant: 1 } },
  { id: "pastel", title: "파스텔", src: "/diagnosis/color-pastel.png", tone: "🎀 쿨톤 추천", tags: "#몽환적 #유니크", scores: { pure: 3, cute: 2, chic: 1 } },
  { id: "glitter", title: "글리터", src: "/diagnosis/color-glitter.png", tone: "💎 화려함 끝판왕", tags: "#영롱 #반짝반짝 #시선집중", scores: { glam: 4, cute: 1, chic: 1 } },
] as const;

export const nailResultTypes: NailResultType[] = [
  {
    resultId: "elegant",
    title: "당신에게 어울리는 네일",
    styleTag: "✨ Elevated & Elegant Style",
    description:
      "차분하면서도 고급스러운 분위기를 가장 잘 소화하는 타입이에요.\n손끝 라인을 정돈해 보이는 디자인이 특히 잘 어울리고,\n은은한 누드 톤이나 미세한 펄 포인트가 세련미를 높여줘요.",
    mainDesigns: [
      { src: "/placeholder.png", title: "누드 글로시 프렌치" },
      { src: "/placeholder.png", title: "샴페인 마블 포인트" },
      { src: "/placeholder.png", title: "밀키 베이지 그라데이션" },
      { src: "/placeholder.png", title: "골드 라인 미니멀" },
    ],
    subDesigns: [
      { src: "/placeholder.png", title: "진주 포인트 프렌치" },
      { src: "/placeholder.png", title: "피치 베이지 시럽" },
      { src: "/placeholder.png", title: "로즈골드 하프문" },
    ],
  },
  {
    resultId: "cute",
    title: "당신에게 어울리는 네일",
    styleTag: "🍑 Soft & Lovely Cute",
    description:
      "생기 있고 사랑스러운 무드가 손끝에서 가장 빛나는 타입이에요.\n말랑한 컬러 조합과 아기자기한 포인트를 더하면\n데일리 룩도 더 화사하고 귀엽게 완성됩니다.",
    mainDesigns: [
      { src: "/placeholder.png", title: "딸기 우유 그라데이션" },
      { src: "/placeholder.png", title: "하트 도트 포인트" },
      { src: "/placeholder.png", title: "코랄 시럽 글로우" },
      { src: "/placeholder.png", title: "리본 파츠 포인트" },
    ],
    subDesigns: [
      { src: "/placeholder.png", title: "베이비 핑크 프렌치" },
      { src: "/placeholder.png", title: "체리 체크 네일" },
      { src: "/placeholder.png", title: "파스텔 하트 네일" },
    ],
  },
  {
    resultId: "pure",
    title: "당신에게 어울리는 네일",
    styleTag: "🌿 Clear & Pure Mood",
    description:
      "맑고 깨끗한 인상을 살려주는 네일이 가장 잘 맞는 타입이에요.\n투명감 있는 컬러와 부드러운 그라데이션이\n자연스러운 손 분위기를 더 예쁘게 정리해 줍니다.",
    mainDesigns: [
      { src: "/placeholder.png", title: "밀키 화이트 그라데이션" },
      { src: "/placeholder.png", title: "시럽 핑크 한 방울" },
      { src: "/placeholder.png", title: "아이보리 클린 프렌치" },
      { src: "/placeholder.png", title: "오트밀 미니멀" },
    ],
    subDesigns: [
      { src: "/placeholder.png", title: "워터리 투명 네일" },
      { src: "/placeholder.png", title: "라이트 피치 코팅" },
      { src: "/placeholder.png", title: "은은 펄 클리어" },
    ],
  },
  {
    resultId: "chic",
    title: "당신에게 어울리는 네일",
    styleTag: "🖤 Urban & Chic Vibe",
    description:
      "세련되고 도회적인 무드를 살리는 스타일이 가장 잘 어울려요.\n깔끔한 라인과 대비감 있는 컬러를 활용하면\n손끝에 또렷한 존재감과 분위기를 줄 수 있습니다.",
    mainDesigns: [
      { src: "/placeholder.png", title: "모노톤 라인 아트" },
      { src: "/placeholder.png", title: "딥브라운 미러 포인트" },
      { src: "/placeholder.png", title: "블랙 프렌치 시크" },
      { src: "/placeholder.png", title: "스모키 그레이 글로시" },
    ],
    subDesigns: [
      { src: "/placeholder.png", title: "실버 라인 미니멀" },
      { src: "/placeholder.png", title: "차콜 무광 포인트" },
      { src: "/placeholder.png", title: "딥네이비 시티룩" },
    ],
  },
  {
    resultId: "glam",
    title: "당신에게 어울리는 네일",
    styleTag: "💎 Bold & Glam Statement",
    description:
      "화려하고 임팩트 있는 디자인을 소화하는 매력적인 타입이에요.\n빛나는 글리터와 스톤 포인트가 잘 어울리고,\n특별한 날에는 과감한 컬러 조합이 더욱 돋보입니다.",
    mainDesigns: [
      { src: "/placeholder.png", title: "오로라 글리터 풀코트" },
      { src: "/placeholder.png", title: "버건디 스톤 포인트" },
      { src: "/placeholder.png", title: "골드 파츠 럭셔리" },
      { src: "/placeholder.png", title: "레드 미러 글램" },
    ],
    subDesigns: [
      { src: "/placeholder.png", title: "펄 샴페인 블링" },
      { src: "/placeholder.png", title: "크리스탈 포인트" },
      { src: "/placeholder.png", title: "글램 딥와인" },
    ],
  },
];

type DiagnosisSelections = {
  lengthId?: string;
  handTypeId?: string;
  moodId?: string;
  colorId?: string;
};

const EMPTY_TOTAL: Record<ResultId, number> = {
  elegant: 0,
  cute: 0,
  pure: 0,
  chic: 0,
  glam: 0,
};

function mergeScores(target: Record<ResultId, number>, scores?: ScoreMap) {
  if (!scores) return;
  (Object.keys(scores) as ResultId[]).forEach((key) => {
    target[key] += scores[key] ?? 0;
  });
}

function getOptionById<T extends OptionWithScores>(options: readonly T[], id?: string) {
  return options.find((opt) => opt.id === id);
}

export function calculateNailResult(selections: DiagnosisSelections): NailResultType {
  const total = { ...EMPTY_TOTAL };

  mergeScores(total, getOptionById(nailLengthOptions, selections.lengthId)?.scores);
  mergeScores(total, getOptionById(handTypeOptions, selections.handTypeId)?.scores);
  mergeScores(total, getOptionById(styleOptions, selections.moodId)?.scores);
  mergeScores(total, getOptionById(colorOptions, selections.colorId)?.scores);

  const bestId = (Object.entries(total).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "elegant") as ResultId;
  return nailResultTypes.find((item) => item.resultId === bestId) ?? nailResultTypes[0];
}