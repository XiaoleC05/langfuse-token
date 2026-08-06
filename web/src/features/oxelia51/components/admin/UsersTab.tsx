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

/**
 * 用户管理：管理员名单说明 + 平台用户列表（只读）。
 * 管理员由服务端环境变量驱动，此处不做任何增删管理员的 UI。
 */
export function UsersTab() {
  const usersQ = api.oxelia51Admin.usersList.useQuery();
  const users = usersQ.data?.items as UserItem[] | undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* 管理员名单（env 驱动，只读展示） */}
      <AdminCard title="管理员">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-xs sm:text-sm">
            {PLATFORM_ADMIN_EMAIL}
          </span>
          <Badge variant="secondary">超级管理员</Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          管理员名单由服务器环境变量 OXELIA51_ADMIN_EMAILS
          管理；新增/变更管理员与所有用户操作仅超级管理员可执行。
        </p>
      </AdminCard>

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
              {(users ?? []).length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground text-center text-sm"
                  >
                    暂无用户数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </AdminCard>
    </div>
  );
}
