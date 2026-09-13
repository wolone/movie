import handler from "vinext/server/fetch-handler"
import { runWithExecutionContext } from "vinext/shims/request-context"

import { runScheduledSync, type SourceKey } from "../lib/resource-sources"

const XIGUA_CRON = "2-59/5 * * * *"
const WSYZY_CRON = "*/5 * * * *"
const UUZY_CRON = "* * * * *"

const SOURCE_KEYS_BY_CRON: Record<string, SourceKey[]> = {
  [XIGUA_CRON]: ["xigua"],
  [WSYZY_CRON]: ["wsyzy"],
  [UUZY_CRON]: ["uuzy"],
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
