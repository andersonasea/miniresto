"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { homePath } from "@/lib/roles";

export function SiteHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--cream)_88%,white)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--terracotta)] text-lg text-white shadow-sm">
            🍽️
          </span>
          <div>
            <p className="font-semibold tracking-tight text-[var(--ink)]">
              Mini Resto
            </p>
            <p className="text-xs text-[var(--muted)]">Carte du jour</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link
              href={homePath(user.role)}
              className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-medium text-white"
            >
              Espace gestion
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)]"
            >
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
