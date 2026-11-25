import { CATEGORY_EMOJI, formatCfa } from "@/lib/seed";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0 || !product.available;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(61,42,31,0.06)]">
      <div className="relative grid h-40 place-items-center bg-[linear-gradient(160deg,#f4e4d4,#f8d7c0)] text-5xl">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span>{CATEGORY_EMOJI[product.category] ?? "🍴"}</span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[var(--ink)]">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            {product.name}
          </h3>
          <p className="shrink-0 font-semibold text-[var(--terracotta)]">
            {formatCfa(product.price)}
          </p>
        </div>
        <p className="flex-1 text-sm text-[var(--muted)]">
          {product.description}
        </p>
        <p
          className={`text-xs font-medium ${outOfStock ? "text-red-700" : "text-[var(--forest)]"}`}
        >
          {outOfStock ? "Indisponible" : `${product.stock} en stock`}
        </p>
      </div>
    </article>
  );
}
