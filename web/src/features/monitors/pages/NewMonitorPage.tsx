import { useRouter } from "next/router";

import Page from "@/src/components/layouts/page";
import { MonitorForm } from "@/src/features/monitors/components/MonitorForm";
import { MonitorPagePermissions } from "@/src/features/monitors/components/MonitorPagePermissions";

/** NewMonitorPage renders the create-monitor form for a project. */
export default function NewMonitorPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  return (
    <MonitorPagePermissions scope="monitors:CUD">
      <Page
        withPadding
        headerProps={{
          title: "新建监控",
          breadcrumb: [
            { name: "监控", href: `/project/${projectId}/monitors` },
          ],
        }}
      >
        <MonitorForm projectId={projectId} />
      </Page>
    </MonitorPagePermissions>
  );
}
