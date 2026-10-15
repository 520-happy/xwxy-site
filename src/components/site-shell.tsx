"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_GROUPS: {
  label: string;
  items: { href: string; icon: string; label: string; external?: boolean }[];
}[] = [
  {
    label: "导航",
    items: [
      { href: "/", icon: "🏠", label: "首页" },
      { href: "/rank", icon: "📺", label: "影视排行榜" },
    ],
  },
  {
    label: "应用",
    items: [
      { href: "/phone", icon: "📱", label: "手机比价" },
      { href: "/game", icon: "🌻", label: "后院保卫战" },
      { href: "/music", icon: "🎸", label: "音乐教室" },
      { href: "https://pansou.de", icon: "🔍", label: "盘搜", external: true },
    ],
  },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      {/* sidebar (desktop) */}
      <nav className="fixed left-0 top-0 bottom-0 z-[100] hidden w-[208px] flex-col border-r border-white/80 bg-white/60 px-3 py-5 shadow-[2px_0_24px_rgba(46,125,79,0.08)] backdrop-blur-[20px] backdrop-saturate-[1.5] md:flex">
        <div className="flex items-center gap-2.5 px-2.5 pb-[18px]">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#3cb371] to-[#2e8b57] text-xl font-bold text-white shadow-[0_4px_14px_rgba(46,158,99,0.35)]">
            X
          </div>
          <div className="text-[19px] font-bold tracking-wider">
            xwxy<em className="not-italic text-accent">.</em>
          </div>
        </div>
        {NAV_GROUPS.map((g) => (
          <div key={g.label}>
            <div className="px-3 pb-1 pt-2.5 text-xs text-fog-light">{g.label}</div>
            {g.items.map((it) => {
              const active =
                !it.external &&
                (it.href === "/" ? pathname === "/" : pathname.startsWith(it.href));
              const cls = cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-[11px] text-[15px] text-ink transition-colors hover:bg-accent/[0.08]",
                active &&
                  "bg-accent/[0.14] font-semibold text-accent-deep shadow-[inset_0_0_0_1px_rgba(46,158,99,0.25)]"
              );
              return it.external ? (
                <a key={it.href + it.label} href={it.href} target="_blank" rel="noopener" className={cls}>
                  <span className="w-6 flex-none text-center text-[18px]">{it.icon}</span>
                  {it.label}
                </a>
              ) : (
                <Link key={it.href} href={it.href} className={cls}>
                  <span className="w-6 flex-none text-center text-[18px]">{it.icon}</span>
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
        <div className="mt-auto px-3 py-2.5 text-xs leading-7 text-fog-light">
          xwxy.dpdns.org
          <br />
          榜单每日看看就好 📺
        </div>
      </nav>

      {/* top bar (mobile) */}
      <nav className="sticky top-0 z-[100] flex gap-1 overflow-x-auto border-b border-white/80 bg-white/60 px-3 py-2 backdrop-blur-[20px] md:hidden">
        {NAV_GROUPS.flatMap((g) => g.items).map((it) => {
          const active =
            !it.external &&
            (it.href === "/" ? pathname === "/" : pathname.startsWith(it.href));
          const cls = cn(
            "flex flex-none items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[13px] text-ink",
            active && "bg-accent/[0.14] font-semibold text-accent-deep"
          );
          return it.external ? (
            <a key={it.href + it.label} href={it.href} target="_blank" rel="noopener" className={cls}>
              <span className="text-[15px]">{it.icon}</span>
              {it.label}
            </a>
          ) : (
            <Link key={it.href} href={it.href} className={cls}>
              <span className="text-[15px]">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>

      <main className="relative z-[1] mx-auto min-h-screen max-w-[1180px] px-9 pb-[60px] pt-7 md:ml-[208px]">
        {children}
      </main>
    </div>
  );
}
