# xwxy-site

xwxy.dpdns.org 的网站源码。Next.js + TypeScript + Tailwind CSS + shadcn/ui + Motion。

## 页面

| 路由 | 内容 |
|------|------|
| `/` | 首页：应用导航卡片 |
| `/rank` | 影视排行榜（腾讯 / 爱奇艺 / 优酷 / 动漫） |
| `/phone` | 手机比价（OPPO Find X10 E） |
| `/game` | 后院保卫战（canvas 塔防小游戏） |
| `/music` | 音乐教室（调音器 / 钢琴 / 新手教程 / 网红谱 / 互动跟学 / 谱子导入） |

## 技术栈

- **前端**：Next.js 16（App Router，静态导出）+ TypeScript + Tailwind CSS 4 + shadcn/ui 风格组件 + Motion 动画
- **后端**：谱子/课程 API 走 Cloudflare Worker（`xwxy-site`）+ KV；需要数据库、后台登录时再接 Supabase
- **AI 编程**：Cursor
- **部署**：Cloudflare Pages（`xwxy-files`），域名 `xwxy.dpdns.org` 由 Worker 转发

## 本地开发

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 静态导出到 out/
```

## 每小时自动更新（价格数据）

手机比价的价格数据在 `src/data/prices.ts`（顶部有 ★ 标记），只改 `PRICE_DATA` 里的
`price / guobu / note / updated` 即可，页面自动重排。榜单数据在 `src/data/rankings.ts`。

## 目录结构

```
src/
  app/            # 路由：page, rank, phone, game, music
  components/
    ui/           # shadcn 风格基础组件（button, card）
    music/        # 音乐教室各面板（调音器/钢琴/跟学/导入）
    site-shell.tsx  # 侧边栏导航布局
  data/           # 榜单、价格、歌曲、和弦、课程数据
  game/           # 后院保卫战游戏引擎（TypeScript）
  lib/            # 音频引擎、工具函数
public/posters/   # 影视榜单海报
```

## 部署说明

1. Cloudflare Pages 项目 `xwxy-files` 连接本仓库，构建命令 `npm run build`，输出目录 `out`，推送即自动部署。
2. Worker `xwxy-site` 负责把 `xwxy.dpdns.org` 的 `/` `/phone` `/game` `/music` `/rank` `/posters/*` 转发到 Pages，`/api/*` 走 Worker 自己的 KV 接口。
