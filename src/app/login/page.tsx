"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { homePath } from "@/lib/roles";
import { DEMO_ADMIN } from "@/lib/users";

export default function LoginPage() {
  const { login, isDemo, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(isDemo ? DEMO_ADMIN.email : "");
  const [password, setPassword] = useState(isDemo ? DEMO_ADMIN.password : "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user) router.replace(homePath(user.role));
  }, [user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const next = await login(email, password);
      router.push(next);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("auth/invalid-credential") || message.includes("auth/user-not-found") || message.includes("auth/wrong-password")) {
        setError(
          "Email ou mot de passe incorrect. Utilisez le compte créé dans Firebase Authentication, pas le compte démo.",
        );
      } else if (message.includes("auth/operation-not-allowed")) {
        setError(
          "La connexion e-mail/mot de passe n'est pas activée dans Firebase Authentication.",
        );
      } else if (
        message.includes("insufficient permissions") ||
        message.includes("permission-denied")
      ) {
        setError(
          "Firestore refuse l'accès. Dans Firebase, ouvrez Firestore → Rules, collez le fichier firestore.rules du projet, puis Publish.",
        );
      } else {
        setError(message || "Identifiants incorrects.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-8 shadow-[0_20px_50px_rgba(61,42,31,0.08)]">
        <Link href="/" className="text-sm text-[var(--muted)]">
          ← Retour à la carte
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Connexion</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Super admin, gestionnaire de vente ou gestionnaire de stock.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            Email
            <input
              className="field mt-1"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label className="block text-sm">
            Mot de passe
            <input
              className="field mt-1"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button className="btn-primary w-full" disabled={pending} type="submit">
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {isDemo ? (
          <p className="mt-4 rounded-2xl bg-[var(--cream)] px-4 py-3 text-xs text-[var(--muted)]">
            Mode démo — super admin : <strong>{DEMO_ADMIN.email}</strong> /{" "}
            <strong>{DEMO_ADMIN.password}</strong>
          </p>
        ) : null}
      </div>
    </div>
  );
}
