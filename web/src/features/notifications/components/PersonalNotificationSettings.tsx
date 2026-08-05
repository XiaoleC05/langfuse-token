import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import Header from "@/src/components/layouts/header";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";

export function PersonalNotificationSettings() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [isSaving, setIsSaving] = useState(false);

  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "project:read",
  });

  const {
    data: preferences,
    isLoading,
    refetch,
  } = api.notificationPreferences.getForProject.useQuery(
    { projectId },
    { enabled: Boolean(projectId) },
  );

  const updatePreference = api.notificationPreferences.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    await updatePreference.mutateAsync({
      projectId,
      channel: "EMAIL",
      type: "COMMENT_MENTION",
      enabled,
    });
    setIsSaving(false);
  };

  if (isLoading || !preferences) {
    return (
      <div>
        <Header title="个人通知" />
        <p className="text-muted-foreground mt-4 text-sm">
          正在加载偏好设置...
        </p>
      </div>
    );
  }

  const emailCommentMention = preferences.find(
    (p) => p.channel === "EMAIL" && p.type === "COMMENT_MENTION",
  );

  return (
    <div>
      <Header title="个人通知" />
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold">邮件通知</h3>
          <p className="text-muted-foreground text-sm">
            管理您在此项目中的个人邮件通知偏好。
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="comment-mention" className="text-base">
              评论提及
            </Label>
            <p className="text-muted-foreground text-sm">
              当有人在评论中提到您时发送邮件
            </p>
          </div>
          <Switch
            id="comment-mention"
            checked={emailCommentMention?.enabled ?? true}
            onCheckedChange={handleToggle}
            disabled={isSaving || !hasAccess}
          />
        </div>
      </div>

      {updatePreference.isError && (
        <div className="border-destructive bg-destructive/10 mt-4 rounded-lg border p-4">
          <p className="text-destructive text-sm">
            更新通知偏好失败，请重试。
          </p>
        </div>
      )}
    </div>
  );
}
