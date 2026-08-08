"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FolderKanban } from "lucide-react";
import { api } from "@/src/utils/api";
import { WorkspaceLayout } from "@/src/features/oxelia51/components/workspace/WorkspaceLayout";
import { formatCost, formatTokens, useCurrency } from "@/src/features/oxelia51/currency";

/** 个人工作台项目列表：Cursor 式（自定义名称 + 可选本地文件夹引用元数据）。 */

function LocalFolderField({ projectId, initial }: { projectId: string; initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const utils = api.useUtils();
  const setLocalFolder = api.workspace.setLocalFolder.useMutation({
    onSuccess: () => utils.workspace.getLocalFolders.invalidate(),
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    const next = value.trim() || null;
    setLocalFolder.mutate(
      { projectId, localFolder: next },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="本地文件夹路径（可选）"
        className="min-w-0 flex-1 rounded-md border bg-transparent px-2 py-1 text-xs text-(--ox-text-h) outline-none placeholder:text-(--ox-text-muted)/60 focus:border-(--ox-accent)"
        style={{ borderColor: "var(--ox-border)" }}
      />
      {saved && <span className="shrink-0 text-[10px] text-(--ox-ok)">已保存</span>}
    </div>
  );
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const byProject = api.workspace.byProject.useQuery();
  const localFolders = api.workspace.getLocalFolders.useQuery();
  const rateQuery = api.workspace.exchangeRate.useQuery();
  const { currency } = useCurrency();
  const rate = rateQuery.data?.rateCnyPerUsd ?? 7.2;
  const cost = (usd?: number) => formatCost(usd ?? 0, currency, rate);
  const tokens = (n?: number) => formatTokens(n ?? 0);

  const projects = session?.user?.organizations.flatMap((org) => org.projects) ?? [];
  const statById = new Map((byProject.data ?? []).map((p) => [p.projectId, p]));
  const folderById = new Map((localFolders.data ?? []).map((f) => [f.projectId, f.localFolder]));

  return (
    <WorkspaceLayout active="/app/projects">
      <h1 className="text-2xl font-bold tracking-tight text-(--ox-text-h)">
        项目
      </h1>
      <p className="mt-1 text-sm text-(--ox-text-muted)">
        你的项目与近 30 天用量。可为每个项目关联一个本地文件夹，便于对照。
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const stat = statById.get(p.id);
          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border p-5"
              style={{ borderColor: "var(--ox-border)" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-(--ox-accent)">
                  <FolderKanban className="h-4 w-4" />
                </span>
                <span className="truncate text-sm font-semibold text-(--ox-text-h)">
                  {p.name}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-(--ox-text-muted)">Token</span>
                <span className="tabular-nums text-(--ox-text-h)">{tokens(stat?.tokens)}</span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-(--ox-text-muted)">成本</span>
                <span className="tabular-nums text-(--ox-text-h)">{cost(stat?.costUsd)}</span>
              </div>
              <div className="mt-auto">
                <LocalFolderField projectId={p.id} initial={folderById.get(p.id) ?? null} />
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-full rounded-xl border px-4 py-10 text-center text-sm text-(--ox-text-muted)" style={{ borderColor: "var(--ox-border)" }}>
            还没有项目。在云平台创建项目并接入代理后，这里会展示用量。
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}

ProjectsPage.skipAppLayout = true;
