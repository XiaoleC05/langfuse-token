"use client";

import { RefreshCw } from "lucide-react";
import { api } from "@/src/utils/api";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  AdminCard,
  PLATFORM_ADMIN_EMAIL,
  errMsg,
  type UserItem,
} from "@/src/features/oxelia51/components/admin/shared";

/** 用户管理：平台用户列表（只读），管理员账户打徽标 */
export function UsersTab() {
  const usersQ = api.oxelia51Admin.usersList.useQuery();
  const users = usersQ.data?.items as UserItem[] | undefined;

  return (
    <AdminCard
      title={`平台用户（${users?.length ?? "…"}）`}
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void usersQ.refetch()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      }
    >
      {usersQ.error ? (
        <p className="text-sm" style={{ color: "var(--ox-warn)" }}>
          {errMsg(usersQ.error)}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>邮箱</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>组织 / 角色</TableHead>
              <TableHead>注册时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    {u.email ?? "—"}
                    {u.email === PLATFORM_ADMIN_EMAIL && (
                      <Badge variant="secondary">管理员</Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell>{u.name || "—"}</TableCell>
                <TableCell className="text-xs">
                  {(u.memberships ?? []).length === 0
                    ? "—"
                    : (u.memberships ?? [])
                        .map((m) => `${m.org}（${m.role}）`)
                        .join("、")}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString("zh-CN")
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </AdminCard>
  );
}
