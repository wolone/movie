import { env } from "cloudflare:workers"

import {
  FALLBACK_MOVIES,
  filterMovies,
  movieFromRow,
  type Movie,
  type MovieRow,
} from "@/lib/movies"

export const dynamic = "force-dynamic"

const movieSelect = `
  SELECT id, slug, title, original_title, tagline, description, year,
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
  ) AS all_movies`

function response(movies: Movie[], source: "d1" | "fallback") {
  return Response.json(
    {
      movies,
      source,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") ?? ""
  const category = searchParams.get("category") ?? "all"

  try {
    const clauses = ["1 = 1"]
    const bindings: string[] = []

    if (query.trim()) {
      clauses.push(
        "(LOWER(title) LIKE LOWER(?) OR LOWER(original_title) LIKE LOWER(?) OR LOWER(tagline) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(genres) LIKE LOWER(?) OR LOWER(directors) LIKE LOWER(?) OR LOWER(actors) LIKE LOWER(?))"
      )
      const search = `%${query.trim()}%`
      bindings.push(search, search, search, search, search, search, search)
    }

    if (category !== "all") {
      clauses.push("LOWER(genres) LIKE LOWER(?)")
      bindings.push(`%${category}%`)
    }

    const statement = env.DB.prepare(
      `${movieSelect}
       WHERE ${clauses.join(" AND ")}
       ORDER BY featured DESC, trending_rank IS NULL, trending_rank ASC,
         source_updated_at DESC, year DESC`
    ).bind(...bindings)

    const { results } = await statement.all<MovieRow>()
    return response(results.map(movieFromRow), "d1")
  } catch (error) {
    console.error("Unable to read movies from D1", error)
    return response(filterMovies(FALLBACK_MOVIES, query, category), "fallback")
  }
}
