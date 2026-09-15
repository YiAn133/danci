import { NextResponse } from "next/server";
import { updateAdmin } from "@/lib/admins";
import { isSuperAdmin } from "@/lib/roles";
import { authorizeSuperAdmin } from "@/lib/session";
import { parseRole, readField } from "@/lib/validation";

/** 编辑管理员（姓名 / 角色）：仅系统管理员可操作。 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeSuperAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);

  const name = readField(body, "name");
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "请输入姓名" }, { status: 400 });
  }

  const role = parseRole(readField(body, "role"));
  if (!role.ok) {
    return NextResponse.json({ error: role.error }, { status: 400 });
  }

  // 防止把自己降级后失去管理入口（系统中必须始终至少有一位系统管理员）。
  if (id === auth.admin.id && isSuperAdmin(auth.admin.role) && !isSuperAdmin(role.data)) {
    return NextResponse.json(
      { error: "不能修改自己的角色，请让其他系统管理员操作" },
      { status: 400 },
    );
  }

  const admin = await updateAdmin(id, { name: name.trim(), role: role.data });
  if (!admin) {
    return NextResponse.json({ error: "管理员不存在" }, { status: 404 });
  }

  return NextResponse.json({ admin });
}
