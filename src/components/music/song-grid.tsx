"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SONGS } from "@/data/songs";
import { chordSVG } from "@/data/chords";

export function SongGridPanel({ onFollow }: { onFollow: (songTitle: string) => void }) {
  return (
    <>
      <Card className="mb-[18px]">
        <CardTitle>
          🔥 抖音热歌简化谱{" "}
          <span className="ml-2 rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            新手友好
          </span>
        </CardTitle>
        <p className="mt-2 text-[13px] leading-7 text-fog">
          2026 年抖音热门歌曲的简化弹唱版：只用 4
          个基础和弦循环，新手也能弹。标“简化版”是因为原曲编配更复杂，先弹会简化版找感觉，再去“我的谱子”导入精确版。
        </p>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SONGS.map((s) => (
          <div key={s.t} className="glass rounded-[18px] p-5">
            <div className="mb-1 flex items-start justify-between">
              <div>
                <h4 className="text-[16px] font-semibold">{s.t}</h4>
                <div className="mt-0.5 text-xs text-fog">{s.a}</div>
              </div>
              <div className="text-sm text-warn">{s.d}</div>
            </div>
            <div className="mb-2.5">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent-deep">
                变调夹 {s.capo}
              </span>{" "}
              <span className="text-xs text-fog">简化版 · 4和弦循环</span>
            </div>
            <div className="mb-2.5 flex gap-2">
              {s.prog.map((c) => (
                <span
                  key={c}
                  className="rounded-lg bg-white/70 px-3 py-1.5 text-sm font-bold text-accent-deep shadow-sm"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mb-2.5 text-[13px] leading-6 text-fog">{s.tip}</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {s.prog.map((c) => (
                <div key={c} className="w-[84px] text-center">
                  <div dangerouslySetInnerHTML={{ __html: chordSVG(c) }} />
                  <div className="text-[13px] font-semibold">{c}</div>
                </div>
              ))}
            </div>
            <Button variant="primary" size="sm" onClick={() => onFollow(s.t)}>
              🎯 跟学这首歌
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
