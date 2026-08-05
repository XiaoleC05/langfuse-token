import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { api } from "@/src/utils/api";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import type { TableViewPresetState } from "@langfuse/shared";

type UseViewMutationsProps = {
  handleSetViewId: (viewId: string | null) => void;
  applyViewState: (view: TableViewPresetState) => void;
};

export const useViewMutations = ({
  handleSetViewId,
  applyViewState,
}: UseViewMutationsProps) => {
  const utils = api.useUtils();

  const createMutation = api.TableViewPresets.create.useMutation({
    onSuccess: (data) => {
      utils.TableViewPresets.getByTableName.invalidate();
      applyViewState(data.view);
      handleSetViewId(data.view.id);
    },
  });

  const updateConfigMutation = api.TableViewPresets.update.useMutation({
    onSuccess: (data) => {
      utils.TableViewPresets.getById.invalidate({
        viewId: data.view.id,
      });
      utils.TableViewPresets.getByTableName.invalidate();
      showSuccessToast({
        title: "视图已更新",
        description: `${data.view.name} 已更新以反映您当前的表格状态`,
      });
    },
  });

  const updateNameMutation = api.TableViewPresets.updateName.useMutation({
    onSuccess: () => {
      utils.TableViewPresets.getByTableName.invalidate();
    },
  });

  const deleteMutation = api.TableViewPresets.delete.useMutation({
    onSuccess: () => {
      utils.TableViewPresets.getByTableName.invalidate();
      handleSetViewId(null);
    },
  });

  const generatePermalinkMutation =
    api.TableViewPresets.generatePermalink.useMutation({
      onSuccess: (data) => {
        // Toast on the clipboard write's resolution so a permission failure
        // surfaces an error instead of falsely reporting success.
        copyTextToClipboard(data)
          .then(() =>
            showSuccessToast({
              title: "永久链接已复制到剪贴板",
              description: "您现在可以将此永久链接分享给他人",
            }),
          )
          .catch(() =>
            showErrorToast(
              "复制永久链接失败",
              "无法写入剪贴板，请手动复制该链接。",
              "WARNING",
            ),
          );
      },
    });

  return {
    createMutation,
    updateConfigMutation,
    updateNameMutation,
    deleteMutation,
    generatePermalinkMutation,
  };
};
