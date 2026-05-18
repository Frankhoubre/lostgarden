"use client";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { syncUserProfile } from "@/lib/sync-user-profile";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          await syncUserProfile(nextUser);
        } catch {
          /* profile sync is best-effort */
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    await auth.currentUser?.reload();
    setUser(auth.currentUser);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser }),
    [user, loading, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
