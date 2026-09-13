const API_ENDPOINT = "https://v1.apizero.cn/api/douban-movie"

export type DoubanMovieMetadata = {
  doubanId: string
  title: string
  originalTitle: string
  year: number
  rating: number
  directors: string
  actors: string
  genres: string[]
  area: string
  durationMinutes: number
  tagline: string
  description: string
  maturity: string
  doubanUrl: string
  isTv: boolean
}

type ApiZeroResponse = {
  code: number
  msg?: string
  data?: {
    douban_id?: string
    name?: string
    year?: string
    score?: string
    director?: string
    actor?: string
    genre?: string
    area?: string
    duration?: string
    short_comment?: string
    douban_url?: string
    is_tv?: boolean
  }
}

type DoubanEnvironment = {
  DOUBAN_API_KEY?: string
}

function splitValues(value = "") {
  return value
    .split(/[,，/、|]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseNumber(value: string | undefined, fallback = 0) {
  const number = Number.parseFloat(value ?? "")
  return Number.isFinite(number) ? number : fallback
}

function parseDuration(value: string | undefined) {
  const minutes = Number.parseInt(value?.match(/\d+/)?.[0] ?? "", 10)
  return Number.isFinite(minutes) ? minutes : 0
}

function parseTitle(name: string) {
  const parts = name.trim().split(/\s+(?=[A-Za-z][A-Za-z0-9 .:'&-]*$)/)
  return parts[0]?.trim() || name.trim()
}

export function doubanIdFromInput(input: string) {
  const match = input.match(/subject\/(\d+)/i)
  return match?.[1] ?? input.trim()
}

export async function fetchDoubanMovie(
  environment: DoubanEnvironment,
  input: string
): Promise<DoubanMovieMetadata> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)
  const headers = new Headers({ Accept: "application/json" })

  if (environment.DOUBAN_API_KEY) {
    headers.set("Authorization", `Bearer ${environment.DOUBAN_API_KEY}`)
  }

  try {
    const url = new URL(API_ENDPOINT)
    url.searchParams.set("id", input)
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    })

    const payload = (await response.json()) as ApiZeroResponse
    if (!response.ok || payload.code !== 0 || !payload.data) {
      throw new Error(
        payload.msg || `ApiZero request failed: ${response.status}`
      )
    }

    const data = payload.data
    const name = data.name?.trim() || `豆瓣影片 ${data.douban_id ?? input}`
    const description = data.short_comment?.trim() || ""

    return {
      doubanId: data.douban_id || doubanIdFromInput(input),
      title: parseTitle(name),
      originalTitle: name,
      year: Number.parseInt(data.year ?? "0", 10) || 0,
      rating: parseNumber(data.score),
      directors: data.director?.trim() || "",
      actors: data.actor?.trim() || "",
      genres: splitValues(data.genre),
      area: data.area?.trim() || "",
      durationMinutes: parseDuration(data.duration),
      tagline: description,
      description,
      maturity: "",
      doubanUrl:
        data.douban_url ||
        `https://movie.douban.com/subject/${data.douban_id || doubanIdFromInput(input)}/`,
      isTv: Boolean(data.is_tv),
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
