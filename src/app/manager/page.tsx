"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/role-gate";
import { formatCfa, itemProfit, saleProfit } from "@/lib/seed";
import { listProducts, listSales } from "@/lib/store";
import type { Product, Sale } from "@/lib/types";

function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    void Promise.all([listProducts(), listSales()]).then(
      ([nextProducts, nextSales]) => {
        setProducts(nextProducts);
        setSales(nextSales);
      },
    );
  }, []);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const today = new Date().toDateString();
  const todaySales = sales.filter(
    (sale) => new Date(sale.createdAt).toDateString() === today,
  );
  const revenueToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const revenueAll = sales.reduce((sum, sale) => sum + sale.total, 0);
  const profitToday = todaySales.reduce(
    (sum, sale) => sum + saleProfit(sale, productsById),
    0,
  );
  const profitAll = sales.reduce(
    (sum, sale) => sum + saleProfit(sale, productsById),
    0,
  );
  const lowStock = products.filter((product) => product.stock <= 5);

  const profitByProduct = useMemo(() => {
    const rows = new Map<
      string,
      { name: string; qty: number; revenue: number; profit: number }
    >();
    for (const sale of sales) {
      for (const item of sale.items) {
        const current = rows.get(item.productId) ?? {
          name: item.name,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
        current.qty += item.quantity;
        current.revenue += item.unitPrice * item.quantity;
        current.profit += itemProfit(item, productsById);
        rows.set(item.productId, current);
      }
    }
    return [...rows.values()].sort((a, b) => b.profit - a.profit);
  }, [sales, productsById]);

  const cards = [
    { label: "Ventes du jour", value: String(todaySales.length) },
    { label: "CA du jour", value: formatCfa(revenueToday) },
    { label: "Bénéfice du jour", value: formatCfa(profitToday) },
    { label: "Bénéfice total", value: formatCfa(profitAll) },
    { label: "CA total", value: formatCfa(revenueAll) },
    { label: "Articles en stock bas", value: String(lowStock.length) },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-[var(--muted)]">
        Vue d&apos;ensemble des ventes, du bénéfice et du stock.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--line)] bg-white p-5"
          >
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-semibold">Bénéfice par article</h2>
        {profitByProduct.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Pas encore de ventes enregistrées.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2">Article</th>
                  <th className="px-2 py-2">Vendus</th>
                  <th className="px-2 py-2">CA</th>
                  <th className="px-2 py-2">Bénéfice</th>
                </tr>
              </thead>
              <tbody>
                {profitByProduct.map((row) => (
                  <tr key={row.name} className="border-t border-[var(--line)]">
                    <td className="px-2 py-2 font-medium">{row.name}</td>
                    <td className="px-2 py-2">{row.qty}</td>
                    <td className="px-2 py-2">{formatCfa(row.revenue)}</td>
                    <td className="px-2 py-2 font-medium text-[var(--forest)]">
                      {formatCfa(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-semibold">Articles à réapprovisionner</h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Aucun stock critique.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {lowStock.map((product) => (
                <li key={product.id} className="flex justify-between">
                  <span>{product.name}</span>
                  <span className="font-medium text-red-700">
                    {product.stock} restant(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-semibold">Meilleures ventes</h2>
          {profitByProduct.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Pas encore de ventes enregistrées.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {profitByProduct.slice(0, 5).map((item) => (
                <li key={item.name} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-medium">
                    {item.qty} vendus · {formatCfa(item.profit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function DashboardRoute() {
  return (
    <RoleGate allow={["super_admin"]}>
      <DashboardPage />
    </RoleGate>
  );
}
