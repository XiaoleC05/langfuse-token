import { useMemo } from "react";
import { LayoutDashboard } from "lucide-react";
import { api } from "@/src/utils/api";
import { Combobox } from "@/src/components/ui/combobox";
import { LangfuseIcon } from "@/src/components/design-system/LangfuseIcon/LangfuseIcon";
import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";

/**
 * Home's dashboard picker: selecting immediately shows ("peeks") the chosen
 * dashboard on Home without changing anything for the project. Persisting it
 * as the project default is a separate, explicit "Set default" action owned
 * by the Home page.
 */
export function HomeDashboardSelect({
  projectId,
  value,
  defaultDashboardId,
  onValueChange,
  currentDashboardName,
}: {
  projectId: string;
  /** Id of the dashboard currently displayed on Home. */
  value: string;
  /** The project's persisted default (pointer or the curated fallback). */
  defaultDashboardId: string;
  onValueChange: (dashboardId: string) => void;
  currentDashboardName: string;
}) {
  const hasCUDAccess = useHasProjectAccess({
    projectId,
    scope: "dashboards:CUD",
  });

  const dashboards = api.dashboard.allDashboards.useQuery(
    {
      projectId,
      page: 1,
      limit: 500,
      orderBy: { column: "name", order: "ASC" },
    },
    { enabled: Boolean(projectId) && hasCUDAccess },
  );

  const options = useMemo(() => {
    const items = dashboards.data?.dashboards ?? [];
    const toOption = (d: { id: string; name: string; owner: string }) => ({
      value: d.id,
      label: d.name,
      ...(d.owner === "LANGFUSE" ? { icon: <LangfuseIcon size={14} /> } : {}),
      ...(d.id === defaultDashboardId ? { badge: "默认" } : {}),
    });
    const curated = items.filter((d) => d.owner === "LANGFUSE");
    const project = items.filter((d) => d.owner === "PROJECT");
    return [
      ...(project.length > 0
        ? [
            {
              heading: "此项目",
              options: project.map(toOption),
            },
          ]
        : []),
      {
        heading: "Langfuse 官方维护",
        options: curated.map(toOption),
      },
    ];
  }, [dashboards.data?.dashboards, defaultDashboardId]);

  if (!hasCUDAccess) {
    return (
      <Button
        variant="ghost"
        disabled
        title="此项目首页显示的仪表盘"
        className="text-muted-foreground my-0"
      >
        <LayoutDashboard className="mr-1 h-4 w-4" />
        {currentDashboardName}
      </Button>
    );
  }

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={(id) => {
        if (typeof id !== "string" || id === value) return;
        onValueChange(id);
      }}
      placeholder={currentDashboardName}
      searchPlaceholder="搜索仪表盘..."
      emptyText="未找到仪表盘"
      className="my-0 w-auto max-w-56"
      name="home-dashboard"
    />
  );
}
