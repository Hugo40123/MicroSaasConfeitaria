import type { AuthUser } from "@/lib/auth";

export type AppPermission =
  | "manage_products"
  | "manage_settings"
  | "view_finance"
  | "view_reports";

const permissionsByRole: Record<AuthUser["role"], AppPermission[]> = {
  ADMIN: ["manage_products", "manage_settings", "view_finance", "view_reports"],
  ATTENDANT: []
};

export function userCan(user: AuthUser, permission: AppPermission) {
  return permissionsByRole[user.role].includes(permission);
}
