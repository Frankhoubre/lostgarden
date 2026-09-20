import "server-only";

/**
 * Server-side upload to Firebase Storage on behalf of the signed-in studio
 * account: the route forwards the browser's Firebase ID token, so the
 * Storage rules apply exactly as they do from the browser, and no service
 * account is needed. Used so a generated image never travels back through
 * the function response (Vercel caps it at 4.5 MB); the browser only
 * receives the public URL.
 */

export async function uploadToStorage(input: {
  idToken: string;
  path: string;
  bytes: Buffer;
  contentType: string;
}): Promise<string> {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) throw new Error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set");
  const name = encodeURIComponent(input.path);
  const response = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${name}`, {
    method: "POST",
    headers: {
      Authorization: `Firebase ${input.idToken}`,
      "Content-Type": input.contentType,
      "Content-Length": String(input.bytes.byteLength),
    },
    body: new Uint8Array(input.bytes),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Storage ${response.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await response.json()) as { name?: string; downloadTokens?: string };
  const token = json.downloadTokens?.split(",")[0];
  if (!json.name || !token) throw new Error("Storage returned no download token");
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(json.name)}?alt=media&token=${token}`;
}

/** Stores a generated image when a real account is behind the request; returns null to fall back to a data URL. */
export async function storeGeneratedImage(input: {
  idToken: string | null;
  path: string;
  base64: string;
  mediaType: string;
}): Promise<string | null> {
  if (!input.idToken) return null;
  try {
    return await uploadToStorage({
      idToken: input.idToken,
      path: input.path,
      bytes: Buffer.from(input.base64, "base64"),
      contentType: input.mediaType,
    });
  } catch (error) {
    console.error("[webtoon] storage upload failed, falling back to data URL", error);
    return null;
  }
}
