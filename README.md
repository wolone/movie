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
- Cloudflare Cron 每 15 分钟同步一次资源首页
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

生产环境密钥通过 Cloudflare Secret 注入，不写入仓库：

```bash
pnpm wrangler secret put DOUBAN_API_KEY
pnpm wrangler secret put SYNC_SECRET
pnpm wrangler secret put CATALOG_SYNC_SECRET
```

`DOUBAN_API_KEY` 用于 ApiZero 豆瓣资料服务；没有密钥时仅适合本地调试或 ApiZero 的匿名额度。同步接口在生产环境必须配置对应的 Secret。

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
POST /api/sync?source=xigua&page=1
POST /api/catalog/sync
```

`/api/sync` 使用 `Authorization: Bearer <SYNC_SECRET>` 或 `X-Sync-Secret`。`/api/catalog/sync` 接收以下 JSON，并使用 `CATALOG_SYNC_SECRET`：

```json
{
  "doubanId": "1292052",
  "sourceKey": "xigua",
  "sourceId": "77137"
}
```

三个资源站不提供稳定的豆瓣 ID，ApiZero 当前公开接口也按豆瓣 ID 或豆瓣 URL查询，因此资源采集与豆瓣关联是两个步骤，不会在生产环境做未经确认的标题猜测。UUZY 当前接口行为只稳定返回首页，定时任务因此只同步每个资源站的第 1 页；需要更多页时可手动传入 `page`。

本项目只保存资源站公开返回的影片元数据和外部播放 URL，不下载、复制或代理视频文件。使用者需要自行确认资源站内容、播放链接及相关图片拥有合法使用权，并遵守各服务的条款。

影片封面使用远程图片 URL；当前未启用 Cloudflare Images，后续可以按需要增加图片绑定和后台内容管理。
