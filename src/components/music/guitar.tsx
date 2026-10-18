"use client";

/**
 * GuitarPanel — 实时可弹的吉他（高真实感版 v2）
 *
 * 外观：12 品实木指板、金属品丝、珍珠母品位标记、按弦粗细区分的琴弦。
 * 音色：Karplus-Strong 拨弦 + 箱体共鸣（见 @/lib/guitar-audio）。
 * 手感：点弦格即响；指板上下滑动扫弦（力度跟手速）；同弦重拨自动掐断；
 *       制音按钮模拟手掌闷音；横向滑动可浏览高把位。
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as RPE,
} from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { noteName } from "@/lib/audio";
import {
  STRING_BASE,
  STRING_LABEL,
  fretFreq,
  pluck,
  pluckOpen,
  strumChord,
  chuck,
  muteAll as engineMuteAll,
  warmup,
} from "@/lib/guitar-audio";
import { cn } from "@/lib/utils";

const FRETS = Array.from({ length: 13 }, (_, i) => i); // 0～12 品
const INLAY_SINGLE = new Set([3, 5, 7, 9]);

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

/** 弦粗细（px）与颜色：4/5/6 缠弦偏铜色，1/2/3 素弦偏银色 */
const STRING_STYLE = [
  { h: 4.5, c: "#c9a06a" },
  { h: 3.8, c: "#c9a06a" },
  { h: 3.0, c: "#bd9260" },
  { h: 2.2, c: "#d9d9d9" },
  { h: 1.8, c: "#d9d9d9" },
  { h: 1.5, c: "#e2e2e2" },
];

export function GuitarPanel() {
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

  useEffect(() => {
    warmup();
  }, []);

  /** 发声 + 显示音名 + 弦振动 */
  const uiPluck = useCallback((si: number, fret: number | null, vel: number) => {
    if (fret === null) {
      chuck();
    } else {
      const f = fretFreq(STRING_BASE[si], fret);
      pluck(si, f, vel);
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
    strumChord(ch.frets);
    setLastNote(`${name} 和弦`);
    setVib((v) => v.map((x) => x + 1));
  };

  /** 扫弦按钮 */
  const strumAll = () => {
    strumChord(frets);
    setLastNote(chord === "自选" ? "扫弦" : `${chord} 扫弦`);
    setVib((v) => v.map((x) => x + 1));
  };

  /** 制音 */
  const mute = () => {
    engineMuteAll();
    setLastNote("制音 ✋");
  };

  /* ---------- 指板手势 ---------- */

  const stringAtY = (clientY: number): number | null => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const rowH = r.height / STRING_BASE.length;
    const idx = Math.floor((clientY - r.top) / rowH);
    return idx >= 0 && idx < STRING_BASE.length ? idx : null;
  };

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
      return;
    }
    const si = stringAtY(e.clientY);
    if (si === null) return;
    strumming.current = true;
    strummed.current = new Set([si]);
    lastMove.current = null;
    const f = frets[si];
    if (f === null) chuck();
    else pluckOpen(si, 0.9);
    if (f !== null) {
      const nn = noteName(fretFreq(STRING_BASE[si], f));
      setLastNote(`${nn.name}${nn.oct}`);
    }
    setVib((v) => {
      const n = [...v];
      n[si] += 1;
      return n;
    });
  };

  const onBoardMove = (e: RPE<HTMLDivElement>) => {
    if (!strumming.current) return;
    const si = stringAtY(e.clientY);
    if (si === null || strummed.current.has(si)) return;
    const now = performance.now();
    let vel = 0.8;
    const lm = lastMove.current;
    if (lm) {
      const dt = Math.max(1, now - lm.t);
      const speed = Math.abs(e.clientY - lm.y) / dt;
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
          12 品实木指板，拨弦带箱体共鸣。点弦格即弹；在指板上
          <span className="font-medium text-ink">上下滑动扫弦</span>，扫得越快越响；横滑浏览高把位。
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

        {/* 指板：横向滚动看高把位；touch-action: pan-x 让竖滑扫弦、横滑滚动互不干扰 */}
        <div className="overflow-x-auto rounded-2xl border border-[#3d2a16] shadow-[inset_0_2px_12px_rgba(0,0,0,0.45)]">
          <div
            ref={boardRef}
            className="min-w-[680px] select-none bg-[linear-gradient(180deg,#4a3221_0%,#402b1a_55%,#37271a_100%)]"
            onPointerDown={onBoardDown}
            onPointerMove={onBoardMove}
            onPointerUp={endStrum}
            onPointerCancel={endStrum}
            onPointerLeave={endStrum}
            style={{ touchAction: "pan-x" }}
            role="application"
            aria-label="吉他指板，6弦乘12品，上下滑动可扫弦，左右滑动浏览把位"
          >
            {/* 品数标尺 */}
            <div className="flex">
              <div className="sticky left-0 z-20 w-14 flex-none bg-[#2e2013]" />
              {FRETS.map((fr) => (
                <div
                  key={fr}
                  className="min-w-[46px] flex-1 py-1 text-center text-[10px] font-medium tracking-wide text-[#e8d5ac]/60"
                >
                  {fr === 0 ? "空" : fr}
                </div>
              ))}
            </div>

            {STRING_BASE.map((base, si) => {
              const f = frets[si];
              const note = f === null ? "×" : noteName(fretFreq(base, f)).name;
              const ss = STRING_STYLE[si];
              return (
                <div key={si} className="relative flex items-center">
                  {/* 琴弦 */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 right-0 top-1/2 z-[5] -translate-y-1/2"
                  >
                    <div
                      key={vib[si]}
                      className="string-vib rounded-full"
                      style={
                        {
                          height: ss.h,
                          background: `linear-gradient(180deg, #fff8, ${ss.c}, #0006)`,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.55)",
                          "--amp": `${3.6 - si * 0.45}px`,
                        } as CSSProperties
                      }
                    />
                  </div>
                  {/* 弦标签（ sticky，不随横滑移走） */}
                  <div className="sticky left-0 z-20 flex w-14 flex-none flex-col items-center justify-center bg-[#2e2013]/95 py-1 backdrop-blur-[1px]">
                    <span className="text-[11px] font-semibold text-[#e8d5ac]">
                      {STRING_LABEL[si]}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] font-bold",
                        f === null ? "text-[#8a7a5f]" : "text-amber-200"
                      )}
                    >
                      {note}
                    </span>
                  </div>
                  {/* 弦格 */}
                  {FRETS.map((fr) => {
                    const active = f === fr;
                    const inlay = INLAY_SINGLE.has(fr) || fr === 12;
                    return (
                      <button
                        key={fr}
                        type="button"
                        onPointerDown={() => onCellDown(si, fr)}
                        onClick={() => onCellClick(si, fr)}
                        aria-label={`${STRING_LABEL[si]}${fr === 0 ? "空弦" : `${fr}品`}`}
                        className={cn(
                          "relative z-10 h-14 min-w-[46px] flex-1 border-l-2",
                          fr === 0
                            ? "border-l-[7px] border-l-[#f2e9d4]"
                            : "border-l-[#cfc6b2]/70",
                          "transition-colors duration-150",
                          "hover:bg-white/10 active:bg-white/20"
                        )}
                      >
                        {/* 品位标记 */}
                        {inlay && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 flex items-center justify-center"
                          >
                            {fr === 12 ? (
                              <span className="flex w-full items-center justify-around px-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#fde68a]/85 shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#fde68a]/85 shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                              </span>
                            ) : (
                              <span className="h-3 w-3 rounded-full bg-[#fde68a]/85 shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                            )}
                          </span>
                        )}
                        {/* 按弦指示 */}
                        {active && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-2 top-1/2 h-8 -translate-y-1/2 rounded-full bg-amber-100/30 ring-2 ring-amber-100/70"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={strumAll} className="btn-primary flex-1 py-3 text-[15px]">
            扫弦 ♪
          </button>
          <button
            onClick={mute}
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
