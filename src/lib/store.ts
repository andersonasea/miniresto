import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import { DEMO_PRODUCTS } from "./seed";
import type { Product, Sale, SaleItem, Supply } from "./types";

const PRODUCTS_KEY = "mini-resto-products";
const SALES_KEY = "mini-resto-sales";
const SUPPLIES_KEY = "mini-resto-supplies";

function uid() {
  return crypto.randomUUID();
}

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    costPrice: Number(product.costPrice) || 0,
  };
}

function seedLocalProducts(): Product[] {
  const existing = readLocal<Product[] | null>(PRODUCTS_KEY, null);
  if (existing && existing.length > 0) {
    const normalized = existing.map(normalizeProduct);
    writeLocal(PRODUCTS_KEY, normalized);
    return normalized;
  }
  const seeded = DEMO_PRODUCTS.map((product) => ({ ...product, id: uid() }));
  writeLocal(PRODUCTS_KEY, seeded);
  return seeded;
}

export async function listProducts(): Promise<Product[]> {
  const db = getFirebaseDb();
  if (db) {
    const snapshot = await getDocs(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
    );
    return snapshot.docs.map((item) =>
      normalizeProduct({
        id: item.id,
        ...(item.data() as Omit<Product, "id">),
      }),
    );
  }
  return seedLocalProducts().sort((a, b) => b.createdAt - a.createdAt);
}

export async function createProduct(
  input: Omit<Product, "id" | "createdAt">,
): Promise<Product> {
  const payload = { ...input, createdAt: Date.now() };
  const db = getFirebaseDb();
  if (db) {
    const ref = await addDoc(collection(db, "products"), payload);
    return { id: ref.id, ...payload };
  }
  const products = seedLocalProducts();
  const product = { id: uid(), ...payload };
  writeLocal(PRODUCTS_KEY, [product, ...products]);
  return product;
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, "id" | "createdAt">>,
) {
  const db = getFirebaseDb();
  if (db) {
    await updateDoc(doc(db, "products", id), patch);
    return;
  }
  const products = seedLocalProducts().map((product) =>
    product.id === id ? { ...product, ...patch } : product,
  );
  writeLocal(PRODUCTS_KEY, products);
}

export async function removeProduct(id: string) {
  const db = getFirebaseDb();
  if (db) {
    await deleteDoc(doc(db, "products", id));
    return;
  }
  writeLocal(
    PRODUCTS_KEY,
    seedLocalProducts().filter((product) => product.id !== id),
  );
}

export async function listSales(): Promise<Sale[]> {
  const db = getFirebaseDb();
  if (db) {
    const snapshot = await getDocs(
      query(collection(db, "sales"), orderBy("createdAt", "desc")),
    );
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Sale, "id">),
    }));
  }
  return readLocal<Sale[]>(SALES_KEY, []).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export async function recordSale(
  items: SaleItem[],
  seller: { id: string; name: string; email: string },
) {
  if (items.length === 0) {
    throw new Error("Ajoutez au moins un article.");
  }

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const sale: Omit<Sale, "id"> = {
    items,
    total,
    createdAt: Date.now(),
    createdBy: seller.email,
    createdById: seller.id,
    createdByName: seller.name,
  };

  const db = getFirebaseDb();
  if (db) {
    const batch = writeBatch(db);
    const saleRef = doc(collection(db, "sales"));
    batch.set(saleRef, sale);
    for (const item of items) {
      batch.update(doc(db, "products", item.productId), {
        stock: increment(-item.quantity),
      });
    }
    await batch.commit();
    return { id: saleRef.id, ...sale };
  }

  const products = seedLocalProducts();
  for (const item of items) {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) throw new Error(`Article introuvable: ${item.name}`);
    if (product.stock < item.quantity) {
      throw new Error(`Stock insuffisant pour ${product.name}`);
    }
    product.stock -= item.quantity;
  }
  writeLocal(PRODUCTS_KEY, products);
  const saved = { id: uid(), ...sale };
  writeLocal(SALES_KEY, [saved, ...readLocal<Sale[]>(SALES_KEY, [])]);
  return saved;
}

export async function listSupplies(): Promise<Supply[]> {
  const db = getFirebaseDb();
  if (db) {
    const snapshot = await getDocs(
      query(collection(db, "supplies"), orderBy("createdAt", "desc")),
    );
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Supply, "id">),
    }));
  }
  return readLocal<Supply[]>(SUPPLIES_KEY, []).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export async function recordSupply(
  input: {
    productId: string;
    quantity: number;
    unitCost?: number;
    supplier?: string;
    note?: string;
  },
  actor: { id: string; name: string },
) {
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La quantité à approvisionner doit être supérieure à 0.");
  }

  const products = await listProducts();
  const product = products.find((item) => item.id === input.productId);
  if (!product) throw new Error("Article introuvable.");

  const parsedCost = Number(input.unitCost);
  const safeCost =
    Number.isFinite(parsedCost) && parsedCost >= 0
      ? parsedCost
      : product.costPrice || 0;
  const previousStock = product.stock;
  const newStock = previousStock + quantity;
  const supply: Omit<Supply, "id"> = {
    productId: product.id,
    productName: product.name,
    quantity,
    unitCost: safeCost,
    supplier: (input.supplier ?? "").trim(),
    note: (input.note ?? "").trim(),
    previousStock,
    newStock,
    createdAt: Date.now(),
    createdById: actor.id,
    createdByName: actor.name,
  };

  const db = getFirebaseDb();
  if (db) {
    const batch = writeBatch(db);
    const supplyRef = doc(collection(db, "supplies"));
    batch.set(supplyRef, supply);
    batch.update(doc(db, "products", product.id), {
      stock: increment(quantity),
      costPrice: safeCost,
    });
    await batch.commit();
    return { id: supplyRef.id, ...supply };
  }

  const nextProducts = seedLocalProducts().map((item) =>
    item.id === product.id
      ? { ...item, stock: newStock, costPrice: safeCost }
      : item,
  );
  writeLocal(PRODUCTS_KEY, nextProducts);
  const saved = { id: uid(), ...supply };
  writeLocal(SUPPLIES_KEY, [saved, ...readLocal<Supply[]>(SUPPLIES_KEY, [])]);
  return saved;
}

export function storageLabel() {
  return isFirebaseConfigured ? "Firebase" : "Mode démo (local)";
}
