const ADMIN_COOKIE_NAME = "movie_admin_session"
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24

type AdminEnv = unknown

function getConfiguredAdminToken(env: AdminEnv) {
  if (!env || typeof env !== "object" || !("ADMIN_TOKEN" in env)) {
    return null
  }

  const token = (env as { ADMIN_TOKEN?: unknown }).ADMIN_TOKEN
  return typeof token === "string" && token.length > 0 ? token : null
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? ""
  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=")
    if (separator < 0) continue

    const cookieName = cookie.slice(0, separator).trim()
    if (cookieName !== name) continue

    const value = cookie.slice(separator + 1).trim()
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return null
}

function getProvidedAdminToken(request: Request) {
  const authorization = request.headers.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length)
  }

  return getCookieValue(request, ADMIN_COOKIE_NAME)
}

async function tokensMatch(left: string, right: string) {
  const encoder = new TextEncoder()
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ])
  const leftBytes = new Uint8Array(leftHash)
  const rightBytes = new Uint8Array(rightHash)
  let difference = 0

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index]
  }

  return difference === 0
}

export function isAdminConfigured(env: AdminEnv) {
  return getConfiguredAdminToken(env) !== null
}

export async function isAdminRequest(request: Request, env: AdminEnv) {
  const configuredToken = getConfiguredAdminToken(env)
  const providedToken = getProvidedAdminToken(request)

  if (!configuredToken || !providedToken) return false
  return tokensMatch(providedToken, configuredToken)
}

export function adminAuthResponse(env: AdminEnv) {
  const configured = isAdminConfigured(env)
  return Response.json(
    {
      error: configured
        ? "Admin authentication required"
        : "ADMIN_TOKEN is not configured",
    },
    {
      status: configured ? 401 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  )
}

export function adminSessionCookie(token: string) {
  return `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ADMIN_SESSION_MAX_AGE}`
}

export function clearAdminSessionCookie() {
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}
