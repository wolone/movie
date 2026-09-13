# MOVIE

一个 Netflix 风格的影视发现网站，基于 Next.js App Router、React、Tailwind CSS、shadcn/ui、Cloudflare Workers 和 D1 构建。

线上地址：<https://movie.71954466.workers.dev>

## 当前功能

- Netflix 风格固定导航、沉浸式 Hero 和横向影片片单
- 影片分类筛选：科幻、动作、剧情、悬疑、爱情
- 影片搜索、详情 Dialog、响应式移动端搜索
- D1 影片列表、影片详情和健康检查 API
- 三个资源站的元数据与外部播放链接同步：西瓜资源、无水印资源网、UUZY
- ApiZero 生产环境豆瓣资料同步，支持将资源站记录映射到豆瓣 ID
- Cloudflare Cron 分批推进三个资源站的全量同步任务：西瓜每 5 分钟处理 15 页，无水印每 5 分钟处理 20 页，UUZY 每分钟处理 1 页，支持 D1 游标断点续传
- D1 同步租约避免 Cron 与后台手动操作同时处理同一资源站；异常执行会在租约过期后自动恢复
- UUZY 会优先重试非 Trailer 资源的空播放列表，并保护已有有效播放地址不被瞬时空响应覆盖
- Skeleton 加载态和 D1 不可用时的本地 fallback 数据
- shadcn/ui 官方 Base UI 组件：Button、Badge、Card、Dialog、Input、ScrollArea、Skeleton、Separator、ToggleGroup

现有 shadcn/ui 组件只通过官方 CLI 添加和组合使用，未修改已有官方 Button 源文件。

## 技术结构

```text
app/
  page.tsx                         首页入口
  api/health/route.ts              D1 健康检查
  api/movies/route.ts              影片列表、搜索、分类 API
  api/movies/[slug]/route.ts       影片详情 API
  api/sync/route.ts                资源站同步入口
  api/catalog/sync/route.ts        ApiZero 豆瓣资料同步与资源映射
  api/sources/route.ts             资源站同步状态
components/movie-home.tsx         Netflix 风格客户端体验
components/ui/                     shadcn/ui 官方组件源码
lib/douban.ts                     ApiZero 豆瓣资料适配器
lib/catalog-sync.ts               豆瓣资料与资源站映射
lib/resource-sources.ts            三个资源站采集适配器
lib/movies.ts                      影片类型、fallback 数据和分组逻辑
migrations/                        D1 schema 与种子数据
worker/index.ts                    vinext 请求处理与 Cron 入口
vite.config.ts                    vinext + Cloudflare Vite 配置
wrangler.jsonc                    Workers 与 D1 绑定配置
```

## 本地开发

```bash
pnpm install
pnpm dev:vinext
```

打开 <http://localhost:3001>。

如果需要重建本地 D1：

```bash
pnpm wrangler d1 migrations apply movie --local
```

## 验证与部署

```bash
pnpm typecheck
pnpm lint
pnpm build:vinext
pnpm start:vinext
pnpm run deploy:vinext
```

生产 D1 migration：

```bash
pnpm wrangler d1 migrations apply movie --remote
```

ApiZero 资料接口按当前生产配置直接使用公开接口，不需要额外 API Key。

当前 Cloudflare 资源：

- Worker：`movie`
- D1：`movie`
- D1 binding：`DB`
- 线上 Worker：<https://movie.71954466.workers.dev>

## API

```text
GET /api/health
GET /api/movies?q=dune&category=科幻
GET /api/movies/:slug
GET /api/sources
GET /api/sources?source=wsyzy&q=丰臣
GET /api/sources?source=wsyzy&mapped=unmapped
GET /api/sync
POST /api/sync?source=xigua&page=1
POST /api/sync?mode=full&source=xigua
POST /api/sync?mode=full
POST /api/sync?mode=pause&source=xigua
POST /api/sync?mode=resume&source=xigua
POST /api/catalog/sync
```

资源管理页面：<https://movie.71954466.workers.dev/admin>。页面提供“全量同步当前”和“全量同步全部”按钮，任务会分批执行并显示进度，也可以对单个资源站暂停和继续。

重复调用 `mode=full` 不会重置正在运行的任务，会从当前游标继续；已暂停的任务保持暂停，需要调用 `mode=resume`；只有已完成的任务才会开启下一轮全量同步。

调用 `POST /api/sync?mode=full`（不指定资源站）只会初始化三个资源站的全量任务，不在同一个 Worker 请求中串行抓取三站；之后由各自 Cron 按独立频率推进。指定 `source` 时仍会立即处理该资源站的一个批次。

Cron 和后台手动同步可以同时触发，但同一资源站同一时间只会由一个批次持有 D1 同步租约；另一个批次会跳过该资源站，等待下一次 Cron 继续。租约默认两分钟，Worker 异常退出后会自动过期，不会永久阻塞同步。

手动分页同步也共享同一租约；如果该资源站正由全量批次处理，接口返回 HTTP 409，等待当前批次完成后再重试。

`/api/sync` 为公开的手动同步入口。`/api/catalog/sync` 接收以下 JSON：

```json
{
  "doubanId": "1292052",
  "sourceKey": "xigua",
  "sourceId": "77137"
}
```

三个资源站不提供稳定的豆瓣 ID，ApiZero 当前公开接口也按豆瓣 ID 或豆瓣 URL查询，因此资源采集与豆瓣关联是两个步骤，不会在生产环境做未经确认的标题猜测。西瓜资源和无水印资源网会依据接口返回的 `pagecount` 分页同步，西瓜每个 Cron 批次最多处理 15 页、每 5 分钟错峰触发；无水印资源网每个 Cron 批次最多处理 20 页、每 5 分钟触发。西瓜列表和详情接口使用 `pagesize=50` 减少全量扫描页数；UUZY 的 API 虽然返回 `pagecount`，但忽略 `pg` 参数，采集器因此改用 UUZY 网站的 `?page=` 分页并抓取详情页播放链接。为控制 Worker 上游请求数，UUZY 每个批次处理 1 页，但以每分钟独立触发，仍不与无水印资源网共享同一个 Worker 调用配额。

资源同步使用按字段比较的幂等 UPSERT，未变化的资源不会重复写入 D1；首次全量导入仍可能跨多个 UTC 日完成。Cloudflare Workers Free 计划每天包含 100,000 行 D1 写入，达到额度后需等待 UTC 零点重置或升级 Workers Paid 计划。

`GET /api/sources?source=<sourceKey>` 可以分页查看已采集资源的标题、`sourceId` 和播放链接；拿到确认过的资源 ID 后，再调用 `/api/catalog/sync` 完成豆瓣映射。

UUZY 详情页偶发请求失败时，采集器不会用空播放列表覆盖已有播放地址；每个 UUZY Cron 批次还会优先重试最多 3 条非 Trailer 的空播放资源。详情页持续不可用的资源会保留在待重试状态，并由后续批次继续处理。

本项目只保存资源站公开返回的影片元数据和外部播放 URL，不下载、复制或代理视频文件。使用者需要自行确认资源站内容、播放链接及相关图片拥有合法使用权，并遵守各服务的条款。

影片封面使用远程图片 URL；当前未启用 Cloudflare Images，后续可以按需要增加图片绑定和后台内容管理。
