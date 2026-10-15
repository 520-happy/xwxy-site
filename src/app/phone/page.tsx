"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { PRICE_DATA, type Platform } from "@/data/prices";
import { cn } from "@/lib/utils";

type Filter = "all" | "guobu" | "real";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "全部平台" },
  { id: "guobu", label: "有国补优惠" },
  { id: "real", label: "实查价格" },
];

function fmt(n: number) {
  return "¥" + n.toLocaleString("zh-CN");
}

function PlatformCard({ p, isBest, index }: { p: Platform; isBest: boolean; index: number }) {
  return (
    <motion.a
      href={p.url}
      target="_blank"
      rel="noopener"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        "glass group relative block overflow-hidden rounded-[20px] p-5 transition-all hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(46,125,79,0.15)]",
        isBest && "border-2 !border-accent"
      )}
    >
      {isBest && (
        <span className="absolute -right-8 top-3.5 rotate-[38deg] bg-accent px-9 py-1 text-xs font-medium text-white">
          最低价
        </span>
      )}
      <div className="mb-3.5 flex items-center gap-3">
        <div
          className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full text-[19px] font-bold text-white"
          style={{ background: p.color }}
        >
          {p.name[0]}
        </div>
        <div>
          <div className="text-base font-medium">{p.name}</div>
          {p.sub && <div className="mt-0.5 text-xs text-fog">{p.sub}</div>}
        </div>
        <span
          className={cn(
            "ml-auto flex-none rounded-full px-3 py-1 text-xs",
            p.type === "real" ? "bg-[#e6f4ea] text-accent" : "bg-[#fef7e0] text-[#b06000]"
          )}
        >
          {p.type === "real" ? "✓ 实查" : "估算"}
        </span>
      </div>
      <div className="mb-1.5 text-[32px] font-medium">
        {p.priceLabel ?? fmt(p.price)} <small className="text-sm font-normal text-fog">元</small>
      </div>
      <div className="mb-2 min-h-[18px] text-[13px] text-accent">{p.guobu}</div>
      <div className="mb-3.5 min-h-[42px] text-[13px] leading-6 text-fog">{p.note}</div>
      <div className="flex items-center justify-between border-t border-white/80 pt-3 text-sm font-medium text-accent">
        <span>去看看</span>
        <span className="transition-transform group-hover:translate-x-[5px]">→</span>
      </div>
    </motion.a>
  );
}

export default function PhonePage() {
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(() => {
    const arr = [...PRICE_DATA.platforms].filter((p) =>
      filter === "all" ? true : filter === "guobu" ? !!p.guobu : p.type === "real"
    );
    arr.sort((a, b) => a.price - b.price);
    return arr;
  }, [filter]);

  const minPrice = Math.min(...PRICE_DATA.platforms.map((p) => p.price));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/80 bg-white/60 backdrop-blur-[20px] backdrop-saturate-[1.5]">
        <div className="mx-auto flex max-w-[1080px] items-center gap-3.5 px-5 py-3">
          <Link
            href="/"
            className="btn-pill inline-flex items-center gap-1.5 px-4 py-2 text-sm text-fog"
          >
            🏠 首页
          </Link>
          <h1 className="text-lg font-medium">Find X10 E 比价</h1>
          <span className="ml-auto text-xs text-fog">
            价格核对：{PRICE_DATA.updated}（每小时核对）
          </span>
        </div>
      </header>

      <main className="relative z-[1] mx-auto max-w-[1080px] px-5 pb-[60px] pt-7">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mb-6 flex flex-wrap items-center gap-6 rounded-3xl p-8"
        >
          <div className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-[22px] bg-gradient-to-br from-[#3cb371] to-[#2e8b57] text-[42px] shadow-[0_8px_20px_rgba(46,158,99,0.35)]">
            📱
          </div>
          <div className="min-w-[240px] flex-1">
            <h2 className="mb-2 text-[28px] font-medium">OPPO Find X10 E</h2>
            <div className="mb-3.5 flex flex-wrap gap-2">
              {["16GB + 512GB", "2026-09-24 开售", "10 个平台"].map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-[rgba(120,210,155,0.5)] bg-[#dff3e6] px-3.5 py-[5px] text-[13px] text-accent-deep"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-7">
              <div>
                <div className="mb-1 text-[13px] text-fog">官方定价</div>
                <div className="text-[30px] font-medium">
                  ¥5,499 <small className="text-[15px] font-normal text-fog">元</small>
                </div>
              </div>
              <div>
                <div className="mb-1 text-[13px] text-fog">国补到手参考</div>
                <div className="text-[30px] font-medium text-accent">
                  ¥4,999 <small className="text-[15px] font-normal text-fog">元起</small>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="mb-[18px] mt-[26px] flex flex-wrap gap-2.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn("btn-pill px-5 py-2 text-sm text-fog", filter === f.id && "active !text-white")}
            >
              {f.label}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <PlatformCard key={p.name} p={p} isBest={p.price === minPrice} index={i} />
          ))}
        </section>

        <section className="glass mt-7 rounded-[20px] p-6 text-[13px] leading-8 text-fog">
          <b className="text-ink">💡 关于价格：</b>
          标注「实查」为公开渠道可验证的价格；标注「估算」为根据官方价与新机渠道惯例推算（部分平台需登录才显示实时价，未登录实查），仅供参考，下单前请以各平台页面实时价格为准。
          <br />
          <b className="text-ink">🔒 关于登录：</b>
          “去看看”会在新窗口打开该平台的官方页面，账号密码只在平台自己的页面输入，本站不经手、不保存。
        </section>
      </main>
    </div>
  );
}
