import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import type { AdminRole } from "@/lib/roles";

export type AdminListItem = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: Date;
};

export type AdminRecord = AdminListItem & { passwordHash: string };

const listColumns = {
  id: adminUsers.id,
  name: adminUsers.name,
  email: adminUsers.email,
  role: adminUsers.role,
  createdAt: adminUsers.createdAt,
};

/** 管理员总数，用于判断是否需要引导到首个系统管理员注册。 */
export async function countAdmins(): Promise<number> {
  const rows = await db.select({ value: count() }).from(adminUsers);
  return rows[0]?.value ?? 0;
}

export async function countSuperAdmins(): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(adminUsers)
    .where(eq(adminUsers.role, "super_admin"));
  return rows[0]?.value ?? 0;
}

export async function listAdmins(): Promise<AdminListItem[]> {
  return db.select(listColumns).from(adminUsers).orderBy(asc(adminUsers.createdAt));
}

export async function findAdminByEmail(
  email: string,
): Promise<AdminRecord | null> {
  const rows = await db
    .select({ ...listColumns, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function createAdmin(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
}): Promise<AdminListItem> {
  const rows = await db.insert(adminUsers).values(input).returning(listColumns);
  return rows[0];
}

export async function updateAdmin(
  id: string,
  input: { name?: string; role?: AdminRole },
): Promise<AdminListItem | null> {
  const rows = await db
    .update(adminUsers)
    .set(input)
    .where(eq(adminUsers.id, id))
    .returning(listColumns);
  return rows[0] ?? null;
}
