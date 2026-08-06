"use client";

import { useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/src/utils/api";
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
  AdminCard,
  errMsg,
  type WhitelistItem,
} from "@/src/features/oxelia51/components/admin/shared";

/** 安全：IP 白名单增删查、一键添加本机 IP */
export function SecurityTab() {
  const whitelistQ = api.oxelia51Admin.whitelistList.useQuery();
  const whitelist = whitelistQ.data as
    | { items?: WhitelistItem[]; clientIP?: string }
    | undefined;

  const utils = api.useUtils();
  const [opError, setOpError] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const invalidateWhitelist = () =>
    utils.oxelia51Admin.whitelistList.invalidate();

  const createMut = api.oxelia51Admin.whitelistCreate.useMutation({
    onSuccess: () => {
      setNewIp("");
      setNewLabel("");
      void invalidateWhitelist();
    },
    onError: (e) => setOpError(e.message),
  });
  const deleteMut = api.oxelia51Admin.whitelistDelete.useMutation({
    onSuccess: () => void invalidateWhitelist(),
    onError: (e) => setOpError(e.message),
  });

  return (
    <AdminCard
      title="IP 白名单"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void whitelistQ.refetch()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      }
    >
      <p className="text-muted-foreground text-xs">
        白名单控制高危运维接口（命令执行）的访问来源
        {whitelist?.clientIP ? `，当前出口 IP：${whitelist.clientIP}` : ""}
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="IP 地址"
          value={newIp}
          onChange={(e) => setNewIp(e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="备注（可选）"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={() => {
            setOpError("");
            createMut.mutate({ ip: newIp.trim(), label: newLabel.trim() });
          }}
          disabled={!newIp.trim() || createMut.isPending}
        >
          添加
        </Button>
        {whitelist?.clientIP && (
          <Button
            variant="outline"
            title={`将当前出口 IP ${whitelist.clientIP} 加入白名单`}
            disabled={createMut.isPending}
            onClick={() => {
              setOpError("");
              // IP 已在白名单：给出明确提示而非禁用按钮（禁用会显示禁止指针）
              if (
                (whitelist.items ?? []).some((i) => i.ip === whitelist.clientIP)
              ) {
                setOpError(`当前出口 IP ${whitelist.clientIP} 已在白名单中`);
                return;
              }
              createMut.mutate({
                ip: whitelist.clientIP!,
                label: "本机（一键添加）",
              });
            }}
          >
            一键添加本机 IP
          </Button>
        )}
      </div>
      {opError && (
        <p className="text-sm" style={{ color: "var(--ox-danger)" }}>
          {opError}
        </p>
      )}
      {whitelistQ.error ? (
        <p className="text-sm" style={{ color: "var(--ox-warn)" }}>
          {errMsg(whitelistQ.error)}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP</TableHead>
              <TableHead>备注</TableHead>
              <TableHead>添加时间</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(whitelist?.items ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.ip}</TableCell>
                <TableCell>{item.label || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString("zh-CN")
                    : "—"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOpError("");
                      deleteMut.mutate({ id: String(item.id) });
                    }}
                  >
                    <Trash2
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--ox-danger)" }}
                    />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(whitelist?.items ?? []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground text-center text-sm"
                >
                  暂无白名单条目
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </AdminCard>
  );
}
