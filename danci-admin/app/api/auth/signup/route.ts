import { NextResponse } from "next/server";
import { countAdmins, createAdmin, findAdminByEmail } from "@/lib/admins";
import { hashPassword } from "@/lib/password";
import { startSession } from "@/lib/session";
import { parseNewAdminInput } from "@/lib/validation";

/**
 * 首个系统管理员注册。系统中已存在管理员时一律拒绝，
 * 保证「系统管理员只能注册一次」。
 */
export async function POST(request: Request) {
  if ((await countAdmins()) > 0) {
    return NextResponse.json(
      { error: "系统管理员已存在，无法再次注册" },
      { status: 403 },
    );
  }

  const parsed = parseNewAdminInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (await findAdminByEmail(parsed.data.email)) {
    return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
  }

  const admin = await createAdmin({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    role: "super_admin",
  });

  await startSession(admin.id);

  return NextResponse.json({ admin }, { status: 201 });
}
