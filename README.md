# MOVIE

一个 Netflix 风格的影视发现网站，基于 Next.js App Router、React、Tailwind CSS、shadcn/ui、Cloudflare Workers 和 D1 构建。

线上地址：<https://movie.71954466.workers.dev>

## 当前功能

- Netflix 风格固定导航、沉浸式 Hero 和横向影片片单
- 影片分类筛选：科幻、动作、剧情、悬疑、爱情
- 影片搜索、详情 Dialog、响应式移动端搜索
- D1 影片列表、影片详情和健康检查 API
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
components/movie-home.tsx         Netflix 风格客户端体验
components/ui/                     shadcn/ui 官方组件源码
lib/movies.ts                      影片类型、fallback 数据和分组逻辑
migrations/                        D1 schema 与种子数据
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
```

影片封面使用远程图片 URL；当前未启用 Cloudflare Images，后续可以按需要增加图片绑定和后台内容管理。
