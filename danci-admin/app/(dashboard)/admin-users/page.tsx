import { redirect } from "next/navigation";
import { AdminUsersClient } from "@/components/admin-users-client";
import { isSuperAdmin } from "@/lib/roles";
import { getCurrentAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** 管理员管理仅系统管理员可见，普通管理员直接访问会被重定向。 */
export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/signin");
  }
  if (!isSuperAdmin(admin.role)) {
    redirect("/books");
  }

  return <AdminUsersClient currentAdminId={admin.id} />;
}
