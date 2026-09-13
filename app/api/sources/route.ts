import { env } from "cloudflare:workers"

import {
  isSourceKey,
  SOURCE_CONFIGS,
  SOURCE_KEYS,
  type SourceKey,
} from "@/lib/resource-sources"
import { movieResourceFromRow, type MovieResourceRow } from "@/lib/movies"

export const dynamic = "force-dynamic"

type SourceItemRow = MovieResourceRow & {
  title: string
  douban_id: string | null
}

type MappingFilter = "all" | "mapped" | "unmapped"

async function getSourceItems(
  sourceKey: SourceKey,
  query: string,
  page: number,
  limit: number,
  mappingFilter: MappingFilter
) {
  const offset = (page - 1) * limit
  const search = `%${query}%`
  const mappingClause =
    mappingFilter === "mapped"
      ? "AND douban_id IS NOT NULL"
      : mappingFilter === "unmapped"
        ? "AND douban_id IS NULL"
        : ""
  const [count, rows] = await Promise.all([
    env.DB.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN douban_id IS NOT NULL THEN 1 ELSE 0 END) AS mapped
         FROM movie_sources
        WHERE source_key = ?
          AND (title LIKE ? OR source_id LIKE ?)
          ${mappingClause}`
    )
      .bind(sourceKey, search, search)
      .first<{ total: number; mapped: number | null }>(),
    env.DB.prepare(
      `SELECT source_key, source_name, source_id, title, source_type,
          source_area, source_language, status_note, source_updated_at,
          poster_url, detail_url, play_lines, douban_id
         FROM movie_sources
        WHERE source_key = ?
          AND (title LIKE ? OR source_id LIKE ?)
          ${mappingClause}
        ORDER BY source_updated_at DESC, source_id DESC
        LIMIT ? OFFSET ?`
    )
      .bind(sourceKey, search, search, limit, offset)
      .all<SourceItemRow>(),
  ])

  return {
    source: {
      key: sourceKey,
      name: SOURCE_CONFIGS[sourceKey].name,
    },
    page,
    limit,
    total: count?.total ?? 0,
    mapped: count?.mapped ?? 0,
    items: rows.results.map((row) => ({
      ...movieResourceFromRow(row),
      title: row.title,
      doubanId: row.douban_id,
    })),
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceParam = searchParams.get("source")

    if (sourceParam) {
      if (!isSourceKey(sourceParam)) {
        return Response.json(
          { error: "Unknown resource source" },
          { status: 400 }
        )
      }

      const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10)
      const requestedLimit = Number.parseInt(
        searchParams.get("limit") ?? "30",
        10
      )
      const page = Number.isFinite(requestedPage)
        ? Math.max(1, requestedPage)
        : 1
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(100, Math.max(1, requestedLimit))
        : 30
      const mappingParam = searchParams.get("mapped")
      const mappingFilter: MappingFilter =
        mappingParam === "mapped" || mappingParam === "unmapped"
          ? mappingParam
          : "all"
      const result = await getSourceItems(
        sourceParam,
        searchParams.get("q")?.trim() ?? "",
        page,
        limit,
        mappingFilter
      )

      return Response.json(result)
    }

    const sources = await Promise.all(
      SOURCE_KEYS.map(async (sourceKey) => {
        const [run, counts] = await Promise.all([
          env.DB.prepare(
            `SELECT last_page, last_run_at, last_success_at, last_error, items_synced
               FROM source_sync_runs
              WHERE source_key = ?
              LIMIT 1`
          )
            .bind(sourceKey)
            .first<{
              last_page: number
              last_run_at: string | null
              last_success_at: string | null
              last_error: string | null
              items_synced: number
            }>(),
          env.DB.prepare(
            `SELECT COUNT(*) AS total,
                    SUM(CASE WHEN douban_id IS NOT NULL THEN 1 ELSE 0 END) AS mapped
               FROM movie_sources
              WHERE source_key = ?`
          )
            .bind(sourceKey)
            .first<{ total: number; mapped: number | null }>(),
        ])

        return {
          key: sourceKey,
          name: SOURCE_CONFIGS[sourceKey].name,
          total: counts?.total ?? 0,
          mapped: counts?.mapped ?? 0,
          run: run ?? null,
        }
      })
    )

    return Response.json({ sources })
  } catch (error) {
    console.error("Unable to read resource source status", error)
    return Response.json(
      { error: "Source status unavailable" },
      { status: 503 }
    )
  }
}
