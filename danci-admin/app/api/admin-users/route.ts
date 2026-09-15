import { NextResponse } from "next/server";
import { createAdmin, findAdminByEmail, listAdmins } from "@/lib/admins";
import { hashPassword } from "@/lib/password";
import { authorizeSuperAdmin } from "@/lib/session";
import { parseNewAdminInput, parseRole, readField } from "@/lib/validation";

/** 管理员列表：仅系统管理员可访问。 */
export async function GET() {
  const auth = await authorizeSuperAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ admins: await listAdmins() });
}

/** 新建管理员：仅系统管理员可操作，并可指定其为普通管理员或系统管理员。 */
export async function POST(request: Request) {
  const auth = await authorizeSuperAdmin();
  if (!auth.ok) return auth.response;

  const body: unknown = await request.json().catch(() => null);

  const parsed = parseNewAdminInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const role = parseRole(readField(body, "role"));
  if (!role.ok) {
    return NextResponse.json({ error: role.error }, { status: 400 });
  }

  if (await findAdminByEmail(parsed.data.email)) {
    return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
  }

  const admin = await createAdmin({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    role: role.data,
  });

  return NextResponse.json({ admin }, { status: 201 });
}
