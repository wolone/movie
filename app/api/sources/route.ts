import { env } from "cloudflare:workers"

import { SOURCE_CONFIGS, SOURCE_KEYS } from "@/lib/resource-sources"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
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
