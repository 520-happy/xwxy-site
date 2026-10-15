"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, SearchX, X } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { CATEGORIES, TOOLS, searchTools, type Tool } from "@/data/tools";
import { cn } from "@/lib/utils";

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const inner = (
    <>
      <div className="mb-4 flex items-start justify-between">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-[10px] border border-line",
            tool.iconTile
          )}
        >
          <tool.Icon size={20} strokeWidth={2} aria-hidden="true" />
        </span>
        {tool.external ? (
          <ArrowUpRight
            size={16}
            aria-hidden="true"
            className="text-fog-light transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
          />
        ) : (
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="text-fog-light transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
          />
        )}
      </div>
      <h2 className="mb-1 text-[15px] font-semibold tracking-tight text-ink">{tool.name}</h2>
      <p className="mb-4 text-[13px] leading-6 text-fog">{tool.description}</p>
      <span className="inline-flex w-fit rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-fog">
        {tool.category}
      </span>
    </>
  );
  const cls =
    "card-lift group block rounded-xl border border-line bg-white p-5 shadow-card animate-fade-up";
  const style = { animationDelay: `${Math.min(index * 0.05, 0.25)}s` };
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
      {/* ---------- Hero（居中、克制） ---------- */}
      <section aria-label="欢迎" className="mx-auto max-w-2xl pb-10 pt-10 text-center sm:pt-14">
        <span className="animate-fade-up mb-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-fog shadow-sm">
          XWXY · 个人工具导航
        </span>
        <h1
          className="animate-fade-up mb-3 text-[32px] font-bold leading-tight tracking-tight text-ink sm:text-[44px]"
          style={{ animationDelay: "0.06s" }}
        >
          你的数字空间
        </h1>
        <p
          className="animate-fade-up mx-auto mb-8 max-w-md text-[15px] leading-7 text-fog"
          style={{ animationDelay: "0.12s" }}
        >
          常用工具与兴趣，一站直达。
        </p>

        {/* 搜索框 */}
        <div className="animate-fade-up relative mx-auto max-w-lg" style={{ animationDelay: "0.18s" }}>
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fog-light"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="搜索工具…"
            aria-label="搜索工具"
            autoComplete="off"
            className="h-11 w-full rounded-[10px] border border-line bg-white pl-10 pr-16 text-[14px] text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-fog-light focus:border-zinc-400 focus:shadow-[0_0_0_3px_rgb(0_0_0/0.06)] [&::-webkit-search-cancel-button]:hidden"
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 sm:block">
            {!query && (
              <kbd className="rounded-md border border-line bg-zinc-50 px-1.5 py-0.5 font-sans text-[11px] text-fog">
                /
              </kbd>
            )}
          </span>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="清空搜索"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-fog-light transition-colors hover:bg-zinc-100 hover:text-ink"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* ---------- 分类 ---------- */}
      <div
        className="mb-6 flex justify-start gap-2 overflow-x-auto pb-1 sm:justify-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="工具分类"
      >
        {CATEGORIES.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={cn("btn-pill flex-none px-4 py-2 text-[13px]", cat === c && "active")}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ---------- 工具网格 ---------- */}
      <section id="apps" aria-label="工具列表" className="mx-auto max-w-5xl">
        <p className="mb-4 text-center text-[13px] text-fog-light" aria-live="polite">
          {query || cat !== "全部工具"
            ? `找到 ${results.length} 个工具${query ? `（“${query.trim()}”）` : ""}`
            : `${results.length} 个工具`}
        </p>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((t, i) => (
              <ToolCard key={t.id} tool={t} index={i} />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
            <SearchX size={32} className="text-fog-light" aria-hidden="true" />
            <p className="text-[14px] font-medium text-ink">没有找到匹配的工具</p>
            <p className="text-[13px] text-fog">换个关键词试试，比如“游戏”“吉他”“比价”</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCat("全部工具");
              }}
              className="btn-pill mt-1 px-4 py-2 text-[13px]"
            >
              清空筛选
            </button>
          </div>
        )}
      </section>

      {/* ---------- 页脚 ---------- */}
      <footer className="mx-auto mt-16 max-w-5xl border-t border-line pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-[11px] font-extrabold text-white"
            >
              X
            </span>
            <span className="text-[13px] font-bold tracking-[0.1em] text-ink">XWXY</span>
            <span className="text-[13px] text-fog-light">— 常用工具与兴趣，一站直达。</span>
          </div>
          <a
            href="https://github.com/520-happy/xwxy-site"
            target="_blank"
            rel="noopener"
            className="w-fit text-[13px] text-fog transition-colors hover:text-ink"
          >
            GitHub 仓库
          </a>
        </div>
        <p className="mt-5 text-xs text-fog-light">© 2026 XWXY · xwxy.dpdns.org</p>
      </footer>
    </SiteShell>
  );
}
