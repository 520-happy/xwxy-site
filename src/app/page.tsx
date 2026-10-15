"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight, Clapperboard, Smartphone, Sprout, Guitar, FolderSearch, type LucideIcon } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ColorBlockAnimation } from "@/components/color-block-animation";
import { PhoneIll, GameIll, MusicIll, RankIll, SearchIll } from "@/components/illustrations";

interface AppEntry {
  href: string;
  title: string;
  sub: string;
  cta: string;
  Icon: LucideIcon;
  Ill: ComponentType<{ className?: string }>;
  /** 卡片顶部视觉区渐变 */
  visual: string;
  iconTile: string;
}

const APPS: AppEntry[] = [
  {
    href: "/phone",
    title: "手机比价",
    sub: "多平台价格，一眼看清",
    cta: "查看比价",
    Icon: Smartphone,
    Ill: PhoneIll,
    visual: "linear-gradient(135deg,#e4ebff 0%,#f2f5ff 60%,#e9f0ff 100%)",
    iconTile: "bg-[#e4ebff] text-[#3b53c9]",
  },
  {
    href: "/game",
    title: "后院保卫战",
    sub: "种植物、挡僵尸，守住你的后院",
    cta: "开始游戏",
    Icon: Sprout,
    Ill: GameIll,
    visual: "linear-gradient(135deg,#ddf3e5 0%,#f0faf3 60%,#e2f5e9 100%)",
    iconTile: "bg-[#ddf3e5] text-[#2e7d4f]",
  },
  {
    href: "/music",
    title: "音乐教室",
    sub: "调音、和弦与新手教程",
    cta: "开始学琴",
    Icon: Guitar,
    Ill: MusicIll,
    visual: "linear-gradient(135deg,#ece4ff 0%,#f6f1ff 60%,#eee7ff 100%)",
    iconTile: "bg-[#ece4ff] text-[#6f42d8]",
  },
  {
    href: "/rank",
    title: "影视排行榜",
    sub: "热播剧集与动漫榜单",
    cta: "查看榜单",
    Icon: Clapperboard,
    Ill: RankIll,
    visual: "linear-gradient(135deg,#fdeecd 0%,#fdf6e8 60%,#fbeed3 100%)",
    iconTile: "bg-[#fdeecd] text-[#b07a1e]",
  },
  {
    href: "https://pansou.de",
    title: "盘搜",
    sub: "快速搜索网盘资源",
    cta: "去搜索",
    Icon: FolderSearch,
    Ill: SearchIll,
    visual: "linear-gradient(135deg,#d9effa 0%,#eef8fd 60%,#ddf0fa 100%)",
    iconTile: "bg-[#d9effa] text-[#2b7fb8]",
  },
];

function AppCard({ app, index, external }: { app: AppEntry; index: number; external?: boolean }) {
  const inner = (
    <>
      <div
        className="relative flex h-32 items-center justify-center overflow-hidden"
        style={{ background: app.visual }}
      >
        <app.Ill className="h-[72px] w-[72px] transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-110" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${app.iconTile}`}>
            <app.Icon size={18} strokeWidth={2.1} aria-hidden="true" />
          </span>
          <h2 className="text-[16.5px] font-semibold text-ink">{app.title}</h2>
        </div>
        <p className="mb-4 text-[13.5px] leading-6 text-fog">{app.sub}</p>
        <div className="mt-auto flex items-center justify-between border-t border-line/80 pt-3.5 text-sm font-medium text-accent-deep">
          <span>{app.cta}</span>
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
          />
        </div>
      </div>
    </>
  );
  const cls =
    "card-lift group flex flex-col overflow-hidden rounded-[20px] border border-line/90 bg-white/85 shadow-card animate-fade-up";
  const style = { animationDelay: `${0.35 + index * 0.08}s` };
  return external ? (
    <a href={app.href} target="_blank" rel="noopener" className={cls} style={style} aria-label={`${app.title}（新窗口打开）`}>
      {inner}
    </a>
  ) : (
    <Link href={app.href} className={cls} style={style} aria-label={app.title}>
      {inner}
    </Link>
  );
}

export default function HomePage() {
  return (
    <SiteShell>
      {/* ---------- 欢迎横幅 ---------- */}
      <section
        aria-label="欢迎"
        className="relative mb-7 overflow-hidden rounded-[28px] border border-white/70 shadow-card"
      >
        {/* 底：蓝紫柔和渐变 */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(118deg,#e9edff 0%,#f2eaff 48%,#e3f0ff 100%)" }}
          aria-hidden="true"
        />
        {/* 光斑：缓慢漂移 */}
        <div
          className="animate-blob absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#b9c8ff]/45 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="animate-blob absolute -bottom-24 right-[8%] h-72 w-72 rounded-full bg-[#d3bdff]/45 blur-3xl"
          style={{ animationDelay: "-9s", animationDuration: "22s" }}
          aria-hidden="true"
        />

        <div className="relative grid items-center gap-6 p-7 sm:p-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span
              className="animate-fade-up mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3.5 py-1.5 text-xs font-medium text-accent-deep shadow-sm backdrop-blur"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#5b7cfa] to-[#8b5cf6]" aria-hidden="true" />
              XWXY · 个人工具导航
            </span>
            <h1
              className="animate-fade-up mb-3 text-[34px] font-extrabold leading-tight tracking-tight text-ink sm:text-[40px]"
              style={{ animationDelay: "0.08s" }}
            >
              你的数字空间
            </h1>
            <p
              className="animate-fade-up mb-2 text-[16px] font-medium text-fog"
              style={{ animationDelay: "0.16s" }}
            >
              常用工具与兴趣，一站直达。
            </p>
            <p
              className="animate-fade-up mb-7 text-[14px] leading-7 text-fog"
              style={{ animationDelay: "0.22s" }}
            >
              把喜欢的工具，放在一起。
            </p>
            <a
              href="#apps"
              className="btn-primary animate-fade-up inline-flex items-center gap-2 px-7 py-3 text-[15px]"
              style={{ animationDelay: "0.3s" }}
            >
              开始探索
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>

          {/* 漂浮几何元素：彩色小方块游走动画 */}
          <div
            className="animate-fade-up relative rounded-[20px] border border-white/70 bg-white/45 shadow-[inset_0_1px_0_rgb(255_255_255/0.8)] backdrop-blur-sm"
            style={{ animationDelay: "0.24s" }}
            aria-hidden="true"
          >
            <ColorBlockAnimation className="h-52 w-full sm:h-60" />
          </div>
        </div>
      </section>

      {/* ---------- 应用卡片 ---------- */}
      <section id="apps" aria-label="应用">
        <div className="animate-fade-up mb-4 flex items-end justify-between" style={{ animationDelay: "0.3s" }}>
          <div>
            <h2 className="text-[20px] font-bold text-ink">应用</h2>
            <p className="mt-1 text-[13px] text-fog">点一张卡片，进入对应功能</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app, i) => (
            <AppCard key={app.title} app={app} index={i} external={app.href.startsWith("http")} />
          ))}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-fog-light">
        xwxy.dpdns.org · 你的数字空间
      </footer>
    </SiteShell>
  );
}
