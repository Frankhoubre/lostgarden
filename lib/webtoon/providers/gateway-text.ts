import "server-only";

/**
 * Vercel AI Gateway text provider: one chat completion that must answer in
 * JSON. Used by the studio to translate the lettering of a panel. Same key
 * as the image provider, server side only.
 */

export const GATEWAY_TEXT_MODEL = "anthropic/claude-sonnet-5";
const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

export type UserPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type UserContent = string | UserPart[];

export async function completeJson<T>(input: {
  system: string;
  user: UserContent;
  model?: string;
  maxTokens?: number;
  /**
   * Reasoning budget. The writer runs with "none": on a long task with many
   * images the model otherwise spends the whole output budget thinking and
   * the answer comes back empty or cut ("length" with 0 chars observed).
   */
  reasoning?: "none" | "low" | "medium" | "high";
  /** Sampling temperature; 0 for a check that must answer the same way twice. */
  temperature?: number;
  /** Receives what the gateway billed for the call (and its repair), in USD. */
  onCost?: (usd: number) => void;
}): Promise<T> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not set");
  const baseUrl = process.env.AI_GATEWAY_BASE_OPENAI_COMPAT_URL ?? GATEWAY_BASE_URL;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: input.model ?? GATEWAY_TEXT_MODEL,
      temperature: input.temperature ?? 0.3,
      max_tokens: input.maxTokens ?? 4000,
      max_completion_tokens: input.maxTokens ?? 4000,
      ...(input.reasoning ? { reasoning_effort: input.reasoning } : {}),
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI Gateway ${response.status}: ${detail.slice(0, 500)}`);
  }
  const json = (await response.json()) as { choices?: { message?: { content?: string }; finish_reason?: string }[]; usage?: { cost?: number | string } };
  const billed = Number(json.usage?.cost ?? 0);
  if (Number.isFinite(billed) && billed > 0) input.onCost?.(billed);
  const choice = json.choices?.[0];
  const content = choice?.message?.content ?? "";
  if (choice?.finish_reason && choice.finish_reason !== "stop") {
    console.warn(`[webtoon] gateway text answer ended with ${choice.finish_reason} after ${content.length} chars`);
  }
  return parseJsonAnswer<T>(content, apiKey, baseUrl, input.onCost);
}

const REPAIR_MODEL = "anthropic/claude-haiku-4.5";

/**
 * Reads the JSON of a model answer. A long answer sometimes carries a
 * broken quote or a stray comma; rather than losing the whole call, a small
 * model is asked once to return the same JSON, valid.
 */
async function parseJsonAnswer<T>(content: string, apiKey: string, baseUrl: string, onCost?: (usd: number) => void): Promise<T> {
  const extract = (text: string) => /\{[\s\S]*\}/.exec(text.replace(/^```(?:json)?\s*|\s*```$/g, ""))?.[0] ?? null;
  const first = extract(content);
  if (!first) throw new Error("AI Gateway returned no JSON");
  try {
    return JSON.parse(first) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid JSON";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: REPAIR_MODEL,
        temperature: 0,
        max_tokens: 16000,
        messages: [
          { role: "system", content: "You repair JSON. Answer with the same JSON, made valid (escape quotes inside strings, fix commas and brackets), and nothing else. Do not change any value beyond what validity requires." },
          { role: "user", content: `This JSON fails to parse (${reason}):\n\n${first}` },
        ],
      }),
    });
    if (!response.ok) throw new Error(`AI Gateway returned invalid JSON (${reason}) and the repair failed (${response.status})`);
    const repaired = (await response.json()) as { choices?: { message?: { content?: string } }[]; usage?: { cost?: number | string } };
    const repairBilled = Number(repaired.usage?.cost ?? 0);
    if (Number.isFinite(repairBilled) && repairBilled > 0) onCost?.(repairBilled);
    const second = extract(repaired.choices?.[0]?.message?.content ?? "");
    if (!second) throw new Error(`AI Gateway returned invalid JSON (${reason}) and the repair returned none`);
    try {
      return JSON.parse(second) as T;
    } catch {
      throw new Error(`AI Gateway returned invalid JSON (${reason}) and the repair did not fix it`);
    }
  }
}
