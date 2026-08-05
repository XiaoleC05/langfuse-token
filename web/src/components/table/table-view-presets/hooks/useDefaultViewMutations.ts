import { api } from "@/src/utils/api";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { type DefaultViewScope } from "@langfuse/shared/src/server";

interface UseDefaultViewMutationsProps {
  tableName: string;
  projectId: string;
}

export function useDefaultViewMutations({
  tableName,
  projectId,
}: UseDefaultViewMutationsProps) {
  const utils = api.useUtils();

  const setAsDefault = api.TableViewPresets.setAsDefault.useMutation({
    onSuccess: (_, variables) => {
      utils.TableViewPresets.getDefault.invalidate({
        projectId,
        viewName: tableName,
      });
      utils.TableViewPresets.getDefaultAssignments.invalidate({
        projectId,
        viewName: tableName,
      });
      const scopeLabel = variables.scope === "user" ? "您的" : "项目";
      showSuccessToast({
        title: "默认视图已设置",
        description: `已设置为${scopeLabel}默认视图`,
      });
    },
    onError: (error) => {
      showErrorToast("设置默认视图失败", error.message);
    },
  });

  const clearDefault = api.TableViewPresets.clearDefault.useMutation({
    onSuccess: (_, variables) => {
      utils.TableViewPresets.getDefault.invalidate({
        projectId,
        viewName: tableName,
      });
      utils.TableViewPresets.getDefaultAssignments.invalidate({
        projectId,
        viewName: tableName,
      });
      const scopeLabel = variables.scope === "user" ? "您的" : "项目";
      showSuccessToast({
        title: "默认视图已清除",
        description: `${scopeLabel}默认视图已清除`,
      });
    },
    onError: (error) => {
      showErrorToast("清除默认视图失败", error.message);
    },
  });

  const setViewAsDefault = (viewId: string, scope: DefaultViewScope) => {
    setAsDefault.mutate({
      projectId,
      viewId,
      viewName: tableName,
      scope,
    });
  };

  const clearViewDefault = (scope: DefaultViewScope) => {
    clearDefault.mutate({
      projectId,
      viewName: tableName,
      scope,
    });
  };

  return {
    setViewAsDefault,
    clearViewDefault,
    isSettingDefault: setAsDefault.isPending,
  };
}
