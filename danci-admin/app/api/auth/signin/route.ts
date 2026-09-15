import { NextResponse } from "next/server";
import { countAdmins, findAdminByEmail } from "@/lib/admins";
import { verifyPassword } from "@/lib/password";
import { startSession } from "@/lib/session";
import { parseSignInInput } from "@/lib/validation";

export async function POST(request: Request) {
  if ((await countAdmins()) === 0) {
    return NextResponse.json(
      { error: "尚未创建系统管理员，请先完成注册" },
      { status: 403 },
    );
  }

  const parsed = parseSignInInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const admin = await findAdminByEmail(parsed.data.email);
  const passwordMatched =
    admin && (await verifyPassword(parsed.data.password, admin.passwordHash));

  if (!admin || !passwordMatched) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }

  await startSession(admin.id);

  return NextResponse.json({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
}
