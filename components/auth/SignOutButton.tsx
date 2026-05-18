"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className = "btn-secondary" }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut(getFirebaseAuth());
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
