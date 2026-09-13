"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const sources = [
  { key: "xigua", name: "西瓜资源" },
  { key: "wsyzy", name: "无水印资源网" },
  { key: "uuzy", name: "UUZY" },
] as const

type SourceKey = (typeof sources)[number]["key"]
type MappingFilter = "all" | "mapped" | "unmapped"

type ResourceItem = {
  sourceKey: string
  sourceName: string
  sourceId: string
  title: string
  sourceType: string
  sourceArea: string
  sourceLanguage: string
  statusNote: string
  sourceUpdatedAt: string | null
  posterUrl: string
  detailUrl: string
  playLines: Array<{ name: string; url: string }>
  doubanId: string | null
}

type SourceResponse = {
  source: { key: SourceKey; name: string }
  page: number
  limit: number
  total: number
  mapped: number
  items: ResourceItem[]
}

type SyncResponse = {
  ok: boolean
  mode: "full" | "page" | "pause" | "resume"
  results: Array<{
    ok: boolean
    sourceKey: string
    status?: "idle" | "running" | "paused" | "completed" | "error"
    pagesProcessed?: number
    itemsSynced?: number
    itemsSyncedTotal?: number
    nextPage?: number
    pageCount?: number | null
    error?: string
  }>
}

type SyncProgress = {
  sourceKey: SourceKey
  sourceName: string
  status: "idle" | "running" | "paused" | "completed" | "error"
  nextPage: number
  lastPage: number
  pageCount: number | null
  progressPercent: number
  estimatedMinutesRemaining: number | null
  totalItems: number | null
  itemsSyncedTotal: number
  lastRunAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
}

function syncStatusLabel(status: SyncProgress["status"]) {
  return {
    idle: "未启动",
    running: "同步中",
    paused: "已暂停",
    completed: "本轮完成",
    error: "需要重试",
  }[status]
}

function formatEta(minutes: number | null) {
  if (minutes === null) return "等待接口返回页数"
  if (minutes >= 24 * 60) return `约 ${Math.ceil(minutes / (24 * 60))} 天`
  if (minutes < 60) return `约 ${minutes} 分钟`
  return `约 ${Math.ceil(minutes / 60)} 小时`
}

function formatDate(value: string | null) {
  if (!value) return "未记录更新时间"

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
}

function resourceMappingKey(
  item: Pick<ResourceItem, "sourceKey" | "sourceId">
) {
  return `${item.sourceKey}:${item.sourceId}`
}

export function ResourceManager() {
  const router = useRouter()
  const [sourceKey, setSourceKey] = useState<SourceKey>("wsyzy")
  const [query, setQuery] = useState("")
  const [activeQuery, setActiveQuery] = useState("")
  const [mappingFilter, setMappingFilter] = useState<MappingFilter>("all")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SourceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [doubanIds, setDoubanIds] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([])
  const [controllingSource, setControllingSource] = useState<SourceKey | null>(
    null
  )

  const loadResources = useCallback(async () => {
    setIsLoading(true)
    setError("")

    const params = new URLSearchParams({
      source: sourceKey,
      limit: "12",
      page: String(page),
      mapped: mappingFilter,
    })
    if (activeQuery) params.set("q", activeQuery)

    try {
      const response = await fetch(`/api/sources?${params.toString()}`, {
        headers: { Accept: "application/json" },
      })
      const payload = (await response.json()) as
        SourceResponse | { error?: string }

      if (!response.ok || !("items" in payload)) {
        throw new Error("error" in payload ? payload.error : "资源接口不可用")
      }

      setData(payload)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "资源加载失败")
    } finally {
      setIsLoading(false)
    }
  }, [activeQuery, mappingFilter, page, sourceKey])

  const loadSyncProgress = useCallback(async () => {
    try {
      const response = await fetch("/api/sync", {
        headers: { Accept: "application/json" },
      })
      if (!response.ok) return
      setSyncProgress((await response.json()) as SyncProgress[])
    } catch {
      // The resource list remains usable when the optional progress request fails.
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadResources()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadResources])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSyncProgress()
    }, 0)
    if (!syncProgress.some((item) => item.status === "running")) {
      return () => window.clearTimeout(timeoutId)
    }

    const intervalId = window.setInterval(() => {
      void loadSyncProgress()
    }, 10_000)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [loadSyncProgress, syncProgress])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setActiveQuery(query.trim())
  }

  function selectMappingFilter(value: string[]) {
    const nextFilter = value[0] as MappingFilter | undefined
    if (!nextFilter) return

    setMappingFilter(nextFilter)
    setPage(1)
  }

  function selectSource(value: string[]) {
    const nextSource = value[0] as SourceKey | undefined
    if (!nextSource) return

    setSourceKey(nextSource)
    setPage(1)
    setNotice("")
  }

  async function syncResources(targetSource?: SourceKey) {
    setIsSyncing(true)
    setError("")
    setNotice("")

    const params = new URLSearchParams({ mode: "full" })
    if (targetSource) params.set("source", targetSource)

    try {
      const response = await fetch(`/api/sync?${params.toString()}`, {
        method: "POST",
        headers: { Accept: "application/json" },
      })
      const payload = (await response.json()) as
        SyncResponse | { error?: string }

      if (!response.ok || !("results" in payload)) {
        throw new Error("error" in payload ? payload.error : "资源站同步失败")
      }

      const successful = payload.results.filter((result) => result.ok)
      const failed = payload.results.filter((result) => !result.ok)
      const pages = successful.reduce(
        (total, result) => total + (result.pagesProcessed ?? 0),
        0
      )
      const failureText = failed.length
        ? `，失败：${failed.map((result) => result.sourceKey).join("、")}`
        : ""

      setNotice(
        pages === 0 && !targetSource
          ? `全量同步任务已启动，三个资源站将由各自 Cron 分批处理${failureText}。`
          : `全量同步任务已启动，本次处理 ${pages} 页，后续由 Cron 继续执行${failureText}。`
      )
      await Promise.all([loadResources(), loadSyncProgress()])
    } catch (syncError) {
      setError(
        syncError instanceof Error ? syncError.message : "资源站同步失败"
      )
    } finally {
      setIsSyncing(false)
    }
  }

  async function controlSync(
    targetSource: SourceKey,
    action: "pause" | "resume"
  ) {
    setControllingSource(targetSource)
    setError("")
    setNotice("")

    const params = new URLSearchParams({
      mode: action,
      source: targetSource,
    })

    try {
      const response = await fetch(`/api/sync?${params.toString()}`, {
        method: "POST",
        headers: { Accept: "application/json" },
      })
      const payload = (await response.json()) as
        | { ok: boolean; results: SyncProgress[]; error?: string }
        | { error?: string }

      if (!response.ok || !("results" in payload)) {
        throw new Error("error" in payload ? payload.error : "同步任务操作失败")
      }

      setSyncProgress((current) =>
        current.map(
          (item) =>
            payload.results.find(
              (result) => result.sourceKey === item.sourceKey
            ) ?? item
        )
      )
      setNotice(
        action === "pause" ? "已暂停当前资源站同步。" : "已继续当前资源站同步。"
      )
    } catch (controlError) {
      setError(
        controlError instanceof Error
          ? controlError.message
          : "同步任务操作失败"
      )
    } finally {
      setControllingSource(null)
    }
  }

  async function mapResource(item: ResourceItem) {
    const mappingKey = resourceMappingKey(item)
    const doubanId = doubanIds[mappingKey]?.trim() || item.doubanId?.trim()
    if (!doubanId) {
      setNotice(`请先填写「${item.title}」的豆瓣 ID 或豆瓣 URL。`)
      return
    }

    setSubmittingId(mappingKey)
    setNotice("")

    try {
      const response = await fetch("/api/catalog/sync", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doubanId,
          sourceKey: item.sourceKey,
          sourceId: item.sourceId,
        }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) throw new Error(payload.error || "豆瓣映射失败")

      setNotice(`「${item.title}」已完成豆瓣资料同步。`)
      await loadResources()
    } catch (mapError) {
      setNotice(mapError instanceof Error ? mapError.message : "豆瓣映射失败")
    } finally {
      setSubmittingId(null)
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const hasRunningSync = syncProgress.some((item) => item.status === "running")
  const selectedSync = syncProgress.find((item) => item.sourceKey === sourceKey)
  const isSelectedSourceRunning = selectedSync?.status === "running"

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.2em] text-primary uppercase">
            内容工作台
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            资源站与豆瓣映射
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            先从资源站找到影片，再输入豆瓣 ID 或豆瓣链接。ApiZero 当前按 ID
            或链接查询，不会根据标题自动猜测；同步完成后，影片详情页会显示对应播放资源。
            <a
              className="ml-1 underline underline-offset-4 hover:text-foreground"
              href="https://apizero.cn/marketplace/douban-movie"
              rel="noreferrer"
              target="_blank"
            >
              查看接口说明
            </a>
          </p>
        </div>
        <Button onClick={() => router.push("/")} variant="outline">
          返回影片首页
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
          <ToggleGroup
            aria-label="选择资源站"
            multiple={false}
            onValueChange={selectSource}
            size="sm"
            value={[sourceKey]}
            variant="outline"
          >
            {sources.map((source) => (
              <ToggleGroupItem key={source.key} value={source.key}>
                {source.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">映射状态</span>
            <ToggleGroup
              aria-label="筛选豆瓣映射状态"
              multiple={false}
              onValueChange={selectMappingFilter}
              size="sm"
              value={[mappingFilter]}
              variant="outline"
            >
              <ToggleGroupItem value="all">全部</ToggleGroupItem>
              <ToggleGroupItem value="unmapped">待映射</ToggleGroupItem>
              <ToggleGroupItem value="mapped">已映射</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <form className="flex gap-2" onSubmit={submitSearch}>
            <Input
              aria-label="搜索资源站影片"
              className="h-10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索资源标题或 sourceId"
              value={query}
            />
            <Button aria-label="搜索资源站" size="icon" type="submit">
              <Search data-icon="inline-start" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {data
            ? `共 ${data.total} 条资源 · 已映射 ${data.mapped} 条`
            : "正在读取资源"}
          {activeQuery ? ` · 搜索「${activeQuery}」` : ""}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isLoading || isSyncing || isSelectedSourceRunning}
            onClick={() => void syncResources(sourceKey)}
            size="sm"
            variant="outline"
          >
            {isSyncing ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            全量同步当前
          </Button>
          <Button
            disabled={isLoading || isSyncing || hasRunningSync}
            onClick={() => void syncResources()}
            size="sm"
            variant="secondary"
          >
            全量同步全部
          </Button>
          <Button
            disabled={isLoading || isSyncing}
            onClick={() => void loadResources()}
            size="sm"
            variant="ghost"
          >
            刷新
          </Button>
        </div>
      </div>

      {syncProgress.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">全量同步进度</CardTitle>
            <CardDescription>
              西瓜每 15 分钟最多处理 15 页，无水印每 5 分钟最多处理 15 页，UUZY
              每 5 分钟错峰处理 1 页；任务支持断点续传。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {syncProgress.map((item) => (
              <div
                className="rounded-xl border bg-muted/20 p-4"
                key={item.sourceKey}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.sourceName}</p>
                  <Badge
                    variant={
                      item.status === "error" ? "destructive" : "secondary"
                    }
                  >
                    {syncStatusLabel(item.status)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  已处理 {item.itemsSyncedTotal} 条 · 第 {item.lastPage || 0} 页
                  {item.pageCount ? ` / ${item.pageCount}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  进度 {item.progressPercent}% · 预计剩余
                  {item.status === "completed"
                    ? "已完成"
                    : ` ${formatEta(item.estimatedMinutesRemaining)}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  最近成功：{formatDate(item.lastSuccessAt ?? item.lastRunAt)}
                </p>
                {item.status === "running" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    下一页：{item.nextPage}
                  </p>
                )}
                {item.lastError && (
                  <p className="mt-2 text-xs text-destructive">
                    {item.lastError}
                  </p>
                )}
                {(item.status === "running" || item.status === "paused") && (
                  <Button
                    className="mt-3"
                    disabled={controllingSource === item.sourceKey}
                    onClick={() =>
                      void controlSync(
                        item.sourceKey,
                        item.status === "paused" ? "resume" : "pause"
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    {controllingSource === item.sourceKey ? (
                      <LoaderCircle
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : item.status === "paused" ? (
                      <Play data-icon="inline-start" />
                    ) : (
                      <Pause data-icon="inline-start" />
                    )}
                    {item.status === "paused" ? "继续同步" : "暂停同步"}
                  </Button>
                )}
                {item.status === "error" && (
                  <Button
                    className="mt-3"
                    disabled={isSyncing}
                    onClick={() => void syncResources(item.sourceKey)}
                    size="sm"
                    variant="outline"
                  >
                    {isSyncing ? (
                      <LoaderCircle
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <RefreshCw data-icon="inline-start" />
                    )}
                    重试当前资源站
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {notice && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {notice}
        </div>
      )}

      {error ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-sm text-destructive">
          {error}
        </div>
      ) : isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {["a", "b", "c", "d"].map((item) => (
            <Skeleton className="h-64 rounded-xl" key={item} />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {data.items.map((item) => (
            <Card key={`${item.sourceKey}-${item.sourceId}`}>
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{item.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <span>
                        {item.sourceName} · sourceId {item.sourceId}
                      </span>
                      <a
                        className="shrink-0 underline underline-offset-4 hover:text-foreground"
                        href={`https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(item.title)}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        豆瓣搜索
                        <ExternalLink
                          className="ml-1 inline-block size-3"
                          data-icon="inline-end"
                        />
                      </a>
                    </CardDescription>
                  </div>
                  <Badge variant={item.doubanId ? "secondary" : "outline"}>
                    {item.doubanId ? "已映射" : "待映射"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex gap-3">
                  {item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={item.title}
                      className="h-24 w-16 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                      src={item.posterUrl}
                    />
                  ) : (
                    <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-center text-xs text-muted-foreground">
                      无海报
                    </div>
                  )}
                  <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
                    <p>
                      {[item.sourceType, item.sourceArea, item.sourceLanguage]
                        .filter(Boolean)
                        .join(" · ") || "暂无分类资料"}
                    </p>
                    <p>{item.statusNote || "暂无更新状态"}</p>
                    <p>
                      {item.playLines.length} 个播放链接 ·{" "}
                      {formatDate(item.sourceUpdatedAt)}
                    </p>
                  </div>
                </div>
                <Separator />
                <form
                  className="flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void mapResource(item)
                  }}
                >
                  <Input
                    aria-label={`${item.title} 豆瓣 ID`}
                    onChange={(event) =>
                      setDoubanIds((current) => ({
                        ...current,
                        [resourceMappingKey(item)]: event.target.value,
                      }))
                    }
                    placeholder="豆瓣 ID 或 URL"
                    value={
                      doubanIds[resourceMappingKey(item)] ?? item.doubanId ?? ""
                    }
                  />
                  <Button
                    className="shrink-0"
                    disabled={submittingId === resourceMappingKey(item)}
                    type="submit"
                  >
                    {submittingId === resourceMappingKey(item) ? (
                      <LoaderCircle
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : item.doubanId ? (
                      <Check data-icon="inline-start" />
                    ) : (
                      <Link2 data-icon="inline-start" />
                    )}
                    {item.doubanId ? "重新同步" : "绑定豆瓣"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          当前筛选条件下没有资源。请先运行资源站同步，或换一个关键词。
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <Button
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          size="sm"
          variant="outline"
        >
          <ChevronLeft data-icon="inline-start" />
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">
          第 {page} / {totalPages} 页
        </span>
        <Button
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((current) => current + 1)}
          size="sm"
          variant="outline"
        >
          下一页
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
