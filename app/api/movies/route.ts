import { env } from "cloudflare:workers"

import {
  FALLBACK_MOVIES,
  filterMovies,
  movieFromRow,
  type Movie,
  type MovieRow,
} from "@/lib/movies"

export const dynamic = "force-dynamic"

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
        "(LOWER(title) LIKE LOWER(?) OR LOWER(original_title) LIKE LOWER(?) OR LOWER(tagline) LIKE LOWER(?) OR LOWER(genres) LIKE LOWER(?))"
      )
      const search = `%${query.trim()}%`
      bindings.push(search, search, search, search)
    }

    if (category !== "all") {
      clauses.push("LOWER(genres) LIKE LOWER(?)")
      bindings.push(`%${category}%`)
    }

    const statement = env.DB.prepare(
      `SELECT id, slug, title, original_title, tagline, description, year,
          rating, duration_minutes, maturity, genres, poster_url, backdrop_url,
          featured, trending_rank
         FROM movies
         WHERE ${clauses.join(" AND ")}
         ORDER BY featured DESC, trending_rank IS NULL, trending_rank ASC, year DESC`
    ).bind(...bindings)

    const { results } = await statement.all<MovieRow>()
    return response(results.map(movieFromRow), "d1")
  } catch (error) {
    console.error("Unable to read movies from D1", error)
    return response(filterMovies(FALLBACK_MOVIES, query, category), "fallback")
  }
}
