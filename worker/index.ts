import handler from "vinext/server/fetch-handler"
import { runWithExecutionContext } from "vinext/shims/request-context"

import { runScheduledSync } from "../lib/resource-sources"

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

    try {
      const results = await runScheduledSync(environment)
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
