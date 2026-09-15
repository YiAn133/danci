import { redirect } from "next/navigation";
import { countAdmins } from "@/lib/admins";
import { getCurrentAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * 入口引导：
 * - 系统中没有任何管理员 → 去注册首个系统管理员
 * - 已登录 → 进单词书管理
 * - 未登录 → 去登录
 */
export default async function HomePage() {
  if ((await countAdmins()) === 0) {
    redirect("/signup");
  }

  if (await getCurrentAdmin()) {
    redirect("/books");
  }

  redirect("/signin");
}
