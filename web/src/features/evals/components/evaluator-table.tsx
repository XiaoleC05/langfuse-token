import { StatusBadge } from "@/src/components/layouts/status-badge";
import { LevelCountsDisplay } from "@/src/components/level-counts-display";
import { DataTable } from "@/src/components/table/data-table";
import { DataTableToolbar } from "@/src/components/table/data-table-toolbar";
import {
  DataTableControlsProvider,
  DataTableControls,
} from "@/src/components/table/data-table-controls";
import { ResizableFilterLayout } from "@/src/components/table/resizable-filter-layout";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import useColumnVisibility from "@/src/features/column-visibility/hooks/useColumnVisibility";
import { InlineFilterState } from "@/src/features/filters/components/filter-builder";
import { useDetailPageLists } from "@/src/features/navigate-detail-pages/context";
import { useSidebarFilterState } from "@/src/features/filters/hooks/useSidebarFilterState";
import { evaluatorFilterConfig } from "@/src/features/filters/config/evaluators-config";
import { api } from "@/src/utils/api";
import { createColumnHelper } from "@tanstack/react-table";
import { useEffect, useState, useMemo } from "react";
import { useQueryParam, StringParam, withDefault } from "use-query-params";
import { usePaginationState } from "@/src/hooks/usePaginationState";
import {
  isLegacyEvalTarget,
  isEventTarget,
} from "@/src/features/evals/utils/typeHelpers";
import { useOrderByState } from "@/src/features/orderBy/hooks/useOrderByState";
import TableIdOrName from "@/src/components/table/table-id";
import { ExternalLinkIcon, Info, Pen } from "lucide-react";
import { usePeekNavigation } from "@/src/components/table/peek/hooks/usePeekNavigation";
import { TablePeekViewEvaluatorConfigDetail } from "@/src/components/table/peek/peek-evaluator-config-detail";
import { evalConfigTargetValues } from "@/src/server/api/definitions/evalConfigsTable";
import { Button } from "@/src/components/ui/button";
import { IconOnlyButton } from "@/src/components/IconOnlyButton";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { EvaluatorForm } from "@/src/features/evals/components/evaluator-form";
import { useRouter } from "next/router";
import { DeleteEvalConfigButton } from "@/src/components/deleteButton";
import { MaintainerTooltip } from "@/src/features/evals/components/maintainer-tooltip";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { Skeleton } from "@/src/components/ui/skeleton";
import { usdFormatter } from "@/src/utils/numbers";
import { Callout } from "@/src/components/ui/callout";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  type EvaluatorDataRow,
  useEvaluatorTableData,
} from "@/src/features/evals/hooks/useEvaluatorTableData";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import {
  TableBadgeLoadingCell,
  TableIconButtonLoadingCell,
  TableTextLoadingCell,
} from "@/src/components/table/loading-cells";

function LegacyBadgeCell({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="warning">
        旧版
        {status === "ACTIVE" && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="text-dark-yellow ml-1 h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px]">
              <div className="space-y-1 text-sm">
                <p className="font-bold">需要操作</p>
                <p className="text-muted-foreground">
                  此评估器需要进行更改才能享受新功能和性能改进。请按照{" "}
                  <Link
                    href="https://langfuse.com/faq/all/llm-as-a-judge-migration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dark-blue font-bold hover:opacity-80"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    此指南
                  </Link>{" "}
                  升级到新版本。<br /> <br /> 如果不升级，您的评估器将继续运行，但您将无法享受改进。
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </Badge>
    </div>
  );
}

export default function EvaluatorTable({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { setDetailPageList } = useDetailPageLists();
  const [paginationState, setPaginationState] = usePaginationState(0, 50, {
    page: "pageIndex",
    limit: "pageSize",
  });
  const [searchQuery, setSearchQuery] = useQueryParam(
    "search",
    withDefault(StringParam, null),
  );
  const [editConfigId, setEditConfigId] = useState<string | null>(null);
  const utils = api.useUtils();

  const [orderByState, setOrderByState] = useOrderByState({
    column: "status",
    order: "ASC",
  });

  const newFilterOptions = {
    status: ["ACTIVE", "PAUSED", "INACTIVE"],
    target: evalConfigTargetValues,
  };

  const queryFilter = useSidebarFilterState(
    evaluatorFilterConfig,
    newFilterOptions,
    {
      loading: false,
      stateLocation: "urlAndSessionStorage",
      sessionFilterContextId: projectId,
    },
  );

  const { evaluators, rows, totalCount, hasLegacyEvals } =
    useEvaluatorTableData({
      projectId,
      page: paginationState.pageIndex,
      limit: paginationState.pageSize,
      filter: queryFilter.filterState,
      orderBy: orderByState,
      searchQuery,
    });

  const existingEvaluator = api.evals.configById.useQuery(
    {
      id: editConfigId as string,
      projectId,
    },
    {
      enabled: !!editConfigId,
    },
  );

  const hasAccess = useHasProjectAccess({ projectId, scope: "evalJob:CUD" });

  const datasets = api.datasets.allDatasetMeta.useQuery({ projectId });

  useEffect(() => {
    if (evaluators.isSuccess) {
      const { configs: configList = [] } = evaluators.data ?? {};
      setDetailPageList(
        "evals",
        configList.map((evaluator) => ({ id: evaluator.id })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluators.isSuccess, evaluators.data]);

  const columnHelper = createColumnHelper<EvaluatorDataRow>();
  const columns = [
    columnHelper.accessor("scoreName", {
      id: "scoreName",
      header: "生成的评分名称",
      size: 200,
      cell: (row) => {
        const scoreName = row.getValue();
        return scoreName ? <TableIdOrName value={scoreName} /> : undefined;
      },
    }),
    columnHelper.accessor("status", {
      header: "状态",
      id: "status",
      size: 80,
      loadingCell: <TableBadgeLoadingCell />,
      cell: (row) => {
        const status = row.getValue();
        return (
          <StatusBadge
            type={status.toLowerCase()}
            className={row.getValue() === "FINISHED" ? "pl-3" : ""}
          />
        );
      },
    }),
    columnHelper.accessor("totalCost", {
      header: "总成本（7 天）",
      id: "totalCost",
      size: 120,
      cell: (row) => {
        const totalCost = row.getValue();

        if (row.row.original.isCostLoading) {
          return <Skeleton className="h-4 w-16" />;
        }

        if (totalCost != null) return usdFormatter(totalCost, 2, 4);

        return "–";
      },
    }),
    columnHelper.accessor("result", {
      header: "结果",
      id: "result",
      size: 150,
      cell: (row) => {
        const result = row.getValue();
        return (
          <LevelCountsDisplay
            counts={result}
            isLoading={row.row.original.isResultLoading}
          />
        );
      },
    }),
    columnHelper.accessor("logs", {
      header: "日志",
      id: "logs",
      size: 150,
      loadingCell: <Skeleton className="h-6 w-16 rounded-md" />,
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <Button
            variant="outline"
            aria-label="view-logs"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/project/${projectId}/evals/${encodeURIComponent(id)}`,
              );
            }}
          >
            <ExternalLinkIcon className="mr-1 h-3 w-3" />
            查看
          </Button>
        );
      },
    }),
    columnHelper.accessor("template", {
      id: "template",
      header: "关联评估器",
      size: 200,
      loadingCell: (
        <div className="flex items-center gap-2">
          <TableTextLoadingCell className="w-32" />
          <TableBadgeLoadingCell className="w-6" />
        </div>
      ),
      cell: ({ row }) => {
        const template = row.original.template;
        if (!template) return "模板未找到";
        return (
          <div className="flex items-center gap-2">
            <TableIdOrName value={template.name} />
            <div className="flex justify-center">
              <MaintainerTooltip maintainer={row.original.maintainer} />
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      id: "createdAt",
      header: "创建时间",
      enableSorting: true,
      size: 150,
    }),
    columnHelper.accessor("updatedAt", {
      id: "updatedAt",
      header: "更新时间",
      enableSorting: true,
      size: 150,
    }),
    columnHelper.accessor("isLegacy", {
      id: "isLegacy",
      header: "评估版本",
      size: 180,
      enableHiding: true,
      loadingCell: <TableBadgeLoadingCell />,
      cell: (row) => {
        const targetObject = row.row.original.target;
        const status = row.row.original.rawStatus;
        const isDeprecated = isLegacyEvalTarget(targetObject);

        if (!isDeprecated) return null;

        return <LegacyBadgeCell status={status} />;
      },
    }),
    columnHelper.accessor("target", {
      id: "target",
      header: "运行目标",
      size: 150,
      enableHiding: true,
      cell: (row) => {
        const targetObject = row.getValue();
        const renderText = isEventTarget(targetObject)
          ? "observations"
          : targetObject;
        return <span className="text-muted-foreground">{renderText}</span>;
      },
    }),
    columnHelper.accessor("filter", {
      id: "filter",
      header: "筛选",
      size: 200,
      enableHiding: true,
      cell: (row) => {
        const filterState = row.getValue();

        // FIX: Temporary workaround: Used to display a different value than the actual value since multiSelect doesn't support key-value pairs
        const newFilterState = filterState.map((filter) => {
          if (filter.type === "stringOptions" && filter.column === "Dataset") {
            return {
              ...filter,
              value: filter.value.map(
                (datasetId) =>
                  datasets.data?.find((d) => d.id === datasetId)?.name ??
                  datasetId,
              ),
            };
          }
          return filter;
        });

        return (
          <div className="flex h-full overflow-x-auto">
            <InlineFilterState filterState={newFilterState} />
          </div>
        );
      },
    }),
    columnHelper.accessor("id", {
      header: "Id",
      id: "id",
      size: 100,
      enableHiding: true,
      cell: (row) => {
        const id = row.getValue();
        return id ? <TableIdOrName value={id} /> : undefined;
      },
    }),
    columnHelper.accessor("actions", {
      header: "操作",
      id: "actions",
      size: 100,
      loadingCell: <TableIconButtonLoadingCell />,
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <div className="flex items-center gap-1">
            <IconOnlyButton
              key={id}
              icon={<Pen className="h-4 w-4" />}
              label="编辑"
              aria-label="edit"
              disabledReason={
                hasAccess
                  ? undefined
                  : "您没有编辑此评估器的权限。"
              }
              onClick={(e) => {
                e.stopPropagation();
                if (id) setEditConfigId(id);
              }}
            />
            <DeleteEvalConfigButton
              aria-label="delete"
              itemId={id}
              projectId={projectId}
              isTableAction
              deleteConfirmation={row.original.scoreName}
              icon
              variant="ghost"
              size="icon-xs"
              title="删除"
            />
          </div>
        );
      },
    }),
  ] as LangfuseColumnDef<EvaluatorDataRow>[];

  const [columnVisibility, setColumnVisibility] =
    useColumnVisibility<EvaluatorDataRow>(
      "evalConfigColumnVisibility",
      columns,
    );

  const peekNavigationProps = usePeekNavigation();

  const peekConfig = useMemo(
    () => ({
      itemType: "RUNNING_EVALUATOR" as const,
      detailNavigationKey: "evals",
      peekEventOptions: {
        ignoredSelectors: [
          "[aria-label='edit'], [aria-label='view-logs'], [aria-label='delete']",
        ],
      },
      ...peekNavigationProps,
    }),
    [peekNavigationProps],
  );

  return (
    <DataTableControlsProvider
      tableName={evaluatorFilterConfig.tableName}
      defaultSidebarCollapsed={evaluatorFilterConfig.defaultSidebarCollapsed}
    >
      <div className="flex h-full w-full flex-col">
        {hasLegacyEvals && (
          <div className="p-2 pb-0">
            <Callout
              id="eval-remapping-table"
              variant="warning"
              key="dismissed-eval-remapping-callouts"
            >
              <span>新功能已上线。</span>
              <span className="font-bold">
                您的部分评估器（标记为&quot;旧版&quot;）需要进行更改{" "}
              </span>
              <span>才能享受新功能和改进。</span>
              <Link
                href="https://langfuse.com/faq/all/llm-as-a-judge-migration"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-blue font-bold hover:opacity-80"
              >
                了解变更内容和升级方法
              </Link>
              <span>。</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="ml-1 inline h-4 w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  您的评估器在不升级的情况下将继续工作，但您将无法享受性能改进。
                </TooltipContent>
              </Tooltip>
            </Callout>
          </div>
        )}

        {/* Toolbar spanning full width */}
        <DataTableToolbar
          columns={columns}
          filterState={queryFilter.filterState}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          searchConfig={{
            metadataSearchFields: ["名称"],
            updateQuery: setSearchQuery,
            currentQuery: searchQuery ?? undefined,
            tableAllowsFullTextSearch: false,
            setSearchType: undefined,
            searchType: undefined,
          }}
        />

        {/* Content area with sidebar and table */}
        <ResizableFilterLayout>
          <DataTableControls queryFilter={queryFilter} />

          <div className="flex flex-1 flex-col overflow-hidden">
            <DataTable
              tableName="evalConfigs"
              columns={columns}
              peekView={peekConfig}
              data={
                evaluators.isLoading
                  ? { isLoading: true, isError: false }
                  : evaluators.isError
                    ? {
                        isLoading: false,
                        isError: true,
                        error: evaluators.error.message,
                      }
                    : {
                        isLoading: false,
                        isError: false,
                        data: rows,
                      }
              }
              pagination={{
                totalCount,
                onChange: setPaginationState,
                state: paginationState,
              }}
              orderBy={orderByState}
              setOrderBy={setOrderByState}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
            />
          </div>
        </ResizableFilterLayout>
        <TablePeekViewEvaluatorConfigDetail
          {...peekConfig}
          projectId={projectId}
        />
      </div>
      <Dialog
        open={!!editConfigId && existingEvaluator.isSuccess}
        onOpenChange={(open) => {
          if (!open) setEditConfigId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-(--breakpoint-xl) overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑配置</DialogTitle>
          </DialogHeader>
          {existingEvaluator.isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Spinner size="lg" />
            </div>
          ) : (
            <EvaluatorForm
              projectId={projectId}
              evalTemplates={[]}
              existingEvaluator={
                existingEvaluator.data && existingEvaluator.data.evalTemplate
                  ? {
                      ...existingEvaluator.data,
                      evalTemplate: {
                        ...existingEvaluator.data.evalTemplate,
                      },
                    }
                  : undefined
              }
              shouldWrapVariables={true}
              useDialog={true}
              mode="edit"
              onFormSuccess={() => {
                setEditConfigId(null);
                utils.evals.allConfigs.invalidate();
                showSuccessToast({
                  title: "评估器更新成功",
                  description:
                    "更改将自动反映到未来的评估器运行中",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </DataTableControlsProvider>
  );
}
