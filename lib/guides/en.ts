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
    { label: "AI anime generators: what they really produce", href: "/ai-anime-generator" },
    { label: "Making of Episode One", href: "/making-of-episode-1" },
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
    { label: "Can AI make a manga?", href: "/ai-manga" },
    { label: "How to tell if an anime was made with AI", href: "/how-to-tell-if-anime-is-ai" },
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


const aiManga: Guide = {
  article: {
    byline:
      "Manga is the still half of the same problem. What making the character sheets and the storyboard for an anime episode taught me about generated manga, and where it breaks.",
    sections: [
      {
        paragraphs: [
          "I have not published a manga. What I have done is the part of an anime production that looks exactly like one: character sheets, a scene by scene storyboard, a storyboard's worth of still frames judged against a bible before a single second of motion existed. That stage is manga with the lettering missing, and it is where most of the lessons below come from.",
          "Short version: AI is already good at a manga page. It is still bad at a manga chapter. The difference is the thing readers actually care about.",
        ],
      },
      {
        heading: "A page is easy, a chapter is not",
        paragraphs: [
          "Ask a current image model for a manga panel and you get one. Ink lines, screentone, a dramatic angle, done in seconds. That is the demo everyone has seen and it is real.",
          "Now ask for the next panel. Same character, same room, three seconds later, from the other side. This is where the same drift that ruins AI animation shows up in print, and it shows up harder, because a reader holds the page still and compares. In motion you can cut away from a wrong face. On paper the wrong face sits next to the right one forever.",
        ],
        callouts: [
          "In animation the eye forgives what it only sees for a second. A manga page gives it all the time in the world.",
        ],
      },
      {
        heading: "What transfers from the anime pipeline",
        paragraphs: [
          "Everything that fixed consistency on Lost Garden works for manga, and it works better, because you never have to fight motion. One reference set per character, reused on every panel. A silhouette that survives a bad generation: Lanterne is an empty armor with a lantern for a head, and that shape reads at thumbnail size in any panel. A world bible that lets you reject a beautiful drawing because it belongs to a different book.",
          "The storyboard stage matters more than people expect. On the episode, ScreenWeaver generates the board from the screenplay, scene by scene, and that board is already a rough manga: a shot per panel, a reason for each one, a rhythm across the page. If you are making a manga, that is the document to get right first, not the art.",
        ],
      },
      {
        heading: "What does not transfer, and hurts",
        paragraphs: [
          "Hands. Two characters touching. Anything with text on it, from a shop sign to a speech bubble. Panel borders and reading order, which the model does not understand at all and which you will lay out yourself. And the deliberate ugliness manga uses for emphasis, the sweat drop, the chibi cut, the speed lines that break perspective on purpose. Models average those away because they are trained on finished pages that mostly avoid them.",
          "Lettering is the one to take seriously. A generated speech bubble is a picture of text, not text. Every real manga workflow with AI in it draws the art and letters by hand afterwards, and there is no shortcut yet that reads well.",
        ],
      },
      {
        heading: "Where generated manga is actually useful today",
        paragraphs: [
          "Name boards, the rough layout a mangaka draws before the clean art. Pitch pages. Character design exploration before you commit. Colour covers, which are single images and play to the model's strength. A fan project where consistency can be loose because the reader already knows the faces.",
          "A forty page chapter with a cast of six that a stranger can follow without noticing anything odd is still a lot of hand correction. It is closer than it was a year ago and it is not there.",
        ],
      },
      {
        heading: "On the word itself",
        paragraphs: [
          "In France people say manga for the animated series too, so a search for an AI manga often means an AI anime. If that is what you came for, Episode One of Lost Garden is a full seventeen minute episode and it is free to watch. If you meant the printed thing, everything above is the honest state of it in 2026, and a manga of the series does not exist yet.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Can AI make a manga?",
      answer:
        "It can make a convincing manga page in seconds. A full chapter with the same faces on every panel, readable lettering and a deliberate layout still needs a human doing most of the assembly and correction. The tools are good at panels and weak at continuity.",
    },
    {
      question: "Is AI manga easier than AI anime?",
      answer:
        "Per image, yes, there is no motion to fight. Per work, not really, because print gives the reader time to compare panels and every inconsistency is permanent. Animation can cut away from a mistake. A page cannot.",
    },
    {
      question: "What is the best way to keep a manga character consistent with AI?",
      answer:
        "Exactly what works in animation: a reference set per character reused on every panel, a design with a strong silhouette and few hard features, and a bible you reject drawings against. Prompts alone drift, in print as on screen.",
    },
    {
      question: "Is there a Lost Garden manga?",
      answer:
        "No. Lost Garden is an animated series. Episode One runs seventeen minutes and can be watched free on YouTube and on this site. The character sheets and storyboard behind it are the closest thing to a manga the project has.",
    },
  ],
  related: [
    { label: "Keeping a character consistent across shots", href: "/ai-character-consistency" },
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "AI anime generators: what they really produce", href: "/ai-anime-generator" },
    { label: "Watch Episode One", href: "/episode-1" },
    { label: "The 6 best AI anime, ranked", href: "/best-ai-anime" },
  ],
};

const aiAnimeGenerator: Guide = {
  article: {
    byline:
      "What an AI anime generator gives you, what it does not, and which parts of a seventeen minute episode came out of one. Written for people about to pay for a subscription.",
    sections: [
      {
        paragraphs: [
          "Every product with anime in its name promises the same thing: type a sentence, get an anime. Some of them are genuinely impressive. None of them make an episode, and the gap between those two facts is where people lose months and a fair amount of money.",
          "This is not a review of any single tool. Rankings on this subject are obsolete within a quarter. It is a description of the category, so you know what you are buying before you buy it.",
        ],
      },
      {
        heading: "What a generator actually outputs",
        paragraphs: [
          "A clip. Somewhere between four and fifteen seconds, in most cases, from a text prompt and often a reference image. A good one gives you an anime-looking shot with plausible motion, a camera move, and lighting that holds for the duration.",
          "What it does not output is the shot before it or the shot after it. It has no memory of your character beyond the image you attached, no idea of your world, no notion that this shot sits in a scene. Every generation is a stranger being asked to draw your character from a photo.",
        ],
        callouts: [
          "A generator makes shots. An episode is made of the decisions between shots, and no product sells those.",
        ],
      },
      {
        heading: "Three kinds of product, and they are not interchangeable",
        list: [
          "One-click anime apps. A prompt, a style preset, a clip. Useful for a mood test or a social post, useless for continuity, and the most expensive per usable second.",
          "Raw video models with an interface. Seedance, Kling, Veo and their successors. This is where the quality is, and where you do the work of references, prompting and selection yourself.",
          "Workspaces that put several models behind one canvas, with your references kept next to the shots. Not a generator, a place to run generators. It is the category Imaginode belongs to, and the one an episode actually gets made in.",
        ],
        trailingParagraphs: [
          "The first kind is what most searches for an anime generator land on. The third kind is the only one that scales to a story.",
        ],
      },
      {
        heading: "What Lost Garden used, and for what",
        paragraphs: [
          "Nothing in Episode One came from a one-click app. The screenplay is written by hand in ScreenWeaver, which then generates the storyboard from it. Image and video generation runs on Imaginode, where a large catalogue of models sits behind one node canvas and the character references for Lanterne and Rose stay attached to every shot that needs them.",
          "Motion came from several video models, Seedance 2 among them, and the model changed depending on the shot. That is the part no single generator can do: try the same shot on three models and keep the one that holds the armour, without rebuilding the setup each time.",
        ],
      },
      {
        heading: "What generators are genuinely good for",
        paragraphs: [
          "Finding a look before you commit to it. Testing whether a scene has a camera at all. Producing a storyboard fast enough that you throw half of it away without regret. Making a ten second proof that a strange idea, an empty armor with a lantern for a head, actually reads on screen.",
          "Those uses are worth paying for, and they were part of making this episode. They are the beginning of the work, and the products sell them as the end of it.",
        ],
      },
      {
        heading: "Before you subscribe",
        paragraphs: [
          "Ask one question of any tool: can I attach the same character references to fifty different shots without re-uploading them fifty times. If the answer is no, it is a clip machine, and clips are the cheap part. If the answer is yes, you are looking at a pipeline, and the price is probably fair.",
          "And bring a script. A generator with nothing to generate produces a very expensive folder of pretty strangers.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "What is the best AI anime generator?",
      answer:
        "For a single clip, the underlying video models change rank every few months, so any named answer goes stale. For an episode, the tool that matters is the one that keeps your character references attached to every shot and lets you try the same shot on several models. That is a workspace, not a generator.",
    },
    {
      question: "Can an AI anime generator make a full episode?",
      answer:
        "No. Generators produce clips of a few seconds with no memory between them. An episode is a script, references, shot after shot judged against a bible, an edit and a sound mix. Lost Garden Episode One took one person about a year, and no step of that was one click.",
    },
    {
      question: "Are free AI anime generators worth using?",
      answer:
        "For a look test or a storyboard frame, yes. For anything you plan to keep, the free tiers usually cap resolution, length and reference support, which are exactly the three things a story needs.",
    },
    {
      question: "Which generator was Lost Garden made with?",
      answer:
        "None in the one-click sense. The script and storyboard live in ScreenWeaver, generation runs on Imaginode with several video models including Seedance 2, and the edit and sound are conventional. The model varied shot by shot.",
    },
  ],
  related: [
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "Keeping a character consistent across shots", href: "/ai-character-consistency" },
    { label: "Making of Episode One", href: "/making-of-episode-1" },
    { label: "Can AI make a manga?", href: "/ai-manga" },
    { label: "Imaginode, the generation platform used", href: "https://imaginode.ai" },
  ],
};

const aiAnimeVoiceAndSound: Guide = {
  article: {
    byline:
      "The main character of Lost Garden cannot speak. How the voices, the armour sounds and the music of Episode One were made, and what AI audio does well and badly in anime.",
    sections: [
      {
        paragraphs: [
          "Sound is the half of an AI anime that nobody asks about, and it is the half that decides whether the viewer believes the space. Every article on the subject is about images. This one is about the other channel.",
          "It helps that Lost Garden forced the question early. Lanterne is an empty suit of armour with a lantern for a head. He has no mouth, no lungs, no voice. Whatever he feels has to come out as sound, and none of that sound could be a person talking.",
        ],
      },
      {
        heading: "A character with no voice",
        paragraphs: [
          "Lanterne's whole vocal identity is built from hollow metal: creaks, empty breaths, internal resonances, small grunts of frustration, a strange metallic sigh when something goes wrong. Those were explored with AI audio tools and then chosen, layered and placed by hand, one reaction at a time.",
          "The constraint turned out to be a gift. A character who cannot explain himself cannot be over-written, and a viewer who has to read a creak as disappointment is doing the work that makes them care. Sound told the audience what Lanterne was before the story did.",
        ],
        callouts: [
          "A voice tells you what a character says. A sound tells you what a character is.",
        ],
      },
      {
        heading: "Voices for the characters who do speak",
        paragraphs: [
          "The episode is voiced in English, with subtitles in French, Japanese and Korean. The spoken lines were produced with AI voice tools, directed line by line: intent, pace, where the breath goes, which word carries the weight. A generated read is a first take, and like any first take, many were rejected.",
          "The honest limit is acting under pressure. Quiet lines, a child's calm, a sentence spoken to someone who cannot answer, those work. A scream, a laugh that turns into something else, two people talking over each other, those still sound like what they are. The episode is written around that, and a lot of scripts would not be.",
        ],
      },
      {
        heading: "The music had rules before it had notes",
        paragraphs: [
          "The bible for sound was as strict as the one for images. Mystical, fragile, underground, sometimes science fiction, sometimes sacred, and never trailer music. When Lanterne meets the Source Tree the score is not heroic. It is ancient and too large: soft glass tones, a low cello, wordless choir textures, cavern reverb, the creak of roots, a faint resonance from the armour itself.",
          "When a sleeping machine wakes, the palette flips to cold drones, electric crackle, mechanical groans, alarm-like tones and one signature alien cry. Those two palettes were explored with AI music tools against written briefs, and the briefs were the real work. A model given the word epic returns the average of every epic score ever made. A model given a list of forbidden instruments returns something that belongs to one film.",
        ],
      },
      {
        heading: "Less music than you think",
        paragraphs: [
          "The most common mistake in AI-assisted animation is a generated score under every scene, because scores are cheap now. The result flattens an episode into a seventeen minute trailer. Lost Garden holds silence in places most projects would fill, and the footsteps on wet stone do more for the sense of a cavern than any string section.",
          "Sound effects were placed by hand, in the edit, like in any film. That part has not changed and probably should not.",
        ],
      },
      {
        heading: "What to take from it",
        paragraphs: [
          "Write the sound bible before generating a note. Give every character a sonic identity, even the ones who talk. Reject generated audio the way you reject generated images, against the bible and not against your mood. And leave silence in. It is the one thing no model will suggest on its own.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Are the voices in Lost Garden AI generated?",
      answer:
        "The spoken lines were produced with AI voice tools and directed line by line, with many takes rejected. Lanterne, the main character, has no human voice at all: his reactions are hollow armour sounds, creaks, empty breaths and metallic sighs, explored with AI audio tools and placed by hand.",
    },
    {
      question: "Is the music in AI anime usually AI generated?",
      answer:
        "Increasingly, yes. On Lost Garden the score was explored with AI music tools against strict written briefs that named the mood, the instruments and what was forbidden. The brief is what keeps a generated score from sounding like every other one.",
    },
    {
      question: "What does AI voice acting still do badly?",
      answer:
        "Extreme emotion and overlap. Shouting, laughter that changes meaning, two characters talking at once. Quiet, controlled lines work well. Writing the script with that limit in mind is more effective than fighting it in the tool.",
    },
    {
      question: "How do you give a character a voice without dialogue?",
      answer:
        "Build a sound identity instead. Lanterne is defined by metal: a creak for hesitation, an empty breath for surprise, a metallic sigh for failure. Consistent sounds for consistent emotions, and the viewer learns the language within a scene.",
    },
  ],
  related: [
    { label: "Making of Episode One", href: "/making-of-episode-1" },
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "Watch Episode One", href: "/episode-1" },
    { label: "The creator's essay on making the series", href: "/vision" },
  ],
};

const howToTellIfAnimeIsAi: Guide = {
  article: {
    byline:
      "The signs that an anime was made with AI, from someone who spent a year hiding them. What still gives it away, what no longer does, and why the honest answer is on the credits.",
    sections: [
      {
        paragraphs: [
          "People ask this under every animated clip now, and the confident answers are mostly wrong in both directions. Hand-drawn work gets accused because it has smooth gradients. Generated work gets waved through because it has a scratchy line. Here is what actually shows, from the side of the person trying to make it not show.",
        ],
      },
      {
        heading: "Watch the cut before the next one",
        paragraphs: [
          "The strongest sign is not in any single shot. It is between shots. A character's face, hair volume, the exact shape of a collar or a strap: if these shift slightly at every cut, the shots were generated separately and nobody could fully lock them. Traditional animation drifts too, but it drifts within a scene as an animator tires, not at every edit point.",
          "The tell that goes with it is cut length. Generated projects cut fast on faces and linger on environments, because a two second face hides drift and an eight second cavern has nothing to betray. A whole episode with almost no long hold on a character is telling you something.",
        ],
        callouts: [
          "AI shows between the shots, not inside them. Compare cuts, not frames.",
        ],
      },
      {
        heading: "Hands, contact and small props",
        paragraphs: [
          "Still the weakest point of every model, and still the first thing to check. Fingers that merge or multiply during a gesture, two hands that touch and become one object, a cup that changes shape between the reach and the drink. A drawn hand can be bad, but it is bad the same way for the whole shot.",
          "Look also at anything a character holds across a cut. Lanterne carries a glowing medallion, and an object like that has to be checked at every cut exactly like a face.",
        ],
      },
      {
        heading: "Motion that floats",
        paragraphs: [
          "Generated motion is smooth in a way that hand animation deliberately is not. Anime holds a pose, snaps to the next one, drops frames on purpose for impact. Video models interpolate everything, so a character who should hit a pose instead glides into it. Walk cycles are the clearest case: watch whether the feet plant or slide.",
          "This one is fading fast, and directing against it is possible, but in 2026 it is still the most reliable thing to look at in an action scene.",
        ],
      },
      {
        heading: "Backgrounds that are too finished",
        paragraphs: [
          "Traditional anime backgrounds are painted once and reused, so the same room looks the same in every shot, down to the crack in the wall. Generated backgrounds are new each time. A crack that moves, a window that gains a pane, moss that changes pattern: the room is being redrawn from a description rather than photographed from a painting.",
          "The paradox is that generated environments are often more detailed than drawn ones. Too much texture everywhere, with no artist's decision about what to leave flat, is itself a sign.",
        ],
      },
      {
        heading: "What no longer works as a test",
        paragraphs: [
          "Line quality, screentone, the anime look itself: models have that now, and the scratchy hand-drawn feel is a preset. Six fingers, once the meme, are rare on current models. Text in the frame is getting readable. Anyone still using those as their test is going to be wrong more often than right.",
          "Eyes are a bad test in both directions. Anime eyes have always been stylised, and a model copies the style perfectly.",
        ],
      },
      {
        heading: "The only reliable method",
        paragraphs: [
          "Read the credits, the description, or the production notes. Lost Garden says on its own site that Episode One is AI-assisted under human direction, lists the tools, and explains what is human and what is generated. Twins Hinahima was open about its AI usage from the start. Projects that hide it are the ones the tests above are for, and the tests get less reliable every month.",
          "So the useful question is shifting from can I tell to did they tell me. That is a question about the people, and it does not go out of date.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "How can you tell if an anime is AI generated?",
      answer:
        "Compare shots rather than frames: faces, hair volume and held objects that shift at every cut, fast cutting on characters with long holds on environments, hands that merge during gestures, motion that glides instead of snapping, and backgrounds that change details between shots. The reliable answer is in the credits or the production notes.",
    },
    {
      question: "Are six fingers still a sign of AI?",
      answer:
        "Rarely, on current models. Hands are still the weakest area, but the giveaway is now fingers merging or multiplying during movement and two hands becoming one object on contact, not a static count.",
    },
    {
      question: "Does a hand-drawn look mean it is not AI?",
      answer:
        "No. Line quality, screentone and a scratchy pencil feel are style presets now. Look at continuity between shots instead.",
    },
    {
      question: "Is Lost Garden AI generated?",
      answer:
        "It is AI-assisted under human direction, and it says so. The script, world, characters, edit and sound decisions are human. Image and video generation runs on Imaginode with several video models, and the production notes on this site list what is generated and what is not.",
    },
  ],
  related: [
    { label: "Is AI anime really anime?", href: "/is-ai-anime-real-anime" },
    { label: "Keeping a character consistent across shots", href: "/ai-character-consistency" },
    { label: "Lost Garden production notes", href: "/process" },
    { label: "AI anime vs traditional animation", href: "/ai-anime-vs-traditional-animation" },
    { label: "The 6 best AI anime, ranked", href: "/best-ai-anime" },
  ],
};

const makingOfEpisodeOne: Guide = {
  article: {
    byline:
      "How Episode One of Lost Garden was made: what changed, what got thrown away, and what a year of one person's work on a seventeen minute anime actually looks like from the inside.",
    sections: [
      {
        paragraphs: [
          "Episode One went online on 29 May 2026. Seventeen minutes, written, directed, generated, edited and mixed by one person. Since then it has passed sixty-five thousand views, been selected at the Seoul International AI Film Festival and reached the final of the AI London Festival. This is the account of how it got made, without the parts that usually get smoothed over.",
        ],
      },
      {
        heading: "The world was somewhere else first",
        paragraphs: [
          "Early Lost Garden had a cathedral. It had an outside, a sky, a fairly conventional fantasy surface with the underground as a place you went down to. The more the project went on, the clearer it became that the strongest identity was below, and the surface got cut entirely.",
          "That decision cost a lot of finished images. It was still the best decision of the production, because everything after it could be checked against one rule: blue forests, cyan mist, wet stone, no sunlight, ever. A world bible is worth exactly the number of good shots you are willing to throw away for it, and the cathedral was the proof.",
        ],
      },
      {
        heading: "A knight designed to survive the tools",
        paragraphs: [
          "Lanterne is an empty armour with a lantern for a head, no face, no body inside, modest proportions, a slightly awkward posture. He is not a legendary knight. He is damaged and protective and a bit clumsy. That was a story choice first, and it turned out to be the most practical decision in the whole pipeline.",
          "A face drifts between generated shots. A silhouette with one light source in the middle of it does not. Rose, a small child with a quiet strength, was the harder character precisely because she has a face, and a face is what drifts.",
        ],
        callouts: [
          "The character who cannot speak and has no face was the easiest one to keep consistent. That is not a coincidence.",
        ],
      },
      {
        heading: "The order of operations",
        paragraphs: [
          "The screenplay was written by hand in ScreenWeaver and stayed the single source of truth for everything after. ScreenWeaver generated the storyboard from it, scene by scene, and every shot was produced through its workflow so that no image ever lost its link to the line of script it served.",
          "Generation ran on Imaginode, a node canvas with a large catalogue of image and video models behind it. The point of that setup was never the choice of a model. It was being able to try the same shot on several, with the character references still attached, and keep whichever held the armour. Seedance 2 handled a lot of motion. It was not the only one, and which model won changed shot by shot.",
        ],
      },
      {
        heading: "What most of the year went to",
        paragraphs: [
          "Rejected takes and the edit. Many shots needed several attempts. Some needed a dozen. A few scenes got rewritten because the shot they needed did not exist yet at any quality, and rewriting a scene is faster than fighting a model for a month.",
          "The edit is where the episode became an episode. Cutting on movement to hide drift, going shorter on faces, trusting a wide shot, deciding that a beautiful frame was wrong for the scene and losing it. None of that came out of a generator and all of it is what viewers are actually responding to.",
        ],
      },
      {
        heading: "Sound came last, and it should",
        paragraphs: [
          "Lanterne has no voice, so his whole character is armour sounds: creaks, empty breaths, a metallic sigh. The score followed a written bible as strict as the visual one, glass tones and low cello for the sacred, cold drones and alarm tones for the machines, and less of it than any trailer would use. Voices for the speaking characters were produced with AI voice tools, directed line by line, in English, with subtitles in three other languages.",
        ],
      },
      {
        heading: "What it did and did not prove",
        paragraphs: [
          "It proved that one person can finish a coherent seventeen minute episode with a world of their own, which was not possible a few years ago. It did not prove that this is fast, cheap, or easy. Anyone who watched it and thought they could do it in a weekend has misread what they saw.",
          "Episode Two is in production, with the same knight, the same child, and a reference set that this time does not have to be built from nothing.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "How long did Lost Garden Episode One take to make?",
      answer:
        "About a year of one person's work for seventeen minutes, most of it spent on rejected takes and on the edit rather than on generation itself. It was released on 29 May 2026.",
    },
    {
      question: "Who made Lost Garden?",
      answer:
        "Frank Houbre wrote, directed, generated, edited and mixed Episode One alone, using an AI-assisted pipeline under human direction. The script lives in ScreenWeaver and generation runs on Imaginode.",
    },
    {
      question: "What was cut from Episode One?",
      answer:
        "An entire surface world, including a cathedral, that early versions of the project had. The series became fully underground and every finished image of the surface was dropped. Several scenes were also rewritten because the shot they needed could not yet be generated well.",
    },
    {
      question: "Has Lost Garden been shown at festivals?",
      answer:
        "Yes. Episode One was selected at the Seoul International AI Film Festival and reached the final of the AI London Festival. It has also passed sixty-five thousand views on YouTube.",
    },
  ],
  related: [
    { label: "Watch Episode One", href: "/episode-1" },
    { label: "How the voices and sound were made", href: "/ai-anime-voice-and-sound" },
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "Can one person make an anime?", href: "/can-one-person-make-an-anime" },
    { label: "Press kit", href: "/press" },
  ],
};

const canOnePersonMakeAnAnime: Guide = {
  article: {
    byline:
      "A studio has forty jobs. A solo creator has one body. Which of those jobs AI now covers, which it does not, and what it really takes to finish an anime episode alone.",
    sections: [
      {
        paragraphs: [
          "Yes, and there is a finished seventeen minute episode on this site to prove it. That is the easy half of the answer. The useful half is what you have to be, and what you have to give up, to be the one person.",
        ],
      },
      {
        heading: "The jobs a studio splits up",
        paragraphs: [
          "Writer, director, storyboard artist, character designer, background artist, key animator, in-betweener, colourist, compositor, editor, sound designer, composer, voice director, producer. In a traditional production those are separate people with separate skills, and most of them never touch the script.",
          "Alone, you do all of them, and the honest question is which ones you can do badly without the episode collapsing.",
        ],
      },
      {
        heading: "What AI takes off your plate",
        paragraphs: [
          "The in-betweening, the colouring, most of the background painting, the raw production of frames. On Lost Garden those ran through Imaginode with several video models, and that is the labour that used to need a floor of people. It is genuinely gone as a bottleneck, and that is the whole reason a solo episode exists.",
          "It also takes the first draft of the storyboard, which ScreenWeaver generates from the screenplay, and a first pass at voices and music from written briefs. First drafts and first passes. Not final ones.",
        ],
        callouts: [
          "AI replaced the jobs that needed many hands. It did not replace the jobs that needed one head.",
        ],
      },
      {
        heading: "What you still have to be",
        list: [
          "A writer. The script is the constraint on everything, and no tool improves a scene that has no reason to exist.",
          "A director. Where the camera stands, what the viewer knows, when to cut away. This is most of the year.",
          "An editor. The episode becomes an episode in the cut. Drift is hidden there, pacing is found there, bad shots die there.",
          "A sound person. Half the film, and the half solo creators skip. Lanterne has no voice, so on this project sound was the character.",
          "A producer, meaning the person who decides that a scene gets rewritten instead of regenerated for another month.",
        ],
        trailingParagraphs: [
          "Notice that none of those is drawing. You do not need to draw. You need to know what is wrong with an image and why, which is closer to directing than to illustration.",
        ],
      },
      {
        heading: "What alone costs",
        paragraphs: [
          "Time, in months. Episode One took about a year for seventeen minutes, and most of it went to rejected takes and the edit, not to typing prompts. There is nobody to hand the boring part to, and the boring part is most of it.",
          "Taste fatigue is the cost nobody warns you about. Choosing between forty versions of a shot, scene after scene, wears down the exact judgement the whole thing depends on. A world bible is what lets you keep deciding when you are tired: the shot matches the rule or it does not.",
        ],
      },
      {
        heading: "How to start, if you are one person",
        paragraphs: [
          "Write a scene. Not a series, not a world, one scene with a change in it. Design one character with a strong silhouette and few features, because that is what survives the tools. Make a reference set and keep it next to every shot. Storyboard the scene before you generate a frame of it. Then finish that scene, with sound, to the end.",
          "A finished two minute scene teaches you more than an unfinished episode, and it is the thing that convinces you, and everyone else, that the rest is possible.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Can one person really make an anime?",
      answer:
        "Yes. Lost Garden Episode One is seventeen minutes made entirely by one person, released in May 2026 and selected at festivals. It took about a year, and the work that remained human was writing, directing, editing and sound.",
    },
    {
      question: "Do I need to know how to draw to make an anime alone?",
      answer:
        "No. Generation covers the frames. You need to write, direct, edit and judge images, which is closer to filmmaking than to illustration. Knowing what is wrong with a shot matters more than being able to fix it by hand.",
    },
    {
      question: "How long does it take one person to make an anime episode?",
      answer:
        "Count in months. Seventeen minutes took about a year, most of it on rejected takes and the edit. A finished short scene is a realistic first goal and teaches more than an unfinished episode.",
    },
    {
      question: "What is the hardest part of making an anime alone?",
      answer:
        "Keeping your judgement sharp across hundreds of decisions with nobody to share them. A written world bible is the practical answer: it turns choosing between forty versions into checking a rule.",
    },
  ],
  related: [
    { label: "Making of Episode One", href: "/making-of-episode-1" },
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "AI anime vs traditional animation", href: "/ai-anime-vs-traditional-animation" },
    { label: "How the voices and sound were made", href: "/ai-anime-voice-and-sound" },
    { label: "Watch Episode One", href: "/episode-1" },
  ],
};


const aiAnimeStoryboard: Guide = {
  article: {
    byline:
      "The storyboard is where an AI anime is actually decided, and it is the step most people skip because the generator makes it feel optional. What a generated board is good for, what it must never decide, and how the board of Episode One was built.",
    sections: [
      {
        paragraphs: [
          "A storyboard exists to answer one question per shot: why this, why here, why this long. Generators make beautiful images so cheaply that it feels reasonable to skip the question and go straight to the answer. Every project that does that ends up with a folder of gorgeous shots that do not cut together.",
          "On Lost Garden the board is not drawn by hand. It is generated by ScreenWeaver from the screenplay, scene by scene, and that is fine, because what the board decides is not the art. It decides the camera.",
        ],
      },
      {
        heading: "What the board decides",
        list: [
          "Where the camera stands and what it can see. Half the scenes in a first draft have no camera at all, just dialogue in a void.",
          "The order of shots, and the reason each one follows the last.",
          "How long each shot holds. A generated shot will be cut down anyway, so the length has to be known before generating.",
          "What the viewer knows at the end of the scene that they did not know at the start.",
        ],
        trailingParagraphs: [
          "None of those are visual. They are directing decisions, and a board that only shows pretty frames has not made them.",
        ],
      },
      {
        heading: "Why a generated board is fine, and a generated film is not",
        paragraphs: [
          "At the board stage you are choosing framing and rhythm, and the art can be rough, wrong, even ugly, as long as the decision reads. That is exactly what generation is good at: a fast, disposable image of a camera position. Throwing half the board away costs nothing, and you should.",
          "The mistake is letting the board's images become the film. A board frame was never checked against the world bible, never held a character reference, never had to survive a cut. Keep the decision, regenerate the image.",
        ],
        callouts: [
          "A storyboard is a list of decisions with pictures attached. The pictures are the disposable part.",
        ],
      },
      {
        heading: "Board from the script, never from the mood",
        paragraphs: [
          "The board is generated from the screenplay because the screenplay is the source of truth for everything downstream. When the board comes from a mood, a reference film, a set of images you liked, the story bends to fit them, and you will not notice until the edit.",
          "In practice that means every board frame in Lost Garden can be traced back to a line of script. When a frame cannot be, it is either a missing line or a shot that does not belong.",
        ],
      },
      {
        heading: "What the board taught the episode",
        paragraphs: [
          "That a page of dialogue is not a sequence until someone decides where to stand. That a scene with a camera reveals a scene without a point. And that Lanterne, who cannot speak, needed more shots than the script suggested, because a creak and a gesture take screen time that a line of dialogue does not.",
          "Several scenes were rewritten after the board, not after generation. That is the cheap moment to change your mind, and the board is what makes it visible.",
        ],
      },
      {
        heading: "How to do it yourself",
        paragraphs: [
          "Write the scene. Generate a rough frame per shot, from the script, in whatever tool is fastest, and do not care what it looks like. Read the board as a sequence: does each frame have a reason, does the scene change something, could a stranger follow it without dialogue. Fix that on the board. Only then open the generator that matters.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Can AI generate an anime storyboard?",
      answer:
        "Yes, and it is a good use of generation, because a board frame only has to show a camera decision, not final art. On Lost Garden the board is generated by ScreenWeaver from the screenplay, scene by scene. The decisions in it are human, the pictures are disposable.",
    },
    {
      question: "Do I need a storyboard for an AI anime?",
      answer:
        "More than for a traditional one. Generation makes it cheap to produce shots without a reason, and the board is where each shot gets one. Skipping it is the most common way projects end up with a folder of beautiful clips that do not cut together.",
    },
    {
      question: "Should the storyboard images be used in the final episode?",
      answer:
        "No. A board frame was never checked against the world bible or a character reference. Keep the framing and timing it decided, then regenerate the shot properly with references attached.",
    },
    {
      question: "What should a storyboard decide?",
      answer:
        "Where the camera stands, the order of shots, how long each holds, and what the viewer learns. None of that is visual, which is why a board of pretty frames that has not made those decisions is not a board yet.",
    },
  ],
  related: [
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "Should you write an anime script with AI?", href: "/ai-anime-script" },
    { label: "Editing AI anime: where the episode is made", href: "/editing-ai-anime" },
    { label: "Making of Episode One", href: "/making-of-episode-1" },
  ],
};

const aiAnimeBackgrounds: Guide = {
  article: {
    byline:
      "Generated environments are the part of AI anime that already looks better than most drawn ones, and the part most likely to make your film look like everyone else's. How the underground world of Lost Garden was kept to one identity across an episode.",
    sections: [
      {
        paragraphs: [
          "Backgrounds are where generation shines and where projects quietly die. A model returns a cavern, a forest, a ruined hall more richly than a small team could paint them, in seconds. It also returns the average of every cavern it has seen, and an episode built from averages belongs to nobody.",
          "Lost Garden is an entirely underground world. Blue forests, cyan mist, glowing mushrooms, white lilies, giant roots, floating stone platforms, rivers in the dark, machines asleep under moss. Keeping that world the same one across seventeen minutes was harder than keeping the characters.",
        ],
      },
      {
        heading: "The bible is a list of what is forbidden",
        paragraphs: [
          "The world bible for the environments is mostly negative. No sunlight, ever. No sky. No warm light except the lantern and the machines. No architecture that looks built by humans in the last thousand years. Those rules did more than any description, because a model can be told what to make and will drift, but a rule about what must not appear is easy to check on every shot.",
          "The palette is the second lock. Blue, cyan, wet grey stone, one warm accent. A generated shot with a golden hour in it is beautiful and belongs to a different film, and the bible is what lets you say so without arguing with yourself.",
        ],
        callouts: [
          "A world with rules can be checked. A world with adjectives can only be admired.",
        ],
      },
      {
        heading: "The world had to be cut down to exist",
        paragraphs: [
          "Early versions had a cathedral and an outside. The more the project grew, the clearer it was that the identity was below, and the surface was removed entirely, finished images included. That cut is the reason the environments read as one place: every remaining location shares the same light, the same stone, the same absence of sky.",
          "A world that tries to have everything has nothing recognisable. Take a location away and the ones left get stronger.",
        ],
      },
      {
        heading: "Consistency is a smaller problem than for characters, and a different one",
        paragraphs: [
          "Nobody tracks a rock. A cavern can be regenerated between shots and no viewer will notice that a crack moved, as long as the light, the palette and the scale hold. What they notice is a change of mood: a cavern that was wet and cold becoming dry and warm across a cut.",
          "So the reference for an environment is not a single image to copy. It is two or three anchor shots per location that fix the light and the scale, and every new shot of that place is judged against them.",
        ],
      },
      {
        heading: "The averaging problem",
        paragraphs: [
          "Ask for a mystical forest and you get the mean of all mystical forests: symmetrical, centred, evenly lit, every tree a hero. That look is what makes AI environments recognisable at a glance. Breaking it means asking for the specific: a forest where the mushrooms are the only light, where the roots are bigger than the trees, where the camera is low and half the frame is mist.",
          "Specific is not the same as detailed. Over-detail is itself a tell. A drawn background has flat areas because a painter decided what mattered. A generated one texture-fills everything unless you tell it not to.",
        ],
      },
      {
        heading: "What to do",
        paragraphs: [
          "Write the negative rules first. Fix a palette and one warm accent. Cut the world down to the locations that share an identity. Make two or three anchor shots per location and judge every new one against them. And ask for what is strange about your world, not for what is beautiful about worlds in general.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Can AI generate anime backgrounds?",
      answer:
        "Yes, and often better than a small team could paint them. The problem is not quality but identity: a model returns the average of every similar place it has seen, and an episode built from averages looks like every other AI project. A world bible with negative rules is what keeps the environments one place.",
    },
    {
      question: "How do you keep AI backgrounds consistent between shots?",
      answer:
        "Differently from characters. Nobody tracks a rock, so exact detail can change. What must hold is light, palette and scale. Two or three anchor shots per location, and every new shot judged against them, is enough.",
    },
    {
      question: "Why do AI anime backgrounds all look the same?",
      answer:
        "Because generic prompts return generic averages: centred, symmetrical, evenly lit, texture everywhere. Asking for what is specific and strange about your world, and forbidding what does not belong in it, is what breaks the look.",
    },
    {
      question: "What is the world bible for Lost Garden?",
      answer:
        "A short set of rules for an underground world: no sunlight, no sky, blue and cyan palette, wet stone, one warm accent from the lantern and the machines, no recent human architecture. It is mostly a list of what must not appear.",
    },
  ],
  related: [
    { label: "How to prompt an anime style that is yours", href: "/anime-style-prompts" },
    { label: "Keeping a character consistent across shots", href: "/ai-character-consistency" },
    { label: "Why AI anime looks bad, and the fixes", href: "/why-ai-anime-looks-bad" },
    { label: "Making of Episode One", href: "/making-of-episode-1" },
  ],
};

const aiAnimeScript: Guide = {
  article: {
    byline:
      "The most searched question in this space is whether AI can write your anime. It can. The episode on this site was not written that way, and this is the argument for why, from someone who builds writing tools for a living.",
    sections: [
      {
        paragraphs: [
          "I build ScreenWeaver, a writing environment for film, and Lost Garden is written in it by hand. Both of those facts are true at once, and the reason is not squeamishness about AI. It is that the script is the one place where a model's greatest strength, producing the plausible average, is exactly what kills a story.",
        ],
      },
      {
        heading: "What a model writes when you ask for an anime script",
        paragraphs: [
          "A competent one. A chosen one with a mysterious past, a mentor, a betrayal in act two, an escalation, a sacrifice. Every beat lands where a thousand other scripts put it, because that is where the training data puts it. It reads fine. It is the script that everyone else who typed the same prompt also got.",
          "That is not a quality problem. Models write cleaner scenes than most first drafts. It is an identity problem. A story is the set of choices nobody else would make, and a model is built to make the choice most people would.",
        ],
        callouts: [
          "A generated image can be selected. A generated story has already selected for you.",
        ],
      },
      {
        heading: "Lost Garden would not survive it",
        paragraphs: [
          "The main character cannot speak. The child is not a weapon, not a miracle to spend, not a symbol. The knight is one of the weakest of thirteen and that is the point. The world is entirely underground and there is no sky. Each of those is a choice a model would flag as a problem and quietly fix, because each one makes the story harder to tell in the conventional way.",
          "Those hard choices are the story. Remove them and you have a competent fantasy about a strong knight who saves a magical girl, which exists ten thousand times already.",
        ],
      },
      {
        heading: "Where AI does belong in writing",
        paragraphs: [
          "Everywhere except the choices. Reading a draft back and asking what a stranger would not understand. Checking that a scene changes something. Finding where the exposition is hiding. Generating the storyboard from the finished scene, which ScreenWeaver does. Translating the script for the subtitles in three languages, then correcting the translation by hand.",
          "That is a lot of help, and none of it decides what the story is.",
        ],
      },
      {
        heading: "The one test",
        paragraphs: [
          "Before keeping any scene, ask what it changes. What does the viewer know at the end that they did not at the start. If the answer is nothing, no generation downstream saves it, and a model will not tell you, because the scene reads fine.",
          "The script is the constraint on everything else in the pipeline. It is also the cheapest thing to change, and the only thing that is entirely yours. Write it.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Can AI write an anime script?",
      answer:
        "It can write a competent one, and that is the problem. A model produces the plausible average: the chosen one, the mentor, the betrayal, the sacrifice, each beat where a thousand scripts put it. A story is the set of choices nobody else would make, which is the one thing a model is built not to do.",
    },
    {
      question: "Was Lost Garden written with AI?",
      answer:
        "No. The screenplay is written by hand in ScreenWeaver. AI is used downstream: the storyboard is generated from the finished script, drafts are read back for clarity, and subtitles are translated then corrected by hand. The story choices are human.",
    },
    {
      question: "What can AI help with in screenwriting?",
      answer:
        "Everything except the choices. Reading a draft for what a stranger would not follow, finding hidden exposition, checking that each scene changes something, generating a board from the finished scene, first-pass translation. None of that decides what the story is.",
    },
    {
      question: "What is the best way to start an anime script?",
      answer:
        "With one scene that changes something, not with a world or a series. Ask what the viewer knows at the end that they did not at the start. If the answer is nothing, no generation later saves it.",
    },
  ],
  related: [
    { label: "AI storyboards: what the board decides", href: "/ai-anime-storyboard" },
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "Lost Garden: story, world and characters", href: "/lost-garden-story-and-characters" },
    { label: "The creator's essay on making the series", href: "/vision" },
  ],
};

const aiAnimeCopyright: Guide = {
  article: {
    byline:
      "Who owns an AI anime, what can be protected, and how Lost Garden is built so that the answer is clear. Written by a filmmaker, not a lawyer, so read it as practice rather than advice.",
    sections: [
      {
        paragraphs: [
          "This is the question under every AI animation that gets any attention, and it deserves a plain answer rather than a shrug. The short version: the parts a human authored can be protected, the parts a machine generated on its own generally cannot, and the useful work is knowing which is which in your own project before anyone asks.",
          "Nothing here is legal advice. Rules differ by country and are still moving. What follows is how one independent production handles it.",
        ],
      },
      {
        heading: "What the current position roughly is",
        paragraphs: [
          "The clearest public statements so far come from the United States Copyright Office, which has said that material generated entirely by a machine, with no human authorship, is not registrable, while the human contributions to a work, its writing, its selection and arrangement, its editing, can be. Other jurisdictions have been less explicit, and none has said the opposite.",
          "Read that carefully and it describes an AI-assisted film quite well. The script is authored. The edit is authored. The choice of forty rejected takes and one kept is authored. The pixels inside a single generated shot are the grey area.",
        ],
        callouts: [
          "The film is the sum of human decisions. A shot is where the machine did its part. Protection follows the decisions.",
        ],
      },
      {
        heading: "How Lost Garden is built for it",
        paragraphs: [
          "The screenplay is written by hand. The world, the characters, Lanterne and Rose and the thirteen knights, the underground with no sky, all of that is original and designed for this project. The storyboard is generated from the script but every camera decision in it is a human one. The edit, the pacing, the sound placement, the choice of what stays, are human.",
          "Generated outputs are curated, corrected and rejected when they break the bible or feel generic. That last habit matters for more than taste: a shot that is the average of the training data is the shot with the weakest claim to being anyone's.",
        ],
      },
      {
        heading: "Design your own things",
        paragraphs: [
          "The strongest protection an independent project has is that its characters and world are its own. Not in the style of a known series, not a prompt that names another studio, not a character who is a famous one with the hair changed. An empty armour with a lantern for a head and a child who makes flowers grow are ours in the plain sense, and that is worth more than any registration.",
          "It is also the honest position with the people whose work trained the models. You cannot fix that debt from an indie budget, but you can decline to make it worse by imitating a living artist's style on purpose.",
        ],
      },
      {
        heading: "Disclose, and keep records",
        paragraphs: [
          "Lost Garden says on its own site what is generated and what is not, lists the tools, and explains the pipeline. Keep the script versions, the boards, the reference sets, the rejected takes. If the question ever comes up formally, the record of human decisions is the answer, and a record you did not keep cannot be reconstructed.",
        ],
      },
      {
        heading: "What this does not settle",
        paragraphs: [
          "Whether a single generated frame can be protected. Whether training was fair. Whether the rules will be the same in two years. None of that is in an indie filmmaker's power. What is in your power is to make a work where the human authorship is real, visible and documented, so that whatever the rules become, your film is on the right side of them.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Can you copyright an AI anime?",
      answer:
        "The human-authored parts, generally yes: the script, the edit, the selection and arrangement of shots, the original characters and world. Purely machine-generated material without human authorship has been described as not registrable, notably by the US Copyright Office. Rules differ by country and this is not legal advice.",
    },
    {
      question: "Who owns Lost Garden?",
      answer:
        "Frank Houbre. The screenplay, characters, world and edit are original human work, the generated shots are curated and corrected under that direction, and the production records are kept. The site states what is generated and what is not.",
    },
    {
      question: "Is it legal to make anime with AI?",
      answer:
        "Making it, yes. The open questions are about what can be protected and about how the models were trained, not about whether you may use them. Designing your own characters and not imitating a living artist's style keeps a project clear of the worst of it.",
    },
    {
      question: "Should I disclose that my anime uses AI?",
      answer:
        "Yes. It is the honest position, it is what the databases and festivals that accept AI work expect, and hiding it is the one thing that reliably turns a technical question into a reputational one.",
    },
  ],
  related: [
    { label: "Is AI anime really anime?", href: "/is-ai-anime-real-anime" },
    { label: "How to tell if an anime was made with AI", href: "/how-to-tell-if-anime-is-ai" },
    { label: "Lost Garden production notes", href: "/process" },
    { label: "AI film festivals that accept animation", href: "/ai-film-festivals-animation" },
  ],
};

const historyOfAiAnime: Guide = {
  article: {
    byline:
      "Who made the first AI anime depends on what you count. A short, dated history from the first backgrounds in 2023 to full broadcast series, with what each step actually proved.",
    sections: [
      {
        paragraphs: [
          "The question first AI anime gets asked a lot and answered badly, because it has three honest answers depending on whether you mean a short, a broadcast series, or a full independent episode. Here they are in order, with dates.",
        ],
      },
      {
        heading: "2023: the first backgrounds, and the first backlash",
        paragraphs: [
          "In January 2023 Netflix Japan released The Dog & the Boy, a short produced with WIT Studio in which the backgrounds were AI-generated and then corrected by hand. It was three minutes long and it was the first time a major studio put the words AI-generated in a credit. The reaction was immediate and mostly hostile, and it set the tone for everything since.",
          "A month later Corridor Digital published Anime Rock, Paper, Scissors, a short made by filming actors and transforming the footage with image models. It looked like anime, it was made by a YouTube studio in weeks, and it proved that a small team could get there. It also drew the same anger, for the same reasons.",
        ],
      },
      {
        heading: "2025: the first broadcast anime",
        paragraphs: [
          "Twins Hinahima, produced by Frontier Works and KaKa Creation, aired on Tokyo MX in March 2025. Roughly 95% of its animation cuts involved generative AI. It was a real television anime, a single 24 minute special, made in Japan for the Japanese market, and by every definition the anime databases use it counts. That is the answer to first broadcast AI anime in the strict sense.",
          "The same year Vidu and Aura Productions released a fifty-episode science fiction series of shorts, which showed the volume side of the story: not one prestige episode but a schedule.",
        ],
        callouts: [
          "By 2025 the question stopped being whether AI anime could exist and became whether anyone wanted it.",
        ],
      },
      {
        heading: "2026: services and solo episodes",
        paragraphs: [
          "Anipops launched in 2026 as Japan's first paid streaming service dedicated to AI anime originals, which is the moment the format acquired a business model rather than a demo.",
          "On 29 May 2026 Lost Garden released a seventeen minute episode written, directed, generated, edited and mixed by one person. It is not the first AI anime. It is, as far as I know, the first full-length episode of an original series made alone, and it was selected at the Seoul International AI Film Festival and reached the final of the AI London Festival on that basis.",
        ],
      },
      {
        heading: "What each step actually proved",
        list: [
          "2023 proved that AI could make a shot that looked like anime, and that audiences would be angry about it.",
          "2025 proved that an AI anime could be broadcast on television and counted as anime by the strictest definition.",
          "2026 proved that the format had customers, and that one person could finish an episode with a world of their own.",
        ],
        trailingParagraphs: [
          "Nothing yet has proved that AI anime can be great. That is the open step, and it is not a technical one.",
        ],
      },
      {
        heading: "Why the dates matter",
        paragraphs: [
          "Three years separate the first corrected backgrounds from a solo episode. The gap between what was possible in 2023 and 2026 is larger than the gap between 2023 and the decade before it. Anyone planning a project on the assumption that the tools will stay as they are is planning for a year that already ended.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "What was the first AI anime?",
      answer:
        "It depends what you count. The first short from a major studio with AI-generated backgrounds was The Dog & the Boy, Netflix Japan and WIT Studio, January 2023. The first broadcast anime was Twins Hinahima, a 24 minute TV special, on Tokyo MX in March 2025, with generative AI in about 95% of its cuts. The first full-length original episode made by one person, as far as is known, is Lost Garden, released 29 May 2026.",
    },
    {
      question: "Was Twins Hinahima the first AI anime?",
      answer:
        "It was the first AI anime broadcast on television in the strict sense, a 24 minute special: produced in Japan by Frontier Works and KaKa Creation, aired on Tokyo MX in March 2025, and counted as anime by the databases' own rules. Shorts using AI predate it by two years.",
    },
    {
      question: "Is Lost Garden the first AI anime?",
      answer:
        "No, and it does not claim to be. It is a seventeen minute episode of an original series made entirely by one person, released in May 2026, which is a different first. Broadcast AI anime and studio shorts came before it.",
    },
    {
      question: "How fast is AI anime changing?",
      answer:
        "Three years separate corrected AI backgrounds in a three minute short from a seventeen minute solo episode. Plans made on today's tools will be out of date within the production.",
    },
  ],
  related: [
    { label: "The 6 best AI anime, ranked", href: "/best-ai-anime" },
    { label: "Is AI anime really anime?", href: "/is-ai-anime-real-anime" },
    { label: "Making of Episode One", href: "/making-of-episode-1" },
    { label: "Can one person make an anime?", href: "/can-one-person-make-an-anime" },
  ],
};

const animeStylePrompts: Guide = {
  article: {
    byline:
      "Every anime prompt guide is a list of magic words. This is the opposite: how prompts are written on a production where the style has to belong to one film, and why the best prompt is mostly a list of what to leave out.",
    sections: [
      {
        paragraphs: [
          "Type anime style into any generator and you get anime style: big eyes, clean line, soft gradient, a character dead centre, evenly lit, staring at you. It is competent and it is what everyone gets. The whole problem of prompting for a real project is getting out of that average, and magic words do not do it, because magic words are the average.",
        ],
      },
      {
        heading: "The model gives you the mean",
        paragraphs: [
          "A model has seen a great many anime frames and, asked for one, returns the centre of them. Centred composition, symmetrical face, every element in focus, nothing cropped, nothing in shadow. That centring is the single most recognisable signature of generated images, and it comes from the prompt being general.",
          "So the first job of a prompt is not description. It is displacement: push the result away from the centre, in a direction that belongs to your film.",
        ],
        callouts: [
          "A generic prompt asks for anime. A production prompt asks for the one frame that could only exist in this film.",
        ],
      },
      {
        heading: "How a Lost Garden prompt is actually built",
        list: [
          "The reference first. A character sheet or an anchor shot of the location, attached, not described. Words drift, images do not.",
          "The camera. Low, wide, from behind, half the frame in mist. A camera decision is what stops the centring.",
          "The bible's rules. Blue and cyan, wet stone, no sky, one warm light. These are the same on every shot.",
          "What is forbidden. No sunlight, no warm ambient light, no crowd, no clean architecture. The negative list does more than the positive one.",
          "Then, last and shortest, the action of the shot.",
        ],
        trailingParagraphs: [
          "Notice that the words anime style are not in it. The style comes from the references and the bible. Naming it only pulls the result back toward the mean.",
        ],
      },
      {
        heading: "Shorter, not longer",
        paragraphs: [
          "The instinct is that a longer prompt is a more controlled one. It is the reverse. Every extra term is another thing the model can weight differently between runs, and long prompts drift more between shots, not less. The consistency of an episode comes from the references and the rules being identical on every shot, and from the free text being short.",
        ],
      },
      {
        heading: "Do not name a studio or an artist",
        paragraphs: [
          "It works, which is the problem. A prompt that names a known studio returns that studio's look, and your film becomes a copy of something with a lawyer. It is also the fastest way to make the style not yours. Build the look from your own references and your own rules. It takes longer and it is the only thing that survives.",
        ],
      },
      {
        heading: "The test",
        paragraphs: [
          "Show a stranger three frames from your project and three from another AI anime. If they cannot tell which are yours, the prompt is still generic, whatever it says. On Lost Garden the test is easy because the world has no sky, and a frame with a sky in it is somebody else's.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "What is the best prompt for anime style?",
      answer:
        "There is no magic string, because any general prompt returns the average anime frame: centred, symmetrical, evenly lit. A production prompt is built from an attached reference, a camera decision, the world bible's rules, a list of what is forbidden, and a short description of the action. The style comes from the references, not from the words.",
    },
    {
      question: "Why do my AI anime images all look centred and the same?",
      answer:
        "Because a general prompt returns the mean of the training data, and the mean is centred. A camera decision in the prompt, low, wide, from behind, cropped, is what displaces it. Attach references instead of describing them.",
    },
    {
      question: "Should I write long prompts for consistency?",
      answer:
        "No. Long prompts drift more between shots, because every extra term can be weighted differently each run. Consistency comes from identical references and rules on every shot and short free text.",
    },
    {
      question: "Is it fine to prompt in the style of a known studio?",
      answer:
        "It works and it is a bad idea. You get that studio's look, not yours, and a project built on it is both derivative and exposed. Build the style from your own references and bible.",
    },
  ],
  related: [
    { label: "Keeping a character consistent across shots", href: "/ai-character-consistency" },
    { label: "AI anime backgrounds: one world, not an average", href: "/ai-anime-backgrounds" },
    { label: "Why AI anime looks bad, and the fixes", href: "/why-ai-anime-looks-bad" },
    { label: "AI anime generators: what they really produce", href: "/ai-anime-generator" },
  ],
};

const editingAiAnime: Guide = {
  article: {
    byline:
      "Generated footage is not a film. The edit is where Episode One became one, and the cut is the tool that hides most of what generation gets wrong. How to edit AI animation, from the person who cut seventeen minutes of it.",
    sections: [
      {
        paragraphs: [
          "Every guide on AI anime ends at generation, as if the clips were the film. They are the raw material. The episode exists in the cut: the pacing, the holds, the choice of what the viewer sees and for how long, and the hundred decisions to lose a beautiful shot because it was wrong for the scene. None of that came out of a model and all of it is what people responded to.",
        ],
      },
      {
        heading: "Cut on movement",
        paragraphs: [
          "The oldest editing rule is the most useful one here. A cut that lands on a movement, a turn, a step, a hand reaching, is invisible, and an invisible cut hides the small drift between two generated shots. A cut on a still frame invites the eye to compare, and the comparison is where AI shows.",
          "This is why the board decides shot length before generation. You are cutting to the movement you planned, not hunting for one afterwards.",
        ],
        callouts: [
          "A viewer forgives a face that changes during a turn. They never forgive one that changes while it stares at them.",
        ],
      },
      {
        heading: "Shorter on faces, longer on the world",
        paragraphs: [
          "Drift is a function of duration. Two seconds on a face rarely betrays itself, eight seconds always does. So character shots run short and environment shots run long, and the rhythm of an AI anime tends toward that pattern whether you like it or not.",
          "The trick is to make a virtue of it. Lost Garden is a slow, quiet film, and its long holds are on caverns, machines, mist, not on a face pretending to act. That is a stylistic choice made from a technical limit, and most style is.",
        ],
      },
      {
        heading: "Cut to what they see, not to them",
        paragraphs: [
          "When a character reacts, the generated shot of the reaction is the risky one. Cut instead to what they are looking at, and let the sound carry the reaction. Lanterne has no face, so his reactions are already a creak and a gesture, and the episode learned early that the thing he sees is the shot.",
        ],
      },
      {
        heading: "Regenerate or cut around: the only real decision",
        paragraphs: [
          "Every flawed shot poses the same question. Is it wrong, or merely imperfect. Wrong means regenerate: the shot contradicts the bible, the character is someone else, the action is not the action. Imperfect means cut around it: trim it shorter, go wide, put the flaw in shadow, cut away before the eye finds it.",
          "Telling those apart quickly is most of the craft. Regenerating everything imperfect never finishes. Cutting around everything wrong makes a film nobody believes.",
        ],
      },
      {
        heading: "Lose the beautiful shot",
        paragraphs: [
          "The hardest cut is the frame you love that does not belong. It was generated before the scene had a reason, or it is a golden hour in a world with no sky, or it is simply longer than the scene can hold. Keep it and the film bends around it. The bible is what lets you cut it without a fight, because the rule is not your taste and the shot breaks the rule.",
        ],
      },
      {
        heading: "Sound is half the cut",
        paragraphs: [
          "Footsteps on wet stone, a creak of armour, the distance of a cavern. Sound placed in the edit is what makes a generated space real, and it papers over a cut that the picture alone could not. Music last, and less than any trailer would use. Silence is a cut too.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "How do you edit AI generated anime?",
      answer:
        "Like film, with three habits added. Cut on movement so drift between shots stays invisible. Keep character shots short and environment shots long, since drift grows with duration. And decide quickly whether a flawed shot is wrong, which means regenerate, or merely imperfect, which means cut around it.",
    },
    {
      question: "Why does the edit matter so much in AI animation?",
      answer:
        "Because generation produces clips, not a film. Pacing, holds, what the viewer sees and for how long, and the decision to lose a beautiful shot that does not belong, are where an episode is made. Viewers respond to the cut, not to the model.",
    },
    {
      question: "How do you hide inconsistencies between AI shots?",
      answer:
        "Cut on movement, keep the shot short, go wide, put the character in shadow, or cut to what they are looking at instead of at them. Sound placed in the edit covers the rest. Long holds on a face are the one thing nothing hides.",
    },
    {
      question: "Should I regenerate a bad shot or cut around it?",
      answer:
        "Regenerate if it is wrong: it contradicts the world bible, the character is someone else, the action is not the action. Cut around it if it is merely imperfect. Regenerating everything imperfect never finishes, and cutting around everything wrong makes a film nobody believes.",
    },
  ],
  related: [
    { label: "How the voices and sound were made", href: "/ai-anime-voice-and-sound" },
    { label: "Keeping a character consistent across shots", href: "/ai-character-consistency" },
    { label: "AI storyboards: what the board decides", href: "/ai-anime-storyboard" },
    { label: "Making of Episode One", href: "/making-of-episode-1" },
  ],
};

const whyAiAnimeLooksBad: Guide = {
  article: {
    byline:
      "Most AI anime looks bad, and it is rarely the model's fault. The six reasons, in the order they usually happen, and what a finished episode did about each one.",
    sections: [
      {
        paragraphs: [
          "The complaint is fair. Most AI anime does look bad: smooth, empty, samey, a trailer for a show that does not exist. What is wrong with the complaint is the diagnosis. People blame the model, and the model is the one part that has improved every quarter. The problems are upstream and downstream of it, and they are the same six on almost every project.",
        ],
      },
      {
        heading: "1. There is no story, so there is nothing to cut to",
        paragraphs: [
          "A reel of beautiful shots with no scene between them reads as bad even when every frame is good, because the eye has nothing to follow. This is the most common cause and the least discussed, since it has nothing to do with AI. The fix is a script with scenes that change something, before any generation.",
        ],
      },
      {
        heading: "2. It is the average",
        paragraphs: [
          "Centred characters, symmetrical faces, evenly lit rooms, every tree a hero, texture everywhere. That look is the mean of the training data and it is what a general prompt returns. It is recognisable in a second and it belongs to nobody. The fix is a world bible with rules and forbidden things, references attached rather than described, and a camera decision in every prompt.",
        ],
        callouts: [
          "Bad AI anime is not ugly. It is average, which is worse, because ugly at least belongs to someone.",
        ],
      },
      {
        heading: "3. The faces drift and the shots are too long",
        paragraphs: [
          "A character who is a slightly different person in every shot breaks the illusion faster than any other flaw, and a long hold on a face is where it shows. The fix is a reference set per character, a design with a strong silhouette and few features, and short character shots cut on movement. Lanterne is an empty armour with a lantern for a head for exactly this reason.",
        ],
      },
      {
        heading: "4. Everything floats",
        paragraphs: [
          "Generated motion interpolates. Anime snaps, holds, drops frames on purpose. So generated characters glide into poses they should hit, feet slide instead of planting, and a fight looks like a dance underwater. The fix is partly directing against it, partly choosing what to show: Lost Garden is quiet and slow, and its action is mostly things waking up, because that is what the motion does well.",
        ],
      },
      {
        heading: "5. Music under everything",
        paragraphs: [
          "Scores are cheap now, so every scene gets one, and the episode flattens into a seventeen minute trailer. The fix is a sound bible as strict as the visual one, footsteps and room tone placed by hand, and silence where a lesser project would fill it. Half of what makes an AI anime feel real is in the audio, and it is the half most projects skip entirely.",
        ],
      },
      {
        heading: "6. It was never edited",
        paragraphs: [
          "Clips laid end to end in generation order are not an edit. Pacing, holds, cutting to what a character sees rather than at them, losing the beautiful shot that does not belong: this is where a film gets made, and it is the step most AI projects treat as export. The fix is to cut like an editor, which means being willing to throw away most of what was generated.",
        ],
      },
      {
        heading: "What this adds up to",
        paragraphs: [
          "Every one of those six is a decision, not a model. Which is the good news: it means the difference between AI anime that looks bad and AI anime that does not is available to anyone willing to write, design, direct, edit and mix, and unavailable to anyone hoping the next model will do it for them.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Why does AI anime look bad?",
      answer:
        "Six reasons that recur on almost every project, and none is the model: no story so nothing cuts together, generic prompts returning the average look, faces drifting in long shots, floating interpolated motion, music under every scene, and no real edit. Each is a decision, and each has a fix.",
    },
    {
      question: "Why does AI animation look so smooth and floaty?",
      answer:
        "Because video models interpolate everything, while anime holds poses, snaps between them and drops frames on purpose. Directing against it helps, and so does choosing what to show: slow, quiet action suits generated motion, fast choreography exposes it.",
    },
    {
      question: "Why do all AI anime look the same?",
      answer:
        "General prompts return the mean of the training data: centred, symmetrical, evenly lit, texture everywhere. A world bible with forbidden things, attached references and a camera decision in every prompt is what makes a project look like itself.",
    },
    {
      question: "Will better models fix AI anime?",
      answer:
        "They fix drift, hands and motion a little more every quarter. They do not write a scene, design a silhouette, place a footstep or cut a shot that does not belong. Those are where most AI anime fails, and they are not model problems.",
    },
  ],
  related: [
    { label: "How to tell if an anime was made with AI", href: "/how-to-tell-if-anime-is-ai" },
    { label: "How to prompt an anime style that is yours", href: "/anime-style-prompts" },
    { label: "Editing AI anime: where the episode is made", href: "/editing-ai-anime" },
    { label: "How the voices and sound were made", href: "/ai-anime-voice-and-sound" },
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
  ],
};

const aiFilmFestivalsAnimation: Guide = {
  article: {
    byline:
      "Episode One was selected in Seoul and reached the final in London. What festival selection did for an independent AI anime, which festivals accept the format, and how to submit without wasting the fee.",
    sections: [
      {
        paragraphs: [
          "Festivals are the one credential an independent AI animation can earn that does not come from a view counter. Lost Garden Episode One was selected at the Seoul International AI Film Festival and reached the final of the AI London Festival, and those two lines did more for the project than the number of views did: they opened a database entry, a press conversation and a reason for a stranger to take seventeen minutes seriously.",
        ],
      },
      {
        heading: "Two kinds of festival, and they want different things",
        paragraphs: [
          "Dedicated AI film festivals, of which there are now several, exist to show what the tools can do and to argue about it. They accept the format by definition, they are judged by people who know what a good generated shot costs, and they are where an AI anime is compared to its peers rather than to a studio feature.",
          "General animation festivals are a different conversation. Some exclude AI-assisted work outright, some require disclosure, most have not decided. Read the rules before paying, and if the rules do not mention AI, ask. Submitting undisclosed work to a festival that would have refused it is the one way to make a technical choice into a reputation problem.",
        ],
        callouts: [
          "A festival that says nothing about AI has not said yes. Ask before you pay the fee.",
        ],
      },
      {
        heading: "What selection actually changed",
        paragraphs: [
          "TMDB, which had looked closed to independent productions under its own rules, listed the series once festival selections existed to point to. Press that would not open an email about an AI anime opened one about a festival finalist. And the project acquired a sentence that a stranger can verify in ten seconds, which is worth more than any description of the pipeline.",
          "It did not change the episode. The same seventeen minutes were there before and after. Selection is a credential, not a review.",
        ],
      },
      {
        heading: "What a jury is looking at",
        paragraphs: [
          "Not the tools. Every entry in an AI festival used tools, and the jury has seen every model's signature. What separates entries is whether there is a story, whether the world belongs to one film, whether the characters hold, whether the sound was made or dumped in, and whether it was edited. In other words, exactly the things that separate AI anime that looks bad from AI anime that does not.",
          "A quiet, coherent seventeen minutes with a character who cannot speak got further than a louder reel would have. Coherence is rare in this category and juries notice it.",
        ],
      },
      {
        heading: "How to submit without wasting money",
        list: [
          "Finish the film. Festivals get demos, and a demo loses to a finished short of a third the ambition.",
          "Disclose the pipeline in the submission notes, plainly, with what was human and what was generated.",
          "Have a press page ready before you submit: synopsis, stills, a still of the creator, contact. Selection generates requests within days.",
          "Submit to the dedicated AI festivals first. That is where the format is judged fairly and where a selection is likely enough to justify the fee.",
          "Keep the film off public platforms if a festival requires a premiere, and read that rule twice.",
        ],
      },
      {
        heading: "What it is not",
        paragraphs: [
          "A selection is not distribution and it is not an audience. Episode One has passed sixty-five thousand views on YouTube, and a festival screening seats a few hundred people. Festivals give you the sentence, the listing and the conversation. The viewers you still have to earn.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Which film festivals accept AI animation?",
      answer:
        "Dedicated AI film festivals accept it by definition; Lost Garden was selected at the Seoul International AI Film Festival and reached the final of the AI London Festival. General animation festivals vary: some exclude AI-assisted work, some require disclosure, many have not decided. If the rules do not mention AI, ask before paying.",
    },
    {
      question: "What does festival selection do for an AI anime?",
      answer:
        "It gives the project a verifiable credential. For Lost Garden it helped open a TMDB listing, made press conversations possible, and gave strangers a reason to take a seventeen minute episode seriously. It did not bring viewers by itself.",
    },
    {
      question: "Should I disclose AI use when submitting to a festival?",
      answer:
        "Always. Dedicated AI festivals expect it, general festivals may require it, and submitting undisclosed work to one that would have refused it turns a technical choice into a reputation problem.",
    },
    {
      question: "What do AI film festival juries look for?",
      answer:
        "Not tools, which every entry used. Story, a world that belongs to one film, characters that hold across shots, sound that was made rather than dumped in, and a real edit. Coherence is rare in the category and it is what gets noticed.",
    },
  ],
  related: [
    { label: "Making of Episode One", href: "/making-of-episode-1" },
    { label: "Press kit", href: "/press" },
    { label: "Is AI anime really anime?", href: "/is-ai-anime-real-anime" },
    { label: "Copyright and AI anime: what can be protected", href: "/ai-anime-copyright" },
  ],
};

const lostGardenStoryAndCharacters: Guide = {
  article: {
    byline:
      "A hollow knight, a child who makes flowers grow, thirteen armours bound by an oath, and a world with no sky. What Lost Garden is about, who is in it, and what Episode One sets in motion, without spoiling the ending.",
    sections: [
      {
        paragraphs: [
          "Lost Garden is a dark fantasy series set entirely underground, in a network of immense caverns filled with blue forests, cyan mist, glowing mushrooms, white lilies, giant roots, rivers in the dark and machines asleep under moss. There is no sky. Nobody in the story has ever seen one.",
          "It is a story about memory, transmission, sacrifice and the possibility of still loving in a world that is almost entirely lost. It is quiet, slow, and not for very young children, though there is nothing explicit in it.",
        ],
      },
      {
        heading: "Lanterne, the twelfth knight",
        paragraphs: [
          "Lanterne is an empty suit of old armour whose helmet is shaped like a lantern. There is no body inside. He cannot speak, cannot write, cannot explain who he is or what he remembers. What he feels comes out as hollow metallic sounds, creaks, empty breaths and small gestures.",
          "He wakes alone on an ancient altar, animated by a strange blue energy, and he is the twelfth of thirteen knights, one of the weakest. Around his neck hangs a pendant showing the face of a child. When she is near, it glows blue. Lanterne is not a hero in the usual sense. He stumbles, hesitates, falls, and watches the world with the fragile attention of someone who has forgotten how to exist. What remains in him is warmth, and it may be the only thing that lets him protect her without losing what made him human.",
        ],
      },
      {
        heading: "Rose, the child",
        paragraphs: [
          "Rose is small, calm and almost unreal. She walks through ruined places with a strange serenity, as if she can hear what the world has forgotten. Around her flowers bloom, roots move, and the dead earth sometimes remembers how to breathe. She is what the story calls a Source Child, connected to the rebirth of a wounded world.",
          "The series is careful about what she is not. She is not a weapon, not a miracle to spend, not a symbol. She is a child, and she must be protected for that reason alone.",
        ],
        callouts: [
          "One character has no voice. The other has no need of one. Most of the story happens in the space between them.",
        ],
      },
      {
        heading: "The thirteen knights and the oath",
        paragraphs: [
          "Lanterne is one of thirteen hollow armours, numbered from thirteen down to one. Each is bound by an oath to a Source Child of its own, and each could become a rival to the others. Two faces are known so far.",
          "Serrure, the ninth knight, is the second. Unlike many of the oath-bound, he has not lost his warmth. He is gentle, welcoming, and one of the first signs to Lanterne that not every knight is an enemy. He explains the oath, the Source Children, and the path toward the Forgotten Garden. His kindness is real and his oath is dangerous, because he is bound to a child of his own, a boy with red and white hair named Aren, whose awakening closes the first episode.",
        ],
      },
      {
        heading: "What else lives in the dark",
        paragraphs: [
          "The Sleeping Machines are colossal beings, half mechanical and half organic, buried in the blue forests since an old catastrophe. Rusted, cracked, covered in fungi, they do not hate and do not forgive. Some of their eyes still open in the dark, and when one wakes it wakes like a forgotten disaster.",
          "The Masked Pilgrims are seen only from afar: figures in black hoods and white masks, crossing the stone platforms in silent processions, their gongs echoing across the abyss. Nobody knows whether they are guardians, mourners, or something older. Their presence means the depths are not empty.",
        ],
      },
      {
        heading: "What Episode One sets in motion",
        paragraphs: [
          "The first episode follows Lanterne from the altar where he wakes, through the blue forest, to the first stirring of something ancient in the dark, and to the child in the lilies whose face he has been carrying. It ends with another awakening, Aren's, which is Serrure's oath coming due.",
          "It runs seventeen minutes, in English with French, Japanese and Korean subtitles, and it is free to watch on YouTube and on this site. Episode Two is in production.",
        ],
      },
      {
        heading: "Where it comes from",
        paragraphs: [
          "The series is written, directed and produced by Frank Houbre, alone, in France, with an AI-assisted pipeline under human direction. Its influences are not hidden: the sense of wonder, danger and lost innocence of Made in Abyss, the scale and slow revelation of Attack on Titan. It is not trying to copy either. It is trying to carry the same weight, with an empty armour and a child.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "What is Lost Garden about?",
      answer:
        "A hollow knight named Lanterne, an empty armour with a lantern for a head who cannot speak, wakes beneath the earth with no memory and must protect Rose, a child whose presence makes life return. It is a dark fantasy about memory, sacrifice and love in an underground world with no sky.",
    },
    {
      question: "Who are the characters in Lost Garden?",
      answer:
        "Lanterne, the twelfth knight, a voiceless hollow armour. Rose, a Source Child who makes flowers grow. Serrure, the ninth knight, kind and bound by his own oath to a boy named Aren. The Sleeping Machines, ancient half-organic relics under the moss. And the Masked Pilgrims, silent processions with gongs, seen only from afar.",
    },
    {
      question: "What are the Thirteen Knights?",
      answer:
        "Thirteen hollow armours, numbered from thirteen down to one, each bound by an oath to a Source Child of its own. Lanterne is the twelfth and one of the weakest. Serrure is the ninth. The others will be revealed in coming episodes.",
    },
    {
      question: "How does Episode One end?",
      answer:
        "With an awakening. Aren, the boy with red and white hair bound to Serrure, wakes, which is the ninth knight's oath coming due. What that means for Lanterne and Rose is the subject of Episode Two, now in production.",
    },
  ],
  related: [
    { label: "Watch Episode One", href: "/episode-1" },
    { label: "Making of Episode One", href: "/making-of-episode-1" },
    { label: "How the voices and sound were made", href: "/ai-anime-voice-and-sound" },
    { label: "The creator's essay on making the series", href: "/vision" },
  ],
};

export const guidesEn: Record<GuideSlug, Guide> = {
  "/how-to-make-ai-anime": howToMakeAiAnime,
  "/ai-character-consistency": characterConsistency,
  "/is-ai-anime-real-anime": isAiAnimeRealAnime,
  "/ai-anime-vs-traditional-animation": aiVsTraditional,
  "/ai-manga": aiManga,
  "/ai-anime-generator": aiAnimeGenerator,
  "/ai-anime-voice-and-sound": aiAnimeVoiceAndSound,
  "/how-to-tell-if-anime-is-ai": howToTellIfAnimeIsAi,
  "/making-of-episode-1": makingOfEpisodeOne,
  "/can-one-person-make-an-anime": canOnePersonMakeAnAnime,
  "/ai-anime-storyboard": aiAnimeStoryboard,
  "/ai-anime-backgrounds": aiAnimeBackgrounds,
  "/ai-anime-script": aiAnimeScript,
  "/ai-anime-copyright": aiAnimeCopyright,
  "/history-of-ai-anime": historyOfAiAnime,
  "/anime-style-prompts": animeStylePrompts,
  "/editing-ai-anime": editingAiAnime,
  "/why-ai-anime-looks-bad": whyAiAnimeLooksBad,
  "/ai-film-festivals-animation": aiFilmFestivalsAnimation,
  "/lost-garden-story-and-characters": lostGardenStoryAndCharacters,
};
