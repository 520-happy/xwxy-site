"use client";

/**
 * GuitarPanel — 实时可弹的吉他（高真实感版）
 *
 * 音色：Karplus-Strong 拨弦物理建模（Web Audio 实时合成）。
 * 手感：
 * - 指板 touch-action:none，手指在弦上滑动即扫弦，扫得越快越响
 * - 点按弦格 pointerdown 直接发声（最低延迟），键盘回车同样可弹
 * - 同一根弦重拨时自动掐断前一个音（8ms 淡出），不浑浊
 * - 拨弦瞬间弦线做衰减振动动画
 * - 「制音」按钮模拟手掌闷音
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type PointerEvent as RPE,
} from "react";
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

interface Voice {
  bus: GainNode;
  cur: { src: AudioBufferSourceNode; fade: GainNode } | null;
}

/** 生成一段拨弦采样 */
function ksBuffer(c: AudioContext, freq: number, vel: number): AudioBuffer {
  const sr = c.sampleRate;
  const N = Math.max(2, Math.round(sr / freq));
  const len = Math.floor(sr * 2.2);
  const buf = c.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = (Math.random() * 2 - 1) * vel;
  // 高频弦衰减稍快，更像真琴
  const damp = 0.9965 - Math.min(0.004, (freq / 1600) * 0.004);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = line[idx];
    const nxt = line[(idx + 1) % N];
    line[idx] = damp * 0.5 * (cur + nxt);
    out[i] = cur;
    idx = (idx + 1) % N;
  }
  return buf;
}

function getMaster(c: AudioContext, ref: MutableRefObject<GainNode | null>): GainNode {
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
    ref.current = input;
  }
  return ref.current;
}

/** 在某根弦上拨响一个音；同弦重拨自动掐断前音 */
function pluckVoice(
  c: AudioContext,
  master: GainNode,
  voices: MutableRefObject<(Voice | null)[]>,
  si: number,
  freq: number,
  when: number,
  vel: number
) {
  let v = voices.current[si];
  if (!v) {
    const bus = c.createGain();
    bus.connect(master);
    v = { bus, cur: null };
    voices.current[si] = v;
  }
  const bus = v.bus;
  // 制音后恢复音量
  bus.gain.cancelScheduledValues(when);
  bus.gain.setValueAtTime(1, when);
  // 掐断该弦上一个音（8ms 淡出防爆音）
  if (v.cur) {
    const { src, fade } = v.cur;
    try {
      fade.gain.cancelScheduledValues(when);
      fade.gain.setValueAtTime(1, when);
      fade.gain.linearRampToValueAtTime(0.0001, when + 0.008);
      src.stop(when + 0.03);
    } catch {
      /* 已自然结束 */
    }
    v.cur = null;
  }
  const src = c.createBufferSource();
  src.buffer = ksBuffer(c, freq, vel);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(6500, freq * 14);
  lp.Q.value = 0.4;
  const g = c.createGain();
  g.gain.value = 0.55;
  const fade = c.createGain();
  src.connect(lp);
  lp.connect(g);
  g.connect(fade);
  fade.connect(bus);
  src.start(when);
  v.cur = { src, fade };
  src.onended = () => {
    if (v!.cur?.src === src) v!.cur = null;
  };
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
  const masterRef = useRef<GainNode | null>(null);
  const voicesRef = useRef<(Voice | null)[]>([null, null, null, null, null, null]);
  const [chord, setChord] = useState("空弦");
  const [frets, setFrets] = useState<(number | null)[]>([0, 0, 0, 0, 0, 0]);
  const [lastNote, setLastNote] = useState("");
  const [vib, setVib] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const boardRef = useRef<HTMLDivElement>(null);
  const strumming = useRef(false);
  const strummed = useRef<Set<number>>(new Set());
  const lastMove = useRef<{ y: number; t: number } | null>(null);
  const cellHandled = useRef(false);
  const suppressClick = useRef(false);

  // 预热 AudioContext，第一次点按延迟更低
  useEffect(() => {
    try {
      ac();
    } catch {
      /* 忽略 */
    }
  }, []);

  /** 发声 + 显示音名 + 弦振动 */
  const uiPluck = useCallback((si: number, fret: number | null, vel: number) => {
    const c = ac();
    const master = getMaster(c, masterRef);
    const t = c.currentTime;
    if (fret === null) {
      chuck(c, master, t);
    } else {
      const f = fretFreq(STRINGS[si].base, fret);
      pluckVoice(c, master, voicesRef, si, f, t, vel);
      const nn = noteName(f);
      setLastNote(`${nn.name}${nn.oct} · ${f.toFixed(1)} Hz`);
    }
    setVib((v) => {
      const n = [...v];
      n[si] += 1;
      return n;
    });
  }, []);

  /** 点弦格：按弦 + 拨响 */
  const tapCell = useCallback(
    (si: number, fret: number, vel = 0.92) => {
      setFrets((prev) => {
        const next = [...prev];
        next[si] = fret;
        return next;
      });
      setChord("自选");
      uiPluck(si, fret, vel);
    },
    [uiPluck]
  );

  /** 和弦按钮：摆指法 + 扫弦 */
  const playChord = (name: string) => {
    const ch = CHORDS.find((c) => c.name === name)!;
    setChord(name);
    setFrets([...ch.frets]);
    const c = ac();
    const master = getMaster(c, masterRef);
    const t0 = c.currentTime + 0.02;
    ch.frets.forEach((f, si) => {
      if (f === null) {
        chuck(c, master, t0 + si * 0.024);
        return;
      }
      const vel = 0.75 + 0.25 * Math.sin((si / 5) * Math.PI);
      pluckVoice(c, master, voicesRef, si, fretFreq(STRINGS[si].base, f), t0 + si * 0.024, vel);
    });
    setLastNote(`${name} 和弦`);
    setVib((v) => v.map((x) => x + 1));
  };

  /** 扫弦按钮：从低音弦到高音弦 */
  const strumAll = () => {
    const c = ac();
    const master = getMaster(c, masterRef);
    const t0 = c.currentTime + 0.02;
    frets.forEach((f, si) => {
      if (f === null) {
        chuck(c, master, t0 + si * 0.024);
        return;
      }
      const vel = 0.75 + 0.25 * Math.sin((si / 5) * Math.PI);
      pluckVoice(c, master, voicesRef, si, fretFreq(STRINGS[si].base, f), t0 + si * 0.024, vel);
    });
    setLastNote(chord === "自选" ? "扫弦" : `${chord} 扫弦`);
    setVib((v) => v.map((x) => x + 1));
  };

  /** 制音：手掌闷住所有弦，下次拨弦自动松开 */
  const muteAll = () => {
    const c = ac();
    const t = c.currentTime;
    voicesRef.current.forEach((v) => {
      if (!v) return;
      v.bus.gain.cancelScheduledValues(t);
      v.bus.gain.setValueAtTime(Math.max(v.bus.gain.value, 0.0001), t);
      v.bus.gain.linearRampToValueAtTime(0.0001, t + 0.035);
    });
    setLastNote("制音 ✋");
  };

  /* ---------- 指板手势：点按即响，滑动扫弦 ---------- */

  const stringAtY = (clientY: number): number | null => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const rowH = r.height / STRINGS.length;
    const idx = Math.floor((clientY - r.top) / rowH);
    return idx >= 0 && idx < STRINGS.length ? idx : null;
  };

  /** 弦格 pointerdown：立刻发声（最低延迟），并接管后续滑动 */
  const onCellDown = (si: number, fr: number) => {
    cellHandled.current = true;
    suppressClick.current = true;
    tapCell(si, fr);
    strumming.current = true;
    strummed.current = new Set([si]);
    lastMove.current = null;
  };

  const onBoardDown = (e: RPE<HTMLDivElement>) => {
    if (cellHandled.current) {
      cellHandled.current = false;
      return; // 弦格已处理，只接管滑动
    }
    const si = stringAtY(e.clientY);
    if (si === null) return;
    strumming.current = true;
    strummed.current = new Set([si]);
    lastMove.current = null;
    uiPluck(si, frets[si], 0.9);
  };

  const onBoardMove = (e: RPE<HTMLDivElement>) => {
    if (!strumming.current) return;
    const si = stringAtY(e.clientY);
    if (si === null || strummed.current.has(si)) return;
    // 力度跟随手速：扫得越快越响
    const now = performance.now();
    let vel = 0.8;
    const lm = lastMove.current;
    if (lm) {
      const dt = Math.max(1, now - lm.t);
      const speed = Math.abs(e.clientY - lm.y) / dt; // px/ms
      vel = Math.min(1, Math.max(0.55, 0.55 + speed * 0.55));
    }
    lastMove.current = { y: e.clientY, t: now };
    strummed.current.add(si);
    uiPluck(si, frets[si], vel);
  };

  const endStrum = () => {
    strumming.current = false;
    strummed.current.clear();
    lastMove.current = null;
  };

  /** 键盘回车/空格点弦格（click 无 pointerdown 时） */
  const onCellClick = (si: number, fr: number) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    tapCell(si, fr);
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
          真实拨弦合成音色。点弦格即弹；在指板上<span className="font-medium text-ink">上下滑动扫弦</span>
          ，扫得越快越响。
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

        {/* 指板：整块 touch-action:none，滑动不抢页面滚动 */}
        <div
          ref={boardRef}
          className="select-none rounded-2xl border border-line bg-white/70 p-2"
          onPointerDown={onBoardDown}
          onPointerMove={onBoardMove}
          onPointerUp={endStrum}
          onPointerCancel={endStrum}
          onPointerLeave={endStrum}
          style={{ touchAction: "none" }}
          role="application"
          aria-label="吉他指板，6弦乘5品，滑动可扫弦"
        >
          {STRINGS.map((s, si) => {
            const f = frets[si];
            const note = f === null ? "×" : noteName(fretFreq(s.base, f)).name;
            const h = 2 + (6 - si) * 0.7;
            return (
              <div key={s.n} className="flex items-center gap-1.5 py-[3px]">
                <div className="w-11 flex-none text-center">
                  <div className="text-[11px] font-medium text-fog">{s.label}</div>
                  <div
                    className={cn(
                      "text-[13px] font-bold",
                      f === null ? "text-fog-light" : "text-accent-deep"
                    )}
                  >
                    {note}
                  </div>
                </div>
                <div className="relative flex flex-1 gap-1">
                  {/* 弦线：拨弦时做衰减振动 */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 right-0 top-1/2"
                    style={{ transform: "translateY(-50%)" }}
                  >
                    <div
                      key={vib[si]}
                      className="string-vib rounded bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300"
                      style={{ height: h, "--amp": `${3.6 - si * 0.45}px` } as CSSProperties}
                    />
                  </div>
                  {FRETS.map((fr) => {
                    const active = f === fr;
                    return (
                      <button
                        key={fr}
                        type="button"
                        onPointerDown={() => onCellDown(si, fr)}
                        onClick={() => onCellClick(si, fr)}
                        aria-label={`${s.label}${fr === 0 ? "空弦" : `${fr}品`}`}
                        className={cn(
                          "relative z-[1] flex h-11 flex-1 items-center justify-center rounded-lg border text-[13px] font-medium transition-colors duration-150",
                          active
                            ? "border-accent bg-accent-soft text-accent-deep shadow-[0_0_0_2px_rgb(99_91_255/0.25)]"
                            : "border-line/70 bg-white/60 text-fog-light hover:border-accent/60 hover:text-accent-deep active:bg-accent-soft"
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

        <div className="mt-4 flex gap-2">
          <button onClick={strumAll} className="btn-primary flex-1 py-3 text-[15px]">
            扫弦 ♪
          </button>
          <button
            onClick={muteAll}
            className="btn-pill px-5 py-3 text-[15px]"
            aria-label="制音，闷住所有琴弦"
          >
            制音
          </button>
        </div>
        <p className="mt-3 text-center text-xs leading-5 text-fog-light">
          标准调弦 E A D G B E · 点格即弹，和弦按钮自动摆指法
        </p>
      </Card>
    </div>
  );
}
