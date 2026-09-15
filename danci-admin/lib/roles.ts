export const ADMIN_ROLES = ["super_admin", "admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "系统管理员",
  admin: "普通管理员",
};

export function isSuperAdmin(role: AdminRole) {
  return role === "super_admin";
}
