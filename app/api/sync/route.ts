import { env } from "cloudflare:workers"

import {
  isSourceKey,
  syncAllSources,
  type SourceKey,
} from "@/lib/resource-sources"
import { hasSyncAccess, isLocalRequest } from "@/lib/sync-auth"

export const dynamic = "force-dynamic"

type SyncEnvironment = CloudflareEnv & {
  SYNC_SECRET?: string
}

export async function POST(request: Request) {
  const runtimeEnv = env as SyncEnvironment

  if (!runtimeEnv.SYNC_SECRET && !isLocalRequest(request)) {
    return Response.json(
      { error: "SYNC_SECRET is not configured" },
      { status: 503 }
    )
  }

  if (!hasSyncAccess(request, runtimeEnv.SYNC_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sourceParam = searchParams.get("source")
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10)

  if (sourceParam && !isSourceKey(sourceParam)) {
    return Response.json({ error: "Unknown resource source" }, { status: 400 })
  }

  try {
    const results = await syncAllSources(runtimeEnv, {
      page: Number.isFinite(page) ? page : 1,
      sourceKey: sourceParam ? (sourceParam as SourceKey) : undefined,
    })

    const hasFailure = results.some((result) => !result.ok)
    return Response.json(
      { ok: !hasFailure, results },
      { status: hasFailure ? 502 : 200 }
    )
  } catch (error) {
    console.error("Resource source sync failed", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Resource sync failed",
      },
      { status: 502 }
    )
  }
}
