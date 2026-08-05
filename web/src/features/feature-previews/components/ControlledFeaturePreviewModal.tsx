import { useSession } from "next-auth/react";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import { api } from "@/src/utils/api";

import {
  FeaturePreviewModal,
  type PreviewFlag,
  type PreviewState,
} from "./FeaturePreviewModal";

type ControlledFeaturePreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PREVIEW_LABEL: Record<PreviewFlag, string> = {
  modernSession: "紧凑会话视图",
  searchBar: "筛选搜索栏",
};

export function ControlledFeaturePreviewModal({
  open,
  onOpenChange,
}: ControlledFeaturePreviewModalProps) {
  const authSession = useSession();
  const { isBetaEnabled } = useV4Beta();
  const capture = usePostHogClientCapture();
  const setFeaturePreviewEnabled =
    api.userAccount.setFeaturePreviewEnabled.useMutation({
      onSuccess: async (_data, variables) => {
        await authSession.update();
        capture("user_settings:feature_preview_toggled", {
          feature: variables.flag,
          isEnabled: variables.enabled,
        });
        showSuccessToast({
          title: "功能预览已更新",
          description: `${PREVIEW_LABEL[variables.flag]} 预览已${
            variables.enabled ? "启用" : "停用"
          }。`,
        });
      },
      onError: (error) => {
        showErrorToast("更新功能预览失败", error.message);
      },
    });

  const onToggle = (flag: PreviewFlag) => (enabled: boolean) =>
    setFeaturePreviewEnabled.mutate({ flag, enabled });

  const state: Partial<Record<PreviewFlag, PreviewState>> = {
    modernSession: {
      enabled:
        authSession.data?.user?.featureFlags.modernSession === true ||
        authSession.data?.environment.enableExperimentalFeatures === true,
      disabled:
        !isBetaEnabled ||
        authSession.data?.environment.enableExperimentalFeatures === true,
      warningReason: !isBetaEnabled
        ? "紧凑会话视图仅可在事件驱动的会话视图上使用。开启「快速（预览）」即可启用。"
        : authSession.data?.environment.enableExperimentalFeatures === true
          ? "此预览由 LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES 启用，因此按用户关闭不会禁用它。"
          : undefined,
      onToggle: onToggle("modernSession"),
      isToggling: setFeaturePreviewEnabled.isPending,
    },
    // The "Filter Search Bar" preview is retired — the bar is now generally
    // available on the v4 events tables for everyone (see useSearchBarEnabled),
    // so it no longer renders a tile here. The `searchBar` flag plumbing
    // (PreviewFlag type, registry entry, the userAccount allowlist) is kept for
    // now so a rollback is a one-line revert; restore the `searchBar: { ... }`
    // state entry to bring the tile back.
    // TODO(remove ~2026-06-19): delete the dead searchBar plumbing once the GA
    // rollout is confirmed stable — see useSearchBarEnabled for the full list.
  };

  return (
    <FeaturePreviewModal
      open={open}
      onOpenChange={onOpenChange}
      state={state}
    />
  );
}
