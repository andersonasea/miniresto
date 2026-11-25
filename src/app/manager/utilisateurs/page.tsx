"use client";

import { FormEvent, useEffect, useState } from "react";
import { RoleGate } from "@/components/role-gate";
import {
  CREATABLE_ROLES,
  ROLE_LABELS,
  type CreatableRole,
} from "@/lib/roles";
import type { StaffUser } from "@/lib/types";
import { createStaffAccount, listUsers, removeStaffAccount } from "@/lib/users";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "sales_manager" as CreatableRole,
};

function UsersManager() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function refresh() {
    setUsers(await listUsers());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await createStaffAccount(form);
      setForm(emptyForm);
      await refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Impossible de créer le compte.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Utilisateurs</h1>
      <p className="mt-1 text-[var(--muted)]">
        Créez un gestionnaire de vente ou un gestionnaire de stock. Le nom
        servira dans l&apos;historique des ventes.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 md:grid-cols-2"
      >
        <input
          className="field"
          placeholder="Nom"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <input
          className="field"
          type="password"
          placeholder="Mot de passe (6 caractères min.)"
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
        />
        <select
          className="field"
          value={form.role}
          onChange={(event) =>
            setForm({ ...form, role: event.target.value as CreatableRole })
          }
        >
          {CREATABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <div className="md:col-span-2 md:text-right">
          <button className="btn-primary" disabled={pending} type="submit">
            {pending ? "Création..." : "Créer le compte"}
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
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((staff) => (
              <tr key={staff.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-medium">{staff.name}</td>
                <td className="px-4 py-3">{staff.email}</td>
                <td className="px-4 py-3">{ROLE_LABELS[staff.role]}</td>
                <td className="px-4 py-3 text-right">
                  {staff.role !== "super_admin" ? (
                    <button
                      className="text-red-700"
                      type="button"
                      onClick={() =>
                        void removeStaffAccount(staff.id).then(refresh)
                      }
                    >
                      Supprimer
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <RoleGate allow={["super_admin"]}>
      <UsersManager />
    </RoleGate>
  );
}
