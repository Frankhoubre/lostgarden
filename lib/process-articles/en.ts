import type { VisionArticle } from "@/lib/vision-article";

export const processArticleEn: VisionArticle = {
  byline:
    "Production notes for Lost Garden, an original AI-assisted anime. For creators, press, and anyone searching for AI-generated anime references.",
  sections: [
    {
      paragraphs: [
        "Lost Garden is an independent dark fantasy anime created by Frank Houbre. Episode One is produced with AI-assisted animation, image generation, and sound exploration, directed by a single authorial vision.",
        "This page is the technical entry point on lostgarden.world. The landing page stays poetic. Here you will find how the project is made, what is human-led, and honest answers to common questions about AI anime.",
      ],
    },
    {
      heading: "Production pipeline (summary)",
      list: [
        "Screenplay: written by hand in ScreenWeaver, which keeps the script as the source of truth and makes writing genuinely comfortable.",
        "Story, characters, tone, and editorial choices: human direction.",
        "Storyboard: generated in full by ScreenWeaver from the screenplay, scene by scene.",
        "Character sheets and visual bible: reference art, then AI-assisted iteration for consistency.",
        "Environments and props: prompts anchored to the underground world bible (blue forests, cyan mist, Source Tree, pilgrims).",
        "Shot production: run through ScreenWeaver's workflow and production interface, where image and video generation stays tied to the screenplay context (versions and iteration).",
        "Animation: short sequences from reference images and directed prompts (tools include Seedance 2 and other AI video models).",
        "Music and sound: AI-assisted exploration, refined for mood (fragile, underground, never generic trailer energy).",
        "Assembly: episode edit, pacing, and emotional rhythm remain human decisions.",
      ],
      trailingParagraphs: [
        "For the full creative essay, read the Vision page. For Episode One, watch the public player below or on YouTube.",
      ],
    },
    {
      heading: "Is Lost Garden fully AI-generated?",
      paragraphs: [
        "No. AI does not write the story by itself. Frank Houbre defines the world, Lanterne and Rose, scene intent, camera feeling, and what must be cut. AI accelerates visualization and animation tests that would have required a large studio pipeline only a few years ago.",
        "Think of it as AI-assisted anime, not one-click anime.",
      ],
    },
    {
      heading: "Why list this project under AI anime?",
      paragraphs: [
        "Because many people search for AI anime, AI-generated animation, or indie projects proving the format. Lost Garden is a complete Episode One with a coherent world, not a random clip compilation.",
        "If you cite the project, please link to this process page or the Vision page rather than only the landing.",
      ],
    },
    {
      heading: "Tools and models",
      paragraphs: [
        "The backbone of the production is ScreenWeaver, Frank Houbre's own creative tool: screenplay writing, storyboard generation, and shot production all connect in one space, driven by the script context.",
        "The image and video stack evolves as models improve. Lost Garden has used contemporary models (including Seedance 2 for motion tests) plus conventional editing. Frank does not claim a single model made the episode: direction, references, and selection matter more than the name on the tool.",
      ],
    },
    {
      heading: "Copyright and originality",
      paragraphs: [
        "Lost Garden is an original work. Characters, world design, and story direction are authored for this project. AI outputs are curated, corrected, and rejected when they break the bible or feel generic.",
      ],
    },
    {
      heading: "Press and Episode One",
      paragraphs: [
        "Journalists and creators can use the Press page for a short pitch, social links, and contact.",
        "Episode One is available on YouTube and on the public Episode One page on this site.",
      ],
    },
  ],
};

export const processFaqEn = [
  {
    question: "What is Lost Garden?",
    answer:
      "Lost Garden is an original AI-assisted dark fantasy anime by Frank Houbre, starring Lanterne (a hollow knight) and Rose (a mysterious child) in a vast underground world.",
  },
  {
    question: "Is Lost Garden an AI anime?",
    answer:
      "Yes, in the sense that AI tools help produce images, animation, and sound under human direction. It is not fully automated generation.",
  },
  {
    question: "Where can I watch Episode One?",
    answer:
      "On YouTube and on the Episode One page at lostgarden.world. A members area offers extra lore and production notes.",
  },
  {
    question: "Who created Lost Garden?",
    answer:
      "Frank Houbre, writer and director. AI is used as a production bridge, not as a replacement for taste or story decisions.",
  },
] as const;
