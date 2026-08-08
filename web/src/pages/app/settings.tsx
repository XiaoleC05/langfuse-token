"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ExternalLink } from "lucide-react";
import { WorkspaceLayout } from "@/src/features/oxelia51/components/workspace/WorkspaceLayout";

/** 个人工作台设置：账户信息与入口。 */

export default function SettingsPage() {
  const { data: session } = useSession();

  const rows: { label: string; value?: string }[] = [
    { label: "邮箱", value: session?.user?.email ?? "—" },
    { label: "名称", value: session?.user?.name ?? "—" },
    {
      label: "组织",
      value: session?.user?.organizations.map((o) => o.name).join("、") || "—",
    },
  ];

  return (
    <WorkspaceLayout active="/app/settings">
      <h1 className="text-2xl font-bold tracking-tight text-(--ox-text-h)">
        设置
      </h1>
      <p className="mt-1 text-sm text-(--ox-text-muted)">
        个人工作台设置。
      </p>

      <div className="mt-6 rounded-xl border" style={{ borderColor: "var(--ox-border)" }}>
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--ox-border)" }}>
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-(--ox-text-muted)">{r.label}</span>
              <span className="max-w-[60%] truncate text-(--ox-text-h)">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/organization"
          className="inline-flex w-fit items-center gap-1 rounded-md border px-3 py-2 text-sm text-(--ox-text-h) transition-colors hover:border-(--ox-accent)/60"
          style={{ borderColor: "var(--ox-border)" }}
        >
          团队视图（高级功能）
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <p className="text-xs leading-5 text-(--ox-text-muted)">
          更细致的项目设置（代理地址、项目密钥、预算告警）在云平台的团队视图中。
          桌面应用同步与多设备设置将在后续版本提供。
        </p>
      </div>
    </WorkspaceLayout>
  );
}

SettingsPage.skipAppLayout = true;
