"use client";

import { FormEvent, useEffect, useState } from "react";
import { RoleGate } from "@/components/role-gate";
import { formatCfa } from "@/lib/seed";
import {
  createProduct,
  listProducts,
  removeProduct,
  updateProduct,
} from "@/lib/store";
import { CATEGORIES, type Category, type Product } from "@/lib/types";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  costPrice: "",
  category: "Boissons" as Category,
  stock: "",
  imageUrl: "",
  available: true,
};

function ArticlesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    setProducts(await listProducts());
  }

  useEffect(() => {
    void refresh();
  }, []);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      costPrice: String(product.costPrice ?? 0),
      category: product.category,
      stock: String(product.stock),
      imageUrl: product.imageUrl,
      available: product.available,
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      costPrice: Number(form.costPrice) || 0,
      category: form.category,
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim(),
      available: form.available,
    };
    if (!payload.name || Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
      setError("Nom, prix et stock sont obligatoires.");
      return;
    }
    try {
      if (editingId) await updateProduct(editingId, payload);
      else await createProduct(payload);
      setForm(emptyForm);
      setEditingId(null);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Articles</h1>
      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 md:grid-cols-2"
      >
        <input
          className="field"
          placeholder="Nom de l'article"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <select
          className="field"
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value as Category })
          }
        >
          {CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <input
          className="field"
          type="number"
          min="0"
          placeholder="Prix de vente (FCFA)"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
        />
        <input
          className="field"
          type="number"
          min="0"
          placeholder="Prix d'achat (FCFA)"
          value={form.costPrice}
          onChange={(event) =>
            setForm({ ...form, costPrice: event.target.value })
          }
        />
        <input
          className="field"
          type="number"
          min="0"
          placeholder="Stock"
          value={form.stock}
          onChange={(event) => setForm({ ...form, stock: event.target.value })}
        />
        <input
          className="field"
          placeholder="Description"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(event) =>
              setForm({ ...form, available: event.target.checked })
            }
          />
          Visible sur la carte
        </label>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {editingId ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Annuler
            </button>
          ) : null}
          <button className="btn-primary" type="submit">
            {editingId ? "Mettre à jour" : "Ajouter l'article"}
          </button>
        </div>
        {error ? (
          <p className="text-sm text-red-700 md:col-span-2">{error}</p>
        ) : null}
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--cream)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3">{product.category}</td>
                <td className="px-4 py-3">{formatCfa(product.price)}</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="mr-3 text-[var(--forest)]"
                    type="button"
                    onClick={() => startEdit(product)}
                  >
                    Modifier
                  </button>
                  <button
                    className="text-red-700"
                    type="button"
                    onClick={() => void removeProduct(product.id).then(refresh)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ArticlesRoute() {
  return (
    <RoleGate allow={["super_admin", "stock_manager"]}>
      <ArticlesPage />
    </RoleGate>
  );
}
