"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookMarkedIcon,
  LanguagesIcon,
  Loader2Icon,
  LogOutIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { isSuperAdmin, type AdminRole } from "@/lib/roles";

export type SidebarAdmin = {
  name: string;
  email: string;
  role: AdminRole;
};

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  /** 仅系统管理员可见。 */
  superAdminOnly?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { title: "单词书管理", url: "/books", icon: BookMarkedIcon },
  {
    title: "管理员管理",
    url: "/admin-users",
    icon: ShieldCheckIcon,
    superAdminOnly: true,
  },
];

export function AppSidebar({ admin }: { admin: SidebarAdmin }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const initial = (admin.name.trim() || admin.email).charAt(0).toUpperCase();
  const items = ADMIN_NAV.filter(
    (item) => !item.superAdminOnly || isSuperAdmin(admin.role),
  );

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      toast.success("已退出登录");
      router.replace("/signin");
      router.refresh();
    } catch {
      toast.error("退出失败，请稍后重试");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/books">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LanguagesIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">单词管理系统</span>
                  <span className="text-muted-foreground truncate text-xs">
                    后台管理
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>内容管理</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2">
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-sm font-medium">{admin.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {admin.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            disabled={signingOut}
            title="退出登录"
            aria-label="退出登录"
          >
            {signingOut ? <Loader2Icon className="animate-spin" /> : <LogOutIcon />}
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
