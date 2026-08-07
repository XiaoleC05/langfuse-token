import { Button } from "@/src/components/ui/button";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
} from "@/src/components/ui/dialog";

export function V4IntroDialog({
  open,
  onConfirm,
  onDismiss,
}: {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent
        className="[&>div:last-child]:hidden"
        aria-label="欢迎使用更快的 Langfuse"
      >
        <DialogBody>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/v4-beta-intro.jpg"
            alt="Langfuse 加速升级 — 性能对比显示 5 倍到 165 倍的提速"
            className="w-full rounded-md"
          />
          <ul className="flex flex-col gap-3">
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-bold">
                欢迎使用更快的 Langfuse
              </span>{" "}
              我们围绕观测而非追踪重构了数据模型，这意味着图表、筛选
              和 API 的速度都大幅提升。
            </li>
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-bold">
                全新的观测表格
              </span>{" "}
              您的追踪数据仍然存在。默认视图现在显示所有观测。如需仅
              查看根追踪的表格，请按{" "}
              <span className="font-bold">Is Root Observation &rarr; True</span>
              {" "}筛选。
            </li>
            <li className="text-muted-foreground text-sm">
              <span className="text-foreground block font-bold">
                全新的表格视图保存
              </span>{" "}
              将表格筛选保存为组织范围的视图，让整个团队从同一个起点
              开始。{" "}
              <a
                href={OXELIA_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                最佳实践 &rarr;
              </a>
            </li>
          </ul>
          <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-700 dark:bg-yellow-950">
            <p className="text-yellow-900 dark:text-yellow-200">
              <span className="font-bold">想要实时查看追踪？</span>{" "}
              请将 SDK 升级到最新版本。旧版 SDK 仍可使用，但追踪
              可能需要约 10 分钟才能显示。{" "}
              <a
                href={OXELIA_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline hover:no-underline"
              >
                升级指南 &rarr;
              </a>
            </p>
          </div>
        </DialogBody>
        <DialogFooter className="items-center sm:justify-between">
          <a
            href={OXELIA_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-bold hover:underline"
          >
            阅读 v4 文档 &rarr;
          </a>
          <Button onClick={onConfirm}>知道了 &rarr;</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
