import Header from "@/src/components/layouts/header";
import ModelTable from "@/src/components/table/use-cases/models";

export function ModelsSettings(props: { projectId: string }) {
  return (
    <>
      <Header title="模型定义" />
      <p className="mb-2 text-sm">
        存储 LLM 模型定价信息的配置。模型定义指定每个输入和输出 Token 的成本，
        使 Langfuse 能够根据 Token 使用量自动计算生成的价格。
      </p>
      <ModelTable projectId={props.projectId} />
    </>
  );
}
