import { env } from "cloudflare:workers"

import { FALLBACK_MOVIES, movieFromRow, type MovieRow } from "@/lib/movies"

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
          featured, trending_rank
         FROM movies
         WHERE slug = ?
         LIMIT 1`
    )
      .bind(slug)
      .first<MovieRow>()

    if (row) {
      return Response.json({ movie: movieFromRow(row), source: "d1" })
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
