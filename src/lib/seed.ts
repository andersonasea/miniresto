import type { Product } from "./types";

export const DEMO_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "Jus d'ananas",
    description: "Jus frais pressé, 33 cl",
    price: 1500,
    costPrice: 700,
    category: "Boissons",
    stock: 24,
    imageUrl: "",
    available: true,
    createdAt: Date.now(),
  },
  {
    name: "Coca-Cola",
    description: "Canette 33 cl",
    price: 1000,
    costPrice: 500,
    category: "Boissons",
    stock: 40,
    imageUrl: "",
    available: true,
    createdAt: Date.now(),
  },
  {
    name: "Eau minérale",
    description: "Bouteille 50 cl",
    price: 500,
    costPrice: 200,
    category: "Boissons",
    stock: 60,
    imageUrl: "",
    available: true,
    createdAt: Date.now(),
  },
  {
    name: "Gâteau au chocolat",
    description: "Part généreuse, cacao noir",
    price: 2500,
    costPrice: 1200,
    category: "Gâteaux",
    stock: 12,
    imageUrl: "",
    available: true,
    createdAt: Date.now(),
  },
  {
    name: "Cupcake vanille",
    description: "Glaçage vanille et pépites",
    price: 1200,
    costPrice: 500,
    category: "Gâteaux",
    stock: 18,
    imageUrl: "",
    available: true,
    createdAt: Date.now(),
  },
  {
    name: "Croissant",
    description: "Beurre, cuit du matin",
    price: 800,
    costPrice: 300,
    category: "Snacks",
    stock: 20,
    imageUrl: "",
    available: true,
    createdAt: Date.now(),
  },
  {
    name: "Sandwich poulet",
    description: "Pain, poulet grillé, crudités",
    price: 3500,
    costPrice: 1800,
    category: "Plats",
    stock: 8,
    imageUrl: "",
    available: true,
    createdAt: Date.now(),
  },
];

export const CATEGORY_EMOJI: Record<string, string> = {
  Boissons: "🥤",
  "Gâteaux": "🍰",
  Snacks: "🥐",
  Plats: "🍽️",
};

export function formatCfa(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function unitCostOf(
  item: { productId: string; unitCost?: number },
  productsById?: Map<string, { costPrice?: number }>,
) {
  if (typeof item.unitCost === "number") return item.unitCost;
  return productsById?.get(item.productId)?.costPrice ?? 0;
}

export function itemProfit(
  item: {
    productId: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
  },
  productsById?: Map<string, { costPrice?: number }>,
) {
  const cost = unitCostOf(item, productsById);
  return (item.unitPrice - cost) * item.quantity;
}

export function saleProfit(
  sale: {
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      unitCost?: number;
    }[];
  },
  productsById?: Map<string, { costPrice?: number }>,
) {
  return sale.items.reduce(
    (sum, item) => sum + itemProfit(item, productsById),
    0,
  );
}
