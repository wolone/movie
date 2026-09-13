import { doubanIdFromInput, fetchDoubanMovie } from "@/lib/douban"
import type { SourceKey } from "@/lib/resource-sources"

type CatalogEnvironment = {
  DB: D1Database
}

type SourceMapping = {
  sourceKey: SourceKey
  sourceId: string
}

function slugForDoubanId(doubanId: string) {
  return `douban-${doubanId}`
}

export async function syncDoubanCatalogMovie(
  environment: CatalogEnvironment,
  input: {
    doubanInput: string
    source?: SourceMapping
  }
) {
  const metadata = await fetchDoubanMovie(input.doubanInput)
  const doubanId = metadata.doubanId || doubanIdFromInput(input.doubanInput)
  const syncedAt = new Date().toISOString()
  let source: {
    sourceKey: string
    sourceId: string
    posterUrl: string
    title: string
  } | null = null

  if (input.source) {
    const sourceRow = await environment.DB.prepare(
      `SELECT source_key, source_id, poster_url, title
         FROM movie_sources
        WHERE source_key = ? AND source_id = ?
        LIMIT 1`
    )
      .bind(input.source.sourceKey, input.source.sourceId)
      .first<{
        source_key: string
        source_id: string
        poster_url: string
        title: string
      }>()

    if (!sourceRow) {
      throw new Error(
        `未找到资源映射：${input.source.sourceKey}/${input.source.sourceId}`
      )
    }

    source = {
      sourceKey: sourceRow.source_key,
      sourceId: sourceRow.source_id,
      posterUrl: sourceRow.poster_url,
      title: sourceRow.title,
    }
  }

  const slug = slugForDoubanId(doubanId)
  const posterUrl = source?.posterUrl ?? ""

  await environment.DB.prepare(
    `INSERT INTO catalog_movies (
       douban_id, slug, title, original_title, tagline, description, year,
       rating, duration_minutes, maturity, genres, poster_url, backdrop_url,
       area, directors, actors, metadata_provider, metadata_synced_at,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(douban_id) DO UPDATE SET
       slug = excluded.slug,
       title = excluded.title,
       original_title = excluded.original_title,
       tagline = excluded.tagline,
       description = excluded.description,
       year = excluded.year,
       rating = excluded.rating,
       duration_minutes = excluded.duration_minutes,
       maturity = excluded.maturity,
       genres = excluded.genres,
       poster_url = CASE
         WHEN excluded.poster_url <> '' THEN excluded.poster_url
         ELSE catalog_movies.poster_url
       END,
       backdrop_url = CASE
         WHEN excluded.backdrop_url <> '' THEN excluded.backdrop_url
         ELSE catalog_movies.backdrop_url
       END,
       area = excluded.area,
       directors = excluded.directors,
       actors = excluded.actors,
       metadata_provider = excluded.metadata_provider,
       metadata_synced_at = excluded.metadata_synced_at,
       updated_at = excluded.updated_at`
  )
    .bind(
      doubanId,
      slug,
      metadata.title,
      metadata.originalTitle,
      metadata.tagline,
      metadata.description,
      metadata.year,
      metadata.rating,
      metadata.durationMinutes,
      metadata.maturity,
      metadata.genres.join(","),
      posterUrl,
      posterUrl,
      metadata.area,
      metadata.directors,
      metadata.actors,
      "apizero-douban",
      syncedAt,
      syncedAt
    )
    .run()

  if (input.source) {
    await environment.DB.prepare(
      `UPDATE movie_sources
          SET douban_id = ?, synced_at = ?
        WHERE source_key = ? AND source_id = ?`
    )
      .bind(doubanId, syncedAt, input.source.sourceKey, input.source.sourceId)
      .run()
  }

  return {
    metadata,
    source,
    slug,
    syncedAt,
  }
}
