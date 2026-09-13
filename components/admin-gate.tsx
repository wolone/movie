"use client"

import { useEffect, useState } from "react"
import { LoaderCircle, LogOut, ShieldCheck } from "lucide-react"

import { ResourceManager } from "@/components/resource-manager"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type SessionResponse = {
  authenticated: boolean
  configured: boolean
  error?: string
}

export function AdminGate() {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    void fetch("/api/admin/session", {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const payload = (await response.json()) as SessionResponse
        if (!cancelled) setSession(payload)
      })
      .catch(() => {
        if (!cancelled) {
          setSession({ authenticated: false, configured: true })
          setError("无法检查管理员会话，请刷新后重试")
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "管理员令牌无效")
      }

      setToken("")
      setSession({ authenticated: true, configured: true })
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "登录失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" })
    setSession((current) =>
      current ? { ...current, authenticated: false } : current
    )
  }

  if (!session) {
    return (
      <section className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-xl items-center px-4 py-12 sm:px-6">
        <Card className="w-full">
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <LoaderCircle
              className="size-4 animate-spin"
              data-icon="inline-start"
            />
            正在检查管理员会话…
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!session.configured) {
    return (
      <section className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-xl items-center px-4 py-12 sm:px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>后台尚未配置</CardTitle>
            <CardDescription>
              请先在 Cloudflare Worker 中配置 ADMIN_TOKEN，再访问此页面。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block rounded-lg bg-muted px-3 py-2 text-sm">
              pnpm wrangler secret put ADMIN_TOKEN
            </code>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!session.authenticated) {
    return (
      <section className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-xl items-center px-4 py-12 sm:px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" data-icon="inline-start" />
              管理员登录
            </CardTitle>
            <CardDescription>
              请输入 Cloudflare Secret ADMIN_TOKEN，令牌只会通过 HTTPS 提交。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={signIn}>
              <Input
                autoComplete="current-password"
                onChange={(event) => setToken(event.target.value)}
                placeholder="ADMIN_TOKEN"
                type="password"
                value={token}
              />
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button disabled={isSubmitting || !token} type="submit">
                {isSubmitting ? (
                  <LoaderCircle
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : null}
                {isSubmitting ? "验证中…" : "进入后台"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl justify-end px-4 pt-4 sm:px-6 lg:px-8">
        <Button onClick={signOut} size="sm" variant="ghost">
          <LogOut data-icon="inline-start" />
          退出登录
        </Button>
      </div>
      <ResourceManager />
    </>
  )
}
