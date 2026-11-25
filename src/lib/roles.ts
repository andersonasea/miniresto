export const ROLES = [
  "super_admin",
  "sales_manager",
  "stock_manager",
] as const;

export type Role = (typeof ROLES)[number];

export const CREATABLE_ROLES = [
  "sales_manager",
  "stock_manager",
] as const;

export type CreatableRole = (typeof CREATABLE_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  sales_manager: "Gestionnaire de vente",
  stock_manager: "Gestionnaire de stock",
};

export type NavLink = {
  href: string;
  label: string;
  roles: Role[];
};

export const NAV_LINKS: NavLink[] = [
  { href: "/manager", label: "Dashboard", roles: ["super_admin"] },
  {
    href: "/manager/articles",
    label: "Articles",
    roles: ["super_admin", "stock_manager"],
  },
  {
    href: "/manager/stock",
    label: "Stock",
    roles: ["super_admin", "stock_manager"],
  },
  {
    href: "/manager/ventes",
    label: "Ventes",
    roles: ["super_admin", "sales_manager"],
  },
  {
    href: "/manager/utilisateurs",
    label: "Utilisateurs",
    roles: ["super_admin"],
  },
];

export function linksForRole(role: Role) {
  return NAV_LINKS.filter((link) => link.roles.includes(role));
}

export function canAccessPath(role: Role, pathname: string) {
  if (pathname === "/manager") return role === "super_admin";
  const match = NAV_LINKS.find(
    (link) => link.href !== "/manager" && pathname.startsWith(link.href),
  );
  if (!match) return false;
  return match.roles.includes(role);
}

export function homePath(role: Role) {
  if (role === "sales_manager") return "/manager/ventes";
  if (role === "stock_manager") return "/manager/articles";
  return "/manager";
}
