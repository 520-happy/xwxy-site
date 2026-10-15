"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Clapperboard,
  Smartphone,
  Sprout,
  Guitar,
  FolderSearch,
  ArrowUpRight,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  external?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "首页", Icon: Home },
  { href: "/rank", label: "影视榜", Icon: Clapperboard },
  { href: "/phone", label: "手机比价", Icon: Smartphone },
  { href: "/game", label: "后院保卫战", Icon: Sprout },
  { href: "/music", label: "音乐教室", Icon: Guitar },
  { href: "https://pansou.de", label: "盘搜", Icon: FolderSearch, external: true },
];

function isActive(pathname: string, it: NavItem) {
  if (it.external) return false;
  return it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 路由切换后收起移动菜单；Esc 关闭
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  const linkCls = (active: boolean) =>
    cn(
      "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] transition-colors duration-200",
      active
        ? "bg-accent-soft font-semibold text-accent-deep"
        : "text-fog hover:bg-slate-900/[0.05] hover:text-ink"
    );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-[100] border-b border-line/70 bg-white/85 backdrop-blur-[16px] backdrop-saturate-[1.3]">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex flex-none items-center gap-2.5" aria-label="XWXY 首页">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d64ff] to-[#8b5cf6] text-[17px] font-extrabold text-white shadow-[0_4px_12px_rgb(99_91_255/0.35)]"
            >
              X
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-[0.12em] text-ink">XWXY</span>
              <span className="block text-[10.5px] tracking-wide text-fog-light">个人工具导航</span>
            </span>
          </Link>

          {/* 桌面端导航 */}
          <nav aria-label="主导航" className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((it) => {
              const active = isActive(pathname, it);
              const inner = (
                <>
                  <it.Icon size={15} strokeWidth={2.1} aria-hidden="true" />
                  {it.label}
                  {it.external && <ArrowUpRight size={12} className="text-fog-light" aria-hidden="true" />}
                </>
              );
              return it.external ? (
                <a key={it.label} href={it.href} target="_blank" rel="noopener" className={linkCls(active)}>
                  {inner}
                </a>
              ) : (
                <Link key={it.label} href={it.href} className={linkCls(active)} aria-current={active ? "page" : undefined}>
                  {inner}
                </Link>
              );
            })}
          </nav>

          {/* 移动端汉堡按钮 */}
          <button
            type="button"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl text-fog transition-colors hover:bg-slate-900/[0.05] hover:text-ink md:hidden"
            aria-expanded={open}
            aria-label={open ? "关闭导航菜单" : "打开导航菜单"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {/* 移动端下拉菜单 */}
        {open && (
          <nav aria-label="主导航" className="border-t border-line/70 bg-white/95 px-4 py-3 backdrop-blur-[16px] md:hidden">
            <ul className="flex flex-col gap-1">
              {NAV.map((it) => {
                const active = isActive(pathname, it);
                const cls = cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors duration-200",
                  active ? "bg-accent-soft font-semibold text-accent-deep" : "text-ink hover:bg-slate-900/[0.04]"
                );
                const inner = (
                  <>
                    <span className={cn(
                      "flex h-9 w-9 flex-none items-center justify-center rounded-[10px]",
                      active ? "bg-gradient-to-br from-[#6d64ff] to-[#8b5cf6] text-white" : "bg-slate-900/[0.05] text-fog"
                    )}>
                      <it.Icon size={17} strokeWidth={2.1} aria-hidden="true" />
                    </span>
                    <span className="flex-1">{it.label}</span>
                    {it.external && <ArrowUpRight size={15} className="text-fog-light" aria-hidden="true" />}
                  </>
                );
                return (
                  <li key={it.label}>
                    {it.external ? (
                      <a href={it.href} target="_blank" rel="noopener" className={cls}>{inner}</a>
                    ) : (
                      <Link href={it.href} className={cls} aria-current={active ? "page" : undefined}>{inner}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      <main className="relative z-[1] mx-auto min-h-screen w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
