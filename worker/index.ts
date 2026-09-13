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

  async scheduled(
    _controller: ScheduledController,
    environment: CloudflareEnv
  ) {
    await runScheduledSync(environment)
  },
}

export default worker
