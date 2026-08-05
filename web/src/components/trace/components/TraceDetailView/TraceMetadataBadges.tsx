/**
 * TraceMetadataBadges - Extracted badge components for trace metadata
 *
 * Following the pattern from ObservationDetailView/ObservationMetadataBadgesSimple.tsx
 * Each badge handles its own null check and returns null when data is unavailable.
 */

import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

export function SessionBadge({
  sessionId,
  projectId,
}: {
  sessionId: string | null;
  projectId: string;
}) {
  if (!sessionId) return null;

  const text = `会话：${sessionId}`;

  return (
    <Link
      href={`/project/${projectId}/sessions/${encodeURIComponent(sessionId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function UserIdBadge({
  userId,
  projectId,
}: {
  userId: string | null;
  projectId: string;
}) {
  if (!userId) return null;

  const text = `用户 ID：${userId}`;

  return (
    <Link
      href={`/project/${projectId}/users/${encodeURIComponent(userId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function TargetTraceBadge({
  targetTraceId,
  projectId,
}: {
  targetTraceId: string | null;
  projectId: string;
}) {
  if (!targetTraceId) return null;

  const text = `目标追踪：${targetTraceId}`;

  return (
    <Link
      href={`/project/${projectId}/traces/${encodeURIComponent(targetTraceId)}`}
      className="inline-flex"
    >
      <Badge>
        <span className="truncate" title={text}>
          {text}
        </span>
        <ExternalLinkIcon className="ml-1 h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function EnvironmentBadge({
  environment,
}: {
  environment: string | null;
}) {
  if (!environment) return null;
  return <Badge variant="tertiary">环境：{environment}</Badge>;
}

export function ReleaseBadge({ release }: { release: string | null }) {
  if (!release) return null;
  return <Badge variant="tertiary">发布版本：{release}</Badge>;
}

export function VersionBadge({ version }: { version: string | null }) {
  if (!version) return null;
  return <Badge variant="tertiary">版本：{version}</Badge>;
}
