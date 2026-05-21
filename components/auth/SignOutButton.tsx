"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";
import { getFirebaseAuth } from "@/lib/firebase";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className = "btn-secondary" }: SignOutButtonProps) {
  const router = useRouter();
  const { locale, dict } = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut(getFirebaseAuth());
      router.push(localePath(locale, "/"));
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
      {loading ? dict.auth.signingOut : dict.auth.signOut}
    </button>
  );
}
