"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { canAccessPath, homePath, type Role } from "@/lib/roles";

export function RoleGate({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user) return;
    if (!allow.includes(user.role) || !canAccessPath(user.role, pathname)) {
      router.replace(homePath(user.role));
    }
  }, [allow, loading, pathname, router, user]);

  if (loading || !user || !allow.includes(user.role)) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">Chargement...</div>
    );
  }

  return children;
}
