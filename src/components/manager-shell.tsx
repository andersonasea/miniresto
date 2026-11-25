"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DEMO_SESSION_KEY, useAuth } from "@/lib/auth-context";
import { linksForRole, ROLE_LABELS } from "@/lib/roles";
import { storageLabel } from "@/lib/store";

export function ManagerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    const demoSession =
      typeof window !== "undefined" &&
      sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!user && !demoSession) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--cream)] text-[var(--muted)]">
        Chargement...
      </div>
    );
  }

  const links = linksForRole(user.role);

  return (
    <div className="min-h-screen bg-[var(--cream)] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[var(--forest)] text-white lg:border-b-0 lg:border-r lg:border-white/10">
        <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
          <div>
            <p className="text-lg font-semibold">Mini Resto</p>
            <p className="text-xs text-white/70">{ROLE_LABELS[user.role]}</p>
          </div>
          <Link
            href="/"
            className="rounded-full bg-white/10 px-3 py-1 text-xs lg:mt-4 lg:inline-block"
          >
            Voir la carte
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-6">
          {links.map((link) => {
            const active =
              link.href === "/manager"
                ? pathname === "/manager"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm ${
                  active
                    ? "bg-white text-[var(--forest)]"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-white/10 px-5 py-4 text-xs text-white/70 lg:block">
          <p>{user.name}</p>
          <p>{user.email}</p>
          <p className="mt-1">{storageLabel()}</p>
          <button
            type="button"
            onClick={() => void logout().then(() => router.push("/"))}
            className="mt-3 text-sm text-white underline"
          >
            Déconnexion
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 lg:hidden">
          <p className="text-sm text-[var(--muted)]">
            {user.name} · {ROLE_LABELS[user.role]}
          </p>
          <button
            type="button"
            onClick={() => void logout().then(() => router.push("/"))}
            className="text-sm text-[var(--terracotta)]"
          >
            Déconnexion
          </button>
        </div>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
