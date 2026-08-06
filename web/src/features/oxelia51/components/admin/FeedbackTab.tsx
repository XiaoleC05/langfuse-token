"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/src/utils/api";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { SegmentedControl } from "@/src/features/oxelia51/components/SegmentedControl";
import {
  AdminCard,
  FEEDBACK_CATEGORY_LABEL,
  FEEDBACK_CATEGORY_VARIANT,
  FEEDBACK_STATUS_LABEL,
  FEEDBACK_STATUS_VARIANT,
  errMsg,
  useIsSuperAdmin,
  type FeedbackItem,
} from "@/src/features/oxelia51/components/admin/shared";

type StatusFilter = "" | "new" | "processing" | "done";

const FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "", label: "全部" },
  { value: "new", label: "新反馈" },
  { value: "processing", label: "处理中" },
  { value: "done", label: "已完成" },
];

/** 状态的下一个流转目标及操作文案 */
const NEXT_STATUS: Record<string, { to: "processing" | "done"; label: string }> = {
  new: { to: "processing", label: "开始处理" },
  processing: { to: "done", label: "标记完成" },
};

/** 用户反馈：列表 + 状态筛选 + 状态流转（流转仅超级管理员可见） */
export function FeedbackTab() {
  const isSuperAdmin = useIsSuperAdmin();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [opError, setOpError] = useState("");

  const feedbackQ = api.oxelia51Admin.listFeedback.useQuery({
    limit: 100,
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const feedback = feedbackQ.data?.items as FeedbackItem[] | undefined;

  const utils = api.useUtils();
  const updateMut = api.oxelia51Admin.updateFeedbackStatus.useMutation({
    onSuccess: () => void utils.oxelia51Admin.listFeedback.invalidate(),
    onError: (e) => setOpError(e.message),
  });

  return (
    <AdminCard
      title={`用户反馈（${feedback?.length ?? "…"}）`}
      action={
        <div className="flex items-center gap-2">
          <SegmentedControl
            options={FILTER_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void feedbackQ.refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
    >
      {opError && (
        <p className="text-sm" style={{ color: "var(--ox-danger)" }}>
          {opError}
        </p>
      )}
      {feedbackQ.error ? (
        <p className="text-sm" style={{ color: "var(--ox-warn)" }}>
          {errMsg(feedbackQ.error)}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">分类</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>内容</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-36">时间</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(feedback ?? []).map((f) => {
              const next = NEXT_STATUS[f.status];
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    <Badge
                      variant={
                        FEEDBACK_CATEGORY_VARIANT[f.category] ?? "outline"
                      }
                    >
                      {FEEDBACK_CATEGORY_LABEL[f.category] ?? f.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{f.email}</TableCell>
                  <TableCell className="max-w-md">
                    <span className="line-clamp-2 whitespace-pre-wrap text-xs">
                      {f.message}
                    </span>
                    {f.projectId && (
                      <span className="text-muted-foreground block text-xs">
                        项目：{f.projectId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={FEEDBACK_STATUS_VARIANT[f.status] ?? "outline"}
                    >
                      {FEEDBACK_STATUS_LABEL[f.status] ?? f.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {f.createdAt
                      ? new Date(f.createdAt).toLocaleString("zh-CN")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {next &&
                      (isSuperAdmin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updateMut.isPending}
                          onClick={() => {
                            setOpError("");
                            updateMut.mutate({ id: f.id, status: next.to });
                          }}
                        >
                          {next.label}
                        </Button>
                      ) : (
                        <span
                          className="text-muted-foreground text-xs"
                          title="仅超级管理员可操作"
                        >
                          —
                        </span>
                      ))}
                  </TableCell>
                </TableRow>
              );
            })}
            {(feedback ?? []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground text-center text-sm"
                >
                  暂无反馈
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </AdminCard>
  );
}
