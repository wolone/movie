export type Movie = {
  id: string
  slug: string
  title: string
  originalTitle: string
  tagline: string
  description: string
  year: number
  rating: number
  durationMinutes: number
  maturity: string
  genres: string[]
  posterUrl: string
  backdropUrl: string
  featured: boolean
  trendingRank: number | null
  sourceKey?: string
  sourceCount?: number
  doubanId?: string
  sources?: MovieResource[]
}

export type MovieResource = {
  sourceKey: string
  sourceName: string
  sourceId: string
  sourceType: string
  sourceArea: string
  sourceLanguage: string
  statusNote: string
  sourceUpdatedAt: string | null
  posterUrl: string
  detailUrl: string
  playLines: Array<{
    name: string
    url: string
  }>
}

export type MovieRow = {
  id: string
  slug: string
  title: string
  original_title: string
  tagline: string
  description: string
  year: number
  rating: number
  duration_minutes: number
  maturity: string
  genres: string
  poster_url: string
  backdrop_url: string
  featured: number
  trending_rank: number | null
  source_key?: string | null
  source_count?: number | null
  douban_id?: string | null
  metadata_provider?: string | null
  source_updated_at?: string | null
}

export type MovieResourceRow = {
  source_key: string
  source_name: string
  source_id: string
  source_type: string
  source_area: string
  source_language: string
  status_note: string
  source_updated_at: string | null
  poster_url: string
  detail_url: string
  play_lines: string
}

const image = (id: string, width: number, height: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=82`

export const FALLBACK_MOVIES: Movie[] = [
  {
    id: "movie-interstellar",
    slug: "interstellar",
    title: "星际穿越",
    originalTitle: "Interstellar",
    tagline: "人类的下一站，是星辰大海。",
    description:
      "当尘埃风暴让地球逐渐失去宜居条件，一支探险队穿越虫洞，寻找人类可以延续文明的新家园。",
    year: 2014,
    rating: 9.4,
    durationMinutes: 169,
    maturity: "PG-13",
    genres: ["科幻", "冒险", "剧情"],
    posterUrl: image("photo-1446776811953-b23d57bd21aa", 520, 780),
    backdropUrl: image("photo-1446776811953-b23d57bd21aa", 1800, 1000),
    featured: true,
    trendingRank: 1,
  },
  {
    id: "movie-dune-part-two",
    slug: "dune-part-two",
    title: "沙丘 2",
    originalTitle: "Dune: Part Two",
    tagline: "浴火而生，向沙海而行。",
    description:
      "保罗·厄崔迪与契妮及弗雷曼人联手，踏上复仇之路，同时努力避免自己预见的可怕未来。",
    year: 2024,
    rating: 9.1,
    durationMinutes: 166,
    maturity: "PG-13",
    genres: ["科幻", "动作", "冒险"],
    posterUrl: image("photo-1500534623283-312aade485b7", 520, 780),
    backdropUrl: image("photo-1500534623283-312aade485b7", 1800, 1000),
    featured: false,
    trendingRank: 2,
  },
  {
    id: "movie-the-last-of-us",
    slug: "the-last-of-us",
    title: "最后生还者",
    originalTitle: "The Last of Us",
    tagline: "在失去一切之后，仍然选择相信。",
    description:
      "一场改变文明的疫情之后，两个被迫结伴同行的幸存者穿越废墟，寻找关于未来的答案。",
    year: 2023,
    rating: 9.0,
    durationMinutes: 54,
    maturity: "16+",
    genres: ["剧情", "惊悚", "冒险"],
    posterUrl: image("photo-1448375240586-882707db888b", 520, 780),
    backdropUrl: image("photo-1448375240586-882707db888b", 1800, 1000),
    featured: false,
    trendingRank: 3,
  },
  {
    id: "movie-blade-runner",
    slug: "blade-runner-2049",
    title: "银翼杀手 2049",
    originalTitle: "Blade Runner 2049",
    tagline: "未来已来，只是尚未平均。",
    description:
      "一名年轻的银翼杀手发现了一个埋藏已久的秘密，线索将他引向三十年前失踪的前任警员。",
    year: 2017,
    rating: 8.8,
    durationMinutes: 164,
    maturity: "16+",
    genres: ["科幻", "悬疑", "剧情"],
    posterUrl: image("photo-1519608487953-e999c86e7455", 520, 780),
    backdropUrl: image("photo-1519608487953-e999c86e7455", 1800, 1000),
    featured: false,
    trendingRank: 4,
  },
  {
    id: "movie-into-the-wild",
    slug: "into-the-wild",
    title: "荒野生存",
    originalTitle: "Into the Wild",
    tagline: "有些人选择离开，是为了真正抵达。",
    description:
      "一个刚毕业的年轻人放弃安稳生活，独自踏上横跨北美的旅程，寻找内心真正的自由。",
    year: 2007,
    rating: 8.7,
    durationMinutes: 148,
    maturity: "PG-13",
    genres: ["剧情", "冒险"],
    posterUrl: image("photo-1464822759023-fed622ff2c3b", 520, 780),
    backdropUrl: image("photo-1464822759023-fed622ff2c3b", 1800, 1000),
    featured: false,
    trendingRank: 5,
  },
  {
    id: "movie-her",
    slug: "her",
    title: "她",
    originalTitle: "Her",
    tagline: "爱，是一种我们共同学习的语言。",
    description:
      "一位孤独的作家与先进的人工智能建立起亲密关系，重新思考人类情感与陪伴的边界。",
    year: 2013,
    rating: 8.5,
    durationMinutes: 126,
    maturity: "R",
    genres: ["爱情", "科幻", "剧情"],
    posterUrl: image("photo-1519608487953-e999c86e7455", 520, 780),
    backdropUrl: image("photo-1477959858617-67f85cf4f1df", 1800, 1000),
    featured: false,
    trendingRank: 6,
  },
  {
    id: "movie-the-batman",
    slug: "the-batman",
    title: "新蝙蝠侠",
    originalTitle: "The Batman",
    tagline: "未被看见的真相，才是最深的黑暗。",
    description:
      "哥谭市接连发生命案，蝙蝠侠必须深入城市腐败的根源，揭开一场席卷家族与权力的阴谋。",
    year: 2022,
    rating: 8.4,
    durationMinutes: 176,
    maturity: "PG-13",
    genres: ["动作", "犯罪", "悬疑"],
    posterUrl: image("photo-1477959858617-67f85cf4f1df", 520, 780),
    backdropUrl: image("photo-1477959858617-67f85cf4f1df", 1800, 1000),
    featured: false,
    trendingRank: 7,
  },
  {
    id: "movie-arrival",
    slug: "arrival",
    title: "降临",
    originalTitle: "Arrival",
    tagline: "语言，是理解世界的第一种方式。",
    description:
      "神秘飞船降临地球，一位语言学家受命解读未知生命的语言，试图阻止全球冲突。",
    year: 2016,
    rating: 8.3,
    durationMinutes: 116,
    maturity: "PG-13",
    genres: ["科幻", "剧情", "悬疑"],
    posterUrl: image("photo-1500534623283-312aade485b7", 520, 780),
    backdropUrl: image("photo-1446776811953-b23d57bd21aa", 1800, 1000),
    featured: false,
    trendingRank: 8,
  },
  {
    id: "movie-spider-verse",
    slug: "spider-man-across-the-spider-verse",
    title: "蜘蛛侠：纵横宇宙",
    originalTitle: "Spider-Man: Across the Spider-Verse",
    tagline: "每个宇宙，都有一个选择。",
    description:
      "迈尔斯·莫拉莱斯再次踏入多元宇宙，遇见一群蜘蛛侠，也迎来必须独自做出的命运选择。",
    year: 2023,
    rating: 8.9,
    durationMinutes: 140,
    maturity: "PG",
    genres: ["动画", "动作", "冒险"],
    posterUrl: image("photo-1519608487953-e999c86e7455", 520, 780),
    backdropUrl: image("photo-1477959858617-67f85cf4f1df", 1800, 1000),
    featured: false,
    trendingRank: 9,
  },
  {
    id: "movie-poor-things",
    slug: "poor-things",
    title: "可怜的东西",
    originalTitle: "Poor Things",
    tagline: "她要重新发明自己的人生。",
    description:
      "一位年轻女性在奇异的科学实验中重获新生，随后踏上跨越大陆的成长与自我发现之旅。",
    year: 2023,
    rating: 8.1,
    durationMinutes: 141,
    maturity: "R",
    genres: ["喜剧", "爱情", "剧情"],
    posterUrl: image("photo-1507525428034-b723cf961d3e", 520, 780),
    backdropUrl: image("photo-1507525428034-b723cf961d3e", 1800, 1000),
    featured: false,
    trendingRank: 10,
  },
  {
    id: "movie-mad-max",
    slug: "mad-max-fury-road",
    title: "疯狂的麦克斯：狂暴女神",
    originalTitle: "Mad Max: Fury Road",
    tagline: "希望是一种反抗。",
    description:
      "在末日荒原上，一群逃亡者驾驶战车穿越沙海，与暴君展开一场关于自由的追逐。",
    year: 2015,
    rating: 8.6,
    durationMinutes: 120,
    maturity: "R",
    genres: ["动作", "科幻", "冒险"],
    posterUrl: image("photo-1500534623283-312aade485b7", 520, 780),
    backdropUrl: image("photo-1500534623283-312aade485b7", 1800, 1000),
    featured: false,
    trendingRank: 11,
  },
  {
    id: "movie-little-women",
    slug: "little-women",
    title: "小妇人",
    originalTitle: "Little Women",
    tagline: "她们的故事，由她们自己书写。",
    description:
      "四姐妹在成长、离别与重逢中寻找各自的人生方向，并用自己的方式定义爱与成功。",
    year: 2019,
    rating: 8.2,
    durationMinutes: 135,
    maturity: "PG",
    genres: ["剧情", "爱情"],
    posterUrl: image("photo-1448375240586-882707db888b", 520, 780),
    backdropUrl: image("photo-1464822759023-fed622ff2c3b", 1800, 1000),
    featured: false,
    trendingRank: 12,
  },
]

export function movieFromRow(row: MovieRow): Movie {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.original_title,
    tagline: row.tagline,
    description: row.description,
    year: row.year,
    rating: row.rating,
    durationMinutes: row.duration_minutes,
    maturity: row.maturity,
    genres: row.genres
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean),
    posterUrl: row.poster_url,
    backdropUrl: row.backdrop_url,
    featured: row.featured === 1,
    trendingRank: row.trending_rank,
    sourceKey: row.source_key ?? undefined,
    sourceCount: row.source_count ?? undefined,
    doubanId: row.douban_id ?? undefined,
  }
}

export function movieResourceFromRow(row: MovieResourceRow): MovieResource {
  let playLines: MovieResource["playLines"] = []

  try {
    const parsed = JSON.parse(row.play_lines) as MovieResource["playLines"]
    if (Array.isArray(parsed)) {
      playLines = parsed.filter(
        (line) =>
          typeof line?.name === "string" && typeof line?.url === "string"
      )
    }
  } catch {
    playLines = []
  }

  return {
    sourceKey: row.source_key,
    sourceName: row.source_name,
    sourceId: row.source_id,
    sourceType: row.source_type,
    sourceArea: row.source_area,
    sourceLanguage: row.source_language,
    statusNote: row.status_note,
    sourceUpdatedAt: row.source_updated_at,
    posterUrl: row.poster_url,
    detailUrl: row.detail_url,
    playLines,
  }
}

export function filterMovies(movies: Movie[], query = "", category = "all") {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const normalizedCategory = category.trim().toLocaleLowerCase()

  return movies.filter((movie) => {
    const matchesQuery =
      !normalizedQuery ||
      [movie.title, movie.originalTitle, movie.tagline, ...movie.genres]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    const matchesCategory =
      normalizedCategory === "all" ||
      movie.genres.some(
        (genre) => genre.toLocaleLowerCase() === normalizedCategory
      )

    return matchesQuery && matchesCategory
  })
}

export function groupMovies(movies: Movie[]) {
  return [
    {
      title: "正在流行",
      movies: movies.filter((movie) => movie.trendingRank !== null),
    },
    {
      title: "科幻与未知",
      movies: movies.filter((movie) => movie.genres.includes("科幻")),
    },
    {
      title: "值得重看",
      movies: movies.filter((movie) => movie.rating >= 8.5),
    },
  ].filter((section) => section.movies.length > 0)
}
