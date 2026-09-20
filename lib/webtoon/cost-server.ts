import "server-only";

/**
 * Running total of what a strip has cost in generations, kept in Firestore
 * (`webtoon_costs/<slug>`) and shown next to the title in the studio. Each
 * route adds what the gateway billed for its calls, as the signed-in
 * account (the browser's Firebase ID token is forwarded), so the Firestore
 * rules apply as from the studio. Nothing is recorded behind the dev bypass.
 */

export type CostKind = "images" | "sheets" | "writer" | "translate";

export async function recordCost(input: { idToken: string | null; slug: string; usd: number; kind: CostKind }): Promise<void> {
  if (!input.idToken || !(input.usd > 0)) return;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return;
  const document = `projects/${projectId}/databases/(default)/documents/webtoon_costs/${input.slug}`;
  const body = {
    writes: [
      {
        update: { name: document, fields: { updated_at_iso: { stringValue: new Date().toISOString() } } },
        updateMask: { fieldPaths: ["updated_at_iso"] },
        updateTransforms: [
          { fieldPath: "total_usd", increment: { doubleValue: input.usd } },
          { fieldPath: `${input.kind}_usd`, increment: { doubleValue: input.usd } },
          { fieldPath: "count", increment: { integerValue: "1" } },
          { fieldPath: `${input.kind}_count`, increment: { integerValue: "1" } },
        ],
      },
    ],
  };
  try {
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${input.idToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) console.error("[webtoon] cost not recorded", response.status, (await response.text()).slice(0, 200));
  } catch (error) {
    console.error("[webtoon] cost not recorded", error);
  }
}
