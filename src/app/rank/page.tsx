"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SiteShell } from "@/components/site-shell";
import { RANKINGS, RANK_UPDATED, type RankItem } from "@/data/rankings";
import { cn } from "@/lib/utils";

function RankCard({ item, index }: { item: RankItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      className="glass group overflow-hidden rounded-[18px] transition-all hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(79,109,245,0.15)]"
    >
      <div className="relative">
        <span
          className={cn(
            "absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold text-white",
            index < 3 ? "bg-gradient-to-br from-[#5b7cfa] to-[#7a5cf8]" : "bg-black/50"
          )}
        >
          {index + 1}
        </span>
        {item.img ? (
          <img
            src={item.img}
            alt={item.title}
            loading="lazy"
            className="aspect-[3/4] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-white/40 text-4xl">
            📺
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="mb-1 text-[15px] font-semibold leading-6">{item.title}</h3>
        {item.actors && <div className="mb-1 text-xs text-fog">{item.actors}</div>}
        {item.desc && <div className="mb-1.5 text-xs leading-5 text-fog-light">{item.desc}</div>}
        {item.heat && <div className="text-xs font-medium text-accent">🔥 {item.heat}</div>}
      </div>
    </motion.div>
  );
}

export default function RankPage() {
  const [tab, setTab] = useState(RANKINGS[0].id);
  const section = RANKINGS.find((s) => s.id === tab) ?? RANKINGS[0];

  return (
    <SiteShell>
      <h1 className="mb-1.5 text-[26px] font-bold">📺 影视排行榜</h1>
      <p className="mb-5 text-sm text-fog">三大平台电视剧热播榜 + 动漫榜，看看最近大家在追什么</p>

      <div className="mb-5 flex flex-wrap gap-2.5">
        {RANKINGS.map((s) => (
          <button
            key={s.id}
            onClick={() => setTab(s.id)}
            className={cn("btn-pill px-5 py-2 text-sm", tab === s.id && "active")}
          >
            {s.name.replace(" · 电视剧榜", "")}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {section.items.map((item, i) => (
            <RankCard key={item.title} item={item} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="glass mt-6 rounded-2xl p-4 text-center text-xs text-fog">
        榜单数据更新于 {RANK_UPDATED}，综合各平台公开热度报道整理，仅供参考。
      </div>
      <footer className="mt-4 text-center text-xs text-fog-light">
        xwxy.dpdns.org · 影视排行榜
      </footer>
    </SiteShell>
  );
}
