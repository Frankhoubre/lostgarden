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

export async function completeJson<T>(input: { system: string; user: UserContent; model?: string; maxTokens?: number }): Promise<T> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not set");
  const baseUrl = process.env.AI_GATEWAY_BASE_OPENAI_COMPAT_URL ?? GATEWAY_BASE_URL;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: input.model ?? GATEWAY_TEXT_MODEL,
      temperature: 0.3,
      max_tokens: input.maxTokens ?? 4000,
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
  const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "";
  const match = /\{[\s\S]*\}/.exec(content.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  if (!match) throw new Error("AI Gateway returned no JSON");
  return JSON.parse(match[0]) as T;
}
