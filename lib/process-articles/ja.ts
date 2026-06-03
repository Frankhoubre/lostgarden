import type { VisionArticle } from "@/lib/vision-article";

export const processArticleJa: VisionArticle = {
  byline:
    "AI支援アニメ「Lost Garden」の制作メモ。クリエイター・メディア・「AIアニメ」で検索する方向け。",
  sections: [
    {
      paragraphs: [
        "Lost GardenはFrank Houbreによるインディーズのダークファンタジーアニメです。第1話はAI支援のアニメーション・画像・音響探索で制作され、一つの作者ビジョンのもとで監督されています。",
        "このページはlostgarden.world上の技術的な入口です。トップは詩的なままです。制作の仕組み、人間が担う部分、AIアニメに関するよくある質問への回答をまとめています。",
      ],
    },
    {
      heading: "制作パイプライン（概要）",
      list: [
        "ストーリー・キャラ・トーン・編集判断：人間のディレクション。",
        "キャラクターシートとビジュアルバイブル：参照画とAI反復で一貫性を確保。",
        "背景・小道具：地下世界のバイブルに沿ったプロンプト。",
        "アニメーション：参照画像と指示付きプロンプトから短いシーケンス（Seedance 2などのAI動画モデル）。",
        "音楽・効果音：AI探索のあとムードで精査。",
        "編集：テンポと感情のリズムは人間が決定。",
      ],
      trailingParagraphs: [
        "創作の長文はVisionページへ。第1話は公開プレイヤーまたはYouTubeで。",
      ],
    },
    {
      heading: "完全にAI生成ですか？",
      paragraphs: [
        "いいえ。AIが単独で物語を書くわけではありません。Frank Houbreが世界、SolとRose、シーンの意図、カットを定義します。AIは数年前なら大規模スタジオが必要だった可視化とアニメテストを加速します。",
        "ワンクリックアニメではなく、AI支援アニメと考えてください。",
      ],
    },
    {
      heading: "なぜAIアニメとして紹介するのか",
      paragraphs: [
        "AIアニメ・AI生成アニメ・インディー事例を探す人が多いからです。Lost Gardenはランダムな切り抜きではなく、一貫した世界観の第1話です。",
        "引用するときはランディングだけでなく、このprocessページかVisionページへのリンクをお願いします。",
      ],
    },
    {
      heading: "ツールとモデル",
      paragraphs: [
        "スタックはモデルの進化に合わせて更新されます。現行の画像・動画モデル（モーションテストにSeedance 2など）と従来の編集を併用しています。一つのモデルが全編を作ったわけではなく、ディレクションと選別が重要です。",
      ],
    },
    {
      heading: "著作権とオリジナリティ",
      paragraphs: [
        "Lost Gardenはオリジナル作品です。キャラ・世界・物語は本プロジェクト用に設計されています。バイブルに反する出力は修正または却下します。",
      ],
    },
    {
      heading: "プレスと第1話",
      paragraphs: [
        "メディア・クリエイター向けにPressページで短いピッチと連絡先を公開しています。",
        "第1話はYouTubeと本サイトのEpisode One公開ページで視聴できます。",
      ],
    },
  ],
};

export const processFaqJa = [
  {
    question: "Lost Gardenとは？",
    answer:
      "Frank HoubreによるオリジナルのAI支援ダークファンタジーアニメ。空洞の騎士Solと謎の子Roseが地下世界を旅します。",
  },
  {
    question: "AIアニメですか？",
    answer:
      "人間の監督のもと、AIが画像・アニメ・音を支援する意味でははい。完全自動生成ではありません。",
  },
  {
    question: "第1話はどこで見られますか？",
    answer:
      "YouTubeとlostgarden.worldのEpisode Oneページ。会員エリアには追加のロアと制作ノートがあります。",
  },
  {
    question: "誰が作りましたか？",
    answer:
      "Frank Houbre。AIは制作の橋であり、趣味や物語判断の代わりではありません。",
  },
] as const;
