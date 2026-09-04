import type { AiAnimeArticle } from "@/lib/ai-anime-article";

export const aiAnimeArticleKo: AiAnimeArticle = {
  lead: "실제로 AI로 제작된 애니메이션 6편의 순위입니다. 1위 Lost Garden(2026년, 독립 제작, 17분 완성 에피소드), 2위 Twins Hinahima(2025년, 컷의 약 95%에 생성 AI를 쓴 일본 최초의 TV 방영 애니메이션), 3위 Anipops 오리지널(2026년, 일본 최초의 유료 AI 애니메이션 스트리밍 서비스), 4위 The Dog & the Boy(2023년, 넷플릭스와 WIT STUDIO), 5위 Anime Rock, Paper, Scissors(2023년, Corridor Digital), 6위 Vidu와 Aura Productions의 SF 시리즈(2025년, 50화).",
  updatedLabel: "2026년 9월 업데이트",
  byline:
    "인공지능으로 만든 애니메이션을 찾는 사람을 위한 실무용 목록입니다. 무엇이 실제로 존재하는지, 누가 만들었는지, 그리고 AI가 실제로 무엇을 했는지.",
  disclosure:
    "고지: 이 글은 Lost Garden 공식 사이트에 실렸고, Lost Garden을 1위에 놓았습니다. 이유는 본문에 그대로 적어두었으니 동의하지 않으셔도 됩니다. 나머지 다섯 편은 모두 실제 제작물이며 출처는 글 끝에 정리했습니다.",
  intro: [
    "AI 애니메이션을 검색하면 대부분 도구가 나옵니다. 생성기, 모델 비교, 프롬프트 모음. 훨씬 찾기 어려운 것은 작품 자체입니다. 끝까지 볼 수 있는 에피소드, 그리고 컷이 바뀌어도 같은 얼굴로 남아 있는 캐릭터.",
    "그런 작품은 수백 편이 아닙니다. 몇 편뿐이고, 출신도 전혀 다릅니다. 일본 방송사, 로스앤젤레스의 스튜디오, 유튜브 VFX 팀, 그리고 노트북 한 대로 작업하는 프랑스의 1인 제작자. 이 목록은 발표 당시의 화제성이 아니라 결과물의 완성도를 기준으로 그 몇 편을 줄 세운 것입니다.",
  ],
  method: {
    heading: "이 순위의 기준",
    paragraphs: [
      "1위는 데모가 아니라 애니메이션에 가장 가까워진 작품입니다. 끝까지 붙잡아둘 만큼 긴 이야기, 무너지지 않는 세계관, 컷이 바뀌어도 눈이 알아보는 캐릭터.",
    ],
    list: [
      "길이: 1분짜리 테스트보다 완성된 에피소드 한 편을 더 높게 봅니다.",
      "일관성: 얼굴, 의상, 배경이 컷을 넘어 유지되는가.",
      "작가성: 이야기를 정하는 사람이 있는가, 아니면 파이프라인 자체가 목적인가.",
      "접근성: 오늘 무료로, 혹은 실제로 존재하는 서비스에서 볼 수 있는가.",
      "정직함: AI가 무엇을 했는지 숨기지 않고 밝히는가.",
    ],
  },
  rankingHeading: "AI로 만든 애니메이션 베스트 6",
  entries: [
    {
      rank: 1,
      title: "Lost Garden",
      meta: "2026년 · 독립 제작 · 제작 Frank Houbre · 1화 17분",
      verdict: "이 목록에서 가장 완성도 높은, 그리고 1인 제작인 에피소드.",
      paragraphs: [
        "Lanterne는 지하 제단에서 깨어납니다. 기억은 없고, 얼굴이 있어야 할 자리에는 등불이 있습니다. Rose는 이유도 모른 채 그가 지키기로 한 아이입니다. 두 사람 주위에는 푸른 숲과 청록빛 안개, 그리고 오래된 맹세에 묶인 열세 명의 텅 빈 기사가 있는 묻힌 세계가 펼쳐집니다.",
        "1화는 약 17분이고, 끝까지 무너지지 않습니다. 바로 그 부분이 어렵습니다. 캐릭터는 장면이 바뀌어도 알아볼 수 있고, 지하 세계는 자기 설정집을 따르며, 이야기는 분위기만 남기고 끝나는 대신 2화로 이어집니다.",
        "이걸 만드는 사람은 한 명입니다. Frank Houbre가 각본을 쓰고, 컷을 연출하고, 에피소드를 편집합니다. AI는 그 연출 안에서 이미지와 애니메이션을 생성하고, 세계관을 깨는 생성 컷은 잘못 찍은 테이크처럼 버려집니다. 그것이 AI 보조 애니메이션과 프롬프트 모음 영상의 차이입니다.",
      ],
      aiRoleLabel: "AI가 하는 일",
      aiRole:
        "이미지 생성, 애니메이션 컷, 그리고 사운드 탐색의 일부. 각본, 스토리보드의 의도, 테이크 선택, 최종 편집은 사람이 합니다.",
      links: [
        { label: "1화 보기", href: "/episode-1" },
        { label: "제작 노트 전문", href: "/process" },
        { label: "Imaginode로 제작", href: "https://imaginode.ai" },
      ],
    },
    {
      rank: 2,
      title: "Twins Hinahima",
      meta: "2025년 · 일본 · 프론티어웍스와 KaKa Creation · TV 방영",
      verdict: "컷의 약 95%에 생성 AI를 쓰고 일본 TV에서 방영된 최초의 애니메이션.",
      paragraphs: [
        "히마리와 히나나는 생김새도 성격도 닮지 않은 쌍둥이 자매이고, 둘 다 틱톡 댄스로 유명해지고 싶어 합니다. 2025년 3월 28일 도쿄 MX, 다음 날 MBS에서 방영됐고 3월 30일부터 스트리밍됐습니다.",
        "모두가 인용하는 숫자는 애니메이션 컷의 약 95%에 생성 AI가 관여했다는 점입니다. 실제로는 하이브리드입니다. AI가 배경 미술과 캐릭터 일러스트를 만들고 사람 애니메이터가 마무리하며, 스튜디오는 언리얼 엔진 5, 클립 스튜디오 페인트, 평소 쓰는 어도비 도구도 함께 씁니다.",
        "볼 만한 이유는 유통 측면에서 증명한 것에 있습니다. 일본 방송사가 AI 사용을 공개적으로 크레딧에 올린 채 전파에 태웠고, 그전에는 아무도 하지 않았습니다.",
      ],
      aiRoleLabel: "AI가 하는 일",
      aiRole:
        "배경 미술과 캐릭터 일러스트를 생성하고, 마무리는 애니메이터가 합니다. 각본, 성우 연기, 연출은 기존 방식 그대로입니다.",
    },
    {
      rank: 3,
      title: "Anipops 오리지널 시리즈",
      meta: "2026년 · 일본 · PIXTA · 숏폼 스트리밍",
      verdict: "AI로 제작한 오리지널 위에 세운 일본 최초의 유료 스트리밍 서비스.",
      paragraphs: [
        "PIXTA는 2026년 8월 12일, 자사 AI 스튜디오가 만든 오리지널 5편을 갖춘 숏폼 스트리밍 플랫폼으로 Anipops를 새로 열었습니다. 라인업에는 몬스터 배틀 판타지 Morks, 사무라이 시대극 Bells of the Oni, 그리고 회사 생활에 지쳐 시골로 내려간 뒤 길고양이 방송으로 화제가 되는 일상물이 있습니다.",
        "Anipops는 2026년 3월 개인 창작자가 자기 AI 애니메이션을 올리는 공간으로 시작했습니다. 그 기능은 Anipops Creators로 옮겨갔고, 본 서비스는 기획과 각본부터 애니메이션까지 사내에서 끝내는 스튜디오 작품 위주가 됐습니다.",
        "AI 애니메이션을 피드에서 공짜로 보는 대신 구독료를 내고 볼 사람이 있는지, 그 첫 번째 진짜 시험입니다. 답은 1년쯤 뒤에 나올 겁니다.",
      ],
      aiRoleLabel: "AI가 하는 일",
      aiRole:
        "기획과 각본부터 애니메이션까지 사내 파이프라인 전체에 들어갑니다. 대상은 휴대폰용 짧은 에피소드입니다.",
    },
    {
      rank: 4,
      title: "The Dog & the Boy",
      meta: "2023년 · 일본 · Netflix Anime Creators Base, WIT STUDIO, rinna · 3분",
      verdict: "논쟁에 불을 붙인 단편.",
      paragraphs: [
        "소년과 로봇 개의 이야기이고, 감독은 마키하라 료타로입니다. 2023년 1월 31일 유튜브에 공개됐습니다. 배경은 먼저 콘셉트 아트로 그린 뒤 AI 모델을 여러 번 거치고, 마지막에 손으로 수정했습니다.",
        "크레딧에는 배경 디자인이 \"AI + Human\"으로 적혔습니다. 작품보다 이 한 줄이 더 기억에 남았습니다. 프로 애니메이터들의 반발은 즉각적이었고, 쟁점은 그림이 아니라 일자리였습니다. 넷플릭스가 이 실험을 배경 미술 인력 부족에 대한 대응이라고 설명한 것도 불에 기름을 부었습니다.",
        "3분짜리입니다. 이야기가 아니라 역사적 이정표로서 그 3분을 쓸 가치가 있습니다.",
      ],
      aiRoleLabel: "AI가 하는 일",
      aiRole:
        "배경 미술만 담당합니다. 손으로 그린 콘셉트에서 생성한 뒤 아티스트가 수정했고, 캐릭터와 애니메이션은 전통 방식입니다.",
    },
    {
      rank: 5,
      title: "Anime Rock, Paper, Scissors",
      meta: "2023년 · 미국 · Corridor Digital · 7분",
      verdict: "AI 영상이라는 말을 알기도 전에 대부분이 먼저 본 작품.",
      paragraphs: [
        "친구 둘이 우스꽝스러울 만큼 비장한 가위바위보를 합니다. 그리고 웃깁니다. Corridor는 실제 배우를 찍은 뒤 Stable Diffusion과 뱀파이어 헌터 D: 블러드러스트로 학습시킨 DreamBooth 모델로 모든 프레임을 다시 그렸고, 배경은 언리얼 엔진으로 만들었습니다. 8일 만에 200만 조회를 넘겼습니다.",
        "특정 영화로 허락 없이 모델을 학습시킨 것, 그것이 바로 프로 애니메이터들을 전면전으로 밀어넣은 행위이고, 3년이 지난 지금도 그 논쟁의 기준점으로 남아 있습니다.",
        "기술적으로는 생성보다 로토스코핑에 가깝고, 그래서 움직임이 이후에 나온 많은 영상보다 아직 더 잘 버팁니다.",
      ],
      aiRoleLabel: "AI가 하는 일",
      aiRole:
        "실사 영상을 애니메이션 스타일로 프레임 단위로 다시 그립니다. 연기, 호흡, 카메라는 촬영한 것이지 생성한 것이 아닙니다.",
    },
    {
      rank: 6,
      title: "Vidu와 Aura Productions의 SF 시리즈",
      meta: "2025년 · 미국과 중국 · Aura Productions와 Vidu · 50화",
      verdict: "물량 승부. 1분에서 2분짜리 50편.",
      paragraphs: [
        "2025년 3월 홍콩 필마트에서 발표된 기획으로, ShengShu Technology의 영상 모델 Vidu만으로 생성한 50편의 짧은 SF 에피소드를 소셜 플랫폼에 배포합니다. Aura Productions는 프로듀서 Luo Yan과 D.T. Carpenter가 세운 로스앤젤레스 스튜디오입니다.",
        "흥미로운 지점은 형식 선택입니다. 긴 영화 한 편 대신 세로 화면에 맞는 짧은 에피소드를 조금씩 흘려보내는 구조이고, 컷 사이에서 캐릭터를 유지하기 위해 Vidu의 다중 피사체 일관성 기능에 기대고 있습니다.",
        "짧은 AI 애니메이션이 신기한 구경거리가 아니라 시청 습관이 된다면, 그 출발점은 대략 여기입니다.",
      ],
      aiRoleLabel: "AI가 하는 일",
      aiRole:
        "영상을 처음부터 끝까지 생성합니다. 사람의 몫은 각본, 컷 설계, 편집에 몰려 있습니다.",
    },
  ],
  sections: [
    {
      heading: "애니메이션 파이프라인에서 AI는 실제로 어디에 들어가는가",
      paragraphs: [
        "AI 애니메이션이라는 말은 최소한 네 가지 다른 것을 가리키고, 그걸 섞어 쓰기 때문에 온라인 논쟁이 제자리를 돕니다.",
      ],
      list: [
        "배경 보조: 사람이 그리고, 모델이 반복하고, 아티스트가 수정한다. The Dog & the Boy.",
        "컷 보조: 모델이 작화 대부분을 내놓고 애니메이터가 마무리한다. Twins Hinahima.",
        "실사 위 스타일 전이: 진짜 배우, 다시 그린 프레임. Anime Rock, Paper, Scissors.",
        "직접 생성: 영상 모델에서 나온 컷을 이어 붙인다. Lost Garden, Anipops, Vidu와 Aura.",
      ],
      trailingParagraphs: [
        "이 넷 중 어느 것도 그 장면이 무엇에 관한 것인지 정하는 사람을 없애주지 않습니다. 그 판단이 여전히 일의 전부이고, 온라인에 떠도는 생성 영상 대부분이 볼 수 없는 이유이기도 합니다.",
      ],
    },
    {
      heading: "100% AI로 만든 애니메이션이 있는가",
      paragraphs: [
        "없습니다. 그렇게 파는 쪽은 의심하세요. 모든 프레임을 생성하는 작품에도 이야기를 고르고, 대사를 쓰고, 마흔 개 테이크 중 쓸 만한 것을 고르고, 편집의 호흡을 잡는 사람이 있습니다.",
        "정말로 달라진 것은 하한선입니다. 17분짜리 애니메이션을 만들려면 스튜디오와 예산이 필요했습니다. 이제 한 사람이 1년이면 만듭니다. 이 목록에서 가장 흥미로운 작품이 동시에 가장 작은 팀인 이유가 거기 있습니다.",
      ],
    },
  ],
  productionHeading: "Lost Garden은 어떻게 제작되는가",
  productionParagraphs: [
    "각본이 먼저이고, 손으로 씁니다. ScreenWeaver에서 쓰고, ScreenWeaver가 그 각본에서 장면별로 스토리보드를 생성합니다.",
    "이미지와 영상 생성은 Imaginode에서 돌아갑니다. Frank Houbre가 직접 만든 AI 창작 플랫폼으로, 많은 이미지 모델과 영상 모델을 하나의 노드 캔버스 뒤에 모아둡니다. 덕분에 도구를 바꾸지 않고 같은 컷을 여러 모델로 시험할 수 있고, 캐릭터 레퍼런스가 그것을 쓰는 컷 옆에 그대로 남습니다. 이건 어떤 모델을 고르느냐보다 중요합니다. Lanterne의 갑옷과 Rose의 얼굴을 한 편 내내 안정적으로 유지하는 건 프롬프트 문제가 아니라 파이프라인 문제이기 때문입니다.",
    "편집, 호흡, 사운드 선택, 그리고 에피소드에 무엇을 남길지에 대한 판단은 모두 사람이 합니다. 설정집과 어긋나는 생성 컷은 잘려나가고, 실제로 꽤 많이 잘립니다.",
  ],
  productionLinks: [
    { label: "컷을 만드는 플랫폼, Imaginode", href: "https://imaginode.ai" },
    { label: "제작 노트 전문 읽기", href: "/process" },
  ],
  faqHeading: "자주 묻는 질문",
  faq: [
    {
      question: "지금 볼 만한 최고의 AI 애니메이션은 무엇인가요.",
      answer:
        "완결된 이야기를 원한다면 Lost Garden 1화입니다. Frank Houbre가 만든 17분짜리 독립 다크 판타지 에피소드입니다. 방영 작품을 원한다면 Twins Hinahima로, 2025년 3월 일본 TV에서 방영됐고 컷의 약 95%에 생성 AI를 썼습니다.",
    },
    {
      question: "100% AI로 만든 애니메이션이 있나요.",
      answer:
        "없습니다. 모든 프레임을 AI로 생성하는 작품은 있지만, 이야기를 쓰고 쓸 만한 테이크를 고르고 에피소드를 편집하는 것은 여전히 사람입니다. 완전 자동이라고 광고하는 기획은 대개 이어지는 이야기가 없는 클립 모음입니다.",
    },
    {
      question: "AI를 처음 쓴 애니메이션은 무엇인가요.",
      answer:
        "2023년 1월 31일 Netflix Anime Creators Base가 WIT STUDIO, rinna와 함께 유튜브에 공개한 The Dog & the Boy가 AI 생성 배경 미술을 크레딧에 올린 최초의 널리 알려진 애니메이션 작품입니다.",
    },
    {
      question: "AI 애니메이션이 TV에서 방영된 적이 있나요.",
      answer:
        "있습니다. 프론티어웍스와 KaKa Creation이 제작한 Twins Hinahima가 2025년 3월 28일 도쿄 MX, 다음 날 MBS에서 방영됐습니다.",
    },
    {
      question: "혼자서 AI 애니메이션을 만들 수 있나요.",
      answer:
        "만들 수 있습니다. Lost Garden이 그 증거입니다. 1화는 한 사람이 쓰고, 연출하고, 제작하고, 편집했습니다. 각본과 스토리보드에는 ScreenWeaver를, 이미지와 영상 생성에는 Imaginode를 썼습니다.",
    },
    {
      question: "Lost Garden은 어디서 볼 수 있나요.",
      answer:
        "1화는 유튜브와 이 사이트의 1화 페이지에서 무료로 볼 수 있습니다. 2화는 제작 중입니다.",
    },
  ],
  sourcesHeading: "출처",
  sourcesNote:
    "다른 다섯 작품에 관한 내용은 아래 공개 보도에 근거합니다. Lost Garden에 관한 내용은 제작진이 제공했습니다.",
  sources: [
    {
      label: "Anime News Network, 프론티어웍스와 KaKa Creation이 Twins Hinahima를 공개",
      href: "https://www.animenewsnetwork.com/news/2024-12-14/frontier-works-kaka-creation-reveal-twins-hinahima-ai-anime/.219056",
    },
    {
      label: "Anime Corner, PIXTA가 새 스튜디오와 오리지널 5편으로 Anipops를 재출시",
      href: "https://animecorner.me/pixtas-japanese-short-form-ai-anime-platform-anipops-launches-with-new-studio-and-5-original-series/",
    },
    {
      label: "Anime News Network, WIT STUDIO가 AI 생성 배경으로 The Dog & the Boy를 제작",
      href: "https://www.animenewsnetwork.com/interest/2023-02-02/wit-studio-produces-the-dog-and-the-boy-anime-short-with-ai-generated-backgrounds/.194426",
    },
    {
      label: "Anime News Network, No, You Cannot Make Anime with AI",
      href: "https://www.animenewsnetwork.com/feature/2023-03-15/no-you-cant-make-anime-with-ai/.195921",
    },
    {
      label: "Variety, Aura Productions가 Vidu와 손잡고 AI 애니메이션 시리즈를 제작",
      href: "https://variety.com/2025/digital/news/luo-yan-aura-productions-vidu-ai-anime-series-1236338232/",
    },
  ],
  relatedHeading: "이어서 읽기",
  relatedLinks: [
    { label: "AI로 만든 애니메이션은 진짜 애니메이션인가", href: "/is-ai-anime-real-anime" },
    { label: "AI 애니메이션과 전통 애니메이션의 차이", href: "/ai-anime-vs-traditional-animation" },
    { label: "AI로 애니메이션 만드는 법, 단계별로", href: "/how-to-make-ai-anime" },
    { label: "컷을 넘어 캐릭터를 유지하는 법", href: "/ai-character-consistency" },
    { label: "Lost Garden 제작 방식 자세히 보기", href: "/process" },
    { label: "1화 보기", href: "/episode-1" },
    { label: "작품을 만든 작가의 비전", href: "/vision" },
    { label: "프레스 및 미디어 킷", href: "/press" },
  ],
};
