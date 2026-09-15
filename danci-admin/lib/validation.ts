import { ADMIN_ROLES, type AdminRole } from "@/lib/roles";

export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 安全地读取未知请求体上的字段。 */
export function readField(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  return (value as Record<string, unknown>)[key];
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** 校验注册 / 新建管理员所需的入参。 */
export function parseNewAdminInput(
  body: unknown,
): Parsed<{ name: string; email: string; password: string }> {
  const name = readString(readField(body, "name")).trim();
  const email = normalizeEmail(readString(readField(body, "email")));
  const password = readString(readField(body, "password"));

  if (!name) return { ok: false, error: "请输入姓名" };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "请输入合法的邮箱" };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `密码长度至少为 ${MIN_PASSWORD_LENGTH} 位` };
  }
  return { ok: true, data: { name, email, password } };
}

/** 校验登录入参。 */
export function parseSignInInput(
  body: unknown,
): Parsed<{ email: string; password: string }> {
  const email = normalizeEmail(readString(readField(body, "email")));
  const password = readString(readField(body, "password"));

  if (!email || !password) return { ok: false, error: "请输入邮箱和密码" };
  return { ok: true, data: { email, password } };
}

export function parseRole(value: unknown): Parsed<AdminRole> {
  if (typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole)) {
    return { ok: true, data: value as AdminRole };
  }
  return { ok: false, error: "角色不合法" };
}
