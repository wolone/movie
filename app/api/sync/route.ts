import { env } from "cloudflare:workers"

import {
  getSyncProgress,
  isSourceKey,
  pauseFullSync,
  resumeFullSync,
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
    ),
    { headers: { "Cache-Control": "no-store" } }
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
    if (mode === "pause") {
      return Response.json({
        ok: true,
        mode,
        results: await pauseFullSync(
          env,
          sourceParam ? (sourceParam as SourceKey) : undefined
        ),
      })
    }

    if (mode === "resume") {
      return Response.json({
        ok: true,
        mode,
        results: await resumeFullSync(
          env,
          sourceParam ? (sourceParam as SourceKey) : undefined
        ),
      })
    }

    if (mode === "full") {
      const results = await startFullSync(
        env,
        sourceParam ? (sourceParam as SourceKey) : undefined
      )
      const hasFailure = results.some((result) => !result.ok)
      const errorMessage = results.find((result) => !result.ok)?.lastError
      return Response.json(
        {
          ok: !hasFailure,
          mode,
          results,
          ...(errorMessage ? { error: errorMessage } : {}),
        },
        { status: hasFailure ? 502 : 200 }
      )
    }

    const results = await syncAllSources(env, {
      page: Number.isFinite(page) ? page : 1,
      sourceKey: sourceParam ? (sourceParam as SourceKey) : undefined,
    })

    const hasFailure = results.some((result) => !result.ok)
    const errorMessage = results.find((result) => !result.ok)?.error
    const isBusy = errorMessage?.includes("正在同步") ?? false
    return Response.json(
      {
        ok: !hasFailure,
        results,
        ...(errorMessage ? { error: errorMessage } : {}),
      },
      { status: hasFailure ? (isBusy ? 409 : 502) : 200 }
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
