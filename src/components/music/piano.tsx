"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { pianoPlay } from "@/lib/audio";

interface PianoNote {
  name: string;
  midi: number;
  black: boolean;
}

const PIANO_NOTES: PianoNote[] = (() => {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const out: PianoNote[] = [];
  for (let oct = 4; oct <= 5; oct++) {
    for (let i = 0; i < 12; i++) {
      const n = names[i];
      out.push({ name: n + oct, midi: (oct + 1) * 12 + i, black: n.includes("#") });
    }
  }
  return out;
})();

export function PianoPanel() {
  const [tone, setTone] = useState("piano");
  const [vol, setVol] = useState(70);
  const [noteLabel, setNoteLabel] = useState("—");
  const [active, setActive] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const play = (midi: number) => {
    const { label } = pianoPlay(midi, tone, vol);
    setNoteLabel(label);
    setActive(midi);
    setTimeout(() => setActive((a) => (a === midi ? null : a)), 180);
  };

  useEffect(() => {
    const keyMap: Record<string, number> = {
      a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
      k: 12, o: 13, l: 14, p: 15, ";": 16, "'": 17,
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const ae = document.activeElement;
      if (ae && /INPUT|TEXTAREA/.test(ae.tagName)) return;
      const idx = keyMap[e.key.toLowerCase()];
      if (idx !== undefined && panelRef.current?.closest("[data-panel-visible='true']")) {
        play(PIANO_NOTES[idx].midi);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone, vol]);

  const whites = PIANO_NOTES.filter((n) => !n.black);
  const W = 46;
  const gap = 2;
  const whiteX = new Map<number, number>();
  whites.forEach((n, i) => whiteX.set(n.midi, i * (W + gap)));

  return (
    <div ref={panelRef} data-panel-visible="true">
      <Card>
        <CardTitle>
          在线钢琴{" "}
          <span className="ml-2 rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            两个八度
          </span>
        </CardTitle>
        <p className="mt-2 text-[13px] leading-7 text-fog">
          用鼠标/手指点琴键，或用电脑键盘弹（A~; 对应白键，W E T Y U O P 对应黑键）。
        </p>
        <div className="glass-dark mt-3.5 overflow-x-auto rounded-[18px] px-[18px] pb-[18px] pt-[26px]">
          <div className="relative h-[220px] min-w-[640px] select-none" style={{ minWidth: whites.length * (W + gap) }}>
            {whites.map((n) => (
              <div
                key={n.midi}
                onMouseDown={(e) => {
                  e.preventDefault();
                  play(n.midi);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  play(n.midi);
                }}
                className="absolute bottom-0 top-0 flex cursor-pointer items-end justify-center rounded-b-lg border border-[#c8c9cb] bg-white pb-2.5 text-xs text-[#9aa0a6]"
                style={{
                  left: whiteX.get(n.midi),
                  width: W,
                  background: active === n.midi ? "#ffe9d9" : undefined,
                }}
              >
                {n.name.replace(/[0-9]/g, "")}
              </div>
            ))}
            {PIANO_NOTES.filter((n) => n.black).map((n) => {
              // 找到前一个白键
              let prev: PianoNote | null = null;
              for (let m = n.midi - 1; m >= 0; m--) {
                const w = PIANO_NOTES.find((x) => x.midi === m && !x.black);
                if (w) {
                  prev = w;
                  break;
                }
              }
              if (!prev) return null;
              const x = (whiteX.get(prev.midi) ?? 0) + W;
              return (
                <div
                  key={n.midi}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    play(n.midi);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    play(n.midi);
                  }}
                  className="absolute top-0 z-[2] h-[58%] cursor-pointer rounded-b-md border border-black bg-[#202124]"
                  style={{
                    left: x - 14,
                    width: 28,
                    background: active === n.midi ? "var(--color-accent)" : undefined,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-3.5 text-[13px] text-white">
            <span>音色</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="rounded-lg border border-white/30 bg-white/[0.14] px-2.5 py-1.5 text-white"
            >
              <option value="piano">钢琴</option>
              <option value="organ">风琴</option>
              <option value="synth">合成器</option>
            </select>
            <span>音量</span>
            <input
              type="range"
              min={0}
              max={100}
              value={vol}
              onChange={(e) => setVol(Number(e.target.value))}
              className="w-[120px]"
            />
            <span className="font-bold text-accent">{noteLabel}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
