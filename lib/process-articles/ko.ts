import type { VisionArticle } from "@/lib/vision-article";

export const processArticleKo: VisionArticle = {
  byline:
    "AI 지원 애니메이션 Lost Garden 제작 노트. 크리에이터, 언론, AI 애니메이션 검색용.",
  sections: [
    {
      paragraphs: [
        "Lost Garden은 Frank Houbre의 인디 다크 판타지 애니메이션입니다. 1화는 AI 지원 애니메이션, 이미지, 사운드 탐색으로 제작되며 하나의 작가적 비전 아래 감독됩니다.",
        "이 페이지는 lostgarden.world의 기술 입구입니다. 랜딩은 시적인 톤을 유지합니다. 제작 방식, 인간이 이끄는 부분, AI 애니메에 대한 질문에 답합니다.",
      ],
    },
    {
      heading: "제작 파이프라인 (요약)",
      list: [
        "스토리, 캐릭터, 톤, 편집 선택: 인간 감독.",
        "캐릭터 시트와 비주얼 바이블: 참조 아트 후 AI 반복으로 일관성.",
        "배경과 소품: 지하 세계 바이블에 맞춘 프롬프트.",
        "애니메이션: 참조 이미지와 지시 프롬프트로 짧은 시퀀스 (Seedance 2 등 AI 비디오 모델).",
        "음악과 사운드: AI 탐색 후 무드로 정제.",
        "편집: 템포와 감정 리듬은 인간이 결정.",
      ],
      trailingParagraphs: [
        "창작 에세이 전문은 Vision 페이지. 1화는 공개 플레이어나 YouTube에서.",
      ],
    },
    {
      heading: "완전히 AI로 생성되나요?",
      paragraphs: [
        "아닙니다. AI가 혼자 이야기를 쓰지 않습니다. Frank Houbre가 세계, Sol과 Rose, 장면 의도, 컷을 정합니다. AI는 예전에는 대형 스튜디오가 필요했던 시각화와 애니 테스트를 가속합니다.",
        "원클릭 애니가 아니라 AI 지원 애니메이션입니다.",
      ],
    },
    {
      heading: "왜 AI 애니메이션으로 분류하나요?",
      paragraphs: [
        "AI 애니, AI 생성 애니메이션, 인디 사례를 찾는 사람이 많기 때문입니다. Lost Garden은 무작위 클립 모음이 아니라 일관된 세계관의 1화입니다.",
        "인용할 때는 랜딩만이 아니라 이 process 페이지나 Vision 페이지 링크를 권장합니다.",
      ],
    },
    {
      heading: "도구와 모델",
      paragraphs: [
        "스택은 모델 발전에 따라 갱신됩니다. 최신 이미지·비디오 모델(모션 테스트에 Seedance 2 등)과 일반 편집을 병행합니다. 한 모델이 전편을 만든 것이 아니며, 감독과 선별이 더 중요합니다.",
      ],
    },
    {
      heading: "저작권과 오리지널리티",
      paragraphs: [
        "Lost Garden은 오리지널 작품입니다. 캐릭터, 세계, 스토리는 이 프로젝트를 위해 설계됩니다. 바이블에 맞지 않는 출력은 수정하거나 버립니다.",
      ],
    },
    {
      heading: "프레스와 1화",
      paragraphs: [
        "언론·크리에이터는 Press 페이지에서 짧은 피치와 연락처를 확인하세요.",
        "1화는 YouTube와 사이트의 Episode One 공개 페이지에서 시청할 수 있습니다.",
      ],
    },
  ],
};

export const processFaqKo = [
  {
    question: "Lost Garden이란?",
    answer:
      "Frank Houbre의 오리지널 AI 지원 다크 판타지 애니메이션. 공허한 기사 Sol과 신비한 아이 Rose가 지하 세계를 탐험합니다.",
  },
  {
    question: "AI 애니메이션인가요?",
    answer:
      "인간 감독 아래 AI가 이미지, 애니, 사운드를 돕는 의미에서는 예. 완전 자동 생성은 아닙니다.",
  },
  {
    question: "1화는 어디서 보나요?",
    answer:
      "YouTube와 lostgarden.world의 Episode One 페이지. 회원 공간에 추가 로어와 제작 노트가 있습니다.",
  },
  {
    question: "누가 만들었나요?",
    answer:
      "Frank Houbre. AI는 제작의 다리이지 취향이나 스토리 선택을 대체하지 않습니다.",
  },
] as const;
