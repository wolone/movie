import { env } from "cloudflare:workers"

import { syncDoubanCatalogMovie } from "@/lib/catalog-sync"
import { isSourceKey } from "@/lib/resource-sources"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Request body must be JSON" },
      { status: 400 }
    )
  }

  if (!body || typeof body !== "object") {
    return Response.json(
      { error: "Request body must be an object" },
      { status: 400 }
    )
  }

  const input = body as {
    doubanId?: unknown
    sourceKey?: unknown
    sourceId?: unknown
  }
  const doubanId =
    typeof input.doubanId === "string" ? input.doubanId.trim() : ""
  const sourceKey =
    typeof input.sourceKey === "string" ? input.sourceKey.trim() : ""
  const sourceId =
    typeof input.sourceId === "string" ? input.sourceId.trim() : ""

  if (!doubanId) {
    return Response.json(
      { error: "doubanId must be a Douban ID or URL" },
      { status: 400 }
    )
  }

  if ((sourceKey && !sourceId) || (!sourceKey && sourceId)) {
    return Response.json(
      { error: "sourceKey and sourceId must be provided together" },
      { status: 400 }
    )
  }

  if (sourceKey && !isSourceKey(sourceKey)) {
    return Response.json({ error: "Unknown resource source" }, { status: 400 })
  }

  const validSourceKey = isSourceKey(sourceKey) ? sourceKey : undefined

  try {
    const result = await syncDoubanCatalogMovie(env, {
      doubanInput: doubanId,
      source:
        validSourceKey && sourceId
          ? { sourceKey: validSourceKey, sourceId }
          : undefined,
    })

    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error("Douban catalog sync failed", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Catalog sync failed" },
      { status: 502 }
    )
  }
}
