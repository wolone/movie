export type SourceKey = "xigua" | "wsyzy" | "uuzy"

export type ResourceItem = {
  sourceKey: SourceKey
  sourceName: string
  sourceId: string
  title: string
  sourceType: string
  area: string
  language: string
  year: number
  note: string
  actors: string
  directors: string
  description: string
  posterUrl: string
  sourceUpdatedAt: string | null
  playLines: Array<{ name: string; url: string }>
  detailUrl: string
}

type SourceConfig = {
  key: SourceKey
  name: string
  listEndpoint: string
  detailEndpoint: string
  siteBase: string
  format: "json" | "xml"
  supportsPagination: boolean
  preferredFlag: string
}

type JsonRecord = Record<string, unknown>

type SourcePage = {
  items: ResourceItem[]
  page: number
  pageCount: number
  totalItems: number
}

export type SyncProgressStatus = "idle" | "running" | "completed" | "error"

export type SyncProgress = {
  sourceKey: SourceKey
  sourceName: string
  status: SyncProgressStatus
  nextPage: number
  lastPage: number
  pageCount: number | null
  totalItems: number | null
  itemsSyncedTotal: number
  lastRunAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
}

export const SOURCE_CONFIGS: Record<SourceKey, SourceConfig> = {
  xigua: {
    key: "xigua",
    name: "西瓜资源",
    listEndpoint: "https://caiji.xgzyapi.com/api.php/provide/vod/at/xml/",
    detailEndpoint: "https://caiji.xgzyapi.com/api.php/provide/vod/at/xml/",
    siteBase: "https://xgzy.tv",
    format: "xml",
    supportsPagination: true,
    preferredFlag: "xiguam3u8",
  },
  wsyzy: {
    key: "wsyzy",
    name: "无水印资源网",
    listEndpoint: "https://api.wsyzy.net/api.php/provide/vod/?ac=list",
    detailEndpoint: "https://api.wsyzy.net/api.php/provide/vod/",
    siteBase: "https://wsyzy.cc",
    format: "json",
    supportsPagination: true,
    preferredFlag: "wsym3u8",
  },
  uuzy: {
    key: "uuzy",
    name: "UUZY",
    listEndpoint: "https://uuzy.me/api.php/provide/vod/from/snm3u8/at/xml",
    detailEndpoint: "https://uuzy.me/api.php/provide/vod/from/snm3u8/at/xml",
    siteBase: "https://uuzy.me",
    format: "xml",
    supportsPagination: false,
    preferredFlag: "m3u8",
  },
}

export const SOURCE_KEYS = Object.keys(SOURCE_CONFIGS) as SourceKey[]

export function isSourceKey(
  value: string | null | undefined
): value is SourceKey {
  return Boolean(value && SOURCE_KEYS.includes(value as SourceKey))
}

function decodeEntities(value: string) {
  return value
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => {
      return String.fromCodePoint(Number.parseInt(code, 16))
    })
    .replace(/&#(\d+);/g, (_, code: string) => {
      return String.fromCodePoint(Number.parseInt(code, 10))
    })
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
}

function cleanText(value = "") {
  let result = value.trim()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const decoded = decodeEntities(result)
    const withoutCdata = decoded
      .replace(/^<!\[CDATA\[/i, "")
      .replace(/\]\]>$/i, "")
      .trim()

    if (withoutCdata === result) break
    result = withoutCdata
  }

  return result.trim()
}

function stripMarkup(value = "") {
  return cleanText(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
}

function getXmlTag(block: string, names: string[]) {
  for (const name of names) {
    const match = block.match(
      new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "i")
    )
    if (match?.[1]) return cleanText(match[1])
  }

  return ""
}

function extractXmlVideos(xml: string) {
  return [...xml.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/gi)].map(
    (match) => match[0]
  )
}

function parseXmlPlayLines(block: string, preferredFlag: string) {
  const lines: ResourceItem["playLines"] = []
  const groups = [...block.matchAll(/<dd\b([^>]*)>([\s\S]*?)<\/dd>/gi)]

  for (const group of groups) {
    const attributes = group[1] ?? ""
    const flag =
      attributes.match(/\bflag\s*=\s*["']([^"']+)["']/i)?.[1] ?? preferredFlag
    const content = cleanText(group[2] ?? "")

    for (const [index, item] of content.split("#").entries()) {
      const separator = item.lastIndexOf("$")
      const label = cleanText(
        separator > 0 ? item.slice(0, separator) : `第 ${index + 1} 集`
      )
      const url = cleanText(separator > 0 ? item.slice(separator + 1) : item)

      if (/^https?:\/\//i.test(url)) {
        lines.push({
          name: flag === preferredFlag ? label : `${flag} · ${label}`,
          url,
        })
      }
    }
  }

  return lines
}

function parseDelimitedPlayLines(
  playUrl: string,
  playFrom: string,
  preferredFlag: string
) {
  const lines: ResourceItem["playLines"] = []
  const urlGroups = playUrl.split("$$$")
  const nameGroups = playFrom.split("$$$")

  for (const [groupIndex, group] of urlGroups.entries()) {
    const flag = cleanText(nameGroups[groupIndex] || preferredFlag)

    for (const [index, item] of group.split("#").entries()) {
      const separator = item.lastIndexOf("$")
      const label = cleanText(
        separator > 0 ? item.slice(0, separator) : `第 ${index + 1} 集`
      )
      const url = cleanText(separator > 0 ? item.slice(separator + 1) : item)

      if (/^https?:\/\//i.test(url)) {
        lines.push({
          name: flag === preferredFlag ? label : `${flag} · ${label}`,
          url,
        })
      }
    }
  }

  return lines
}

function resolveUrl(value: string, siteBase: string) {
  const cleaned = cleanText(value)
  if (!cleaned) return ""

  try {
    return new URL(cleaned, siteBase).toString()
  } catch {
    return ""
  }
}

function firstJsonValue(record: JsonRecord, names: string[]) {
  for (const name of names) {
    const value = record[name]
    if (value !== undefined && value !== null) return cleanText(String(value))
  }

  return ""
}

function jsonItems(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload.filter(isJsonRecord)
  if (!isJsonRecord(payload)) return []

  for (const key of ["list", "data", "results", "items"]) {
    const value = payload[key]
    if (Array.isArray(value)) return value.filter(isJsonRecord)
    if (isJsonRecord(value)) {
      const nested = jsonItems(value)
      if (nested.length > 0) return nested
    }
  }

  return []
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseJsonPlayLines(record: JsonRecord, preferredFlag: string) {
  return parseDelimitedPlayLines(
    firstJsonValue(record, ["vod_play_url", "play_url"]),
    firstJsonValue(record, ["vod_play_from", "play_from"]) || preferredFlag,
    preferredFlag
  )
}

function parseYear(value: string) {
  const year = Number.parseInt(value.match(/\d{4}/)?.[0] ?? "", 10)
  return Number.isFinite(year) ? year : 0
}

function parseDate(value: string) {
  const cleaned = cleanText(value)
  if (!cleaned) return null

  const date = new Date(cleaned)
  return Number.isNaN(date.getTime()) ? cleaned : date.toISOString()
}

function normalizeXmlItem(block: string, config: SourceConfig): ResourceItem {
  const sourceId = getXmlTag(block, ["vod_id", "id"])
  const title = getXmlTag(block, ["vod_name", "name"])

  return {
    sourceKey: config.key,
    sourceName: config.name,
    sourceId,
    title,
    sourceType: getXmlTag(block, ["type_name", "vod_type_name", "type"]),
    area: getXmlTag(block, ["vod_area", "area"]),
    language: getXmlTag(block, ["vod_lang", "lang", "language"]),
    year: parseYear(getXmlTag(block, ["vod_year", "year"])),
    note: getXmlTag(block, ["vod_remarks", "vod_note", "remarks", "note"]),
    actors: getXmlTag(block, ["vod_actor", "actor"]),
    directors: getXmlTag(block, ["vod_director", "director"]),
    description: stripMarkup(
      getXmlTag(block, ["vod_content", "vod_blurb", "des", "description"])
    ),
    posterUrl: resolveUrl(
      getXmlTag(block, ["vod_pic", "pic", "poster"]),
      config.siteBase
    ),
    sourceUpdatedAt: parseDate(
      getXmlTag(block, ["vod_time", "vod_time_add", "last", "update_time"])
    ),
    playLines: parseXmlPlayLines(block, config.preferredFlag),
    detailUrl: `${config.siteBase}/index.php/vod/detail/id/${sourceId}.html`,
  }
}

function normalizeJsonItem(
  record: JsonRecord,
  config: SourceConfig
): ResourceItem {
  const sourceId = firstJsonValue(record, ["vod_id", "id"])
  const title = firstJsonValue(record, ["vod_name", "name", "title"])
  const poster = firstJsonValue(record, ["vod_pic", "pic", "poster"])

  return {
    sourceKey: config.key,
    sourceName: config.name,
    sourceId,
    title,
    sourceType: firstJsonValue(record, ["type_name", "vod_type_name", "type"]),
    area: firstJsonValue(record, ["vod_area", "area"]),
    language: firstJsonValue(record, ["vod_lang", "lang", "language"]),
    year: parseYear(firstJsonValue(record, ["vod_year", "year"])),
    note: firstJsonValue(record, [
      "vod_remarks",
      "vod_note",
      "remarks",
      "note",
    ]),
    actors: firstJsonValue(record, ["vod_actor", "actor"]),
    directors: firstJsonValue(record, ["vod_director", "director"]),
    description: stripMarkup(
      firstJsonValue(record, ["vod_content", "vod_blurb", "des", "description"])
    ),
    posterUrl: resolveUrl(poster, config.siteBase),
    sourceUpdatedAt: parseDate(
      firstJsonValue(record, [
        "vod_time",
        "vod_time_add",
        "last",
        "update_time",
      ])
    ),
    playLines: parseJsonPlayLines(record, config.preferredFlag),
    detailUrl: `${config.siteBase}/index.php/vod/detail/id/${sourceId}.html`,
  }
}

function buildListUrl(config: SourceConfig, page: number) {
  const url = new URL(config.listEndpoint)
  if (config.supportsPagination) url.searchParams.set("pg", String(page))
  return url
}

function buildDetailUrl(config: SourceConfig, ids: string[]) {
  const url = new URL(config.detailEndpoint)
  url.searchParams.set("ac", "detail")
  url.searchParams.set("ids", ids.join(","))
  return url
}

function readNumericValue(value: string | undefined) {
  const number = Number.parseInt(value ?? "", 10)
  return Number.isFinite(number) ? number : 0
}

function parseXmlPageMeta(xml: string, config: SourceConfig, page: number) {
  const attributes = xml.match(/<list\b([^>]*)>/i)?.[1] ?? ""
  const getAttribute = (name: string) =>
    attributes.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1]

  return {
    page: readNumericValue(getAttribute("page")) || page,
    pageCount: config.supportsPagination
      ? readNumericValue(getAttribute("pagecount"))
      : 1,
    totalItems: readNumericValue(getAttribute("recordcount")),
  }
}

function parseJsonPageMeta(
  payload: JsonRecord,
  config: SourceConfig,
  page: number
) {
  return {
    page: readNumericValue(firstJsonValue(payload, ["page"])) || page,
    pageCount: config.supportsPagination
      ? readNumericValue(firstJsonValue(payload, ["pagecount"]))
      : 1,
    totalItems: readNumericValue(
      firstJsonValue(payload, ["total", "recordcount"])
    ),
  }
}

async function fetchBody(url: URL) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20_000)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json, application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent": "movie-worker-resource-sync/1.0",
      },
      signal: controller.signal,
    })
    const body = await response.text()
    const trimmed = body.trim()
    const validBody = trimmed.startsWith("<") || trimmed.startsWith("{")

    if (!response.ok && !validBody) {
      throw new Error(`Resource request failed: ${response.status} ${url}`)
    }

    if (!validBody) throw new Error(`Resource response was empty: ${url}`)
    return body
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchXmlItems(config: SourceConfig, page: number) {
  const listBody = await fetchBody(buildListUrl(config, page))
  const listBlocks = extractXmlVideos(listBody)
  const pageMeta = parseXmlPageMeta(listBody, config, page)

  if (listBlocks.length === 0)
    return { items: [], ...pageMeta } satisfies SourcePage

  if (config.key === "uuzy") {
    return {
      items: listBlocks.map((block) => normalizeXmlItem(block, config)),
      ...pageMeta,
    } satisfies SourcePage
  }

  const ids = listBlocks
    .map((block) => getXmlTag(block, ["vod_id", "id"]))
    .filter(Boolean)
  if (ids.length === 0) return { items: [], ...pageMeta } satisfies SourcePage

  const detailBody = await fetchBody(buildDetailUrl(config, ids.slice(0, 50)))
  const detailBlocks = extractXmlVideos(detailBody)
  return {
    items: (detailBlocks.length > 0 ? detailBlocks : listBlocks).map((block) =>
      normalizeXmlItem(block, config)
    ),
    ...pageMeta,
  } satisfies SourcePage
}

async function fetchJsonItems(config: SourceConfig, page: number) {
  const listUrl = buildListUrl(config, page)
  const listBody = await fetchBody(listUrl)
  const listPayload = JSON.parse(listBody) as unknown
  const pageMeta = isJsonRecord(listPayload)
    ? parseJsonPageMeta(listPayload, config, page)
    : { page, pageCount: config.supportsPagination ? 0 : 1, totalItems: 0 }
  const listRecords = jsonItems(listPayload)
  if (listRecords.length === 0)
    return { items: [], ...pageMeta } satisfies SourcePage
  const ids = listRecords
    .map((record) => firstJsonValue(record, ["vod_id", "id"]))
    .filter(Boolean)

  if (ids.length === 0) return { items: [], ...pageMeta } satisfies SourcePage

  const detailBody = await fetchBody(buildDetailUrl(config, ids.slice(0, 50)))
  const detailRecords = jsonItems(JSON.parse(detailBody) as unknown)
  return {
    items: (detailRecords.length > 0 ? detailRecords : listRecords).map(
      (record) => normalizeJsonItem(record, config)
    ),
    ...pageMeta,
  } satisfies SourcePage
}

async function fetchSourceItems(config: SourceConfig, page: number) {
  return config.format === "xml"
    ? fetchXmlItems(config, page)
    : fetchJsonItems(config, page)
}

function uniqueItems(items: ResourceItem[]) {
  return [
    ...new Map(
      items.filter((item) => item.sourceId).map((item) => [item.sourceId, item])
    ).values(),
  ]
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

type SyncPageResult = {
  sourceKey: SourceKey
  sourceName: string
  page: number
  pageCount: number
  totalItems: number
  itemsSynced: number
  syncedAt: string
}

type SyncRunRow = {
  source_key: SourceKey
  last_page: number
  last_run_at: string | null
  last_success_at: string | null
  last_error: string | null
  items_synced: number
  sync_mode: "incremental" | "full"
  sync_status: SyncProgressStatus
  next_page: number
  page_count: number | null
  total_items: number | null
  items_synced_total: number
  last_batch_at: string | null
}

const FULL_SYNC_PAGES_PER_BATCH = 5

async function syncSourcePage(
  environment: { DB: D1Database },
  sourceKey: SourceKey,
  page: number
): Promise<SyncPageResult> {
  const config = SOURCE_CONFIGS[sourceKey]
  const startedAt = new Date().toISOString()

  try {
    const sourcePage = await fetchSourceItems(config, page)
    const items = uniqueItems(sourcePage.items)
    const statements = items.map((item) =>
      environment.DB.prepare(
        `INSERT INTO movie_sources (
           source_key, source_name, source_id, title, source_type, source_area,
           source_language, status_note, source_updated_at, poster_url,
           play_lines, detail_url, synced_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(source_key, source_id) DO UPDATE SET
           source_name = excluded.source_name,
           title = excluded.title,
           source_type = excluded.source_type,
           source_area = excluded.source_area,
           source_language = excluded.source_language,
           status_note = excluded.status_note,
           source_updated_at = excluded.source_updated_at,
           poster_url = excluded.poster_url,
           play_lines = excluded.play_lines,
           detail_url = excluded.detail_url,
           synced_at = excluded.synced_at,
           douban_id = COALESCE(movie_sources.douban_id, excluded.douban_id)`
      ).bind(
        item.sourceKey,
        item.sourceName,
        item.sourceId,
        item.title,
        item.sourceType,
        item.area,
        item.language,
        item.note,
        item.sourceUpdatedAt,
        item.posterUrl,
        JSON.stringify(item.playLines),
        item.detailUrl,
        startedAt
      )
    )

    for (const batch of chunks(statements, 50)) {
      await environment.DB.batch(batch)
    }

    await environment.DB.prepare(
      `INSERT INTO source_sync_runs (
         source_key, last_page, last_run_at, last_success_at, last_error,
         items_synced, page_count, total_items, last_batch_at
       ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)
       ON CONFLICT(source_key) DO UPDATE SET
         last_page = excluded.last_page,
         last_run_at = excluded.last_run_at,
         last_success_at = excluded.last_success_at,
         last_error = NULL,
         items_synced = excluded.items_synced,
         page_count = excluded.page_count,
         total_items = excluded.total_items,
         last_batch_at = excluded.last_batch_at`
    )
      .bind(
        sourceKey,
        sourcePage.page,
        startedAt,
        startedAt,
        items.length,
        sourcePage.pageCount || null,
        sourcePage.totalItems || null,
        startedAt
      )
      .run()

    return {
      sourceKey,
      sourceName: config.name,
      page: sourcePage.page,
      pageCount: sourcePage.pageCount,
      totalItems: sourcePage.totalItems,
      itemsSynced: items.length,
      syncedAt: startedAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    try {
      await environment.DB.prepare(
        `INSERT INTO source_sync_runs (
           source_key, last_page, last_run_at, last_error, sync_status
         ) VALUES (?, ?, ?, ?, 'error')
         ON CONFLICT(source_key) DO UPDATE SET
           last_page = excluded.last_page,
           last_run_at = excluded.last_run_at,
           last_error = excluded.last_error,
           sync_status = 'error'`
      )
        .bind(sourceKey, page, startedAt, message.slice(0, 500))
        .run()
    } catch (runError) {
      console.error("Unable to persist source sync failure", runError)
    }

    throw new Error(`${config.name} 同步失败：${message}`)
  }
}

export async function syncSource(
  environment: { DB: D1Database },
  sourceKey: SourceKey,
  page = 1
) {
  return syncSourcePage(environment, sourceKey, Math.max(1, Math.floor(page)))
}

export async function syncAllSources(
  environment: { DB: D1Database },
  options: { page?: number; sourceKey?: SourceKey } = {}
) {
  const page = Math.max(1, Math.floor(options.page ?? 1))
  const keys = options.sourceKey ? [options.sourceKey] : SOURCE_KEYS
  const results: Array<
    | (Awaited<ReturnType<typeof syncSource>> & { ok: true })
    | { ok: false; sourceKey: SourceKey; error: string }
  > = []

  for (const key of keys) {
    try {
      results.push({ ok: true, ...(await syncSource(environment, key, page)) })
    } catch (error) {
      results.push({
        ok: false,
        sourceKey: key,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

async function getSyncRun(
  environment: { DB: D1Database },
  sourceKey: SourceKey
) {
  return environment.DB.prepare(
    `SELECT source_key, last_page, last_run_at, last_success_at, last_error,
            items_synced, sync_mode, sync_status, next_page, page_count,
            total_items, items_synced_total, last_batch_at
       FROM source_sync_runs
      WHERE source_key = ?
      LIMIT 1`
  )
    .bind(sourceKey)
    .first<SyncRunRow>()
}

function emptySyncProgress(sourceKey: SourceKey): SyncProgress {
  return {
    sourceKey,
    sourceName: SOURCE_CONFIGS[sourceKey].name,
    status: "idle",
    nextPage: 1,
    lastPage: 0,
    pageCount: null,
    totalItems: null,
    itemsSyncedTotal: 0,
    lastRunAt: null,
    lastSuccessAt: null,
    lastError: null,
  }
}

function toSyncProgress(
  sourceKey: SourceKey,
  run: SyncRunRow | null
): SyncProgress {
  if (!run) return emptySyncProgress(sourceKey)

  return {
    sourceKey,
    sourceName: SOURCE_CONFIGS[sourceKey].name,
    status: run.sync_status,
    nextPage: run.next_page,
    lastPage: run.last_page,
    pageCount: run.page_count,
    totalItems: run.total_items,
    itemsSyncedTotal: run.items_synced_total,
    lastRunAt: run.last_run_at,
    lastSuccessAt: run.last_success_at,
    lastError: run.last_error,
  }
}

export async function getSyncProgress(
  environment: { DB: D1Database },
  sourceKey?: SourceKey
) {
  const keys = sourceKey ? [sourceKey] : SOURCE_KEYS
  return Promise.all(
    keys.map(async (key) =>
      toSyncProgress(key, await getSyncRun(environment, key))
    )
  )
}

async function setFullSyncRun(
  environment: { DB: D1Database },
  sourceKey: SourceKey,
  reset: boolean
) {
  const now = new Date().toISOString()
  const run = await getSyncRun(environment, sourceKey)

  if (reset || !run || run.sync_status === "completed") {
    await environment.DB.prepare(
      `INSERT INTO source_sync_runs (
         source_key, last_page, last_run_at, last_success_at, last_error,
         items_synced, sync_mode, sync_status, next_page, page_count,
         total_items, items_synced_total, last_batch_at
       ) VALUES (?, 0, ?, NULL, NULL, 0, 'full', 'running', 1, NULL, NULL, 0, NULL)
       ON CONFLICT(source_key) DO UPDATE SET
         last_page = 0,
         last_run_at = excluded.last_run_at,
         last_error = NULL,
         sync_mode = 'full',
         sync_status = 'running',
         next_page = 1,
         page_count = NULL,
         total_items = NULL,
         items_synced_total = 0,
         last_batch_at = NULL`
    )
      .bind(sourceKey, now)
      .run()
    return
  }

  if (run.sync_status !== "running") {
    await environment.DB.prepare(
      `UPDATE source_sync_runs
          SET sync_mode = 'full',
              sync_status = 'running',
              last_run_at = ?,
              last_error = NULL
        WHERE source_key = ?`
    )
      .bind(now, sourceKey)
      .run()
  }
}

async function updateFullSyncProgress(
  environment: { DB: D1Database },
  sourceKey: SourceKey,
  values: {
    status: SyncProgressStatus
    nextPage: number
    pageCount: number | null
    totalItems: number | null
    itemsSyncedTotal: number
    error?: string | null
  }
) {
  await environment.DB.prepare(
    `UPDATE source_sync_runs
        SET sync_status = ?,
            sync_mode = 'full',
            next_page = ?,
            page_count = ?,
            total_items = ?,
            items_synced_total = ?,
            last_error = ?
      WHERE source_key = ?`
  )
    .bind(
      values.status,
      values.nextPage,
      values.pageCount,
      values.totalItems,
      values.itemsSyncedTotal,
      values.error ?? null,
      sourceKey
    )
    .run()
}

export async function processFullSyncBatch(
  environment: { DB: D1Database },
  options: { sourceKeys?: SourceKey[]; pagesPerSource?: number } = {}
) {
  const keys = options.sourceKeys ?? SOURCE_KEYS
  const pagesPerSource = Math.max(
    1,
    Math.min(5, Math.floor(options.pagesPerSource ?? FULL_SYNC_PAGES_PER_BATCH))
  )
  const results: Array<SyncProgress & { ok: boolean; pagesProcessed: number }> =
    []

  for (const key of keys) {
    const run = await getSyncRun(environment, key)
    if (!run || run.sync_status !== "running") {
      results.push({ ...toSyncProgress(key, run), ok: true, pagesProcessed: 0 })
      continue
    }

    let nextPage = Math.max(1, run.next_page)
    let pageCount = run.page_count
    let totalItems = run.total_items
    let itemsSyncedTotal = run.items_synced_total
    let status: SyncProgressStatus = "running"
    let error: string | null = null
    let pagesProcessed = 0

    for (; pagesProcessed < pagesPerSource; pagesProcessed += 1) {
      if (pageCount && nextPage > pageCount) {
        status = "completed"
        nextPage = 1
        break
      }

      try {
        const pageResult = await syncSourcePage(environment, key, nextPage)
        pageCount = pageResult.pageCount || pageCount
        totalItems = pageResult.totalItems || totalItems
        itemsSyncedTotal += pageResult.itemsSynced

        const reachedEnd =
          pageResult.itemsSynced === 0 ||
          Boolean(pageCount && nextPage >= pageCount)

        if (reachedEnd) {
          status = "completed"
          nextPage = 1
          pagesProcessed += 1
          break
        }

        nextPage += 1
        await updateFullSyncProgress(environment, key, {
          status,
          nextPage,
          pageCount,
          totalItems,
          itemsSyncedTotal,
        })
      } catch (syncError) {
        status = "error"
        error =
          syncError instanceof Error ? syncError.message : String(syncError)
        break
      }
    }

    if (status === "error") {
      await updateFullSyncProgress(environment, key, {
        status,
        nextPage,
        pageCount,
        totalItems,
        itemsSyncedTotal,
        error,
      })
    } else {
      await updateFullSyncProgress(environment, key, {
        status,
        nextPage,
        pageCount,
        totalItems,
        itemsSyncedTotal,
      })
    }

    results.push({
      ...toSyncProgress(key, await getSyncRun(environment, key)),
      ok: status !== "error",
      pagesProcessed,
    })
  }

  return results
}

export async function startFullSync(
  environment: { DB: D1Database },
  sourceKey?: SourceKey
) {
  const keys = sourceKey ? [sourceKey] : SOURCE_KEYS
  for (const key of keys) await setFullSyncRun(environment, key, true)
  return processFullSyncBatch(environment, { sourceKeys: keys })
}

export async function runScheduledSync(environment: { DB: D1Database }) {
  for (const key of SOURCE_KEYS) await setFullSyncRun(environment, key, false)
  return processFullSyncBatch(environment)
}
