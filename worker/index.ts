import handler from "vinext/server/fetch-handler"
import { runWithExecutionContext } from "vinext/shims/request-context"

import { runScheduledSync, type SourceKey } from "../lib/resource-sources"

const XIGUA_CRON = "2-59/5 * * * *"
const LEGACY_XIGUA_CRON = "*/15 * * * *"
const WSYZY_CRON = "*/5 * * * *"
const UUZY_CRON = "* * * * *"

const SOURCE_KEYS_BY_CRON: Record<string, SourceKey[]> = {
  [XIGUA_CRON]: ["xigua"],
  [LEGACY_XIGUA_CRON]: ["xigua"],
  [WSYZY_CRON]: ["wsyzy"],
  [UUZY_CRON]: ["uuzy"],
}

let d1WriteLimitDate: string | null = null

function utcDateNow() {
  return new Date().toISOString().slice(0, 10)
}

function isD1DailyWriteLimitError(error: unknown) {
  return String(error).includes("free tier daily row write limit")
}

const worker = {
  fetch(
    request: Request,
    environment: CloudflareEnv,
    context: ExecutionContext
  ) {
    return runWithExecutionContext(context, () =>
      handler.fetch(request, environment, context)
    )
  },

  async scheduled(controller: ScheduledController, environment: CloudflareEnv) {
    const startedAt = Date.now()
    const sourceKeys = SOURCE_KEYS_BY_CRON[controller.cron] ?? []

    if (sourceKeys.length === 0) {
      console.error("resource sync cron has no source mapping", {
        cron: controller.cron,
      })
      return
    }

    const utcDate = utcDateNow()
    if (d1WriteLimitDate === utcDate) return

    try {
      const results = await runScheduledSync(environment, sourceKeys)
      const summary = results.map((result) => ({
        sourceKey: result.sourceKey,
        status: result.status,
        ok: result.ok,
        pagesProcessed: result.pagesProcessed,
        nextPage: result.nextPage,
        lastPage: result.lastPage,
        lastError: result.lastError,
      }))
      const logPayload = {
        cron: controller.cron,
        scheduledTime: new Date(controller.scheduledTime).toISOString(),
        durationMs: Date.now() - startedAt,
        sourceKeys,
        failedSources: summary
          .filter((result) => !result.ok)
          .map((result) => result.sourceKey),
        results: summary,
      }

      if (logPayload.failedSources.length > 0) {
        console.error("resource sync cron completed with errors", logPayload)
      } else {
        console.log("resource sync cron completed", logPayload)
      }
    } catch (error) {
      if (isD1DailyWriteLimitError(error)) {
        d1WriteLimitDate = utcDate
        console.error("resource sync paused until the next UTC day", {
          cron: controller.cron,
          scheduledTime: new Date(controller.scheduledTime).toISOString(),
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : String(error),
        })
        return
      }

      console.error("resource sync cron failed", {
        cron: controller.cron,
        scheduledTime: new Date(controller.scheduledTime).toISOString(),
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },
}

export default worker
