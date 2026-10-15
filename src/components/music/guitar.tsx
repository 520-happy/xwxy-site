"use client";

/**
 * GuitarPanel — 实时可弹的吉他
 *
 * 音色：Karplus-Strong 拨弦物理建模（延迟线 + 低通反馈），
 * 听感接近真实木吉他拨弦，非普通振荡器电子音。
 *
 * 交互：6 弦 × 5 品指板，点任意格 = 按弦并拨响该弦；
 * 和弦按钮一键摆好指法并扫弦；也可在弦区滑动扫弦。
 */
import { useCallback, useRef, useState, type MutableRefObject } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { ac, noteName } from "@/lib/audio";
import { cn } from "@/lib/utils";

const STRINGS = [
  { n: 6, label: "6弦", base: 82.41 },
  { n: 5, label: "5弦", base: 110.0 },
  { n: 4, label: "4弦", base: 146.83 },
  { n: 3, label: "3弦", base: 196.0 },
  { n: 2, label: "2弦", base: 246.94 },
  { n: 1, label: "1弦", base: 329.63 },
];

const FRETS = [0, 1, 2, 3, 4];

/** 和弦指法：按 6→1 弦顺序，null = 不弹（×） */
const CHORDS: { name: string; frets: (number | null)[] }[] = [
  { name: "空弦", frets: [0, 0, 0, 0, 0, 0] },
  { name: "C", frets: [null, 3, 2, 0, 1, 0] },
  { name: "G", frets: [3, 2, 0, 0, 0, 3] },
  { name: "Am", frets: [null, 0, 2, 2, 1, 0] },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0] },
  { name: "D", frets: [null, null, 0, 2, 3, 2] },
  { name: "F", frets: [null, null, 3, 2, 1, 1] },
];

function fretFreq(base: number, fret: number) {
  return base * Math.pow(2, fret / 12);
}

/* ---------------- Karplus-Strong 拨弦合成 ---------------- */

interface Master {
  input: GainNode;
}

function getMaster(c: AudioContext, ref: MutableRefObject<Master | null>): GainNode {
  if (!ref.current) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 5;
    comp.attack.value = 0.004;
    comp.release.value = 0.24;
    const input = c.createGain();
    input.gain.value = 0.9;
    input.connect(comp);
    comp.connect(c.destination);
    ref.current = { input };
  }
  return ref.current.input;
}

/** 单次拨弦：freq 频率，when 起音时间，vel 力度 0-1 */
function ksPluck(
  c: AudioContext,
  dest: AudioNode,
  freq: number,
  when: number,
  vel = 1
) {
  const sr = c.sampleRate;
  const N = Math.max(2, Math.round(sr / freq));
  const dur = 2.2;
  const len = Math.floor(sr * dur);
  const buf = c.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = (Math.random() * 2 - 1) * vel;
  // 高频弦衰减稍快，更像真琴
  const damp = 0.9965 - Math.min(0.004, (freq / 1600) * 0.004);
  const blend = 0.5;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = line[idx];
    const nxt = line[(idx + 1) % N];
    line[idx] = damp * (blend * cur + (1 - blend) * nxt);
    out[i] = cur;
    idx = (idx + 1) % N;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(6500, freq * 14);
  lp.Q.value = 0.4;
  const g = c.createGain();
  g.gain.value = 0.55;
  src.connect(lp);
  lp.connect(g);
  g.connect(dest);
  src.start(when);
}

/** 制音闷响（× 弦的闷音） */
function chuck(c: AudioContext, dest: AudioNode, when: number) {
  const sr = c.sampleRate;
  const len = Math.floor(sr * 0.09);
  const buf = c.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  for (let i = 0; i < len; i++) out[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 900;
  bp.Q.value = 1.2;
  const g = c.createGain();
  g.gain.value = 0.35;
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(when);
}

/* ---------------- 组件 ---------------- */

export function GuitarPanel() {
  const masterRef = useRef<Master | null>(null);
  const [chord, setChord] = useState("空弦");
  // 每根弦当前品位（null = ×不弹）
  const [frets, setFrets] = useState<(number | null)[]>([0, 0, 0, 0, 0, 0]);
  const [lastNote, setLastNote] = useState("");
  const [vibKey, setVibKey] = useState(0);
  const strumming = useRef(false);
  const strummed = useRef<Set<number>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);

  const pluckString = useCallback(
    (si: number, fret: number | null, when?: number) => {
      const c = ac();
      const dest = getMaster(c, masterRef);
      const t = when ?? c.currentTime;
      if (fret === null) {
        chuck(c, dest, t);
        return;
      }
      const f = fretFreq(STRINGS[si].base, fret);
      ksPluck(c, dest, f, t, 0.85 + Math.random() * 0.15);
      if (when === undefined) {
        const nn = noteName(f);
        setLastNote(`${nn.name}${nn.oct} · ${f.toFixed(1)} Hz`);
        setVibKey((k) => k + 1);
      }
    },
    []
  );

  /** 点格：按弦 + 拨响 */
  const tapCell = (si: number, fret: number) => {
    setFrets((prev) => {
      const next = [...prev];
      next[si] = fret;
      return next;
    });
    setChord("自选");
    pluckString(si, fret);
  };

  /** 和弦按钮：摆指法 + 扫弦 */
  const playChord = (name: string) => {
    const ch = CHORDS.find((c) => c.name === name)!;
    setChord(name);
    setFrets([...ch.frets]);
    const c = ac();
    const dest = getMaster(c, masterRef);
    const t0 = c.currentTime + 0.02;
    // 从低音弦向高音弦扫，力度中间稍强
    ch.frets.forEach((f, si) => {
      if (f === null) return;
      const vel = 0.75 + 0.25 * Math.sin((si / 5) * Math.PI);
      const freq = fretFreq(STRINGS[si].base, f);
      ksPluck(c, dest, freq, t0 + si * 0.024, vel);
    });
    setLastNote(`${name} 和弦`);
    setVibKey((k) => k + 1);
  };

  /** 扫弦按钮 */
  const strumAll = () => {
    const c = ac();
    const dest = getMaster(c, masterRef);
    const t0 = c.currentTime + 0.02;
    frets.forEach((f, si) => {
      if (f === null) {
        chuck(c, dest, t0 + si * 0.024);
        return;
      }
      const vel = 0.75 + 0.25 * Math.sin((si / 5) * Math.PI);
      ksPluck(c, dest, fretFreq(STRINGS[si].base, f), t0 + si * 0.024, vel);
    });
    setLastNote(chord === "自选" ? "扫弦" : `${chord} 扫弦`);
    setVibKey((k) => k + 1);
  };

  /** 在弦区滑动扫弦 */
  const stringAtY = (clientY: number): number | null => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const rowH = r.height / STRINGS.length;
    const idx = Math.floor((clientY - r.top) / rowH);
    return idx >= 0 && idx < STRINGS.length ? idx : null;
  };

  const onBoardDown = (e: React.PointerEvent) => {
    // 点在弦格按钮上时由按钮的 onClick 处理，避免一次点按拨弦两次
    if ((e.target as HTMLElement).closest("button")) return;
    const si = stringAtY(e.clientY);
    if (si === null) return;
    strumming.current = true;
    strummed.current = new Set([si]);
    pluckString(si, frets[si]);
  };
  const onBoardMove = (e: React.PointerEvent) => {
    if (!strumming.current) return;
    const si = stringAtY(e.clientY);
    if (si === null || strummed.current.has(si)) return;
    strummed.current.add(si);
    pluckString(si, frets[si]);
  };
  const endStrum = () => {
    strumming.current = false;
    strummed.current.clear();
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <CardTitle>🎸 指弹吉他</CardTitle>
          <span className="text-xs text-fog" aria-live="polite">
            {lastNote || "点弦格或和弦开始弹"}
          </span>
        </div>
        <p className="mb-4 text-[13px] leading-6 text-fog">
          真实拨弦合成音色。点任意弦格按弦拨响；选和弦一键摆好指法并扫弦。
        </p>

        {/* 和弦 */}
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="和弦">
          {CHORDS.map((c) => (
            <button
              key={c.name}
              onClick={() => playChord(c.name)}
              className={cn("btn-pill px-4 py-2 text-sm", chord === c.name && "active")}
              aria-pressed={chord === c.name}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* 指板 */}
        <div
          ref={boardRef}
          className="select-none rounded-2xl border border-line bg-white/70 p-2"
          onPointerDown={onBoardDown}
          onPointerMove={onBoardMove}
          onPointerUp={endStrum}
          onPointerCancel={endStrum}
          onPointerLeave={endStrum}
          style={{ touchAction: "pan-y" }}
          role="application"
          aria-label="吉他指板，6弦乘5品"
        >
          {STRINGS.map((s, si) => {
            const f = frets[si];
            const note = f === null ? "×" : noteName(fretFreq(s.base, f)).name;
            return (
              <div key={s.n} className="flex items-center gap-1.5 py-[3px]">
                <div className="w-11 flex-none text-center">
                  <div className="text-[11px] font-medium text-fog">{s.label}</div>
                  <div
                    key={vibKey}
                    className={cn(
                      "text-[13px] font-bold",
                      f === null ? "text-fog-light" : "text-accent-deep"
                    )}
                  >
                    {note}
                  </div>
                </div>
                <div className="relative flex flex-1 gap-1">
                  {/* 弦线 */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300"
                    style={{ height: 2 + (6 - si) * 0.7 }}
                  />
                  {FRETS.map((fr) => {
                    const active = f === fr;
                    return (
                      <button
                        key={fr}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          tapCell(si, fr);
                        }}
                        aria-label={`${s.label}${fr === 0 ? "空弦" : `${fr}品`}`}
                        className={cn(
                          "relative z-[1] flex h-11 flex-1 items-center justify-center rounded-lg border text-[13px] font-medium transition-all duration-150",
                          active
                            ? "border-accent bg-accent-soft text-accent-deep shadow-[0_0_0_2px_rgb(99_91_255/0.25)]"
                            : "border-line/70 bg-white/60 text-fog-light hover:border-accent/60 hover:text-accent-deep"
                        )}
                      >
                        {fr === 0 ? (
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border-2",
                              active ? "border-accent-deep" : "border-zinc-300"
                            )}
                          />
                        ) : (
                          fr
                        )}
                      </button>
                    );
                  })}
                  <div className="flex w-7 flex-none items-center justify-center">
                    {f === null ? (
                      <span className="text-sm font-bold text-fog-light">×</span>
                    ) : (
                      <span className="text-[11px] text-fog">{f}品</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={strumAll} className="btn-primary mt-4 w-full py-3 text-[15px]">
          扫弦 ♪
        </button>
        <p className="mt-3 text-center text-xs leading-5 text-fog-light">
          标准调弦 E A D G B E · 点格即弹，和弦按钮自动摆指法
        </p>
      </Card>
    </div>
  );
}
