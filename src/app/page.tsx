"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX, X } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ColorBlockAnimation } from "@/components/color-block-animation";
import { CATEGORIES, TOOLS, searchTools, type Tool } from "@/data/tools";
import { cn } from "@/lib/utils";

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const inner = (
    <>
      <div
        className="relative flex h-28 items-center justify-center overflow-hidden"
        style={{ background: tool.visual }}
      >
        <tool.Ill className="h-16 w-16 transition-transform duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tool.iconTile)}>
            <tool.Icon size={18} strokeWidth={2.1} aria-hidden="true" />
          </span>
          <h2 className="text-[16px] font-semibold text-ink">{tool.name}</h2>
        </div>
        <p className="mb-4 text-[13.5px] leading-6 text-fog">{tool.description}</p>
        <div className="mt-auto flex items-center justify-between border-t border-line/80 pt-3.5 text-sm font-medium text-accent-deep">
          <span>进入</span>
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="transition-transform duration-200 ease-out group-hover:translate-x-1"
          />
        </div>
      </div>
    </>
  );
  const cls =
    "card-lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card animate-fade-up";
  const style = { animationDelay: `${Math.min(index * 0.06, 0.3)}s` };
  const label = tool.external ? `${tool.name}（新窗口打开）` : tool.name;
  return tool.external ? (
    <a href={tool.href} target="_blank" rel="noopener" className={cls} style={style} aria-label={label}>
      {inner}
    </a>
  ) : (
    <Link href={tool.href} className={cls} style={style} aria-label={label}>
      {inner}
    </Link>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("全部工具");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" 聚焦搜索（不在输入框内时）；输入框内 Esc 清空
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const byCat = cat === "全部工具" ? TOOLS : TOOLS.filter((t) => t.category === cat);
    const q = query.trim().toLowerCase();
    if (!q) return byCat;
    return searchTools(query).filter((t) => byCat.includes(t));
  }, [query, cat]);

  return (
    <SiteShell>
      {/* ---------- Hero（紧凑） ---------- */}
      <section aria-label="欢迎" className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(115deg,#eef0ff 0%,#f4efff 50%,#e9f4ff 100%)" }}
          aria-hidden="true"
        />
        <div
          className="animate-blob absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#c9c2ff]/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="animate-blob absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#b9d4ff]/40 blur-3xl"
          style={{ animationDelay: "-10s" }}
          aria-hidden="true"
        />

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <h1 className="animate-fade-up mb-2 text-[30px] font-extrabold tracking-tight text-ink sm:text-[36px]">
            你的数字空间
          </h1>
          <p className="animate-fade-up mb-6 text-[14.5px] text-fog" style={{ animationDelay: "0.08s" }}>
            常用工具与兴趣，一站直达。
          </p>

          {/* 全局搜索 */}
          <div className="animate-fade-up relative max-w-xl" style={{ animationDelay: "0.14s" }}>
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fog-light"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="搜索工具：比价、吉他、游戏…（按 / 快速聚焦）"
              aria-label="搜索工具"
              autoComplete="off"
              className="h-[52px] w-full rounded-2xl border border-line bg-white pl-11 pr-11 text-[15px] text-ink shadow-[0_2px_12px_rgb(35_40_66/0.06)] outline-none transition-all duration-200 placeholder:text-fog-light focus:border-accent focus:shadow-[0_0_0_3px_rgb(99_91_255/0.15)] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="清空搜索"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-fog-light transition-colors hover:bg-slate-900/[0.06] hover:text-ink"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* 装饰：小方块游走（克制，细条） */}
          <div className="animate-fade-up mt-6 overflow-hidden rounded-2xl border border-white/70 bg-white/50" style={{ animationDelay: "0.2s" }} aria-hidden="true">
            <ColorBlockAnimation className="h-20 w-full" holdMs={2600} />
          </div>
        </div>
      </section>

      {/* ---------- 分类 ---------- */}
      <div
        className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="工具分类"
      >
        {CATEGORIES.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={cn("btn-pill flex-none px-5 py-2 text-sm", cat === c && "active")}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ---------- 工具网格 ---------- */}
      <section id="apps" aria-label="工具列表">
        <p className="mb-4 text-[13px] text-fog" aria-live="polite">
          {query || cat !== "全部工具"
            ? `找到 ${results.length} 个工具${query ? `（“${query.trim()}”）` : ""}`
            : `共 ${results.length} 个工具`}
        </p>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((t, i) => (
              <ToolCard key={t.id} tool={t} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
            <SearchX size={36} className="text-fog-light" aria-hidden="true" />
            <p className="text-[15px] font-medium text-ink">没有找到匹配的工具</p>
            <p className="text-[13px] text-fog">换个关键词试试，比如“游戏”“吉他”“比价”</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCat("全部工具");
              }}
              className="btn-pill mt-1 px-5 py-2 text-sm"
            >
              清空筛选
            </button>
          </div>
        )}
      </section>

      {/* ---------- 页脚 ---------- */}
      <footer className="mt-14 border-t border-line pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#6d64ff] to-[#8b5cf6] text-[13px] font-extrabold text-white"
              >
                X
              </span>
              <span className="text-[14px] font-extrabold tracking-[0.12em] text-ink">XWXY</span>
            </div>
            <p className="text-[13px] text-fog">常用工具与兴趣，一站直达。</p>
          </div>
          <div className="flex items-center gap-5 text-[13px]">
            <a
              href="https://github.com/520-happy/xwxy-site"
              target="_blank"
              rel="noopener"
              className="text-fog transition-colors hover:text-accent-deep"
            >
              GitHub 仓库
            </a>
            <a href="https://pansou.de" target="_blank" rel="noopener" className="text-fog transition-colors hover:text-accent-deep">
              盘搜
            </a>
          </div>
        </div>
        <p className="mt-6 text-xs text-fog-light">© 2026 XWXY · xwxy.dpdns.org</p>
      </footer>
    </SiteShell>
  );
}
