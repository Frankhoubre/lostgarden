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
    { label: "How to make an AI anime, step by step", href: "/how-to-make-ai-anime" },
    { label: "The 6 best AI anime, ranked", href: "/best-ai-anime" },
    { label: "Lost Garden production notes", href: "/process" },
    { label: "Imaginode, the generation platform used", href: "https://imaginode.ai" },
  ],
};

export const guidesEn: Record<GuideSlug, Guide> = {
  "/how-to-make-ai-anime": howToMakeAiAnime,
  "/ai-character-consistency": characterConsistency,
};
