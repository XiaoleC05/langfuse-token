import { fireEvent, render, screen } from "@testing-library/react";

import { type Monitor } from "@langfuse/shared/monitors";

vi.mock("@/src/components/deleteButton", () => ({
  DeleteMonitorButton: (props: { itemId: string }) => (
    <button type="button" data-testid="delete-monitor">
      delete {props.itemId}
    </button>
  ),
}));

import { __test } from "./MonitorsTable";

const { MonitorRowActions } = __test;

const PROJECT_ID = "proj_test123";

/** monitorRow builds a minimal monitor row with the given id and status. */
const monitorRow = (status: Monitor["status"]): Monitor =>
  ({ id: "mon-1", status }) as Monitor;

describe("MonitorRowActions", () => {
  it("write access: edit links to monitors/<id> and pause click toggles status", () => {
    const onToggleStatus = vi.fn();
    render(
      <MonitorRowActions
        monitor={monitorRow("ACTIVE")}
        projectId={PROJECT_ID}
        hasCUDAccess={true}
        collapsed={false}
        isStatusPending={false}
        onToggleStatus={onToggleStatus}
      />,
    );

    const editLink = screen.getByRole("link");
    expect(editLink.getAttribute("href")).toBe(
      `/project/${PROJECT_ID}/monitors/mon-1`,
    );

    fireEvent.click(screen.getByRole("button", { name: /暂停/i }));
    expect(onToggleStatus).toHaveBeenCalledTimes(1);
  });

  it("paused monitor: shows a Resume control", () => {
    render(
      <MonitorRowActions
        monitor={monitorRow("PAUSED")}
        projectId={PROJECT_ID}
        hasCUDAccess={true}
        collapsed={false}
        isStatusPending={false}
        onToggleStatus={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /恢复/i })).toBeInTheDocument();
  });

  it("read-only access: pause and edit controls are disabled", () => {
    render(
      <MonitorRowActions
        monitor={monitorRow("ACTIVE")}
        projectId={PROJECT_ID}
        hasCUDAccess={false}
        collapsed={false}
        isStatusPending={false}
        onToggleStatus={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /暂停/i })).toBeDisabled();
    expect(screen.getByRole("link")).toHaveAttribute("disabled");
  });

  it("collapsed: actions hide behind a kebab menu trigger", () => {
    render(
      <MonitorRowActions
        monitor={monitorRow("ACTIVE")}
        projectId={PROJECT_ID}
        hasCUDAccess={true}
        collapsed={true}
        isStatusPending={false}
        onToggleStatus={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /监控操作/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
