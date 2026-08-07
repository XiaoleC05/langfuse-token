import { VERSION } from "@/src/constants/VERSION";
import { env } from "@/src/env.mjs";
import {
  createTRPCRouter,
  protectedProjectProcedure,
  publicProcedure,
} from "@/src/server/api/trpc";
import { logger, compareVersions } from "@langfuse/shared/src/server";
import { z } from "zod";

// oxelia51 fork: the update check queries the fork's own GitHub releases
// instead of the upstream langfuse.com latest-releases API.
const LATEST_RELEASE_URL =
  "https://api.github.com/repos/XiaoleC05/langfuse-token/releases/latest";

const GithubLatestReleaseRes = z.object({
  tag_name: z.string(),
  html_url: z.url(),
});

type CheckUpdateResult = {
  updateType: "major" | "minor" | "patch" | null;
  currentVersion: string;
  latestRelease: string;
  url: string;
} | null;

// GitHub's anonymous API is rate-limited to 60 requests/hour per source IP, so
// cache the lookup result (including failures) for an hour in memory.
const CHECK_UPDATE_CACHE_TTL_MS = 60 * 60 * 1000;
let checkUpdateCache: {
  expiresAt: number;
  result: CheckUpdateResult;
} | null = null;

export const publicRouter = createTRPCRouter({
  tracingSearchConfig: protectedProjectProcedure
    .input(z.object({ projectId: z.string() }))
    .query(() => ({
      legacyTracingIoSearchEnabled:
        env.LANGFUSE_DISABLE_LEGACY_TRACING_IO_SEARCH !== "true",
    })),
  checkUpdate: publicProcedure.query(async (): Promise<CheckUpdateResult> => {
    // Skip update check on Langfuse Cloud
    if (env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION) return null;

    if (checkUpdateCache && checkUpdateCache.expiresAt > Date.now()) {
      return checkUpdateCache.result;
    }

    const result = await fetchLatestRelease();

    checkUpdateCache = {
      expiresAt: Date.now() + CHECK_UPDATE_CACHE_TTL_MS,
      result,
    };
    return result;
  }),
});

async function fetchLatestRelease(): Promise<CheckUpdateResult> {
  let body;
  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "oxelia51-langfuse-fork",
      },
      signal: AbortSignal.timeout(5000),
    });
    // 404: the fork has no published release yet — treat as "no update"
    // without logging an error. Other non-OK statuses (e.g. rate limiting)
    // also fail silently downstream.
    if (!response.ok) {
      if (response.status !== 404) {
        logger.warn("[trpc.public.checkUpdate] GitHub releases API failed", {
          status: response.status,
        });
      }
      return null;
    }
    body = await response.json();
  } catch (error) {
    logger.warn("[trpc.public.checkUpdate] failed to fetch latest release", {
      error,
    });
    return null;
  }

  const release = GithubLatestReleaseRes.safeParse(body);
  if (!release.success) {
    logger.warn(
      "[trpc.public.checkUpdate] GitHub release response is invalid",
      {
        error: release.error,
      },
    );
    return null;
  }

  let updateType: "major" | "minor" | "patch" | null;
  try {
    updateType = compareVersions(VERSION, release.data.tag_name);
  } catch (error) {
    logger.warn(
      "[trpc.public.checkUpdate] failed to compare versions, treating as no update",
      { error, latestRelease: release.data.tag_name },
    );
    return null;
  }

  return {
    updateType,
    currentVersion: VERSION,
    latestRelease: release.data.tag_name,
    url: release.data.html_url,
  };
}
