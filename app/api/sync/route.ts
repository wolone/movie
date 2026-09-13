import { env } from "cloudflare:workers"

import {
  isSourceKey,
  getSyncProgress,
  startFullSync,
  syncAllSources,
  type SourceKey,
} from "@/lib/resource-sources"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sourceParam = searchParams.get("source")

  if (sourceParam && !isSourceKey(sourceParam)) {
    return Response.json({ error: "Unknown resource source" }, { status: 400 })
  }

  return Response.json(
    await getSyncProgress(
      env,
      sourceParam ? (sourceParam as SourceKey) : undefined
    )
  )
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const sourceParam = searchParams.get("source")
  const mode = searchParams.get("mode") ?? "page"
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10)

  if (sourceParam && !isSourceKey(sourceParam)) {
    return Response.json({ error: "Unknown resource source" }, { status: 400 })
  }

  try {
    if (mode === "full") {
      const results = await startFullSync(
        env,
        sourceParam ? (sourceParam as SourceKey) : undefined
      )
      const hasFailure = results.some((result) => !result.ok)
      return Response.json(
        { ok: !hasFailure, mode, results },
        { status: hasFailure ? 502 : 200 }
      )
    }

    const results = await syncAllSources(env, {
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
