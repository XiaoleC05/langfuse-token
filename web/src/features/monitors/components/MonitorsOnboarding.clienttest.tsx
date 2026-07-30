import { render, screen } from "@testing-library/react";

import { MonitorsOnboarding } from "./MonitorsOnboarding";

const PROJECT_ID = "proj_test123";

/** parsePrefill decodes the `prefill` query param into the same shape the form's serializer produced. */
const parsePrefill = (
  href: string,
): { eventSource?: string; actionType?: string; redirectUrl?: string } => {
  const url = new URL(href, "http://localhost");
  const raw = url.searchParams.get("prefill");
  if (!raw) return {};
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
};

describe("MonitorsOnboarding", () => {
  it("renders the splash header, step titles, and four CTAs", () => {
    render(<MonitorsOnboarding projectId={PROJECT_ID} hasCUDAccess={true} />);

    expect(
      screen.getByText("在问题影响用户之前及时发现"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("选择告警通知渠道"),
    ).toBeInTheDocument();
    expect(screen.getByText("决定监控内容")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /连接 Slack/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /连接 Webhooks/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /连接 Github Actions/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /创建监控/i }),
    ).toBeInTheDocument();
  });

  it("links each channel button to /automations?view=create with the matching prefill actionType", () => {
    render(<MonitorsOnboarding projectId={PROJECT_ID} hasCUDAccess={true} />);

    const cases: Array<{ label: RegExp; expected: string }> = [
      { label: /连接 Slack/i, expected: "SLACK" },
      { label: /连接 Webhooks/i, expected: "WEBHOOK" },
      { label: /连接 Github Actions/i, expected: "GITHUB_DISPATCH" },
    ];

    for (const { label, expected } of cases) {
      const link = screen.getByRole("link", { name: label });
      const href = link.getAttribute("href") ?? "";
      expect(href).toContain(`/project/${PROJECT_ID}/automations`);
      expect(href).toContain("view=create");

      const decoded = parsePrefill(href);
      expect(decoded.eventSource).toBe("monitor");
      expect(decoded.actionType).toBe(expected);
      expect(decoded.redirectUrl).toBe(`/project/${PROJECT_ID}/monitors`);
    }
  });

  it("links the Create Monitor CTA to the project's new-monitor route", () => {
    render(<MonitorsOnboarding projectId={PROJECT_ID} hasCUDAccess={true} />);

    const link = screen.getByRole("link", { name: /创建监控/i });
    expect(link.getAttribute("href")).toBe(
      `/project/${PROJECT_ID}/monitors/new`,
    );
  });
});
