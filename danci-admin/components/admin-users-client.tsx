"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2Icon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLES,
  isSuperAdmin,
  type AdminRole,
} from "@/lib/roles";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "admin",
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" });

export function AdminUsersClient({
  currentAdminId,
}: {
  currentAdminId: string;
}) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // 通过刷新令牌触发列表重载，保证新建 / 编辑后拿到的是服务端的最新数据。
  useEffect(() => {
    let active = true;

    fetch("/api/admin-users", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as {
          admins?: AdminRow[];
          error?: string;
        } | null;
        return { ok: response.ok, data };
      })
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok) {
          toast.error(data?.error ?? "获取管理员列表失败");
        } else {
          setAdmins(data?.admins ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        toast.error("网络异常，请稍后重试");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  function requestReload() {
    setReloadToken((token) => token + 1);
  }

  function openCreateDialog() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(admin: AdminRow) {
    setEditing(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      password: "",
      role: admin.role,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = editing
        ? await fetch(`/api/admin-users/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: form.name, role: form.role }),
          })
        : await fetch("/api/admin-users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role,
            }),
          });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        toast.error(data?.error ?? "保存失败，请稍后重试");
        return;
      }

      toast.success(editing ? "管理员已更新" : "管理员已创建");
      setDialogOpen(false);
      requestReload();
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  const isEditingSelf = editing?.id === currentAdminId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">管理员管理</h1>
          <p className="text-muted-foreground text-sm">
            共 {admins.length} 位管理员。系统管理员可新增管理员并调整其角色。
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusIcon />
          新增管理员
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2Icon className="text-muted-foreground mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground h-24 text-center"
                >
                  暂无管理员
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.name}
                    {admin.id === currentAdminId ? (
                      <span className="text-muted-foreground ml-2 text-xs">
                        （当前登录）
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        isSuperAdmin(admin.role) ? "default" : "secondary"
                      }
                    >
                      {ADMIN_ROLE_LABELS[admin.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {dateFormatter.format(new Date(admin.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`编辑 ${admin.name}`}
                      onClick={() => openEditDialog(admin)}
                    >
                      <PencilIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "编辑管理员" : "新增管理员"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "修改管理员姓名或角色。"
                  : "创建后可指定其为普通管理员或系统管理员。"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="admin-name">姓名</Label>
                <Input
                  id="admin-name"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="请输入姓名"
                />
              </div>

              {editing ? null : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="admin-email">邮箱</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admin-password">密码</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      required
                      value={form.password}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      placeholder={`至少 ${MIN_PASSWORD_LENGTH} 位`}
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label>角色</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, role: value as AdminRole }))
                  }
                  disabled={isEditingSelf}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ADMIN_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditingSelf ? (
                  <p className="text-muted-foreground text-xs">
                    不能修改自己的角色，请让其他系统管理员操作。
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2Icon className="animate-spin" /> : null}
                {editing ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
