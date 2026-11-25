"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/role-gate";
import { useAuth } from "@/lib/auth-context";
import { formatCfa } from "@/lib/seed";
import { listProducts, listSupplies, recordSupply } from "@/lib/store";
import type { Product, Supply } from "@/lib/types";

type SupplyForm = {
  quantity: string;
  unitCost: string;
  supplier: string;
  note: string;
};

const emptyForm: SupplyForm = {
  quantity: "",
  unitCost: "",
  supplier: "",
  note: "",
};

function StockPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [forms, setForms] = useState<Record<string, SupplyForm>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function refresh() {
    const [nextProducts, nextSupplies] = await Promise.all([
      listProducts(),
      listSupplies(),
    ]);
    setProducts(nextProducts);
    setSupplies(nextSupplies);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const suppliesByProduct = useMemo(() => {
    const grouped = new Map<string, Supply[]>();
    for (const supply of supplies) {
      const list = grouped.get(supply.productId) ?? [];
      list.push(supply);
      grouped.set(supply.productId, list);
    }
    return grouped;
  }, [supplies]);

  function formFor(product: Product): SupplyForm {
    return (
      forms[product.id] ?? {
        ...emptyForm,
        unitCost: product.costPrice ? String(product.costPrice) : "",
      }
    );
  }

  function patchForm(productId: string, patch: Partial<SupplyForm>) {
    const product = products.find((item) => item.id === productId);
    const fallback: SupplyForm = {
      ...emptyForm,
      unitCost: product?.costPrice ? String(product.costPrice) : "",
    };
    setForms((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? fallback),
        ...patch,
      },
    }));
  }

  async function onSupply(event: FormEvent, product: Product) {
    event.preventDefault();
    if (!user) return;
    const form = formFor(product);
    setError("");
    setPendingId(product.id);
    try {
      await recordSupply(
        {
          productId: product.id,
          quantity: Number(form.quantity),
          unitCost: form.unitCost === "" ? undefined : Number(form.unitCost),
          supplier: form.supplier,
          note: form.note,
        },
        { id: user.uid, name: user.name },
      );
      setForms((current) => ({
        ...current,
        [product.id]: {
          ...emptyForm,
          unitCost: form.unitCost,
        },
      }));
      await refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Approvisionnement impossible.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Stock</h1>
      <p className="mt-1 text-[var(--muted)]">
        Approvisionnez chaque article : le stock augmente et l&apos;entrée est
        conservée dans l&apos;historique.
      </p>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 grid gap-4">
        {products.map((product) => {
          const low = product.stock <= 5;
          const open = openId === product.id;
          const form = formFor(product);
          const history = suppliesByProduct.get(product.id) ?? [];

          return (
            <article
              key={product.id}
              className="rounded-2xl border border-[var(--line)] bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">{product.name}</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {product.category} · coût {formatCfa(product.costPrice ?? 0)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      low
                        ? "bg-red-50 text-red-700"
                        : "bg-[var(--cream)] text-[var(--forest)]"
                    }`}
                  >
                    Stock {product.stock}
                    {low ? " · bas" : ""}
                  </span>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() =>
                      setOpenId((current) =>
                        current === product.id ? null : product.id,
                      )
                    }
                  >
                    {open ? "Fermer" : "Approvisionner"}
                  </button>
                </div>
              </div>

              {open ? (
                <form
                  onSubmit={(event) => void onSupply(event, product)}
                  className="mt-4 grid gap-3 border-t border-[var(--line)] pt-4 md:grid-cols-2"
                >
                  <label className="text-sm">
                    Quantité reçue
                    <input
                      className="field mt-1"
                      type="number"
                      min="1"
                      required
                      value={form.quantity}
                      onChange={(event) =>
                        patchForm(product.id, { quantity: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    Prix d&apos;achat unitaire (FCFA)
                    <input
                      className="field mt-1"
                      type="number"
                      min="0"
                      value={form.unitCost}
                      onChange={(event) =>
                        patchForm(product.id, { unitCost: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    Fournisseur
                    <input
                      className="field mt-1"
                      placeholder="Ex. Dépôt central"
                      value={form.supplier}
                      onChange={(event) =>
                        patchForm(product.id, { supplier: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    Note
                    <input
                      className="field mt-1"
                      placeholder="Optionnel"
                      value={form.note}
                      onChange={(event) =>
                        patchForm(product.id, { note: event.target.value })
                      }
                    />
                  </label>
                  <div className="md:col-span-2 md:text-right">
                    <button
                      className="btn-primary"
                      disabled={pendingId === product.id}
                      type="submit"
                    >
                      {pendingId === product.id
                        ? "Enregistrement..."
                        : "Enregistrer l'approvisionnement"}
                    </button>
                  </div>
                </form>
              ) : null}

              {history.length > 0 ? (
                <div className="mt-4 border-t border-[var(--line)] pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    Derniers approvisionnements
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {history.slice(0, 3).map((supply) => (
                      <li
                        key={supply.id}
                        className="flex flex-wrap justify-between gap-2 text-[var(--muted)]"
                      >
                        <span>
                          +{supply.quantity} · {formatCfa(supply.unitCost)} / u.
                          {supply.supplier ? ` · ${supply.supplier}` : ""}
                        </span>
                        <span>
                          {new Date(supply.createdAt).toLocaleString("fr-FR")} ·{" "}
                          {supply.createdByName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Historique des approvisionnements</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--cream)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Quantité</th>
                <th className="px-4 py-3">Coût</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Par</th>
              </tr>
            </thead>
            <tbody>
              {supplies.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[var(--muted)]" colSpan={6}>
                    Aucun approvisionnement pour le moment.
                  </td>
                </tr>
              ) : (
                supplies.map((supply) => (
                  <tr key={supply.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      {new Date(supply.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {supply.productName}
                      {supply.supplier ? (
                        <span className="block text-xs font-normal text-[var(--muted)]">
                          {supply.supplier}
                          {supply.note ? ` · ${supply.note}` : ""}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">+{supply.quantity}</td>
                    <td className="px-4 py-3">{formatCfa(supply.unitCost)}</td>
                    <td className="px-4 py-3">
                      {supply.previousStock} → {supply.newStock}
                    </td>
                    <td className="px-4 py-3">{supply.createdByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function StockRoute() {
  return (
    <RoleGate allow={["super_admin", "stock_manager"]}>
      <StockPage />
    </RoleGate>
  );
}
