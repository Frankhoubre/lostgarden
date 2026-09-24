import { completeJson } from "./providers/gateway-text";
import type { Figure } from "./lettering";
import type { ReferenceAsset, WebtoonPanel } from "./types";

/**
 * THE DRAWN IMAGE, CHECKED. Frank found panels where the image contradicts
 * the panel: a character nobody asked for (470, 484, 551, 552, 600, 601),
 * two Lanternes (459), swords or a spear in Lanterne's hands (549 to 585),
 * Serrure without his helmet (577), Lanterne without his when he wears it
 * (609). A vision model looks at the image with the panel's cast, state and
 * canon, says where each character's head is (the lettering places the
 * bubbles from it) and lists what breaks the panel. The route redraws once
 * with those faults named.
 */

export type ImageCheck = { figures: Figure[]; issues: string[]; cost_usd: number };

export async function checkPanelImage(input: {
  image: string;
  panel: Pick<WebtoonPanel, "characters" | "description" | "dialogue" | "objects">;
  library: ReferenceAsset[];
  canon?: Record<string, string[]>;
}): Promise<ImageCheck> {
  const { panel } = input;
  const cast = panel.characters.map((id) => {
    const sheet = input.library.find((a) => a.kind === "character" && a.subject === id);
    return { id, name: sheet?.name.split(",")[0] ?? id, looks: (sheet?.must_keep ?? "").slice(0, 260) };
  });
  const canon = panel.characters.flatMap((id) => input.canon?.[id] ?? []);
  const state = /STATE TO KEEP EXACTLY:([^]*?)(?=MOTION:|EFFECTS|SCALE:|$)/.exec(panel.description)?.[1]?.trim() ?? "";
  let usd = 0;
  try {
    const answer = await completeJson<{ figures?: { who?: string; head?: { x?: number; y?: number } }[]; issues?: string[] }>({
      system: [
        "You check one drawn webtoon panel against what it must show, like a strict continuity supervisor.",
        "1. FIGURES: every character or creature drawn in the image, with `who` (one of the expected ids when it is that character, else \"unknown\") and `head`: the centre of its head, helmet or face, in percent of the image (x from the left, y from the top). A character seen from behind still has a head position.",
        "2. ISSUES: only real faults, each in one short English sentence an illustrator can act on. Faults: a person, knight or creature that is NOT in the expected cast (not a background silhouette of scenery); an expected character missing; the same character drawn twice; a canon rule broken; the state broken (a helmet on when it must be off, or off when it must be on); letters or text drawn in the image. Style, beauty and small details are not faults. When everything is right, `issues` is empty.",
        'Answer with JSON only: {"figures": [{"who", "head": {"x", "y"}}], "issues": [..]}.',
      ].join("\n\n"),
      user: [
        { type: "text", text: `EXPECTED CAST (id, name, design):\n${JSON.stringify(cast)}${canon.length ? `\n\nCANON:\n- ${canon.join("\n- ")}` : ""}${state ? `\n\nSTATE: ${state}` : ""}\n\nPANEL: ${panel.description.split("STATE TO KEEP")[0].slice(0, 500)}` },
        { type: "image_url", image_url: { url: input.image } },
        { type: "text", text: "Check the image now, as JSON." },
      ],
      maxTokens: 1500,
      reasoning: "none",
      temperature: 0,
      onCost: (value) => {
        usd += value;
      },
    });
    const ids = new Set(panel.characters);
    const figures: Figure[] = (answer.figures ?? [])
      .filter((f) => f && f.head && Number.isFinite(Number(f.head.x)) && Number.isFinite(Number(f.head.y)))
      .map((f) => ({ who: ids.has(String(f.who)) ? String(f.who) : "unknown", head: { x: Number(f.head!.x), y: Number(f.head!.y) } }));
    const issues = (answer.issues ?? []).filter((i) => typeof i === "string" && i.trim()).slice(0, 6);
    return { figures, issues, cost_usd: usd };
  } catch {
    return { figures: [], issues: [], cost_usd: usd };
  }
}
