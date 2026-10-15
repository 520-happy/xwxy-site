"use client";

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
  { href: "/rank", label: "影视排行榜", Icon: Clapperboard },
  { href: "/phone", label: "手机比价", Icon: Smartphone },
  { href: "/game", label: "后院保卫战", Icon: Sprout },
  { href: "/music", label: "音乐教室", Icon: Guitar },
  { href: "https://pansou.de", label: "盘搜", Icon: FolderSearch, external: true },
];

function isActive(pathname: string, it: NavItem) {
  if (it.external) return false;
  return it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
}

function NavLink({ it, active, onNavigate }: { it: NavItem; active: boolean; onNavigate?: () => void }) {
  const cls = cn(
    "nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px]",
    active
      ? "active bg-accent-soft font-semibold text-accent-deep shadow-[inset_0_0_0_1px_rgb(79_109_245/0.18)]"
      : "text-fog hover:bg-slate-900/[0.045] hover:text-ink"
  );
  const inner = (
    <>
      <span
        className={cn(
          "nav-icon flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px]",
          active ? "bg-gradient-to-br from-[#5b7cfa] to-[#7a5cf8] text-white shadow-[0_4px_12px_rgb(79_109_245/0.35)]"
                 : "bg-slate-900/[0.05] text-fog group-hover:bg-accent-soft group-hover:text-accent-deep"
        )}
      >
        <it.Icon size={17} strokeWidth={2.1} aria-hidden="true" />
      </span>
      <span className="flex-1">{it.label}</span>
      {it.external && (
        <ArrowUpRight size={14} className="text-fog-light" aria-hidden="true" />
      )}
    </>
  );
  return it.external ? (
    <a href={it.href} target="_blank" rel="noopener" className={cls} onClick={onNavigate}>
      {inner}
    </a>
  ) : (
    <Link href={it.href} className={cls} aria-current={active ? "page" : undefined} onClick={onNavigate}>
      {inner}
    </Link>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* 桌面端侧边栏 */}
      <nav
        aria-label="主导航"
        className="fixed bottom-0 left-0 top-0 z-[100] hidden w-[232px] flex-col border-r border-white/70 bg-white/70 px-3.5 py-5 shadow-[2px_0_28px_rgb(24_28_48/0.06)] backdrop-blur-[20px] backdrop-saturate-[1.4] md:flex"
      >
        <div className="flex items-center gap-3 px-2 pb-5">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b7cfa] via-[#6d6df2] to-[#8b5cf6] text-[19px] font-extrabold text-white shadow-[0_6px_16px_rgb(79_109_245/0.4)]"
          >
            X
          </div>
          <div>
            <div className="text-[17px] font-extrabold tracking-[0.14em] text-ink">XWXY</div>
            <div className="text-[11px] tracking-wide text-fog-light">数字空间</div>
          </div>
        </div>

        <div className="flex flex-col gap-1" role="list">
          {NAV.map((it) => (
            <div key={it.href + it.label} role="listitem">
              <NavLink it={it} active={isActive(pathname, it)} />
            </div>
          ))}
        </div>

        <div className="mt-auto px-2.5 pt-4 text-xs leading-6 text-fog-light">
          xwxy.dpdns.org
        </div>
      </nav>

      {/* 移动端顶栏：品牌 + 横向滚动导航，不遮挡内容 */}
      <nav
        aria-label="主导航"
        className="sticky top-0 z-[100] border-b border-white/70 bg-white/75 backdrop-blur-[20px] backdrop-saturate-[1.4] md:hidden"
      >
        <div className="flex items-center gap-2 px-4 pb-1 pt-3">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#5b7cfa] via-[#6d6df2] to-[#8b5cf6] text-[15px] font-extrabold text-white shadow-[0_4px_12px_rgb(79_109_245/0.35)]"
          >
            X
          </div>
          <span className="text-[15px] font-extrabold tracking-[0.14em] text-ink">XWXY</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((it) => {
            const active = isActive(pathname, it);
            const cls = cn(
              "nav-item flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px]",
              active
                ? "active bg-accent-soft font-semibold text-accent-deep shadow-[inset_0_0_0_1px_rgb(79_109_245/0.18)]"
                : "text-fog hover:bg-slate-900/[0.045] hover:text-ink"
            );
            const inner = (
              <>
                <it.Icon size={15} strokeWidth={2.1} aria-hidden="true" />
                {it.label}
              </>
            );
            return it.external ? (
              <a key={it.href + it.label} href={it.href} target="_blank" rel="noopener" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={it.href} href={it.href} className={cls} aria-current={active ? "page" : undefined}>
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="relative z-[1] mx-auto min-h-screen max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 md:ml-[232px] md:px-9 md:pt-8">
        {children}
      </main>
    </div>
  );
}
