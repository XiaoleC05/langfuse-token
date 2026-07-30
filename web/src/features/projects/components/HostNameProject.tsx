import { Card } from "@/src/components/ui/card";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";
import Header from "@/src/components/layouts/header";
import { useUiCustomization } from "@/src/ee/features/ui-customization/useUiCustomization";
import { env } from "@/src/env.mjs";

export function HostNameProject() {
  const uiCustomization = useUiCustomization();
  return (
    <div>
      <Header title="主机名称" />
      <Card className="mb-4 p-3">
        <div className="">
          <div className="mb-2 text-sm">
            连接 Langfuse 时请使用此主机名/baseurl。
          </div>
          <CodeView
            content={`${uiCustomization?.hostname ?? window.origin}${env.NEXT_PUBLIC_BASE_PATH ?? ""}`}
          />
        </div>
      </Card>
    </div>
  );
}
