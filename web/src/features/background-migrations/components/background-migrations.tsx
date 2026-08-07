import { DataTable } from "@/src/components/table/data-table";
import { DataTableToolbar } from "@/src/components/table/data-table-toolbar";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { api } from "@/src/utils/api";
import { type BackgroundMigration } from "@langfuse/shared";
import { RetryBackgroundMigration } from "@/src/features/background-migrations/components/retry-background-migration";
import { StatusBadge } from "@/src/components/layouts/status-badge";
import Page from "@/src/components/layouts/page";

export default function BackgroundMigrationsTable() {
  const backgroundMigrations = api.backgroundMigrations.all.useQuery();

  const columns = [
    {
      accessorKey: "name",
      id: "name",
      enableColumnFilter: false,
      header: "名称",
    },
    {
      accessorKey: "script",
      id: "script",
      enableColumnFilter: false,
      header: "脚本",
    },
    {
      accessorKey: "args",
      id: "args",
      enableColumnFilter: false,
      header: "参数",
      size: 80,
      cell: (row) => JSON.stringify(row.getValue()),
    },
    {
      id: "status",
      header: "状态",
      size: 80,
      cell: (row) => {
        const failedAt = row.row.original.failedAt;
        if (failedAt) {
          return (
            <StatusBadge type="failed" showText={false}>
              失败
            </StatusBadge>
          );
        }
        const finishedAt = row.row.original.finishedAt;
        if (finishedAt) {
          return (
            <StatusBadge type="finished" showText={false}>
              已完成
            </StatusBadge>
          );
        }
        const workerId = row.row.original.workerId;
        if (workerId) {
          return (
            <StatusBadge type="active" showText={false}>
              进行中
            </StatusBadge>
          );
        }

        return (
          <StatusBadge type="queued" showText={false}>
            排队中
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "failedReason",
      id: "failedReason",
      enableColumnFilter: false,
      header: "失败原因",
    },
    {
      accessorKey: "state",
      id: "state",
      enableColumnFilter: false,
      header: "状态数据",
      cell: (row) => JSON.stringify(row.getValue()),
    },
    {
      id: "actions",
      header: "操作",
      size: 65,
      cell: (row) => {
        const name = row.row.original.name;
        const isRetryable = row.row.original.failedAt !== null;
        return (
          <RetryBackgroundMigration
            backgroundMigrationName={name}
            isRetryable={isRetryable}
          />
        );
      },
    },
  ] as LangfuseColumnDef<BackgroundMigration>[];

  return (
    <Page
      headerProps={{
        title: "后台迁移",
      }}
    >
      <DataTableToolbar columns={columns} />
      <DataTable
        tableName="backgroundMigrations"
        columns={columns}
        data={
          backgroundMigrations.isPending
            ? { isLoading: true, isError: false }
            : backgroundMigrations.isError
              ? {
                  isLoading: false,
                  isError: true,
                  error: backgroundMigrations.error.message,
                }
              : {
                  isLoading: false,
                  isError: false,
                  data: backgroundMigrations.data?.migrations ?? [],
                }
        }
      />
    </Page>
  );
}
