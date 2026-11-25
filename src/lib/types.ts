import type { Role } from "./roles";

export const CATEGORIES = ["Boissons", "Gâteaux", "Snacks", "Plats"] as const;

export type Category = (typeof CATEGORIES)[number];

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  category: Category;
  stock: number;
  imageUrl: string;
  available: boolean;
  createdAt: number;
};

export type SaleItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

export type Sale = {
  id: string;
  items: SaleItem[];
  total: number;
  createdAt: number;
  createdBy: string;
  createdById?: string;
  createdByName?: string;
};

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: number;
  password?: string;
};

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  role: Role;
};

export type Supply = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  note: string;
  previousStock: number;
  newStock: number;
  createdAt: number;
  createdById: string;
  createdByName: string;
};
