import { Button } from "@/src/components/ui/button";
import { LifeBuoy, Mail, MessageSquare } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { Separator } from "@/src/components/ui/separator";
import { FeedbackDialog } from "@/src/features/oxelia51/components/FeedbackDialog";

// oxelia51 fork: the upstream drawer sections (ask-ai assistant, upstream
// docs site, ideas/issues/gh-support links, Discord, Community Hours, status
// page and the Pylon-backed "Email a Support Engineer" form) were removed —
// all of them point at Langfuse-hosted services this fork does not operate.
// Support goes through the in-app feedback dialog, email, or GitHub Issues
// instead.
export function IntroSection() {
  return (
    <div className="mt-1 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <MessageSquare className="h-4 w-4" /> 提交反馈
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          告诉我们你的想法或遇到的问题，我们会通过邮件回复你。
        </p>
        <FeedbackDialog
          trigger={
            <Button variant="outline" className="w-full">
              提交反馈
            </Button>
          }
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <LifeBuoy className="h-4 w-4" /> 邮件支持
        </div>
        <p className="text-muted-foreground text-sm">
          反馈未能解决你的问题？可以直接给我们发邮件。
        </p>
        <Button variant="outline" asChild>
          <a href="mailto:receive@oxelia51.com">
            <Mail className="mr-2 h-4 w-4" /> receive@oxelia51.com
          </a>
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <SiGithub className="h-4 w-4" /> GitHub Issues
        </div>
        <p className="text-muted-foreground text-sm">
          也可以在 GitHub 上提交 Issue 跟踪问题处理进度。
        </p>
        <Button variant="outline" asChild>
          <a
            href="https://github.com/XiaoleC05/Oxelia51/issues"
            target="_blank"
            rel="noopener"
          >
            <SiGithub className="mr-2 h-4 w-4" /> 提交 Issue ↗
          </a>
        </Button>
      </div>
    </div>
  );
}
