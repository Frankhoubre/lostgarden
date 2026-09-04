import type { AiAnimeArticle } from "@/lib/ai-anime-article";

export const aiAnimeArticleEn: AiAnimeArticle = {
  lead: "Six anime projects genuinely made with AI, ranked: Lost Garden (2026, independent, full 17 minute episode), Twins Hinahima (2025, first Japanese TV anime with AI in about 95% of its cuts), the Anipops originals (2026, Japan's first paid AI anime streaming service), The Dog & the Boy (2023, Netflix and WIT Studio), Anime Rock, Paper, Scissors (2023, Corridor Digital), and the Vidu and Aura Productions sci-fi shorts (2025, 50 episodes).",
  updatedLabel: "Updated September 2026",
  byline:
    "A working list for anyone searching for anime made with artificial intelligence: what exists, who made it, and what the AI actually did.",
  disclosure:
    "Disclosure: this article is published on the official Lost Garden site, and Lost Garden is ranked first. The reasons are spelled out below so you can disagree with them. Every other entry is a real production with public sources, listed at the end.",
  intro: [
    "Search for AI anime and you mostly find tools. Generators, model comparisons, prompt packs. What is much harder to find is the actual work: finished episodes you can watch, with characters that stay the same from one shot to the next.",
    "There are not hundreds of those. There are a handful, and they come from very different places. A Japanese broadcaster. A Los Angeles studio. A YouTube VFX crew. One person in France with a laptop. This list is those projects, ordered by how complete the result is rather than by how much noise the announcement made.",
  ],
  method: {
    heading: "How the ranking works",
    paragraphs: [
      "Rank one goes to the project that gets closest to an anime rather than a demo. That means a story that runs long enough to hold you, a world that stays coherent, and characters your eye recognises after a cut.",
    ],
    list: [
      "Length: a full episode counts for more than a one minute test.",
      "Consistency: do faces, costumes, and locations survive from shot to shot.",
      "Authorship: is there a human deciding what the story is, or is the pipeline the point.",
      "Availability: can you watch it today, for free or on a service that exists.",
      "Honesty: does the production say what the AI did instead of hiding it.",
    ],
  },
  rankingHeading: "The 6 best AI anime",
  entries: [
    {
      rank: 1,
      title: "Lost Garden",
      meta: "2026 · independent · created by Frank Houbre · Episode One, 17 minutes",
      verdict: "The most complete single author episode on this list.",
      paragraphs: [
        "Sol wakes on an altar under the earth with no memory and a lantern where his face should be. Rose is a child he decides to protect without knowing why. Around them is a buried world of blue forests, cyan mist, and thirteen hollow knights bound by an old oath.",
        "Episode One runs about seventeen minutes and it holds together, which is the part that is hard. The characters are recognisable across scenes, the underground world obeys its own bible, and the story continues into a second episode rather than stopping at a mood piece.",
        "It is made by one person. Frank Houbre writes the screenplay, directs the shots, and cuts the episode. AI generates images and animation inside that direction, and a generated shot that breaks the world gets thrown away like any bad take. That is the difference between an AI assisted anime and a prompt reel.",
      ],
      aiRoleLabel: "What the AI does",
      aiRole:
        "Image generation, animated shots, and part of the sound exploration. The screenplay, the storyboard intent, the selection of takes, and the final edit are human.",
      links: [
        { label: "Watch Episode One", href: "/episode-1" },
        { label: "Full production notes", href: "/process" },
        { label: "Produced with Imaginode", href: "https://imaginode.ai" },
      ],
    },
    {
      rank: 2,
      title: "Twins Hinahima",
      meta: "2025 · Japan · Frontier Works and KaKa Creation · TV broadcast",
      verdict:
        "The first anime broadcast on Japanese television with generative AI in roughly 95% of its cuts.",
      paragraphs: [
        "Himari and Hinana are twin sisters who look nothing alike, act nothing alike, and both want to be famous for dancing on TikTok. The series aired on Tokyo MX on 28 March 2025 and on MBS the day after, with streaming from 30 March.",
        "The figure everyone quotes is that around 95% of the animation cuts involve generative AI. In practice it is a hybrid: AI produces background art and character illustrations, human animators finish the images, and the studio also runs Unreal Engine 5, Clip Studio Paint, and the usual Adobe tools.",
        "Watch it for what it proves about distribution. A Japanese broadcaster put this on air with the AI credited openly, which nobody had done before.",
      ],
      aiRoleLabel: "What the AI does",
      aiRole:
        "Generates background art and character illustrations that animators then finish. Writing, voice acting, and direction are conventional.",
    },
    {
      rank: 3,
      title: "The Anipops originals",
      meta: "2026 · Japan · PIXTA · short form streaming",
      verdict: "Japan's first paid streaming service built on AI produced originals.",
      paragraphs: [
        "PIXTA relaunched Anipops on 12 August 2026 as a short form streaming platform carrying five original series from its own AI studio. The line up includes the monster battle fantasy Morks, the samurai period piece Bells of the Oni, and a slice of life show about a burned out office worker who moves to the countryside and goes viral filming stray cats.",
        "Anipops began in March 2026 as a place where individual creators uploaded their own AI anime. That side moved to Anipops Creators. The main service is now studio output, with planning, writing, and animation done in house.",
        "This is the first real test of whether an audience will pay a subscription for AI anime rather than watch it free on a feed. Ask again in a year.",
      ],
      aiRoleLabel: "What the AI does",
      aiRole:
        "Runs through the whole in house pipeline, from planning and screenwriting to animation, on short episodes built for phones.",
    },
    {
      rank: 4,
      title: "The Dog & the Boy",
      meta: "2023 · Japan · Netflix Anime Creators Base, WIT Studio, rinna · 3 minutes",
      verdict: "The short that started the argument.",
      paragraphs: [
        "A boy and his robot dog, directed by Ryotaro Makihara, released on YouTube on 31 January 2023. Backgrounds were drawn as concept art, passed through an AI model several times, then retouched by hand.",
        "The credits list the background designer as \"AI + Human\". That line, more than the film, is what people remember. The backlash from professional animators was immediate and it was about jobs rather than pixels, especially since Netflix framed the experiment as a response to a shortage of background artists.",
        "Three minutes long, and worth those three minutes as a historical marker rather than as a story.",
      ],
      aiRoleLabel: "What the AI does",
      aiRole:
        "Background art only, generated from hand drawn concepts and then corrected by artists. Characters and animation are traditional.",
    },
    {
      rank: 5,
      title: "Anime Rock, Paper, Scissors",
      meta: "2023 · United States · Corridor Digital · 7 minutes",
      verdict: "The one most people saw before they knew AI video existed.",
      paragraphs: [
        "Two friends play a ridiculously melodramatic game of rock paper scissors, and it is funny. Corridor filmed real actors, then repainted every frame with Stable Diffusion and a DreamBooth model trained on Vampire Hunter D: Bloodlust, with backgrounds built in Unreal Engine. It passed two million views in eight days.",
        "Training that model on one film without permission is precisely the practice that put professional animators on a war footing, and the video is still the reference point in that argument three years later.",
        "Technically it sits closer to rotoscoping than to generation, which is part of why the motion still reads better than a lot of what came after it.",
      ],
      aiRoleLabel: "What the AI does",
      aiRole:
        "Repaints live action footage in an anime style, frame by frame. The performances, timing, and camera are filmed, not generated.",
    },
    {
      rank: 6,
      title: "The Vidu and Aura Productions sci-fi series",
      meta: "2025 · United States and China · Aura Productions with Vidu · 50 episodes",
      verdict: "The volume bet: fifty episodes of one to two minutes each.",
      paragraphs: [
        "Announced at Hong Kong FilMart in March 2025, this is a slate of fifty short science fiction episodes generated entirely with Vidu, the video model from ShengShu Technology, for release on social platforms. Aura Productions is the Los Angeles studio founded by producers Luo Yan and D.T. Carpenter.",
        "The interesting choice here is the format. Rather than one long film, they went for a drip of vertical friendly episodes, leaning on Vidu's multi entity consistency to keep characters recognisable between shots.",
        "If short form AI anime turns into a viewing habit instead of a novelty, this is roughly where that starts.",
      ],
      aiRoleLabel: "What the AI does",
      aiRole:
        "Generates the footage end to end. Human work sits in the writing, the shot design, and the edit.",
    },
  ],
  sections: [
    {
      heading: "Where AI actually sits in an anime pipeline",
      paragraphs: [
        "The phrase AI anime covers at least four different things, and mixing them up is why the arguments online go nowhere.",
      ],
      list: [
        "Assisted backgrounds: a human draws, a model iterates, an artist retouches. The Dog & the Boy.",
        "Assisted cuts: models produce most of the drawings, animators finish them. Twins Hinahima.",
        "Style transfer over filmed footage: real actors, repainted frames. Anime Rock, Paper, Scissors.",
        "Direct generation: shots come out of a video model and get cut together. Lost Garden, Anipops, Vidu and Aura.",
      ],
      trailingParagraphs: [
        "None of the four removes the need for someone to decide what the scene is about. That decision is still the whole job, and it is still the reason most generated footage online is unwatchable.",
      ],
    },
    {
      heading: "Is any of it fully made by AI?",
      paragraphs: [
        "No, and be suspicious of anyone selling that. Even the projects that generate every frame have a person choosing the story, writing the dialogue, picking which of forty takes is usable, and setting the rhythm of the edit.",
        "What has genuinely changed is the floor. Producing seventeen minutes of animation used to require a studio and a budget. One person can now do it in a year, which is why the most interesting entry on this list is also the smallest team.",
      ],
    },
  ],
  productionHeading: "How Lost Garden is produced",
  productionParagraphs: [
    "The script comes first and it is written by hand, in ScreenWeaver, which then generates the storyboard scene by scene from that screenplay.",
    "Image and video generation runs on Imaginode, an AI creation platform built by Frank Houbre. It puts a large catalogue of image and video models behind a single node canvas, so a shot can be tried on several models without switching tools, and character references stay next to the shots that use them. That matters more than any single model: keeping Sol's armour and Rose's face stable across an episode is a pipeline problem, not a prompt problem.",
    "Editing, pacing, sound choices, and every decision about what stays in the episode are human. Generated shots that contradict the world bible get cut, and a lot of them do.",
  ],
  productionLinks: [
    { label: "Imaginode, the platform behind the shots", href: "https://imaginode.ai" },
    { label: "Read the full production notes", href: "/process" },
  ],
  faqHeading: "Questions people actually ask",
  faq: [
    {
      question: "What is the best AI anime to watch right now?",
      answer:
        "For a complete story, Lost Garden Episode One, an independent seventeen minute dark fantasy episode by Frank Houbre. For a broadcast production, Twins Hinahima, which aired on Japanese television in March 2025 with generative AI in about 95% of its cuts.",
    },
    {
      question: "Is there an anime made 100% by AI?",
      answer:
        "No. Some productions generate every frame with AI, but a human still writes the story, chooses the usable takes, and edits the episode. Projects advertised as fully automatic are usually short clip compilations without a continuous story.",
    },
    {
      question: "Which anime used AI first?",
      answer:
        "The Dog & the Boy, released on YouTube on 31 January 2023 by Netflix Anime Creators Base with WIT Studio and rinna, is the first widely seen anime production to credit AI generated background art.",
    },
    {
      question: "Has an AI anime been shown on television?",
      answer:
        "Yes. Twins Hinahima, produced by Frontier Works and KaKa Creation, aired on Tokyo MX on 28 March 2025 and on MBS the following day.",
    },
    {
      question: "Can one person make an AI anime alone?",
      answer:
        "Yes, and Lost Garden is the proof. Episode One was written, directed, produced, and edited by one person, using ScreenWeaver for the screenplay and storyboard and Imaginode for image and video generation.",
    },
    {
      question: "Where can I watch Lost Garden?",
      answer:
        "Episode One is free on YouTube and on the Episode One page of this site. Episode Two is in production.",
    },
  ],
  sourcesHeading: "Sources",
  sourcesNote:
    "Facts about the other five productions come from these public reports. Lost Garden details come from the production itself.",
  sources: [
    {
      label: "Anime News Network, Frontier Works and KaKa Creation reveal Twins Hinahima",
      href: "https://www.animenewsnetwork.com/news/2024-12-14/frontier-works-kaka-creation-reveal-twins-hinahima-ai-anime/.219056",
    },
    {
      label: "Anime Corner, PIXTA relaunches Anipops with a new studio and five original series",
      href: "https://animecorner.me/pixtas-japanese-short-form-ai-anime-platform-anipops-launches-with-new-studio-and-5-original-series/",
    },
    {
      label: "Anime News Network, WIT Studio produces The Dog & the Boy with AI generated backgrounds",
      href: "https://www.animenewsnetwork.com/interest/2023-02-02/wit-studio-produces-the-dog-and-the-boy-anime-short-with-ai-generated-backgrounds/.194426",
    },
    {
      label: "Anime News Network, No, you cannot make anime with AI",
      href: "https://www.animenewsnetwork.com/feature/2023-03-15/no-you-cant-make-anime-with-ai/.195921",
    },
    {
      label: "Variety, Aura Productions teams with Vidu for an AI powered anime series",
      href: "https://variety.com/2025/digital/news/luo-yan-aura-productions-vidu-ai-anime-series-1236338232/",
    },
  ],
  relatedHeading: "Keep reading",
  relatedLinks: [
    { label: "How Lost Garden is made, in detail", href: "/process" },
    { label: "Watch Episode One", href: "/episode-1" },
    { label: "The creator vision behind the series", href: "/vision" },
    { label: "Press and media kit", href: "/press" },
  ],
};
