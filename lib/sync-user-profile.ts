import { type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export async function syncUserProfile(user: User): Promise<void> {
  const ref = doc(getDb(), "users", user.uid);
  const providerIds = user.providerData.map((p) => p.providerId);
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      providers: providerIds,
      lastLoginAt: serverTimestamp(),
      source: "lost-garden",
      ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true },
  );
}
