"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Info,
  Play,
  Search,
  Sparkles,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FALLBACK_MOVIES, groupMovies, type Movie } from "@/lib/movies"

const categories = ["all", "科幻", "动作", "剧情", "悬疑", "爱情"] as const

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60

  return remaining ? `${hours} 小时 ${remaining} 分钟` : `${hours} 小时`
}

export function MovieHome() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [query, setQuery] = useState("")
  const [activeQuery, setActiveQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [source, setSource] = useState<"d1" | "fallback" | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  const loadMovies = useCallback(async () => {
    const params = new URLSearchParams()
    if (activeQuery) params.set("q", activeQuery)
    if (category !== "all") params.set("category", category)

    try {
      const response = await fetch(`/api/movies?${params.toString()}`, {
        headers: { Accept: "application/json" },
      })

      if (!response.ok) throw new Error("Movie API unavailable")

      const data = (await response.json()) as {
        movies: Movie[]
        source: "d1" | "fallback"
      }

      setMovies(data.movies)
      setSource(data.source)
    } catch {
      setMovies(
        FALLBACK_MOVIES.filter((movie) => {
          const matchesQuery =
            !activeQuery ||
            [movie.title, movie.originalTitle, movie.tagline, ...movie.genres]
              .join(" ")
              .toLocaleLowerCase()
              .includes(activeQuery.toLocaleLowerCase())
          const matchesCategory =
            category === "all" || movie.genres.includes(category)

          return matchesQuery && matchesCategory
        })
      )
      setSource("fallback")
    } finally {
      setIsLoading(false)
    }
  }, [activeQuery, category])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMovies()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadMovies])

  const featuredMovie = useMemo(
    () => movies.find((movie) => movie.featured) ?? FALLBACK_MOVIES[0],
    [movies]
  )
  const sections = useMemo(() => {
    if (activeQuery || category !== "all") {
      return [
        {
          title: activeQuery ? "搜索结果" : `${category}片单`,
          movies,
        },
      ].filter((section) => section.movies.length > 0)
    }

    return groupMovies(movies)
  }, [activeQuery, category, movies])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveQuery(query.trim())
  }

  function clearSearch() {
    setQuery("")
    setActiveQuery("")
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 text-lg font-semibold tracking-[0.32em] text-primary"
          >
            MOVIE
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <Link
              className="text-foreground transition-colors hover:text-primary"
              href="#discover"
            >
              首页
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="#discover"
            >
              电影
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="#discover"
            >
              剧集
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="#discover"
            >
              我的片单
            </Link>
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <form
              className="hidden items-center gap-2 sm:flex"
              onSubmit={submitSearch}
            >
              <Input
                aria-label="搜索电影"
                className="h-9 w-44 border-border/70 bg-muted/40 text-sm lg:w-56"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索电影、剧集"
                value={query}
              />
              <Button
                aria-label="搜索"
                size="icon"
                type="submit"
                variant="secondary"
              >
                <Search data-icon="inline-start" />
              </Button>
            </form>
            <Button aria-label="通知" size="icon" variant="ghost">
              <Bell data-icon="inline-start" />
            </Button>
            <Button
              className="hidden sm:inline-flex"
              size="sm"
              variant="outline"
            >
              观影记录
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section
          className="relative isolate flex min-h-[620px] items-end overflow-hidden border-b border-border/30 pt-16"
          style={{
            backgroundImage: `url(${featuredMovie.backdropUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 -z-10 bg-background/35" />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-background via-background/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-linear-to-t from-background to-transparent" />
          <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <Badge className="mb-5 gap-1.5" variant="secondary">
                <Sparkles data-icon="inline-start" />
                本周精选
              </Badge>
              <p className="mb-3 text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
                {featuredMovie.originalTitle}
              </p>
              <h1 className="text-5xl leading-[0.95] font-semibold tracking-[-0.05em] text-balance sm:text-7xl">
                {featuredMovie.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-pretty text-muted-foreground sm:text-xl">
                {featuredMovie.tagline} {featuredMovie.description}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setSelectedMovie(featuredMovie)}
                  size="lg"
                >
                  <Play data-icon="inline-start" />
                  开始观看
                </Button>
                <Button
                  onClick={() => setSelectedMovie(featuredMovie)}
                  size="lg"
                  variant="secondary"
                >
                  <Info data-icon="inline-start" />
                  详情
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {featuredMovie.rating} 评分
                </span>
                <span>{featuredMovie.year}</span>
                <span>{formatDuration(featuredMovie.durationMinutes)}</span>
                <span>{featuredMovie.maturity}</span>
                <span>{featuredMovie.genres.join(" · ")}</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
          id="discover"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium tracking-[0.2em] text-primary uppercase">
                发现好故事
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                你的下一部电影
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {source === "d1"
                ? "内容来自 Cloudflare D1 数据库，搜索和分类筛选实时生效。"
                : "当前使用本地演示数据，连接 Cloudflare D1 后会自动切换为数据库内容。"}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ToggleGroup
              className="max-w-full overflow-x-auto pb-1"
              onValueChange={(values) => {
                setCategory(values[0] ?? "all")
              }}
              multiple={false}
              size="sm"
              value={[category]}
              variant="outline"
            >
              {categories.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                  {item === "all" ? "全部" : item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <form className="flex gap-2 sm:hidden" onSubmit={submitSearch}>
              <Input
                aria-label="搜索电影"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索电影、剧集"
                value={query}
              />
              <Button aria-label="搜索" size="icon" type="submit">
                <Search data-icon="inline-start" />
              </Button>
            </form>
          </div>

          {activeQuery && (
            <div className="mt-7 flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                “{activeQuery}” 的搜索结果 · {movies.length} 部
              </span>
              <Button onClick={clearSearch} size="sm" variant="ghost">
                <X data-icon="inline-start" />
                清除
              </Button>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-12">
            {isLoading ? (
              <MovieRowsSkeleton />
            ) : sections.length > 0 ? (
              sections.map((section) => (
                <MovieSection
                  key={section.title}
                  movies={section.movies}
                  onSelect={setSelectedMovie}
                  title={section.title}
                />
              ))
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
                <p className="text-lg font-medium">没有找到匹配的影片</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  换一个关键词或切换其他分类试试。
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="font-medium tracking-[0.28em] text-foreground">
              MOVIE
            </p>
            <p className="mt-2">把今晚留给一个好故事。</p>
          </div>
          <div className="flex items-center gap-5">
            <Link
              className="transition-colors hover:text-foreground"
              href="#discover"
            >
              浏览片单
            </Link>
            <Link
              className="transition-colors hover:text-foreground"
              href="/api/health"
            >
              服务状态
            </Link>
            <span>Cloudflare Workers + D1</span>
          </div>
        </div>
      </footer>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelectedMovie(null)
        }}
        open={Boolean(selectedMovie)}
      >
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          {selectedMovie && (
            <>
              <div
                className="relative min-h-64 overflow-hidden"
                style={{
                  backgroundImage: `url(${selectedMovie.backdropUrl})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      {selectedMovie.originalTitle}
                    </p>
                    <DialogTitle className="text-3xl tracking-tight">
                      {selectedMovie.title}
                    </DialogTitle>
                    <DialogDescription className="text-base text-foreground/70">
                      {selectedMovie.tagline}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
              <div className="flex flex-col gap-5 p-6">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{selectedMovie.rating} 评分</Badge>
                  <span>{selectedMovie.year}</span>
                  <span>·</span>
                  <span>{formatDuration(selectedMovie.durationMinutes)}</span>
                  <span>·</span>
                  <span>{selectedMovie.maturity}</span>
                  {selectedMovie.genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
                <Separator />
                <p className="text-sm leading-7 text-muted-foreground">
                  {selectedMovie.description}
                </p>
                <DialogFooter className="-mx-6 -mb-6 rounded-none border-t-0 bg-transparent p-0 pt-1 sm:justify-start">
                  <Button onClick={() => setSelectedMovie(null)}>
                    <Play data-icon="inline-start" />
                    加入播放列表
                  </Button>
                  <Button
                    onClick={() => setSelectedMovie(null)}
                    variant="outline"
                  >
                    完成
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MovieSection({
  movies,
  onSelect,
  title,
}: {
  movies: Movie[]
  onSelect: (movie: Movie) => void
  title: string
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <Button className="shrink-0" size="sm" variant="ghost">
          查看全部
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max gap-4 pb-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onSelect={onSelect} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

function MovieCard({
  movie,
  onSelect,
}: {
  movie: Movie
  onSelect: (movie: Movie) => void
}) {
  return (
    <Card className="w-44 shrink-0 border-border/60 bg-card/80 transition-transform hover:-translate-y-1 sm:w-48">
      <CardHeader className="p-0">
        <button
          aria-label={`查看 ${movie.title} 详情`}
          className="group relative aspect-[2/3] overflow-hidden text-left"
          onClick={() => onSelect(movie)}
          type="button"
        >
          {/* Remote posters intentionally use plain img for vinext/Workers delivery. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={movie.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            src={movie.posterUrl}
          />
          <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-70" />
          <Badge className="absolute top-3 left-3" variant="secondary">
            {movie.rating}
          </Badge>
          <span className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <span>查看详情</span>
            <ArrowRight data-icon="inline-end" />
          </span>
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 pt-3">
        <CardTitle className="truncate text-sm">{movie.title}</CardTitle>
      </CardContent>
      <CardFooter className="border-t-0 bg-transparent px-3 pt-0 pb-3 text-xs text-muted-foreground">
        <span className="truncate">
          {movie.year} · {movie.genres[0]}
        </span>
      </CardFooter>
    </Card>
  )
}

function MovieRowsSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      {["a", "b"].map((section) => (
        <section key={section}>
          <Skeleton className="mb-4 h-7 w-32" />
          <div className="flex gap-4 overflow-hidden">
            {["a", "b", "c", "d", "e"].map((card) => (
              <Skeleton
                className="h-72 w-44 shrink-0 rounded-xl sm:w-48"
                key={card}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
