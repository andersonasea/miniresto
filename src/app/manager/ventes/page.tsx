"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/role-gate";
import { useAuth } from "@/lib/auth-context";
import { formatCfa, itemProfit, saleProfit } from "@/lib/seed";
import { listProducts, listSales, recordSale } from "@/lib/store";
import type { Product, Sale, SaleItem, StaffUser } from "@/lib/types";
import { listUsers } from "@/lib/users";

function VentesPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellers, setSellers] = useState<StaffUser[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [sellerId, setSellerId] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const [nextProducts, nextSales, nextUsers] = await Promise.all([
      listProducts(),
      listSales(),
      user?.role === "super_admin" ? listUsers() : Promise.resolve([]),
    ]);
    setProducts(nextProducts);
    setSales(nextSales);
    const nextSellers = nextUsers.filter(
      (staff) => staff.role === "sales_manager",
    );
    setSellers(nextSellers);
    if (!productId && nextProducts[0]) setProductId(nextProducts[0].id);
    if (!sellerId && nextSellers[0]) setSellerId(nextSellers[0].id);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );
  const cartProfit = useMemo(
    () => cart.reduce((sum, item) => sum + itemProfit(item), 0),
    [cart],
  );

  const selectedSeller = sellers.find((staff) => staff.id === sellerId);
  const seller =
    user?.role === "sales_manager"
      ? { id: user.uid, name: user.name, email: user.email }
      : selectedSeller
        ? {
            id: selectedSeller.id,
            name: selectedSeller.name,
            email: selectedSeller.email,
          }
        : user
          ? { id: user.uid, name: user.name, email: user.email }
          : null;

  function addToCart() {
    const product = products.find((item) => item.id === productId);
    const qty = Number(quantity);
    if (!product || qty < 1) return;
    if (product.stock < qty) {
      setError(`Stock insuffisant pour ${product.name}.`);
      return;
    }
    setError("");
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          quantity: qty,
          unitPrice: product.price,
          unitCost: product.costPrice ?? 0,
        },
      ];
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!seller) {
      setError("Aucun gestionnaire de vente sélectionné.");
      return;
    }
    try {
      await recordSale(cart, seller);
      setCart([]);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Vente impossible.");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Ventes</h1>
      <p className="mt-1 text-[var(--muted)]">
        Chaque vente est enregistrée au nom du gestionnaire qui la valide.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-5"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
          <select
            className="field"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            {products.map((product) => {
              const profit = product.price - (product.costPrice ?? 0);
              return (
                <option key={product.id} value={product.id}>
                  {product.name} — {formatCfa(product.price)} · bénéfice{" "}
                  {formatCfa(profit)} ({product.stock})
                </option>
              );
            })}
          </select>
          <input
            className="field"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={addToCart}>
            Ajouter
          </button>
        </div>

        {cart.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm">
            {cart.map((item) => {
              const profit = itemProfit(item);
              return (
                <li
                  key={item.productId}
                  className="flex flex-wrap items-baseline justify-between gap-2"
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-right">
                    {formatCfa(item.unitPrice * item.quantity)}
                    <span className="ml-2 text-[var(--forest)]">
                      bénéfice {formatCfa(profit)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">Panier vide.</p>
        )}

        {user?.role === "super_admin" && sellers.length > 0 ? (
          <label className="mt-4 block text-sm">
            Validée par
            <select
              className="field mt-1"
              value={sellerId}
              onChange={(event) => setSellerId(event.target.value)}
            >
              {sellers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Validée par <strong>{seller?.name ?? user?.name}</strong>
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Total {formatCfa(total)}</p>
            <p className="text-sm text-[var(--forest)]">
              Bénéfice {formatCfa(cartProfit)}
            </p>
          </div>
          <button
            className="btn-primary"
            disabled={cart.length === 0}
            type="submit"
          >
            Valider la vente
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </form>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Historique</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--cream)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Articles</th>
                <th className="px-4 py-3">Gestionnaire</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Bénéfice</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">
                    {new Date(sale.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    {sale.items
                      .map((item) => {
                        const profit = itemProfit(item);
                        return `${item.name} × ${item.quantity} (bénéfice ${formatCfa(profit)})`;
                      })
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {sale.createdByName || sale.createdBy}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCfa(sale.total)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--forest)]">
                    {formatCfa(saleProfit(sale))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function VentesRoute() {
  return (
    <RoleGate allow={["super_admin", "sales_manager"]}>
      <VentesPage />
    </RoleGate>
  );
}
