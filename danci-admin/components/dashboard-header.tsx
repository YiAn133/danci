"use client";

import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  const pathname = usePathname();
  const title =
    ADMIN_NAV.find((item) => item.url === pathname)?.title ?? "后台管理";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="text-sm font-medium">{title}</span>
    </header>
  );
}
