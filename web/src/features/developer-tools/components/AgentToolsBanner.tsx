import { Callout } from "@/src/components/ui/callout";
import { Bot } from "lucide-react";

/**
 * 可关闭的信息横幅：Oxelia51 支持通过 Agent Skill、MCP 服务器和 CLI
 * 接入智能编码助手。渲染在项目总览页。无外链（避免跳转回本页的循环）。
 */
export function AgentToolsBanner() {
  return (
    <Callout
      className="mb-4"
      id="agent-tools-banner:v1"
      variant="info"
      align="middle"
    >
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-bold">
            Oxelia51 与您的智能编码助手配合良好。
          </span>{" "}
          通过 Agent Skill、MCP 服务器和 CLI，将 Claude Code、Codex 等智能编码助手接入您的数据。
        </span>
      </div>
    </Callout>
  );
}
