import type { AiAnimeArticle } from "@/lib/ai-anime-article";

export const aiAnimeArticleJa: AiAnimeArticle = {
  lead: "実際にAIで制作されたアニメ6作品のランキングです。1位はLost Garden（2026年、インディー、17分の完成エピソード）、2位はTwins Hinahima（2025年、約95%のカットに生成AIを使った日本初のテレビ放送アニメ）、3位はAnipopsのオリジナル作品（2026年、日本初の有料AIアニメ配信サービス）、4位はThe Dog & the Boy（2023年、NetflixとWIT STUDIO）、5位はAnime Rock, Paper, Scissors（2023年、Corridor Digital）、6位はViduとAura Productionsのsfシリーズ（2025年、全50話）。",
  updatedLabel: "2026年9月更新",
  byline:
    "AIで作られたアニメを探している人のための実用リストです。何が本当に存在するのか、誰が作ったのか、そしてAIが実際に何をしたのか。",
  disclosure:
    "開示：この記事はLost Gardenの公式サイトに掲載されており、Lost Gardenを1位にしています。その理由は本文で明示しているので、納得できなければ反論してください。他の5作品はすべて実在する制作で、出典は記事末に並べています。",
  intro: [
    "AIアニメで検索すると、出てくるのはほとんどツールです。ジェネレーター、モデル比較、プロンプト集。見つけるのがはるかに難しいのは作品そのもの、つまり最後まで見られるエピソードと、カットをまたいでも同じ顔でいるキャラクターです。",
    "そうした作品は何百もありません。ほんの数本で、しかも出どころがまるで違います。日本の放送局、ロサンゼルスのスタジオ、YouTubeのVFXチーム、そしてノートパソコン1台で作るフランスの個人。このリストはその数本を、発表時の話題の大きさではなく、完成度の順に並べたものです。",
  ],
  method: {
    heading: "このランキングの基準",
    paragraphs: [
      "1位は、デモではなくアニメに最も近づいた作品です。つまり見続けられるだけの長さの物語があり、世界観が崩れず、カットの後でもキャラクターを目が認識できること。",
    ],
    list: [
      "尺：1分のテストより、1本の完成エピソードを高く評価します。",
      "一貫性：顔、衣装、背景がカットをまたいで保たれているか。",
      "作家性：物語を決める人間がいるのか、それともパイプラインの披露が目的なのか。",
      "視聴可能性：今日、無料または実在するサービスで見られるか。",
      "誠実さ：AIが何をしたのかを隠さずに説明しているか。",
    ],
  },
  rankingHeading: "AIで作られたアニメ・ベスト6",
  entries: [
    {
      rank: 1,
      title: "Lost Garden",
      meta: "2026年 · インディー · 制作 Frank Houbre · 第1話 17分",
      verdict: "このリストで最も完成度が高く、しかも単独制作のエピソード。",
      paragraphs: [
        "ソルは地下の祭壇で目を覚まします。記憶はなく、顔があるはずの場所にはランタンがあります。ローズは、理由もわからないまま彼が守ると決めた子どもです。二人の周りには、青い森と青緑の霧、そして古い誓いに縛られた13人の空洞の騎士がいる、埋もれた世界が広がっています。",
        "第1話は約17分あり、そして最後まで崩れません。そこが一番難しいところです。キャラクターはシーンをまたいでも見分けがつき、地下世界は独自の設定資料に従い、物語は雰囲気だけで終わらず第2話へ続きます。",
        "これを作っているのは1人です。Frank Houbreが脚本を書き、カットを演出し、エピソードを編集します。AIはその演出の内側で画とアニメーションを生成し、世界観を壊した生成カットは、出来の悪いテイクと同じように捨てられます。それがAI支援のアニメと、プロンプトを並べただけの映像との違いです。",
      ],
      aiRoleLabel: "AIが担当していること",
      aiRole:
        "画像生成、アニメーションカット、そして音の探索の一部。脚本、絵コンテの意図、テイクの取捨選択、最終編集は人間が行います。",
      links: [
        { label: "第1話を見る", href: "/episode-1" },
        { label: "制作ノート全文", href: "/process" },
        { label: "Imaginodeで制作", href: "https://imaginode.ai" },
      ],
    },
    {
      rank: 2,
      title: "Twins Hinahima（ツインズひなひま）",
      meta: "2025年 · 日本 · フロンティアワークス、KaKa Creation · テレビ放送",
      verdict:
        "約95%のカットに生成AIを使い、日本のテレビで放送された最初のアニメ。",
      paragraphs: [
        "ひまりとひなな。見た目も性格も似ていない双子の姉妹が、どちらもTikTokのダンスで有名になりたいと願います。2025年3月28日にTOKYO MX、翌日にMBSで放送され、3月30日から配信されました。",
        "誰もが引用する数字が、アニメーションカットの約95%に生成AIが関わっているという点です。実態はハイブリッドで、AIが背景美術とキャラクターイラストを生成し、人間のアニメーターが画を仕上げ、スタジオはUnreal Engine 5、CLIP STUDIO PAINT、通常のAdobe製品も併用しています。",
        "見るべき理由は、流通面で証明したことにあります。日本の放送局がAIの使用を明示したうえで電波に乗せた。それ以前に誰もやっていませんでした。",
      ],
      aiRoleLabel: "AIが担当していること",
      aiRole:
        "背景美術とキャラクターイラストの生成。仕上げはアニメーターが行い、脚本、声の演技、演出は従来どおりです。",
    },
    {
      rank: 3,
      title: "Anipopsのオリジナル作品",
      meta: "2026年 · 日本 · ピクスタ · ショート配信",
      verdict: "AI制作のオリジナル作品で構成された、日本初の有料配信サービス。",
      paragraphs: [
        "ピクスタは2026年8月12日、自社のAIスタジオによるオリジナル5作品を揃えたショート配信プラットフォームとしてAnipopsをリニューアルしました。ラインナップにはモンスターバトルファンタジーのMorks、時代劇のBells of the Oni、そして社畜生活に燃え尽きて田舎へ移住し、野良猫の配信でバズる日常系作品が含まれます。",
        "Anipopsは2026年3月、個人クリエイターが自作のAIアニメを投稿する場として始まりました。その機能はAnipops Creatorsへ移り、本体は企画、脚本、アニメーションまで社内で完結するスタジオ作品の配信になっています。",
        "AIアニメをフィードで無料で見るのではなく、月額を払って見る人がいるのか。その最初の本格的なテストです。答えが出るのは1年後でしょう。",
      ],
      aiRoleLabel: "AIが担当していること",
      aiRole:
        "企画と脚本からアニメーションまで、社内パイプライン全体に入っています。スマートフォン向けの短尺エピソードが対象です。",
    },
    {
      rank: 4,
      title: "The Dog & the Boy（犬と少年）",
      meta: "2023年 · 日本 · Netflix Anime Creators Base、WIT STUDIO、rinna · 3分",
      verdict: "議論の火をつけた短編。",
      paragraphs: [
        "少年とロボット犬の物語で、監督は牧原亮太郎。2023年1月31日にYouTubeで公開されました。背景はまずコンセプトアートとして描かれ、AIモデルを何度か通したうえで、最後に手で修正されています。",
        "クレジットで背景デザインが「AI + Human」と表記されました。作品そのものより、この1行が記憶されています。プロのアニメーターからの反発は即座で、争点は絵ではなく雇用でした。Netflixがこの実験を背景美術の人手不足への対応として説明したことも、火に油を注ぎました。",
        "3分の作品です。物語としてではなく、歴史の目印としてその3分を使う価値があります。",
      ],
      aiRoleLabel: "AIが担当していること",
      aiRole:
        "背景美術のみ。手描きのコンセプトから生成し、アーティストが修正しています。キャラクターとアニメーションは従来どおりです。",
    },
    {
      rank: 5,
      title: "Anime Rock, Paper, Scissors",
      meta: "2023年 · アメリカ · Corridor Digital · 7分",
      verdict: "AI動画という言葉を知る前に、多くの人が見てしまった作品。",
      paragraphs: [
        "友人二人が、ばかばかしいほど大げさなじゃんけん勝負をします。そして面白い。Corridorは実写で俳優を撮影し、Stable Diffusionと、Vampire Hunter D: Bloodlustで学習させたDreamBoothモデルで全フレームを描き直しました。背景はUnreal Engineで構築され、8日間で200万回再生を超えています。",
        "特定の映画で許諾なくモデルを学習させたこと、それこそがプロのアニメーターを臨戦態勢にさせた行為であり、3年経った今もこの議論の基準点であり続けています。",
        "技術的には生成よりロトスコープに近く、だからこそ動きが、その後に出てきた多くの映像よりまだ持ちこたえています。",
      ],
      aiRoleLabel: "AIが担当していること",
      aiRole:
        "実写映像をアニメ調にフレーム単位で描き直します。演技、間、カメラは撮影されたもので、生成ではありません。",
    },
    {
      rank: 6,
      title: "ViduとAura ProductionsのSFシリーズ",
      meta: "2025年 · アメリカと中国 · Aura ProductionsとVidu · 全50話",
      verdict: "物量での勝負。1話1分から2分を50本。",
      paragraphs: [
        "2025年3月の香港フィルマートで発表された企画で、生数科技（ShengShu Technology）の動画モデルViduだけで生成した50本の短編SFエピソードを、SNSで配信します。Aura Productionsは、プロデューサーのLuo YanとD.T. Carpenterが設立したロサンゼルスのスタジオです。",
        "興味深いのは形式の選択です。長編1本ではなく、縦型に向いた短編を少しずつ流す設計で、キャラクターをカット間で保つためにViduの複数被写体の一貫性機能に頼っています。",
        "短尺のAIアニメが物珍しさではなく視聴習慣になるとしたら、その出発点はおおよそここです。",
      ],
      aiRoleLabel: "AIが担当していること",
      aiRole:
        "映像を最初から最後まで生成します。人間の仕事は脚本、カット設計、編集に集中しています。",
    },
  ],
  sections: [
    {
      heading: "アニメ制作のどこにAIが入るのか",
      paragraphs: [
        "AIアニメという言葉は少なくとも4つの別物を指しており、それを混ぜているせいでネット上の議論が噛み合いません。",
      ],
      list: [
        "背景支援：人間が描き、モデルが反復し、アーティストが修正する。The Dog & the Boy。",
        "カット支援：モデルが作画の大半を出し、アニメーターが仕上げる。Twins Hinahima。",
        "実写へのスタイル転写：本物の俳優、描き直したフレーム。Anime Rock, Paper, Scissors。",
        "直接生成：動画モデルから出たカットをつないで編集する。Lost Garden、Anipops、ViduとAura。",
      ],
      trailingParagraphs: [
        "4つのどれも、そのシーンが何を語るのかを決める人間を不要にはしません。その判断が今も仕事の本体であり、ネット上の生成映像の大半が見るに堪えない理由でもあります。",
      ],
    },
    {
      heading: "100%AIで作られたアニメはあるのか",
      paragraphs: [
        "ありません。そう売り込んでくる相手は疑ってください。全フレームを生成している作品でも、物語を選び、台詞を書き、40テイクのどれが使えるかを決め、編集のリズムを作るのは人間です。",
        "本当に変わったのは下限です。17分のアニメーションを作るにはスタジオと予算が必要でした。今は1人が1年で作れます。このリストで最も興味深い作品が、最も小さなチームである理由もそこにあります。",
      ],
    },
  ],
  productionHeading: "Lost Gardenの制作方法",
  productionParagraphs: [
    "まず脚本があり、それはScreenWeaverで手で書かれます。ScreenWeaverはその脚本からシーンごとに絵コンテを生成します。",
    "画像と動画の生成はImaginodeで動いています。Frank Houbreが自ら作ったAI制作プラットフォームで、多数の画像モデルと動画モデルを1つのノードキャンバスの裏にまとめています。おかげでツールを変えずに同じカットを複数のモデルで試せて、キャラクターのリファレンスがそれを使うカットの隣に置かれたままになります。これは単一モデルの選択より重要です。ソルの鎧とローズの顔を1話のあいだ安定させるのは、プロンプトの問題ではなくパイプラインの問題だからです。",
    "編集、テンポ、音の選択、そしてエピソードに何を残すかという判断はすべて人間が行います。設定資料と矛盾する生成カットは切られますし、実際かなりの数が切られます。",
  ],
  productionLinks: [
    { label: "カットを支えるプラットフォーム、Imaginode", href: "https://imaginode.ai" },
    { label: "制作ノート全文を読む", href: "/process" },
  ],
  faqHeading: "よくある質問",
  faq: [
    {
      question: "今いちばん見るべきAIアニメはどれですか。",
      answer:
        "完結した物語ならLost Gardenの第1話。Frank Houbreによる17分のインディー・ダークファンタジーです。放送作品ならTwins Hinahima。2025年3月に日本のテレビで放送され、約95%のカットに生成AIが使われています。",
    },
    {
      question: "100%AIで作られたアニメはありますか。",
      answer:
        "ありません。全フレームをAIで生成する作品はありますが、物語を書き、使えるテイクを選び、エピソードを編集するのは今も人間です。完全自動をうたう企画は、たいてい連続した物語のないクリップ集です。",
    },
    {
      question: "最初にAIを使ったアニメは何ですか。",
      answer:
        "2023年1月31日にNetflix Anime Creators BaseがWIT STUDIO、rinnaと共にYouTubeで公開したThe Dog & the Boyが、AI生成の背景美術をクレジットした最初の広く見られたアニメ作品です。",
    },
    {
      question: "AIアニメがテレビで放送されたことはありますか。",
      answer:
        "あります。フロンティアワークスとKaKa Creationが制作したTwins Hinahimaが、2025年3月28日にTOKYO MX、翌日にMBSで放送されました。",
    },
    {
      question: "1人でAIアニメを作れますか。",
      answer:
        "作れます。Lost Gardenがその証拠です。第1話は1人で執筆、演出、制作、編集され、脚本と絵コンテにScreenWeaver、画像と動画の生成にImaginodeを使っています。",
    },
    {
      question: "Lost Gardenはどこで見られますか。",
      answer:
        "第1話はYouTubeと本サイトの第1話ページで無料公開中です。第2話は制作中です。",
    },
  ],
  sourcesHeading: "出典",
  sourcesNote:
    "他の5作品に関する情報は以下の公開記事に基づきます。Lost Gardenに関する情報は制作側によるものです。",
  sources: [
    {
      label: "Anime News Network, フロンティアワークスとKaKa CreationがTwins Hinahimaを発表",
      href: "https://www.animenewsnetwork.com/news/2024-12-14/frontier-works-kaka-creation-reveal-twins-hinahima-ai-anime/.219056",
    },
    {
      label: "Anime Corner, ピクスタが新スタジオとオリジナル5作品でAnipopsをリニューアル",
      href: "https://animecorner.me/pixtas-japanese-short-form-ai-anime-platform-anipops-launches-with-new-studio-and-5-original-series/",
    },
    {
      label: "Anime News Network, WIT STUDIOがAI生成背景でThe Dog & the Boyを制作",
      href: "https://www.animenewsnetwork.com/interest/2023-02-02/wit-studio-produces-the-dog-and-the-boy-anime-short-with-ai-generated-backgrounds/.194426",
    },
    {
      label: "Anime News Network, No, You Cannot Make Anime with AI",
      href: "https://www.animenewsnetwork.com/feature/2023-03-15/no-you-cant-make-anime-with-ai/.195921",
    },
    {
      label: "Variety, Aura ProductionsがViduと組みAIアニメシリーズを制作",
      href: "https://variety.com/2025/digital/news/luo-yan-aura-productions-vidu-ai-anime-series-1236338232/",
    },
  ],
  relatedHeading: "続けて読む",
  relatedLinks: [
    { label: "AIでアニメを作る手順", href: "/how-to-make-ai-anime" },
    { label: "カットをまたいでキャラクターを保つ方法", href: "/ai-character-consistency" },
    { label: "Lost Gardenの作り方を詳しく", href: "/process" },
    { label: "第1話を見る", href: "/episode-1" },
    { label: "作品の背景にある作家のビジョン", href: "/vision" },
    { label: "プレス・メディアキット", href: "/press" },
  ],
};
