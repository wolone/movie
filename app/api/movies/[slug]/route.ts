import { env } from "cloudflare:workers"

import {
  FALLBACK_MOVIES,
  movieFromRow,
  movieResourceFromRow,
  type MovieResourceRow,
  type MovieRow,
} from "@/lib/movies"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  try {
    const row = await env.DB.prepare(
      `SELECT id, slug, title, original_title, tagline, description, year,
          rating, duration_minutes, maturity, genres, poster_url, backdrop_url,
          featured, trending_rank, source_key, source_count, douban_id,
          metadata_provider, source_updated_at, directors, actors
         FROM (
           SELECT id, slug, title, original_title, tagline, description, year,
             rating, duration_minutes, maturity, genres, poster_url, backdrop_url,
             featured, trending_rank, 'demo' AS source_key, 0 AS source_count,
             NULL AS douban_id, NULL AS metadata_provider, NULL AS source_updated_at,
             '' AS directors, '' AS actors
           FROM movies
           UNION ALL
           SELECT
             'catalog:' || c.douban_id AS id,
             c.slug,
             c.title,
             c.original_title,
             c.tagline,
             c.description,
             c.year,
             c.rating,
             c.duration_minutes,
             c.maturity,
             c.genres,
             COALESCE(
               NULLIF(c.poster_url, ''),
               (SELECT poster_url FROM movie_sources WHERE douban_id = c.douban_id AND poster_url <> '' LIMIT 1),
               ''
             ) AS poster_url,
             COALESCE(NULLIF(c.backdrop_url, ''), c.poster_url, '') AS backdrop_url,
             c.featured,
             c.trending_rank,
             'apizero-douban' AS source_key,
             (SELECT COUNT(*) FROM movie_sources WHERE douban_id = c.douban_id) AS source_count,
             c.douban_id,
             c.metadata_provider,
             c.metadata_synced_at AS source_updated_at,
             c.directors,
             c.actors
           FROM catalog_movies AS c
         ) AS all_movies
        WHERE slug = ?
        LIMIT 1`
    )
      .bind(slug)
      .first<MovieRow>()

    if (row) {
      const movie = movieFromRow(row)

      if (row.douban_id) {
        const { results } = await env.DB.prepare(
          `SELECT source_key, source_name, source_id, source_type,
              source_area, source_language, status_note, source_updated_at,
              poster_url, detail_url, play_lines
             FROM movie_sources
            WHERE douban_id = ?
            ORDER BY source_name ASC, source_id ASC`
        )
          .bind(row.douban_id)
          .all<MovieResourceRow>()

        movie.sources = results.map(movieResourceFromRow)
      }

      return Response.json({ movie, source: "d1" })
    }
  } catch (error) {
    console.error("Unable to read movie from D1", error)
  }

  const fallback = FALLBACK_MOVIES.find((movie) => movie.slug === slug)

  if (!fallback) {
    return Response.json({ error: "Movie not found" }, { status: 404 })
  }

  return Response.json({ movie: fallback, source: "fallback" })
}
