import { env } from "cloudflare:workers"

import {
  adminAuthResponse,
  adminSessionCookie,
  clearAdminSessionCookie,
  isAdminConfigured,
  isAdminRequest,
} from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return Response.json(
    {
      authenticated: await isAdminRequest(request, env),
      configured: isAdminConfigured(env),
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}

export async function POST(request: Request) {
  if (!isAdminConfigured(env)) return adminAuthResponse(env)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Request body must be JSON" },
      { status: 400 }
    )
  }

  const token =
    body &&
    typeof body === "object" &&
    "token" in body &&
    typeof body.token === "string"
      ? body.token
      : ""

  if (
    !token ||
    !(await isAdminRequest(
      new Request(request.url, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env
    ))
  ) {
    return Response.json(
      { error: "Invalid admin token" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    )
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": adminSessionCookie(token),
      },
    }
  )
}

export async function DELETE() {
  return Response.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": clearAdminSessionCookie(),
      },
    }
  )
}
