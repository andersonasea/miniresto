"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { listProducts, storageLabel } from "@/lib/store";
import { CATEGORIES, type Product } from "@/lib/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>("Tous");
  const [error, setError] = useState("");

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Impossible de charger la carte.",
        );
      });
  }, []);

  const visible = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === "Tous" || product.category === category;
      return matchesCategory && product.available;
    });
  }, [products, category]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--terracotta)]">
          Mini restaurant
        </p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Ce que nous vendons aujourd&apos;hui
        </h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">
          Boissons, gâteaux, snacks et plats.
        </p>
        <p className="mt-3 text-xs text-[var(--muted)]">{storageLabel()}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {["Tous", ...CATEGORIES].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm ${
                category === item
                  ? "bg-[var(--ink)] text-white"
                  : "border border-[var(--line)] bg-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-8 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
