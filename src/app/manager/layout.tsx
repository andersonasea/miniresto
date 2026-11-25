"use client";

import { Suspense } from "react";
import { ManagerShell } from "@/components/manager-shell";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[var(--cream)]">
          Chargement...
        </div>
      }
    >
      <ManagerShell>{children}</ManagerShell>
    </Suspense>
  );
}
