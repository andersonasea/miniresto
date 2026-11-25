import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb, getSecondaryAuth } from "./firebase";
import type { CreatableRole } from "./roles";
import type { StaffUser } from "./types";

const USERS_KEY = "mini-resto-users";

export const DEMO_ADMIN = {
  email: "admin@resto.local",
  password: "admin123",
  name: "Super admin",
};

function uid() {
  return crypto.randomUUID();
}

function readLocalUsers(): StaffUser[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StaffUser[];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: StaffUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function seedLocalUsers(): StaffUser[] {
  const existing = readLocalUsers();
  if (existing.length > 0) return existing;
  const admin: StaffUser = {
    id: "demo-super-admin",
    email: DEMO_ADMIN.email,
    name: DEMO_ADMIN.name,
    role: "super_admin",
    password: DEMO_ADMIN.password,
    createdAt: Date.now(),
  };
  writeLocalUsers([admin]);
  return [admin];
}

export async function getUserProfile(id: string): Promise<StaffUser | null> {
  const db = getFirebaseDb();
  if (db) {
    const snap = await getDoc(doc(db, "users", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<StaffUser, "id">) };
  }
  return seedLocalUsers().find((user) => user.id === id) ?? null;
}

export async function listUsers(): Promise<StaffUser[]> {
  const db = getFirebaseDb();
  if (db) {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs
      .map((item) => ({
        id: item.id,
        ...(item.data() as Omit<StaffUser, "id">),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  return seedLocalUsers().sort((a, b) => b.createdAt - a.createdAt);
}

export async function findLocalUser(email: string, password: string) {
  return (
    seedLocalUsers().find(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.password === password,
    ) ?? null
  );
}

export async function ensureFirstFirebaseAdmin(params: {
  uid: string;
  email: string;
}) {
  const db = getFirebaseDb();
  if (!db) return null;
  const existing = await getUserProfile(params.uid);
  if (existing) return existing;
  const profile: Omit<StaffUser, "id"> = {
    email: params.email,
    name: "Super admin",
    role: "super_admin",
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "users", params.uid), profile);
  return { id: params.uid, ...profile };
}

export async function createStaffAccount(input: {
  email: string;
  password: string;
  name: string;
  role: CreatableRole;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name || input.password.length < 6) {
    throw new Error("Nom, email et mot de passe (6 caractères min.) sont requis.");
  }

  const db = getFirebaseDb();
  const secondary = getSecondaryAuth();
  if (db && secondary) {
    const credential = await createUserWithEmailAndPassword(
      secondary,
      email,
      input.password,
    );
    const profile: Omit<StaffUser, "id"> = {
      email,
      name,
      role: input.role,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", credential.user.uid), profile);
    await signOut(secondary);
    return { id: credential.user.uid, ...profile };
  }

  const users = seedLocalUsers();
  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error("Un compte existe déjà avec cet email.");
  }
  const created: StaffUser = {
    id: uid(),
    email,
    name,
    role: input.role,
    password: input.password,
    createdAt: Date.now(),
  };
  writeLocalUsers([created, ...users]);
  return created;
}

export async function removeStaffAccount(id: string) {
  if (id === "demo-super-admin") {
    throw new Error("Le super admin de démonstration ne peut pas être supprimé.");
  }
  const db = getFirebaseDb();
  if (db) {
    await deleteDoc(doc(db, "users", id));
    return;
  }
  writeLocalUsers(seedLocalUsers().filter((user) => user.id !== id));
}
