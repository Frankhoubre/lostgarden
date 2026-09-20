import "server-only";

/**
 * Server-side check for the studio routes. The browser sends its Firebase ID
 * token; we ask Identity Toolkit who it belongs to (no Admin SDK needed, the
 * public web API key is enough) and compare the address with the allowlist.
 */
const BUILT_IN_STUDIO_EMAILS = ["frank.houbre@gmail.com"];

function allowedEmails(): string[] {
  const extra = (process.env.NEXT_PUBLIC_WEBTOON_STUDIO_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...BUILT_IN_STUDIO_EMAILS, ...extra])];
}

type LookupResponse = { users?: { email?: string; emailVerified?: boolean }[] };

export type StudioIdentity = { email: string; /** The Firebase ID token of the account, to act on its behalf (Storage). Null behind the dev bypass. */ idToken: string | null };

export async function verifyStudioRequest(request: Request): Promise<StudioIdentity | null> {
  // Local work behind ?dev=1: the gate is open in the browser, so the route
  // opens too, on the dev server only, when the editor says so.
  if (process.env.NODE_ENV === "development" && request.headers.get("x-studio-dev") === "1") {
    return { email: "dev@localhost", idToken: null };
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as LookupResponse;
    const user = payload.users?.[0];
    const email = user?.email?.toLowerCase();
    if (!email || !user?.emailVerified) return null;
    return allowedEmails().includes(email) ? { email, idToken: token } : null;
  } catch {
    return null;
  }
}
