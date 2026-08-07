import Header from "@/src/components/layouts/header";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { CodeBlock } from "@/src/components/design-system/Codeblock/Codeblock";
import Link from "next/link";
import { Bot, SquareTerminal, Sparkles } from "lucide-react";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

const DocsButton = ({ href }: { href: string }) => (
  <Button asChild variant="ghost">
    <Link href={href} target="_blank">
      文档 ↗
    </Link>
  </Button>
);

const ManageApiKeysButton = ({ projectId }: { projectId: string }) => (
  <Button asChild variant="secondary">
    <Link href={`/project/${projectId}/settings/api-keys`}>
      管理 API 密钥
    </Link>
  </Button>
);

export function DeveloperToolsSettings({ projectId }: { projectId: string }) {
  return (
    <div>
      <Header title="MCP & CLI" />
      <p className="text-muted-foreground mb-6 text-sm">
        将 Langfuse 带入您的终端和智能编码助手。借助这些工具，您和您的助手
        无需离开开发环境即可读写 Langfuse 数据——追踪、提示词、数据集、评分等。
      </p>
      <div className="space-y-6">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="text-foreground h-5 w-5" />
            <span className="font-bold">Agent Skill</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            Langfuse Agent Skill 是一个遵循 Anthropic&apos;s Agent Skills
            标准的开源技能。它让智能编码助手（Claude Code、Cursor、Windsurf）
            获得 Langfuse 原生能力，并引导它们遵循最佳实践，从而在安装后
            获得更好的结果。
          </p>
          <CodeBlock
            language="shell"
            value={`npx skills add langfuse/skills --skill "langfuse"`}
          />
          <div className="mt-4 flex items-center gap-2">
            <DocsButton href={OXELIA_DOCS_URL} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="text-foreground h-5 w-5" />
            <span className="font-bold">MCP Server</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            Langfuse MCP 服务器让助手和代理通过 Model Context Protocol
            以编程方式与您的 Langfuse 数据交互。
            它同时支持读取和写入操作，您可以通过白名单将其限制为只读访问。
            使用项目范围的 API 密钥对进行身份验证。
          </p>
          <CodeBlock
            language="shell"
            value={`claude mcp add --transport http langfuse \\
  https://<your-host>/api/public/mcp \\
  --header "Authorization: Basic {your-base64-token}"`}
          />
          <div className="mt-4 flex items-center gap-2">
            <ManageApiKeysButton projectId={projectId} />
            <DocsButton href={OXELIA_DOCS_URL} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <SquareTerminal className="text-foreground h-5 w-5" />
            <span className="font-bold">CLI</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            Langfuse CLI 提供对完整 Langfuse API 的终端访问。
            它封装了每个 API 端点，因此您可以直接在终端或脚本中管理追踪、提示词、
            数据集、评分和会话。它使用与 Langfuse SDK 相同的 API 密钥对。
          </p>
          <CodeBlock
            language="shell"
            value={`export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."

npx langfuse-cli api <resource> <action>`}
          />
          <div className="mt-4 flex items-center gap-2">
            <ManageApiKeysButton projectId={projectId} />
            <DocsButton href={OXELIA_DOCS_URL} />
          </div>
        </Card>
      </div>
    </div>
  );
}
