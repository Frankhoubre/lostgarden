"use client";

import { getFirebaseAuth } from "@/lib/firebase";

/** Headers of a studio route call: the account's Firebase token, or the local bypass behind ?dev=1. */
export async function studioHeaders(): Promise<Record<string, string>> {
  const token = (await getFirebaseAuth().currentUser?.getIdToken().catch(() => "")) ?? "";
  if (token) return { Authorization: `Bearer ${token}` };
  if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("dev")) return { "x-studio-dev": "1" };
  return {};
}
