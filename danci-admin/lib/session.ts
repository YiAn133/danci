import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { ADMIN_SESSION_TTL_DAYS, adminSessions, adminUsers } from "@/db/schema";
import { isSuperAdmin, type AdminRole } from "@/lib/roles";

export const SESSION_COOKIE_NAME = "danci_admin_session";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = ADMIN_SESSION_TTL_DAYS * DAY_IN_MS;

export type SessionAdmin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: Date;
};

/** 创建会话并写入 HttpOnly Cookie，有效期 7 天。 */
export async function startSession(adminId: string): Promise<void> {
  // 顺手清掉已过期的会话，避免表无限增长。
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(adminSessions).values({ token, adminId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** 删除当前会话（数据库记录 + Cookie）。 */
export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** 读取当前登录的管理员；会话不存在或已过期时返回 null。 */
export async function getCurrentAdmin(): Promise<SessionAdmin | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt,
      expiresAt: adminSessions.expiresAt,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
    .where(eq(adminSessions.token, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

type SuperAdminAuth =
  | { ok: true; admin: SessionAdmin }
  | { ok: false; response: NextResponse };

/**
 * 接口层的权限校验：必须是已登录的系统管理员。
 * 普通管理员即使直接调用接口也会被拒绝。
 */
export async function authorizeSuperAdmin(): Promise<SuperAdminAuth> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "未登录或会话已过期" }, { status: 401 }),
    };
  }
  if (!isSuperAdmin(admin.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "只有系统管理员可以执行该操作" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, admin };
}
