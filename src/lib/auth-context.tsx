"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
import { homePath } from "./roles";
import type { SessionUser } from "./types";
import {
  ensureFirstFirebaseAdmin,
  findLocalUser,
  getUserProfile,
} from "./users";

export const DEMO_SESSION_KEY = "mini-resto-demo-session";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(user: {
  id: string;
  email: string;
  name: string;
  role: SessionUser["role"];
}): SessionUser {
  return {
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
      if (raw) {
        try {
          setUser(JSON.parse(raw) as SessionUser);
        } catch {
          sessionStorage.removeItem(DEMO_SESSION_KEY);
        }
      }
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (next) => {
      void (async () => {
        if (!next) {
          setUser(null);
          setLoading(false);
          return;
        }
        const profile =
          (await getUserProfile(next.uid)) ??
          (await ensureFirstFirebaseAdmin({
            uid: next.uid,
            email: next.email ?? "",
          }));
        if (!profile) {
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(toSession(profile));
        setLoading(false);
      })();
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemo: !isFirebaseConfigured,
      login: async (email, password) => {
        const auth = getFirebaseAuth();
        if (!auth) {
          const local = await findLocalUser(email.trim(), password);
          if (!local) {
            throw new Error("Identifiants incorrects.");
          }
          const session = toSession(local);
          sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
          setUser(session);
          return homePath(session.role);
        }

        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const profile =
          (await getUserProfile(credential.user.uid)) ??
          (await ensureFirstFirebaseAdmin({
            uid: credential.user.uid,
            email: credential.user.email ?? email,
          }));
        if (!profile) {
          await signOut(auth);
          throw new Error(
            "Ce compte n'a pas de rôle. Demandez au super admin de le créer.",
          );
        }
        const session = toSession(profile);
        setUser(session);
        return homePath(session.role);
      },
      logout: async () => {
        const auth = getFirebaseAuth();
        sessionStorage.removeItem(DEMO_SESSION_KEY);
        if (auth) await signOut(auth);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
