"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SiteShell } from "@/components/site-shell";
import { ColorBlockAnimation } from "@/components/color-block-animation";

const CARDS = [
  {
    href: "/phone",
    icon: "📱",
    iconBg: "#dff3e6",
    title: "手机比价",
    desc: "OPPO Find X10 E（16GB+512GB）各平台到手价，一小时核对一次。",
    go: "查看比价",
  },
  {
    href: "/game",
    icon: "🌻",
    iconBg: "#e6f4ea",
    title: "后院保卫战",
    desc: "种植物、挡僵尸的塔防小游戏。向日葵产阳光，豌豆射手开火，撑过 10 波进攻！",
    go: "开始游戏",
  },
  {
    href: "/music",
    icon: "🎸",
    iconBg: "#dff3e6",
    title: "音乐教室",
    desc: "吉他调音器、变调夹、钢琴、新手教程、抖音网红谱，还能导入自己的谱子。",
    go: "开始学琴",
  },
  {
    href: "/rank",
    icon: "📺",
    iconBg: "#e8f7ee",
    title: "影视排行榜",
    desc: "腾讯视频、爱奇艺、优酷电视剧热播榜 + 动漫榜，附海报，看看最近大家在追什么。",
    go: "查看榜单",
  },
  {
    href: "https://pansou.de",
    icon: "🔍",
    iconBg: "#e8f7ee",
    title: "盘搜",
    desc: "夸克网盘资源搜索，找你想要的资源。",
    go: "去搜索",
    external: true,
  },
];

export default function HomePage() {
  return (
    <SiteShell>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass mb-6 rounded-3xl p-8"
      >
        <h1 className="mb-2 text-[28px] font-semibold">👋 欢迎来到 xwxy</h1>
        <p className="text-sm text-fog">左侧选一个标签，开始游览</p>
        {/* 彩色小方块游走动画：装饰区，给足舞台让队形舒展 */}
        <ColorBlockAnimation className="mt-5 h-64 w-full sm:h-72" />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c, i) => {
          const inner = (
            <>
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
                style={{ background: c.iconBg }}
              >
                {c.icon}
              </div>
              <h2 className="mb-2 text-lg font-semibold">{c.title}</h2>
              <p className="mb-4 min-h-[48px] text-[13px] leading-6 text-fog">{c.desc}</p>
              <div className="flex items-center justify-between border-t border-white/80 pt-3 text-sm font-medium text-accent">
                <span>{c.go}</span>
                <motion.span
                  className="inline-block"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  →
                </motion.span>
              </div>
            </>
          );
          const cls =
            "glass group rounded-[20px] p-6 text-left transition-all hover:-translate-y-1 hover:border-[rgba(120,210,155,0.7)] hover:shadow-[0_14px_30px_rgba(46,125,79,0.15)]";
          return (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              {c.external ? (
                <a href={c.href} target="_blank" rel="noopener" className={cls + " block h-full"}>
                  {inner}
                </a>
              ) : (
                <Link href={c.href} className={cls + " block h-full"}>
                  {inner}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      <footer className="mt-8 text-center text-xs text-fog-light">
        xwxy.dpdns.org · 点击卡片进入对应页面
      </footer>
    </SiteShell>
  );
}
