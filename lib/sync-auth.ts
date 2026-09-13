export function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  )
}

export function hasSyncAccess(request: Request, secret: string | undefined) {
  if (!secret) return isLocalRequest(request)

  const authorization = request.headers.get("Authorization")
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  return token === secret || request.headers.get("X-Sync-Secret") === secret
}
