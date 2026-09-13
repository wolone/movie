import { env } from "cloudflare:workers"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const result = await env.DB.prepare("SELECT 1 AS ok").first<{
      ok: number
    }>()

    return Response.json({
      ok: result?.ok === 1,
      database: "movie",
      source: "d1",
    })
  } catch (error) {
    console.error("D1 health check failed", error)
    return Response.json(
      { ok: false, database: "movie", source: "fallback" },
      { status: 503 }
    )
  }
}
