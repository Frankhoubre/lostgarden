import type { Guide, GuideSlug } from "@/lib/guide-article";

const howToMakeAiAnime: Guide = {
  article: {
    byline:
      "The pipeline behind Lost Garden Episode One, seventeen minutes of animation made by one person. Written for people who want to try it, not for people who want to be sold a tool.",
    sections: [
      {
        paragraphs: [
          "Most guides on this subject are tool reviews wearing a tutorial costume. This one is the order of operations that actually produced a finished episode, including the parts that waste the most time.",
          "The short version: the script is the constraint, not the model. Everything below follows from that.",
        ],
      },
      {
        heading: "1. Write the script before you open any generator",
        paragraphs: [
          "The temptation is to generate a beautiful shot first and build a story around it. That path produces a mood reel, never an episode. A shot that exists before the scene has nothing to serve, and you will keep it out of attachment rather than usefulness.",
          "Write scenes with intent. What does this scene change. What does the viewer know at the end that they did not know at the start. If a scene fails that test on paper, no amount of generation saves it.",
          "On Lost Garden the screenplay is written by hand in ScreenWeaver, which keeps the script as the single source of truth for everything downstream.",
        ],
      },
      {
        heading: "2. Build the world bible before the first image",
        paragraphs: [
          "A bible is a short document that fixes what cannot change: the light, the palette, the materials, the rules of the place. For the underground world of Lost Garden that means blue forests, cyan mist, wet stone, no sunlight, ever.",
          "This is not worldbuilding for pleasure. It is the reference you check a generated shot against, and it is the reason you can say no to an image that looks good and belongs to a different film.",
        ],
        callouts: [
          "A world bible is a rejection tool. Its value is measured in shots you throw away.",
        ],
      },
      {
        heading: "3. Storyboard from the script, scene by scene",
        paragraphs: [
          "Storyboarding is where you find out that half your scenes have no camera. A page of dialogue is not a sequence until someone decides where to stand.",
          "Generated boards are fine at this stage, because you are deciding framing and rhythm, not final art. What matters is that every shot in the board has a reason: what it shows, why it comes after the previous one, how long it needs to be.",
        ],
      },
      {
        heading: "4. Lock your characters before you generate a single shot",
        paragraphs: [
          "This is the step everyone skips, and it is the one that decides whether your episode reads as a film or as a slideshow of similar-looking strangers.",
          "Build a reference set per character: face, full body, silhouette, the two or three angles you will actually use. Keep those references next to the shots that use them rather than in a folder you forget. Consistency is a pipeline problem, not a prompting problem, and it is covered in its own guide.",
        ],
      },
      {
        heading: "5. Generate shots, and expect to throw most of them away",
        paragraphs: [
          "The realistic ratio is uncomfortable. Many shots need several attempts, some need a dozen, and some scenes get rewritten because the shot they need does not exist yet at any quality.",
          "Two habits save the most time. Generate at the length the edit needs rather than the length the model offers, because long generated shots drift and you will cut them down anyway. And judge a take against the bible before you judge it against your taste.",
          "On Lost Garden the image and video generation runs on Imaginode, which puts a large catalogue of models behind one canvas. The point is not model choice, it is being able to try the same shot on several models without rebuilding the setup each time.",
        ],
      },
      {
        heading: "6. Cut like an editor, not like a prompter",
        paragraphs: [
          "An edit is where an AI-assisted film either becomes a film or stays a collection of clips. Pacing, holds, when to stay on a face, when to cut away before the viewer notices a flaw: none of that comes out of a model.",
          "Cutting on movement hides a lot of drift. So does trusting a shorter shot. The instinct to hold on a beautiful generated frame is almost always wrong.",
        ],
      },
      {
        heading: "7. Sound is half the film and it is the half people skip",
        paragraphs: [
          "Footsteps on wet stone, the creak of empty armor, distance in a cavern. Sound is what convinces the viewer that the space is real, and it does more for that than any resolution increase.",
          "Music last, and less of it than you think. A generated score under every scene flattens the episode into a trailer.",
        ],
      },
      {
        heading: "What it actually costs",
        paragraphs: [
          "Time, mostly. Episode One of Lost Garden runs seventeen minutes and was written, directed, generated, edited and finished by one person. That is possible now and it was not possible three years ago, which is the genuinely new thing.",
          "It is not fast. Anyone promising a finished episode in a weekend is selling a demo.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "What is the minimum I need to start?",
      answer:
        "A script, a world bible, and a reference set for each character. The generation tools matter far less than those three documents, and starting without them is the most common reason projects stall.",
    },
    {
      question: "Which AI model should I use for anime?",
      answer:
        "The one that holds your character references best, which changes every few months. Pick a setup that lets you try the same shot on several models rather than committing to one, and judge on consistency rather than on the prettiest single frame.",
    },
    {
      question: "How long does an AI anime episode take to make?",
      answer:
        "For a seventeen minute episode made by one person, count in months, not weekends. Most of that time goes to rejected shots and to the edit, not to prompting.",
    },
    {
      question: "Do I need to know how to draw?",
      answer:
        "No, but you need to know how to look. The skill that matters is deciding what is wrong with a shot and why, which is closer to directing and editing than to drawing.",
    },
  ],
  related: [
    { label: "Is AI anime really anime?", href: "/is-ai-anime-real-anime" },
    { label: "AI anime vs traditional animation", href: "/ai-anime-vs-traditional-animation" },
    { label: "Keeping a character consistent across shots", href: "/ai-character-consistency" },
    { label: "The 6 best AI anime, ranked", href: "/best-ai-anime" },
    { label: "Lost Garden production notes", href: "/process" },
    { label: "Imaginode, the generation platform used", href: "https://imaginode.ai" },
  ],
};

const characterConsistency: Guide = {
  article: {
    byline:
      "Why generated characters drift between shots, and the working methods that keep a face recognisable across a seventeen minute episode.",
    sections: [
      {
        paragraphs: [
          "This is the problem that stops most AI animation projects. A single shot looks incredible. Two shots side by side look like two different people wearing the same costume, and the illusion collapses.",
          "There is no setting that fixes it. There are habits that reduce it to something an edit can absorb.",
        ],
      },
      {
        heading: "Why prompts alone always fail",
        paragraphs: [
          "A written description is a very low bandwidth way to specify a face. Silver hair, green eyes and a scar describes thousands of different people, and a model will happily give you a new one each time.",
          "Adding adjectives makes this worse, not better. Longer prompts drift further, because each extra term is another thing the model can weight differently between runs.",
        ],
        callouts: [
          "Every detail you specify in words instead of in an image is a detail that will change between shots.",
        ],
      },
      {
        heading: "Reference images beat descriptions, always",
        paragraphs: [
          "Build one reference set per character and reuse it everywhere: a clean face at eye level, a full body, a silhouette, and the specific angles your storyboard actually calls for. Three quarter view and profile are worth the effort because they are where most drift shows up.",
          "Keep those references inside the same workspace as the shots that use them. On Lost Garden that is what Imaginode is doing in the pipeline: a node canvas where a character reference sits next to every shot it feeds, rather than in a folder nobody reopens.",
        ],
      },
      {
        heading: "Design for consistency in the first place",
        paragraphs: [
          "The characters that survive generation are the ones with a readable silhouette and a small number of hard features. Lanterne is an empty armor with a lantern for a head. That shape is recognisable at any size, in any light, from any angle, even when the details underneath change.",
          "If your character is defined by a subtle face, you have chosen the hardest possible problem. Give them a shape, a colour and one object. That is what the eye actually tracks.",
        ],
      },
      {
        heading: "Accept drift where nobody looks",
        paragraphs: [
          "Rivets, folds, background props, the exact pattern on a sleeve: viewers do not track these and never have. Traditional animation has always simplified them for the same reason.",
          "Spend your attention on the three or four things that carry identity, and let the rest move. Trying to lock everything means locking nothing, because you will run out of patience before you run out of shots.",
        ],
      },
      {
        heading: "Shorter shots hide more",
        paragraphs: [
          "Drift is a function of duration. A two second shot rarely has time to betray itself. An eight second hold on a face will, no matter what you do.",
          "This is not a compromise, it is how action is cut anyway. If a shot needs to be long, find a reason for the camera to move or for the character to turn away.",
        ],
      },
      {
        heading: "Fix it in the edit, not in the generator",
        paragraphs: [
          "Cutting on movement hides a change the same way it always has. So does going wide, or putting the character in shadow, or cutting to what they are looking at instead of at them.",
          "Regenerate when a shot is wrong. Cut around it when a shot is merely imperfect. Telling those two apart quickly is most of the craft, and the main reason a finished episode exists at all.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Why do my AI characters change between shots?",
      answer:
        "Because a text prompt cannot specify a face precisely enough. Each generation is a fresh interpretation of your description. Reference images, reused across every shot, are the only reliable fix.",
    },
    {
      question: "How many reference images do I need per character?",
      answer:
        "Four to six covering face, full body, silhouette and the angles your storyboard needs. More than that stops helping and starts contradicting itself.",
    },
    {
      question: "Does character consistency depend on the model?",
      answer:
        "Partly. Models differ in how well they hold a reference, and the ranking changes every few months. But a well designed character with a clear silhouette survives a weak model, and a subtle face fails on a strong one.",
    },
    {
      question: "Can I keep a character consistent across a whole series?",
      answer:
        "Yes, if the reference set is versioned and reused rather than rebuilt each episode. Rebuilding references is how a character slowly becomes someone else between episode one and episode three.",
    },
  ],
  related: [
    { label: "Is AI anime really anime?", href: "/is-ai-anime-real-anime" },
    { label: "AI anime vs traditional animation", href: "/ai-anime-vs-traditional-animation" },
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "The 6 best AI anime, ranked", href: "/best-ai-anime" },
    { label: "Lost Garden production notes", href: "/process" },
    { label: "Imaginode, the generation platform used", href: "https://imaginode.ai" },
  ],
};

const isAiAnimeRealAnime: Guide = {
  article: {
    byline:
      "The question comes up under every AI animation video. The major anime databases already answer it, and their answer has almost nothing to do with AI.",
    sections: [
      {
        paragraphs: [
          "Short version: the databases that catalogue anime define it by where it is produced, not by how it is drawn. On that definition, an AI-assisted series made in Japan is anime and a hand-drawn series made in France is not. The technique never enters into it.",
          "That is worth knowing before arguing about it, because most of the argument online is people using two different definitions at once.",
        ],
      },
      {
        heading: "What AniList actually requires",
        paragraphs: [
          "AniList accepts three regional categories and nothing else. Anime needs significant creative control from Japanese studios. Aeni needs South Korean studios. Donghua needs Chinese or Taiwanese studios.",
          "Their own worked example is RWBY. It has a Japanese dub. It was broadcast on Japanese television. It is still rejected, because the production company and the principal staff are American. Their submission form goes further and offers only four countries of origin, with no way to leave the field empty.",
        ],
        callouts: [
          "A Japanese dub and a Japanese broadcast are not enough. The creative control has to be Japanese.",
        ],
      },
      {
        heading: "What MyAnimeList requires",
        paragraphs: [
          "The same shape of rule. The work must be animated as a work of animation, professionally produced in Japan, and made for the Japanese market, with a narrow allowance for co-productions. RWBY fails there too, for the same reason.",
          "Anime News Network is the outlier of the three. Its encyclopedia is broader and does catalogue non-Japanese animation, which is why it is the one database an independent Western production can realistically join.",
        ],
      },
      {
        heading: "So where does AI fit",
        paragraphs: [
          "Nowhere in those rules. Not one of them mentions how the images are made.",
          "Twins Hinahima settles it in practice. It was produced by Frontier Works and KaKa Creation, aired on Tokyo MX in March 2025, and roughly 95% of its animation cuts involve generative AI. By every criterion above it is unambiguously anime. Meanwhile a French series drawn entirely by hand over ten years by two hundred people would not be.",
          "Whatever you think of AI in animation, it is not the line these databases draw.",
        ],
      },
      {
        heading: "The other definition, the one everyone actually uses",
        paragraphs: [
          "In ordinary speech, anime describes a visual and narrative tradition: the character design, the cutting, the register of emotion, the relationship to stillness. Under that definition plenty of non-Japanese work qualifies, and viewers apply it without hesitation.",
          "In Japan the word is broader still. Anime simply means animation, all of it, including Pixar.",
          "So there are at least three definitions in circulation: a production-origin one used by databases, a stylistic one used by viewers, and a literal one used in Japan. An argument that does not say which one it is using cannot be settled.",
        ],
      },
      {
        heading: "Where that leaves Lost Garden",
        paragraphs: [
          "Lost Garden is an independent animated series made in France, in the anime tradition, with an AI-assisted pipeline under human direction. It is anime by the stylistic definition and not by the database one, and both of those statements are useful.",
          "Being precise about it is not modesty, it is practical. It is why the project belongs in the Anime News Network encyclopedia, on IMDb and on TMDB, and not on AniList or MyAnimeList. Submitting to the wrong place wastes everyone's time and gets you rejected on a rule that has nothing to do with your work.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Is AI anime real anime?",
      answer:
        "It depends which definition you use. AniList and MyAnimeList define anime by Japanese production, so an AI-assisted Japanese series qualifies and a hand-drawn Western one does not. By the stylistic definition most viewers use, AI-assisted work in the anime tradition counts.",
    },
    {
      question: "Has an AI anime been accepted as anime by the industry?",
      answer:
        "Yes. Twins Hinahima was produced by Frontier Works and KaKa Creation, aired on Tokyo MX in March 2025, and uses generative AI in roughly 95% of its animation cuts. It meets every database criterion.",
    },
    {
      question: "Why do AniList and MyAnimeList reject Western animation?",
      answer:
        "Because both define anime by production origin. AniList's own example is RWBY, rejected despite a Japanese dub and Japanese broadcast, because the production and principal staff are American. MyAnimeList requires professional production in Japan for the Japanese market.",
    },
    {
      question: "Which database accepts independent Western animation?",
      answer:
        "Anime News Network's encyclopedia is broader than AniList and MyAnimeList and does catalogue non-Japanese animation. IMDb, TMDB and Wikidata have no regional restriction at all.",
    },
  ],
  related: [
    { label: "The 6 best AI anime, ranked", href: "/best-ai-anime" },
    { label: "AI anime vs traditional animation", href: "/ai-anime-vs-traditional-animation" },
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "Lost Garden production notes", href: "/process" },
  ],
};

const aiVsTraditional: Guide = {
  article: {
    byline:
      "A comparison written from the inside, after finishing a seventeen minute episode alone. What an AI-assisted pipeline genuinely changes, what it leaves exactly as it was, and where it is still worse.",
    sections: [
      {
        paragraphs: [
          "Most comparisons on this subject are written by people selling one side. This one comes from having produced an episode with the AI-assisted pipeline, and from watching what it did and did not solve.",
        ],
      },
      {
        heading: "What genuinely changes: the floor",
        paragraphs: [
          "Seventeen minutes of animation used to require a studio, a schedule and a payroll. It now takes one person and a year. That is the whole story, and everything else people claim about AI animation is smaller than this.",
          "It does not make animation cheap. It makes it possible at a scale of one, which is a different thing and a more interesting one.",
        ],
      },
      {
        heading: "What changes: iteration, and therefore taste",
        paragraphs: [
          "In a traditional pipeline a shot is expensive enough that you commit to it at the storyboard. In a generated pipeline you can look at forty versions of the same shot before choosing.",
          "That sounds purely good and is not. Choosing between forty options is a skill, and without a world bible to check against you will pick the prettiest rather than the right one. The bottleneck moves from making images to judging them.",
        ],
        callouts: [
          "The scarce resource stops being production capacity and becomes judgement.",
        ],
      },
      {
        heading: "What does not change at all",
        list: [
          "Writing. A weak scene is weak at any resolution.",
          "Storyboarding intent. Someone still decides where the camera stands and why.",
          "Editing. Pacing, holds and cuts are still the difference between a film and a reel.",
          "Sound. Still half the result, still the half people skip.",
          "The hit rate. Most takes are bad in both pipelines. Only the cost of a bad take changed.",
        ],
      },
      {
        heading: "Where AI is clearly worse",
        paragraphs: [
          "Character consistency across shots is the obvious one, and it is a pipeline problem rather than a prompting problem. Hands and small props remain unreliable. Long holds on a face betray drift that a two second shot hides.",
          "Deliberate timing is the deeper gap. A traditional animator decides that a gesture takes eleven frames because eleven is funnier than twelve. Generated motion does not offer that control, and the difference shows in comedy and in fight choreography more than anywhere else.",
        ],
      },
      {
        heading: "Where AI is clearly better",
        paragraphs: [
          "Exploring a visual direction before committing. Environments, light, atmosphere, the texture of a world: these come back faster and richer than a small team could draw them.",
          "Volume of attempts is the other one. Being able to fail forty times on a shot that matters is a luxury a scheduled production does not have.",
        ],
      },
      {
        heading: "The honest verdict",
        paragraphs: [
          "It is not a replacement pipeline, it is a different set of constraints. A studio still does character acting and choreography that no generated shot reaches. A single person can now finish a coherent episode with a world of their own, which no single person could do before.",
          "Both of those are true at once, and anyone telling you only one of them is selling something.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Is AI animation cheaper than traditional animation?",
      answer:
        "Cheaper in payroll, not in time. The cost moves from a team to one person's months. What actually changes is that a production of this length becomes possible for one person at all, which was not the case a few years ago.",
    },
    {
      question: "Is AI animation faster?",
      answer:
        "Individual shots are faster. The project is not, because most of the time goes to rejected takes and to the edit. A seventeen minute episode made alone still counts in months.",
    },
    {
      question: "What can traditional animation still do better?",
      answer:
        "Deliberate timing and character acting. An animator choosing that a gesture lasts eleven frames rather than twelve has control that generated motion does not offer, and it shows most in comedy and fight choreography.",
    },
    {
      question: "Will AI replace animators?",
      answer:
        "It has not replaced the parts of the work that decide whether a scene lands: writing, staging, editing, timing. It has lowered the barrier for people who could not produce animation at all. Those are different effects and both are happening.",
    },
  ],
  related: [
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "Keeping a character consistent across shots", href: "/ai-character-consistency" },
    { label: "Is AI anime really anime?", href: "/is-ai-anime-real-anime" },
    { label: "AI anime vs traditional animation", href: "/ai-anime-vs-traditional-animation" },
    { label: "The 6 best AI anime, ranked", href: "/best-ai-anime" },
  ],
};

export const guidesEn: Record<GuideSlug, Guide> = {
  "/how-to-make-ai-anime": howToMakeAiAnime,
  "/ai-character-consistency": characterConsistency,
  "/is-ai-anime-real-anime": isAiAnimeRealAnime,
  "/ai-anime-vs-traditional-animation": aiVsTraditional,
};
