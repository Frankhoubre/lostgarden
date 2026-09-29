"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { LIBRARY_COLLECTION } from "@/lib/webtoon/library";
import { EMPTY_GLOSSARY, glossaryDocId, type Glossary } from "@/lib/webtoon/glossary";

export async function loadGlossary(series: string): Promise<Glossary> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, glossaryDocId(series)));
  if (!snapshot.exists()) return EMPTY_GLOSSARY;
  try {
    const value = JSON.parse((snapshot.data() as { glossary_json?: string }).glossary_json ?? "null") as Glossary | null;
    return value ? { terms: value.terms ?? [], voices: value.voices ?? [], updated_at: value.updated_at } : EMPTY_GLOSSARY;
  } catch {
    return EMPTY_GLOSSARY;
  }
}

export async function saveGlossary(series: string, glossary: Glossary, user: User): Promise<void> {
  const value: Glossary = { ...glossary, updated_at: new Date().toISOString() };
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, glossaryDocId(series)), {
    glossary_json: JSON.stringify(value),
    updated_at_iso: value.updated_at,
    updated_by: user.email ?? null,
    touched: serverTimestamp(),
  });
}
