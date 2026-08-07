"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { api } from "@/src/utils/api";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  AdminCard,
  PLATFORM_ADMIN_EMAIL,
  errMsg,
  useIsSuperAdmin,
  type UserItem,
} from "@/src/features/oxelia51/components/admin/shared";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";

/**
 * 用户管理：管理员名单说明 + 平台用户列表。
 * 管理员由服务端环境变量驱动，此处不做任何增删管理员的 UI。
 * 重置密码 / 删除用户为写操作，仅超级管理员可见（服务端 superAdminProcedure 兜底）。
 */
export function UsersTab() {
  const isSuperAdmin = useIsSuperAdmin();
  const usersQ = api.oxelia51Admin.usersList.useQuery();
  const users = usersQ.data?.items as UserItem[] | undefined;

  const utils = api.useUtils();
  const [opError, setOpError] = useState("");

  // 重置密码：确认对话框目标 + 成功后的临时密码（仅本次展示）
  const [resetTarget, setResetTarget] = useState<UserItem | null>(null);
  const [resetResult, setResetResult] = useState<{
    email: string | null;
    tempPassword: string;
  } | null>(null);

  // 删除用户：对话框目标 + 邮箱确认输入 + 对话框内错误
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const resetMut = api.oxelia51Admin.adminResetUserPassword.useMutation({
    onSuccess: (data) => {
      setResetTarget(null);
      setResetResult(data);
    },
    onError: (e) => {
      setResetTarget(null);
      setOpError(e.message);
    },
  });

  const deleteMut = api.oxelia51Admin.adminDeleteUser.useMutation({
    onSuccess: (data) => {
      setDeleteTarget(null);
      setDeleteConfirmEmail("");
      setDeleteError("");
      void utils.oxelia51Admin.usersList.invalidate();
      showSuccessToast({
        title: "用户已删除",
        description: `${data.email ?? "该用户"} 及其关联数据已删除。`,
      });
    },
    onError: (e) => setDeleteError(e.message),
  });

  const openDeleteDialog = (u: UserItem) => {
    setDeleteTarget(u);
    setDeleteConfirmEmail("");
    setDeleteError("");
  };

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
        {opError && (
          <p className="text-sm" style={{ color: "var(--ox-danger)" }}>
            {opError}
          </p>
        )}
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
                {isSuperAdmin && <TableHead className="w-40">操作</TableHead>}
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
                  {isSuperAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="重置为该用户的登录密码（仅超级管理员可操作）"
                          onClick={() => {
                            setOpError("");
                            setResetTarget(u);
                          }}
                        >
                          重置密码
                        </Button>
                        {/* 超级管理员账户不提供删除入口（服务端另有保护） */}
                        {u.email !== PLATFORM_ADMIN_EMAIL && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="永久删除该用户（仅超级管理员可操作）"
                            style={{ color: "var(--ox-danger)" }}
                            onClick={() => {
                              setOpError("");
                              openDeleteDialog(u);
                            }}
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {(users ?? []).length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isSuperAdmin ? 5 : 4}
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

      {/* 重置密码：二次确认 */}
      <AlertDialog
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>重置用户密码</AlertDialogTitle>
            <AlertDialogDescription>
              将为 <b>{resetTarget?.email}</b>{" "}
              生成一个 12 位临时密码，原密码立即失效。
              临时密码仅显示一次，需由您转交用户。确认继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetMut.isPending}
              onClick={() => {
                if (resetTarget) resetMut.mutate({ userId: resetTarget.id });
              }}
            >
              {resetMut.isPending ? "重置中…" : "确认重置"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置成功：临时密码仅显示一次 + 一键复制 */}
      <Dialog
        open={resetResult !== null}
        onOpenChange={(open) => {
          if (!open) setResetResult(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>临时密码已生成</DialogTitle>
            <DialogDescription>
              用户 {resetResult?.email} 的密码已重置。
              临时密码仅显示一次，关闭后无法再次查看，请立即转交用户并提醒其尽快修改密码。
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded border px-2 py-1 font-mono text-sm select-all">
                {resetResult?.tempPassword}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!resetResult) return;
                  void navigator.clipboard.writeText(resetResult.tempPassword);
                  showSuccessToast({
                    title: "已复制",
                    description: "临时密码已复制到剪贴板。",
                  });
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                复制
              </Button>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setResetResult(null)}>我已妥善保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除用户：输入邮箱二次确认 */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>删除用户</DialogTitle>
            <DialogDescription>
              此操作将永久删除用户 <b>{deleteTarget?.email}</b>{" "}
              及其会员关系等关联数据，不可恢复。请输入该用户的邮箱地址以确认。
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Input
              placeholder={deleteTarget?.email ?? ""}
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              autoComplete="off"
            />
            {deleteError && (
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--ox-danger)" }}
              >
                {deleteError}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="destructive"
              loading={deleteMut.isPending}
              disabled={
                deleteConfirmEmail.trim() !== (deleteTarget?.email ?? "")
              }
              onClick={() => {
                if (deleteTarget) deleteMut.mutate({ userId: deleteTarget.id });
              }}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
