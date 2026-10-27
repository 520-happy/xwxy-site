"use client";

/**
 * 从零学吉他 · 续编（第 2～6 章）
 *
 * 接在 learn-guitar.tsx 的 13 节课后面：节奏与扫弦 → 和弦进阶 →
 * 指弹与旋律 → 乐理一点通 → 游戏馆。全部一步一屏、全部可动手点。
 * 注意：本文件只在组件体内使用 learn-guitar 的 const 导出（LEARN_CHORDS），
 * 模块顶层只用函数声明类导出，避免循环引用时的 TDZ 问题。
 */
import { useEffect, useRef, useState } from "react";
import { Para, IBox, Remember, ChordDiagram, LEARN_CHORDS, type ChordDef, type Lesson } from "./learn-guitar";
import { metroTick, noteName } from "@/lib/audio";
import {
  STRING_BASE,
  STRING_LABEL,
  fretFreq,
  pluckOpen,
  pluckFret,
  strumChord,
  muteAll,
} from "@/lib/guitar-audio";
import { cn } from "@/lib/utils";

/* ================= 第 2 章 · 节奏与扫弦 ================= */

function MetroWidget() {
  const [bpm, setBpm] = useState(80);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const timer = useRef<number | null>(null);
  const beatRef = useRef(-1);

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
    setBeat(-1);
    beatRef.current = -1;
  };

  const start = () => {
    stop();
    setRunning(true);
    const iv = 60000 / bpm;
    beatRef.current = 0;
    setBeat(0);
    metroTick(true);
    timer.current = window.setInterval(() => {
      beatRef.current = (beatRef.current + 1) % 4;
      setBeat(beatRef.current);
      metroTick(beatRef.current === 0);
    }, iv);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        节拍器就是音乐的心跳。先开着它，嘴里跟着数 <b>1 - 2 - 3 - 4</b>，数稳了再拿琴：
      </p>
      <div className="mb-4 flex justify-center gap-3">
        {[0, 1, 2, 3].map((b) => (
          <span
            key={b}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-all",
              beat === b
                ? b === 0
                  ? "scale-110 bg-emerald-500 text-white shadow-lg"
                  : "scale-110 bg-emerald-200 text-emerald-900"
                : "bg-zinc-100 text-zinc-400"
            )}
          >
            {b + 1}
          </span>
        ))}
      </div>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex-none text-sm text-fog">速度</span>
        <input
          type="range"
          min={60}
          max={120}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="flex-1"
        />
        <span className="flex-none text-sm font-bold">{bpm} 拍/分钟</span>
      </div>
      <button
        onClick={running ? stop : start}
        className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
      >
        {running ? "⏹ 停" : "▶ 开始数拍子"}
      </button>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        慢歌 60～80，快歌 100～120。先从 80 练，数得稳稳的再加速。
      </p>
    </div>
  );
}

function StrumDirWidget() {
  const [name, setName] = useState("Em");
  const chord = LEARN_CHORDS.find((c) => c.name === name) ?? LEARN_CHORDS[0];
  const down = () => strumChord(chord.frets, true);
  const up = () => strumChord(chord.frets, false);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {LEARN_CHORDS.map((c) => (
          <button
            key={c.name}
            onClick={() => setName(c.name)}
            className={cn("btn-pill px-4 py-2 text-sm font-bold", name === c.name && "active")}
          >
            {c.name}
          </button>
        ))}
      </div>
      <p className="mb-3 text-[13px] text-fog">
        <b>下扫</b>：手从粗弦往细弦扫（↓）；<b>上扫</b>：从细弦往粗弦挑（↑）。手腕放松，像甩水一样，别用整条胳膊抡：
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={down}
          className="rounded-2xl border border-emerald-200 bg-white py-6 text-center transition-all hover:bg-emerald-50 active:scale-95"
        >
          <span className="block text-3xl">↓</span>
          <span className="mt-1 block text-sm font-bold">下扫</span>
          <span className="text-xs text-fog">从 6 弦往 1 弦</span>
        </button>
        <button
          onClick={up}
          className="rounded-2xl border border-emerald-200 bg-white py-6 text-center transition-all hover:bg-emerald-50 active:scale-95"
        >
          <span className="block text-3xl">↑</span>
          <span className="mt-1 block text-sm font-bold">上扫</span>
          <span className="text-xs text-fog">从 1 弦往 6 弦</span>
        </button>
      </div>
    </div>
  );
}

/** 扫弦节奏型：一小节 8 个半拍，· = 空过 */
const STRUM_PATTERN: ("down" | "up" | "rest")[] = [
  "down",
  "rest",
  "down",
  "up",
  "rest",
  "up",
  "down",
  "up",
];

function PatternWidget() {
  const [bpm, setBpm] = useState(80);
  const [running, setRunning] = useState(false);
  const [slot, setSlot] = useState(-1);
  const timer = useRef<number | null>(null);
  const chord = LEARN_CHORDS[0]; // Em

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
    setSlot(-1);
  };

  const start = () => {
    stop();
    setRunning(true);
    let i = 0;
    const iv = 60000 / bpm / 2; // 半拍
    const step = () => {
      setSlot(i);
      const s = STRUM_PATTERN[i];
      if (s === "down") strumChord(chord.frets, true);
      else if (s === "up") strumChord(chord.frets, false);
      i = (i + 1) % STRUM_PATTERN.length;
    };
    step();
    timer.current = window.setInterval(step, iv);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        最常用的入门节奏型（Em 和弦，· 表示这半拍空过、手不停摆动）：
      </p>
      <div className="mb-4 grid grid-cols-8 gap-1.5">
        {STRUM_PATTERN.map((s, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border py-3 text-center text-lg font-bold transition-all",
              slot === i
                ? "scale-105 border-emerald-500 bg-emerald-500 text-white shadow"
                : "border-line bg-white/70 text-zinc-700"
            )}
          >
            {s === "down" ? "↓" : s === "up" ? "↑" : "·"}
          </div>
        ))}
      </div>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex-none text-sm text-fog">速度</span>
        <input
          type="range"
          min={60}
          max={100}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="flex-1"
        />
        <span className="flex-none text-sm font-bold">{bpm}</span>
      </div>
      <button
        onClick={running ? stop : start}
        className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
      >
        {running ? "⏹ 停" : "▶ 循环播放节奏型"}
      </button>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        秘诀：<b>右手一直上下摆动不停</b>，碰到 · 只是不碰弦。手不停，节奏就不会乱。
      </p>
    </div>
  );
}

function MuteWidget() {
  const chord = LEARN_CHORDS[0]; // Em
  const [muted, setMuted] = useState(false);
  const play = () => {
    setMuted(false);
    strumChord(chord.frets, true);
  };
  const cut = () => {
    muteAll();
    setMuted(true);
  };
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        先扫响 Em，再点“切”——右手掌根轻轻压住琴弦，声音立刻收住：
      </p>
      <div className="flex gap-3">
        <button
          onClick={play}
          className="flex-1 rounded-2xl border border-emerald-200 bg-white py-5 text-center transition-all hover:bg-emerald-50 active:scale-95"
        >
          <span className="block text-2xl">♪</span>
          <span className="mt-1 block text-sm font-bold">扫响 Em</span>
        </button>
        <button
          onClick={cut}
          className="flex-1 rounded-2xl border border-amber-200 bg-white py-5 text-center transition-all hover:bg-amber-50 active:scale-95"
        >
          <span className="block text-2xl">✋</span>
          <span className="mt-1 block text-sm font-bold">切！收住</span>
        </button>
      </div>
      <p className="mt-3 h-6 text-center text-sm text-fog" aria-live="polite">
        {muted ? "✂️ 干净利落地收住了，这就是切音。" : "扫响后立刻点“切”，感受声音被手掌按住。"}
      </p>
      <p className="text-[13px] leading-6 text-fog">
        切音让扫弦有了“断句”，歌曲就有了呼吸感。扫弦节奏型里加上切音，立刻像模像样。
      </p>
    </div>
  );
}

/* ================= 第 3 章 · 和弦进阶 ================= */

const NEW_CHORDS: ChordDef[] = [
  {
    name: "Dm",
    frets: [null, 0, 0, 2, 3, 1],
    fingers: [null, null, null, 2, 3, 1],
    tip: "中指 3 弦 2 品，无名指 2 弦 3 品，食指 1 弦 1 品。声音有点忧伤，配抒情歌很好听。5、6 弦不弹。",
  },
  {
    name: "E",
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [null, 2, 3, 1, null, null],
    tip: "中指 5 弦 2 品，无名指 4 弦 2 品，食指 3 弦 1 品。6 根弦全响，很亮堂。",
  },
  {
    name: "A",
    frets: [null, 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null],
    tip: "食指、中指、无名指并排按在 4、3、2 弦的 2 品上，像三兄弟挤在一起。6 弦不弹。",
  },
];

function NewChordsWidget() {
  const [name, setName] = useState("Dm");
  const chord = NEW_CHORDS.find((c) => c.name === name)!;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {NEW_CHORDS.map((c) => (
          <button
            key={c.name}
            onClick={() => setName(c.name)}
            className={cn("btn-pill px-4 py-2 text-sm font-bold", name === c.name && "active")}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <button
          onClick={() => strumChord(chord.frets)}
          className="rounded-2xl border border-line bg-white/70 p-3 transition-transform hover:scale-[1.03] active:scale-95"
          aria-label={`弹${chord.name}和弦试听`}
        >
          <ChordDiagram chord={chord} big />
          <span className="mt-1 block text-center text-xs text-fog">点图试听 ♪</span>
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-7">
            <b className="text-emerald-700">{chord.name}</b> 怎么按：
          </p>
          <p className="text-sm leading-8 text-ink">{chord.tip}</p>
          <p className="text-[13px] leading-7 text-fog">
            练法和前面一样：摆好 → 逐根拨检查 → 闭眼 3 秒摆好才算过关。
          </p>
        </div>
      </div>
    </div>
  );
}

const F_EASY: ChordDef = {
  name: "F（简化版）",
  frets: [null, null, 3, 2, 1, 1],
  fingers: [null, null, 3, 2, 1, 1],
  tip: "食指同时按住 2 弦和 1 弦的 1 品（小横按），中指 3 弦 2 品，无名指 4 弦 3 品。只弹 1～4 弦。",
};
const F_FULL: ChordDef = {
  name: "F（完整版）",
  frets: [1, 3, 3, 2, 1, 1],
  fingers: [1, 3, 4, 2, 1, 1],
  tip: "食指横按 6 根弦的 1 品，无名指 5 弦 3 品，小指 4 弦 3 品，中指 3 弦 2 品。这是吉他第一道坎，别急。",
};

function FChordWidget() {
  const [full, setFull] = useState(false);
  const chord = full ? F_FULL : F_EASY;
  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setFull(false)}
          className={cn("btn-pill px-4 py-2 text-sm font-bold", !full && "active")}
        >
          简化版（先练这个）
        </button>
        <button
          onClick={() => setFull(true)}
          className={cn("btn-pill px-4 py-2 text-sm font-bold", full && "active")}
        >
          完整版（大横按）
        </button>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <button
          onClick={() => strumChord(chord.frets)}
          className="rounded-2xl border border-line bg-white/70 p-3 transition-transform hover:scale-[1.03] active:scale-95"
          aria-label={`弹${chord.name}试听`}
        >
          <ChordDiagram chord={chord} big />
          <span className="mt-1 block text-center text-xs text-fog">点图试听 ♪</span>
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm leading-8 text-ink">{chord.tip}</p>
          <p className="text-[13px] leading-7 text-fog">
            {full
              ? "大横按按不响太正常了：食指侧面用力、拇指顶在琴颈背面正对食指的位置，每天练 5 分钟，两三周就通了。"
              : "简化版的声音和完整版几乎一样，先用它弹歌，等手指有力了再挑战大横按——不丢人，所有吉他手都这么过来的。"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SwitchWidget() {
  const pool = [...LEARN_CHORDS, ...NEW_CHORDS];
  const [a, setA] = useState("Em");
  const [b, setB] = useState("Am");
  const [auto, setAuto] = useState(false);
  const [cur, setCur] = useState<"a" | "b">("a");
  const [beat, setBeat] = useState(0);
  const timer = useRef<number | null>(null);
  const ca = pool.find((c) => c.name === a) ?? pool[0];
  const cb = pool.find((c) => c.name === b) ?? pool[1];

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setAuto(false);
  };

  const start = () => {
    stop();
    setAuto(true);
    setCur("a");
    setBeat(0);
    strumChord(ca.frets);
    let bt = 0;
    let side: "a" | "b" = "a";
    timer.current = window.setInterval(() => {
      bt = (bt + 1) % 4;
      setBeat(bt);
      metroTick(bt === 0);
      if (bt === 0) {
        side = side === "a" ? "b" : "a";
        setCur(side);
        strumChord((side === "a" ? ca : cb).frets);
      }
    }, 60000 / 70);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (which: "a" | "b", name: string) => {
    if (which === "a") setA(name);
    else setB(name);
  };

  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        选两个和弦，节拍器每 4 拍换一个（绿框是当前和弦）。左手跟着换，右手每拍扫一下：
      </p>
      <div className="mb-3 grid grid-cols-2 gap-3">
        {(["a", "b"] as const).map((which) => (
          <div key={which}>
            <p className="mb-1.5 text-xs font-bold text-fog">{which === "a" ? "和弦 1" : "和弦 2"}</p>
            <div className="flex flex-wrap gap-1.5">
              {pool.map((c) => (
                <button
                  key={c.name}
                  onClick={() => pick(which, c.name)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-bold",
                    (which === "a" ? a : b) === c.name
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-line bg-white text-fog"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        {([ca, cb] as const).map((c, i) => (
          <div
            key={c.name}
            className={cn(
              "rounded-2xl border-2 p-2 text-center transition-all",
              auto && cur === (i === 0 ? "a" : "b")
                ? "border-emerald-500 bg-emerald-50/60 shadow"
                : "border-line bg-white/60"
            )}
          >
            <p className="mb-1 text-sm font-bold">{c.name}</p>
            <div className="flex justify-center">
              <ChordDiagram chord={c} />
            </div>
          </div>
        ))}
      </div>
      <div className="mb-3 flex justify-center gap-2">
        {[0, 1, 2, 3].map((b) => (
          <span
            key={b}
            className={cn(
              "h-3 w-3 rounded-full transition-all",
              auto && beat === b ? "scale-125 bg-emerald-500" : "bg-zinc-200"
            )}
          />
        ))}
      </div>
      <button
        onClick={auto ? stop : start}
        className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
      >
        {auto ? "⏹ 停" : "▶ 开始换和弦练习"}
      </button>
    </div>
  );
}

function ProgWidget() {
  // 注意：PROG 必须在组件体内定义，不能放模块顶层——
  // learn-guitar-2 与 learn-guitar 循环引用，顶层读 LEARN_CHORDS 会撞上 TDZ。
  const PROG = [
    { name: "C", frets: LEARN_CHORDS[2].frets },
    { name: "G", frets: LEARN_CHORDS[3].frets },
    { name: "Am", frets: LEARN_CHORDS[1].frets },
    { name: "F", frets: F_EASY.frets },
  ];
  const [auto, setAuto] = useState(false);
  const [idx, setIdx] = useState(0);
  const [beat, setBeat] = useState(0);
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setAuto(false);
  };

  const start = () => {
    stop();
    setAuto(true);
    setIdx(0);
    setBeat(0);
    strumChord(PROG[0].frets);
    let bt = 0;
    let pi = 0;
    timer.current = window.setInterval(() => {
      bt = (bt + 1) % 4;
      setBeat(bt);
      if (bt === 0) {
        pi = (pi + 1) % PROG.length;
        setIdx(pi);
        strumChord(PROG[pi].frets);
      } else {
        metroTick(false);
      }
    }, 60000 / 80);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        <b>1645 进行：C → G → Am → F</b> 循环，每个和弦 4 拍。无数流行歌的伴奏就是它：
      </p>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {PROG.map((c, i) => (
          <button
            key={c.name}
            onClick={() => {
              setIdx(i);
              strumChord(c.frets);
            }}
            className={cn(
              "rounded-xl border py-4 text-center transition-all",
              idx === i
                ? "scale-105 border-emerald-300 bg-emerald-500 text-white shadow-lg"
                : "border-line bg-white/60 hover:border-emerald-300/50"
            )}
          >
            <span className={cn("block text-xl font-bold", idx === i ? "text-white" : "text-ink")}>
              {c.name}
            </span>
            <span className={cn("block text-xs", idx === i ? "text-white/85" : "text-fog")}>4 拍</span>
          </button>
        ))}
      </div>
      <div className="mb-3 flex justify-center gap-2">
        {[0, 1, 2, 3].map((b) => (
          <span
            key={b}
            className={cn(
              "h-3 w-3 rounded-full transition-all",
              auto && beat === b ? "scale-125 bg-emerald-500" : "bg-zinc-200"
            )}
          />
        ))}
      </div>
      <button
        onClick={auto ? stop : start}
        className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
      >
        {auto ? "⏹ 停" : "▶ 自动循环 1645"}
      </button>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        会了这四个和弦 + 这个进行，你已经能给很多歌伴奏了。右手先用“一下一下往下扫”，稳了再套第 2 章的节奏型。
      </p>
    </div>
  );
}

/* ================= 第 4 章 · 指弹与旋律 ================= */

/** 爬格子：6→1 弦，每弦 1-2-3-4 品，手指 1-2-3-4 对应 */
const CRAWL: { si: number; fret: number; finger: number }[] = (() => {
  const out: { si: number; fret: number; finger: number }[] = [];
  for (let si = 0; si <= 5; si++) {
    for (let f = 1; f <= 4; f++) out.push({ si, fret: f, finger: f });
  }
  return out;
})();

function CrawlWidget() {
  const [idx, setIdx] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const timer = useRef<number | null>(null);

  const playAt = (i: number) => {
    setIdx(i);
    const s = CRAWL[i];
    pluckFret(s.si, s.fret, 0.9);
  };

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setAuto(false);
  };

  const start = () => {
    stop();
    setAuto(true);
    let i = 0;
    playAt(0);
    timer.current = window.setInterval(() => {
      i += 1;
      if (i >= CRAWL.length) {
        stop();
        setIdx(null);
        return;
      }
      playAt(i);
    }, 380);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const FINGER_CN = ["", "食指", "中指", "无名指", "小指"];
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        爬格子 = 手指体操：从 6 弦 1 品开始，每根弦按 1-2-3-4 品爬过去，手指和品数一一对应（1=食指 2=中指 3=无名指 4=小指）：
      </p>
      <div className="mb-3 grid grid-cols-6 gap-1.5">
        {CRAWL.map((s, i) => (
          <button
            key={i}
            onClick={() => playAt(i)}
            className={cn(
              "rounded-lg border py-2 text-center text-xs transition-all active:scale-95",
              idx === i
                ? "border-emerald-500 bg-emerald-500 text-white shadow"
                : "border-line bg-white/70 text-zinc-700"
            )}
          >
            <span className="block font-bold">
              {STRING_LABEL[s.si]}
              {s.fret}品
            </span>
            <span className="text-[11px] opacity-80">{FINGER_CN[s.finger]}</span>
          </button>
        ))}
      </div>
      <button
        onClick={auto ? stop : start}
        className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
      >
        {auto ? "⏹ 停" : "▶ 自动爬一遍"}
      </button>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        每天爬 5 分钟，手指的灵活度和力量涨得最快。爬顺了可以倒着爬（4-3-2-1），再加速。
      </p>
    </div>
  );
}

/** C 大调音阶：do re mi fa sol la si do */
const SCALE_NOTES: { sol: string; name: string; si: number; fret: number }[] = [
  { sol: "do", name: "C", si: 1, fret: 3 },
  { sol: "re", name: "D", si: 1, fret: 5 },
  { sol: "mi", name: "E", si: 2, fret: 2 },
  { sol: "fa", name: "F", si: 2, fret: 3 },
  { sol: "sol", name: "G", si: 2, fret: 5 },
  { sol: "la", name: "A", si: 3, fret: 2 },
  { sol: "si", name: "B", si: 3, fret: 4 },
  { sol: "do", name: "C", si: 3, fret: 5 },
];

function ScaleWidget() {
  const [idx, setIdx] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const timer = useRef<number | null>(null);

  const playAt = (i: number) => {
    setIdx(i);
    const n = SCALE_NOTES[i];
    pluckFret(n.si, n.fret, 0.95);
  };

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setAuto(false);
  };

  const start = (down = false) => {
    stop();
    setAuto(true);
    const order = down
      ? SCALE_NOTES.map((_, i) => SCALE_NOTES.length - 1 - i)
      : SCALE_NOTES.map((_, i) => i);
    let k = 0;
    playAt(order[0]);
    timer.current = window.setInterval(() => {
      k += 1;
      if (k >= order.length) {
        stop();
        return;
      }
      playAt(order[k]);
    }, 480);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        C 大调音阶就是 do re mi fa sol la si do，在吉他上是这样按的（点每个音听）：
      </p>
      <div className="mb-3 grid grid-cols-8 gap-1.5">
        {SCALE_NOTES.map((n, i) => (
          <button
            key={i}
            onClick={() => playAt(i)}
            className={cn(
              "rounded-xl border py-3 text-center transition-all active:scale-95",
              idx === i
                ? "border-emerald-500 bg-emerald-500 text-white shadow"
                : "border-line bg-white/70 hover:border-emerald-300/50"
            )}
          >
            <span className={cn("block text-sm font-bold", idx === i ? "text-white" : "text-ink")}>
              {n.sol}
            </span>
            <span className={cn("block text-[11px]", idx === i ? "text-white/85" : "text-fog")}>
              {n.name}
              <br />
              {STRING_LABEL[n.si]}
              {n.fret}品
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => (auto ? stop() : start(false))}
          className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
        >
          {auto ? "⏹ 停" : "▶ 上行（do→do）"}
        </button>
        <button
          onClick={() => (auto ? stop() : start(true))}
          className="rounded-full border border-emerald-300 bg-white px-6 py-3 text-sm font-medium text-emerald-700 transition-transform active:scale-95"
        >
          ◀ 下行（do→do）
        </button>
      </div>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        音阶是旋律的原材料：先把上行下行弹顺，弹歌的时候找音就快多了。
      </p>
    </div>
  );
}

/** 《小星星》完整旋律：1 弦 = 索引 5，2 弦 = 索引 4 */
const TWINKLE_FULL: { si: number; fret: number; name: string }[] = [
  // C C G G A A G
  { si: 5, fret: 8, name: "C" }, { si: 5, fret: 8, name: "C" },
  { si: 5, fret: 3, name: "G" }, { si: 5, fret: 3, name: "G" },
  { si: 5, fret: 5, name: "A" }, { si: 5, fret: 5, name: "A" },
  { si: 5, fret: 3, name: "G" },
  // F F E E D D C
  { si: 4, fret: 6, name: "F" }, { si: 4, fret: 6, name: "F" },
  { si: 4, fret: 5, name: "E" }, { si: 4, fret: 5, name: "E" },
  { si: 4, fret: 3, name: "D" }, { si: 4, fret: 3, name: "D" },
  { si: 4, fret: 1, name: "C" },
  // G G F F E E D
  { si: 5, fret: 3, name: "G" }, { si: 5, fret: 3, name: "G" },
  { si: 4, fret: 6, name: "F" }, { si: 4, fret: 6, name: "F" },
  { si: 4, fret: 5, name: "E" }, { si: 4, fret: 5, name: "E" },
  { si: 4, fret: 3, name: "D" },
  // G G F F E E D
  { si: 5, fret: 3, name: "G" }, { si: 5, fret: 3, name: "G" },
  { si: 4, fret: 6, name: "F" }, { si: 4, fret: 6, name: "F" },
  { si: 4, fret: 5, name: "E" }, { si: 4, fret: 5, name: "E" },
  { si: 4, fret: 3, name: "D" },
  // C C G G A A G
  { si: 5, fret: 8, name: "C" }, { si: 5, fret: 8, name: "C" },
  { si: 5, fret: 3, name: "G" }, { si: 5, fret: 3, name: "G" },
  { si: 5, fret: 5, name: "A" }, { si: 5, fret: 5, name: "A" },
  { si: 5, fret: 3, name: "G" },
  // F F E E D D C
  { si: 4, fret: 6, name: "F" }, { si: 4, fret: 6, name: "F" },
  { si: 4, fret: 5, name: "E" }, { si: 4, fret: 5, name: "E" },
  { si: 4, fret: 3, name: "D" }, { si: 4, fret: 3, name: "D" },
  { si: 4, fret: 1, name: "C" },
];

function MelodyWidget() {
  const [idx, setIdx] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const timer = useRef<number | null>(null);

  const playAt = (i: number) => {
    setIdx(i);
    const n = TWINKLE_FULL[i];
    pluckFret(n.si, n.fret, 0.95);
  };

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setAuto(false);
  };

  const start = () => {
    stop();
    setAuto(true);
    let i = 0;
    playAt(0);
    timer.current = window.setInterval(() => {
      i += 1;
      if (i >= TWINKLE_FULL.length) {
        stop();
        setIdx(null);
        return;
      }
      playAt(i);
    }, 560);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const phrases = [0, 7, 14, 21, 28, 35];
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        整首《小星星》旋律，6 句、42 个音。点任意一个音听它，熟了点自动播放跟弹：
      </p>
      <div className="space-y-2">
        {phrases.map((startIdx, pi) => (
          <div key={pi} className="flex flex-wrap gap-1.5">
            {TWINKLE_FULL.slice(startIdx, startIdx + 7).map((n, k) => {
              const gi = startIdx + k;
              return (
                <button
                  key={gi}
                  onClick={() => playAt(gi)}
                  className={cn(
                    "min-w-[44px] rounded-lg border px-2 py-2 text-center text-xs transition-all active:scale-95",
                    idx === gi
                      ? "border-emerald-500 bg-emerald-500 text-white shadow"
                      : "border-line bg-white/70 text-zinc-700"
                  )}
                >
                  <span className="block font-bold">{n.name}</span>
                  <span className="text-[11px] opacity-80">
                    {STRING_LABEL[n.si]}
                    {n.fret}品
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <button
        onClick={auto ? stop : start}
        className="mt-4 rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
      >
        {auto ? "⏹ 停" : "▶ 自动弹整首《小星星》"}
      </button>
    </div>
  );
}

/* ================= 第 5 章 · 乐理一点通 ================= */

function SemiWidget() {
  const [first, setFirst] = useState<number | null>(null);
  const [second, setSecond] = useState<number | null>(null);

  const tap = (fret: number) => {
    pluckFret(5, fret, 0.9);
    if (first === null) setFirst(fret);
    else if (second === null && fret !== first) {
      setSecond(fret);
    } else {
      setFirst(fret);
      setSecond(null);
    }
  };

  const diff = first !== null && second !== null ? Math.abs(second - first) : null;
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        点 1 弦上的两个品，听听它们差多远。先点一个品，再点另一个：
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {Array.from({ length: 13 }).map((_, f) => (
          <button
            key={f}
            onClick={() => tap(f)}
            className={cn(
              "min-w-[40px] flex-1 rounded-lg border py-2.5 text-center text-xs font-bold transition-all active:scale-95",
              first === f || second === f
                ? "border-amber-500 bg-amber-100 text-amber-900"
                : "border-line bg-white/70 text-zinc-700"
            )}
          >
            {f === 0 ? "空弦" : `${f}品`}
          </button>
        ))}
      </div>
      <div className="min-h-[52px] rounded-xl bg-white/70 p-3 text-center text-sm leading-7">
        {diff === null ? (
          <span className="text-fog">点两个品，这里告诉你它们的关系。</span>
        ) : diff === 0 ? (
          <span>同一个品，同一个音。</span>
        ) : diff === 1 ? (
          <span>
            <b className="text-emerald-700">相差 1 品 = 半音</b>（最小的距离，比如 mi 到 fa、si 到 do 之间就是半音）。
          </span>
        ) : diff === 2 ? (
          <span>
            <b className="text-emerald-700">相差 2 品 = 全音</b>（中间隔了一个半音，比如 do 到 re）。
          </span>
        ) : (
          <span>
            相差 {diff} 品 = {diff} 个半音（{Math.floor(diff / 2)} 个全音
            {diff % 2 === 1 ? " + 1 个半音" : ""}）。
          </span>
        )}
      </div>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        记住就够了：<b>相邻两品 = 半音，隔一品 = 全音</b>。整个音乐理论都从这两个词长出来。
      </p>
    </div>
  );
}

const FORMULA: { sol: string; name: string; fret: number; step: string }[] = [
  { sol: "do", name: "C", fret: 8, step: "起" },
  { sol: "re", name: "D", fret: 10, step: "全音" },
  { sol: "mi", name: "E", fret: 12, step: "全音" },
  { sol: "fa", name: "F", fret: 13, step: "半音" },
  { sol: "sol", name: "G", fret: 15, step: "全音" },
  { sol: "la", name: "A", fret: 17, step: "全音" },
  { sol: "si", name: "B", fret: 19, step: "全音" },
  { sol: "do", name: "C", fret: 20, step: "半音" },
];

function ScaleFormulaWidget() {
  const [idx, setIdx] = useState<number | null>(null);
  const playAt = (i: number) => {
    setIdx(i);
    pluckFret(5, FORMULA[i].fret, 0.95);
  };
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        大调音阶有个固定公式：<b>全 全 半 全 全 全 半</b>。从 do 出发按这个公式走，走到哪都是大调：
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {FORMULA.map((n, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <button
              onClick={() => playAt(i)}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition-all active:scale-95",
                idx === i
                  ? "border-emerald-500 bg-emerald-500 text-white shadow"
                  : "border-line bg-white/70 hover:border-emerald-300/50"
              )}
            >
              <span className={cn("block text-sm font-bold", idx === i ? "text-white" : "text-ink")}>
                {n.sol}
              </span>
              <span className={cn("block text-[11px]", idx === i ? "text-white/85" : "text-fog")}>
                {n.name} · 1弦{n.fret}品
              </span>
            </button>
            {i < FORMULA.length - 1 && (
              <span className="text-[11px] font-bold text-amber-600">
                {FORMULA[i + 1].step}
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="text-[13px] leading-6 text-fog">
        口诀：<b>全全半、全全全半</b>。mi 到 fa 是半音、si 到 do 是半音，其他全是全音——这就是为什么 do re mi 听起来永远那么顺。
      </p>
    </div>
  );
}

function ChordBuildWidget() {
  const notes = [
    { name: "C（do）", si: 1, fret: 3 },
    { name: "E（mi）", si: 2, fret: 2 },
    { name: "G（sol）", si: 3, fret: 0 },
  ];
  const [played, setPlayed] = useState<boolean[]>([false, false, false]);
  const playOne = (i: number) => {
    const n = notes[i];
    if (n.fret === 0) pluckOpen(n.si, 0.95);
    else pluckFret(n.si, n.fret, 0.95);
    setPlayed((p) => p.map((v, k) => (k === i ? true : v)));
  };
  const playAll = () => {
    strumChord(LEARN_CHORDS[2].frets);
    setPlayed([true, true, true]);
  };
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        和弦不是随便几个音凑的。以 C 和弦为例：从 do 开始，<b>每隔一个音取一个</b>——do（跳过 re）mi（跳过 fa）sol：
      </p>
      <div className="mb-3 flex items-center gap-2">
        {notes.map((n, i) => (
          <span key={i} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => playOne(i)}
              className={cn(
                "flex-1 rounded-xl border py-4 text-center text-sm font-bold transition-all active:scale-95",
                played[i]
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-line bg-white/70 hover:border-emerald-300/50"
              )}
            >
              {n.name}
            </button>
            {i < notes.length - 1 && <span className="text-zinc-300">+</span>}
          </span>
        ))}
        <span className="text-zinc-300">=</span>
        <button
          onClick={playAll}
          className="flex-1 rounded-xl border border-emerald-300 bg-emerald-500 py-4 text-center text-sm font-bold text-white shadow transition-all active:scale-95"
        >
          C 和弦 ♪
        </button>
      </div>
      <p className="text-[13px] leading-6 text-fog">
        <b>1 - 3 - 5</b>：第 1、3、5 个音拼起来就是大三和弦。Am 是 la do mi（A C E），G 是 sol si re（G B D）——全是一个套路。
      </p>
    </div>
  );
}

/* ================= 第 6 章 · 游戏馆 ================= */

function StringQuiz() {
  const ROUNDS = 5;
  const [phase, setPhase] = useState<"idle" | "asking" | "done">("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  const newQ = () => {
    const t = Math.floor(Math.random() * 6);
    setTarget(t);
    setPicked(null);
    pluckOpen(t, 0.95);
  };
  const start = () => {
    setRound(0);
    setScore(0);
    setPhase("asking");
    window.setTimeout(newQ, 300);
  };
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === target) setScore((s) => s + 1);
  };
  const next = () => {
    if (round + 1 >= ROUNDS) setPhase("done");
    else {
      setRound((r) => r + 1);
      window.setTimeout(newQ, 300);
    }
  };

  if (phase === "idle")
    return (
      <div className="text-center">
        <p className="mb-4 text-sm leading-7 text-zinc-600">
          放一根空弦的声音，你猜是第几弦。共 {ROUNDS} 题，粗弦低沉、细弦明亮：
        </p>
        <button onClick={start} className="btn-primary px-8 py-3 text-[15px]">
          开始游戏 🔊
        </button>
      </div>
    );
  if (phase === "done")
    return (
      <div className="text-center">
        <p className="text-4xl">{score >= 4 ? "🎉" : score >= 3 ? "👍" : "💪"}</p>
        <p className="mt-3 text-[15px] font-medium text-zinc-800">
          {ROUNDS} 题对了 {score} 题
        </p>
        <button onClick={start} className="btn-pill mt-4 px-6 py-2.5 text-sm">
          再玩一次
        </button>
      </div>
    );
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[13px] text-fog">
        <span>
          第 {round + 1} / {ROUNDS} 题
        </span>
        <span>得分：{score}</span>
        <button onClick={() => target !== null && pluckOpen(target, 0.95)} className="text-emerald-700 underline">
          🔊 再听一次
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={picked !== null}
            className={cn(
              "rounded-2xl border-2 py-4 text-base font-bold transition-all active:scale-95",
              picked === null
                ? "border-emerald-200 bg-white hover:border-emerald-400"
                : i === target
                  ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                  : picked === i
                    ? "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-zinc-200 bg-white opacity-60"
            )}
          >
            {STRING_LABEL[i]}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="mt-3 text-center">
          <p className={cn("text-sm font-medium", picked === target ? "text-emerald-700" : "text-amber-700")}>
            {picked === target ? "✅ 对啦！" : `💡 是${STRING_LABEL[target!]}，记住它的声音`}
          </p>
          <button onClick={next} className="btn-primary mt-2 px-6 py-2 text-sm">
            {round + 1 >= ROUNDS ? "看成绩" : "下一题 →"}
          </button>
        </div>
      )}
    </div>
  );
}

function FretFind() {
  const ROUNDS = 5;
  const NATURALS = ["C", "D", "E", "F", "G", "A", "B"];
  const [phase, setPhase] = useState<"idle" | "asking" | "done">("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState("G");
  const [tried, setTried] = useState<string[]>([]);
  const [found, setFound] = useState(false);

  const newQ = () => {
    setTarget(NATURALS[Math.floor(Math.random() * NATURALS.length)]);
    setTried([]);
    setFound(false);
  };
  const start = () => {
    setRound(0);
    setScore(0);
    setPhase("asking");
    newQ();
  };
  const tap = (si: number, fret: number) => {
    if (found) return;
    pluckFret(si, fret, 0.9);
    const key = `${si}-${fret}`;
    if (tried.includes(key)) return;
    setTried((t) => [...t, key]);
    const name = noteName(fretFreq(STRING_BASE[si], fret)).name;
    if (name === target) {
      setFound(true);
      setScore((s) => s + 1);
    }
  };
  const next = () => {
    if (round + 1 >= ROUNDS) setPhase("done");
    else {
      setRound((r) => r + 1);
      newQ();
    }
  };

  if (phase === "idle")
    return (
      <div className="text-center">
        <p className="mb-4 text-sm leading-7 text-zinc-600">
          在指板上找到指定的音（1～5 品 + 空弦）。点格子会出声，找对了就过关，共 {ROUNDS} 题：
        </p>
        <button onClick={start} className="btn-primary px-8 py-3 text-[15px]">
          开始游戏 🎯
        </button>
      </div>
    );
  if (phase === "done")
    return (
      <div className="text-center">
        <p className="text-4xl">{score >= 4 ? "🎉" : score >= 3 ? "👍" : "💪"}</p>
        <p className="mt-3 text-[15px] font-medium text-zinc-800">
          {ROUNDS} 题找到了 {score} 个音
        </p>
        <button onClick={start} className="btn-pill mt-4 px-6 py-2.5 text-sm">
          再玩一次
        </button>
      </div>
    );
  const rows = [5, 4, 3, 2, 1, 0];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[13px] text-fog">
        <span>
          第 {round + 1} / {ROUNDS} 题
        </span>
        <span>得分：{score}</span>
      </div>
      <p className="mb-3 text-center text-lg font-bold">
        请找出：<span className="text-emerald-700">{target}</span> 音
      </p>
      <div className="overflow-x-auto rounded-xl border border-line bg-white/70 p-2">
        <div className="min-w-[380px]">
          {rows.map((si) => (
            <div key={si} className="flex items-center">
              <span className="w-8 flex-none text-center text-[11px] font-bold text-fog">
                {STRING_LABEL[si]}
              </span>
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3, 4, 5].map((fret) => {
                  const key = `${si}-${fret}`;
                  const hit = found && noteName(fretFreq(STRING_BASE[si], fret)).name === target;
                  return (
                    <button
                      key={fret}
                      onClick={() => tap(si, fret)}
                      className={cn(
                        "h-10 flex-1 rounded-md border text-xs font-bold transition-all active:scale-95",
                        hit
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : tried.includes(key)
                            ? "border-zinc-200 bg-zinc-100 text-zinc-400"
                            : "border-zinc-200 bg-white hover:border-amber-300"
                      )}
                    >
                      {fret === 0 ? "空" : fret}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {found && (
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-emerald-700">✅ 找到了！{target} 音就在这里。</p>
          <button onClick={next} className="btn-primary mt-2 px-6 py-2 text-sm">
            {round + 1 >= ROUNDS ? "看成绩" : "下一题 →"}
          </button>
        </div>
      )}
    </div>
  );
}

function ChordQuiz() {
  const ROUNDS = 5;
  const pool = [...LEARN_CHORDS, ...NEW_CHORDS, F_EASY];
  const [phase, setPhase] = useState<"idle" | "asking" | "done">("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<ChordDef>(pool[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);

  const newQ = () => {
    const t = pool[Math.floor(Math.random() * pool.length)];
    const others = pool.filter((c) => c.name !== t.name);
    const opts = [t.name];
    while (opts.length < 4 && others.length > 0) {
      const o = others.splice(Math.floor(Math.random() * others.length), 1)[0];
      opts.push(o.name);
    }
    opts.sort(() => Math.random() - 0.5);
    setTarget(t);
    setOptions(opts);
    setPicked(null);
  };
  const start = () => {
    setRound(0);
    setScore(0);
    setPhase("asking");
    newQ();
  };
  const pick = (n: string) => {
    if (picked !== null) return;
    setPicked(n);
    if (n === target.name) setScore((s) => s + 1);
  };
  const next = () => {
    if (round + 1 >= ROUNDS) setPhase("done");
    else {
      setRound((r) => r + 1);
      newQ();
    }
  };

  if (phase === "idle")
    return (
      <div className="text-center">
        <p className="mb-4 text-sm leading-7 text-zinc-600">
          看和弦图，猜它是哪个和弦。共 {ROUNDS} 题：
        </p>
        <button onClick={start} className="btn-primary px-8 py-3 text-[15px]">
          开始挑战 🎯
        </button>
      </div>
    );
  if (phase === "done")
    return (
      <div className="text-center">
        <p className="text-4xl">{score >= 4 ? "🎉" : score >= 3 ? "👍" : "💪"}</p>
        <p className="mt-3 text-[15px] font-medium text-zinc-800">
          {ROUNDS} 题对了 {score} 题
        </p>
        <button onClick={start} className="btn-pill mt-4 px-6 py-2.5 text-sm">
          再玩一次
        </button>
      </div>
    );
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[13px] text-fog">
        <span>
          第 {round + 1} / {ROUNDS} 题
        </span>
        <span>得分：{score}</span>
      </div>
      <div className="mb-3 flex justify-center">
        <div className="rounded-2xl border border-line bg-white/70 p-2">
          <ChordDiagram chord={target} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => pick(n)}
            disabled={picked !== null}
            className={cn(
              "rounded-2xl border-2 py-4 text-lg font-bold transition-all active:scale-95",
              picked === null
                ? "border-emerald-200 bg-white hover:border-emerald-400"
                : n === target.name
                  ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                  : picked === n
                    ? "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-zinc-200 bg-white opacity-60"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="mt-3 text-center">
          <p className={cn("text-sm font-medium", picked === target.name ? "text-emerald-700" : "text-amber-700")}>
            {picked === target.name ? "✅ 对啦！" : `💡 是 ${target.name}`}
          </p>
          <button onClick={next} className="btn-primary mt-2 px-6 py-2 text-sm">
            {round + 1 >= ROUNDS ? "看成绩" : "下一题 →"}
          </button>
        </div>
      )}
    </div>
  );
}

const STRUM_QUIZ_PATTERNS: { label: string; slots: ("down" | "up" | "rest")[] }[] = [
  {
    label: "↓ · ↓ ↑ · ↑ ↓ ↑",
    slots: ["down", "rest", "down", "up", "rest", "up", "down", "up"],
  },
  {
    label: "↓ · ↓ · ↓ ↑ · ↑",
    slots: ["down", "rest", "down", "rest", "down", "up", "rest", "up"],
  },
  {
    label: "↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑",
    slots: ["down", "up", "down", "up", "down", "up", "down", "up"],
  },
];

function StrumQuiz() {
  const ROUNDS = 3;
  const [phase, setPhase] = useState<"idle" | "asking" | "done">("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);
  const chord = LEARN_CHORDS[0];

  const stopPlay = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
  };

  const playPattern = (pi: number) => {
    stopPlay();
    setPlaying(true);
    const slots = STRUM_QUIZ_PATTERNS[pi].slots;
    let i = 0;
    const step = () => {
      const s = slots[i];
      if (s === "down") strumChord(chord.frets, true);
      else if (s === "up") strumChord(chord.frets, false);
      i += 1;
      if (i >= slots.length) stopPlay();
    };
    step();
    timer.current = window.setInterval(step, 300);
  };

  useEffect(() => () => stopPlay(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const newQ = () => {
    const t = Math.floor(Math.random() * STRUM_QUIZ_PATTERNS.length);
    setTarget(t);
    setPicked(null);
    window.setTimeout(() => playPattern(t), 400);
  };
  const start = () => {
    setRound(0);
    setScore(0);
    setPhase("asking");
    newQ();
  };
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === target) setScore((s) => s + 1);
  };
  const next = () => {
    if (round + 1 >= ROUNDS) setPhase("done");
    else {
      setRound((r) => r + 1);
      const t = Math.floor(Math.random() * STRUM_QUIZ_PATTERNS.length);
      setTarget(t);
      setPicked(null);
      window.setTimeout(() => playPattern(t), 400);
    }
  };

  if (phase === "idle")
    return (
      <div className="text-center">
        <p className="mb-4 text-sm leading-7 text-zinc-600">
          听一段扫弦，猜它是下面哪种节奏型。共 {ROUNDS} 题，仔细听上下扫的区别：
        </p>
        <button onClick={start} className="btn-primary px-8 py-3 text-[15px]">
          开始游戏 🎧
        </button>
      </div>
    );
  if (phase === "done")
    return (
      <div className="text-center">
        <p className="text-4xl">{score >= 2 ? "🎉" : "💪"}</p>
        <p className="mt-3 text-[15px] font-medium text-zinc-800">
          {ROUNDS} 题对了 {score} 题
        </p>
        <button onClick={start} className="btn-pill mt-4 px-6 py-2.5 text-sm">
          再玩一次
        </button>
      </div>
    );
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[13px] text-fog">
        <span>
          第 {round + 1} / {ROUNDS} 题
        </span>
        <span>得分：{score}</span>
        <button onClick={() => playPattern(target)} className="text-emerald-700 underline">
          🔊 再听一次
        </button>
      </div>
      <div className="space-y-2">
        {STRUM_QUIZ_PATTERNS.map((p, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={picked !== null}
            className={cn(
              "w-full rounded-2xl border-2 py-4 text-center font-mono text-base font-bold tracking-wider transition-all active:scale-95",
              picked === null
                ? "border-emerald-200 bg-white hover:border-emerald-400"
                : i === target
                  ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                  : picked === i
                    ? "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-zinc-200 bg-white opacity-60"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="mt-3 text-center">
          <p className={cn("text-sm font-medium", picked === target ? "text-emerald-700" : "text-amber-700")}>
            {picked === target ? "✅ 对啦！耳朵很灵。" : `💡 是第 ${target + 1} 种：${STRUM_QUIZ_PATTERNS[target].label}`}
          </p>
          <button onClick={next} className="btn-primary mt-2 px-6 py-2 text-sm">
            {round + 1 >= ROUNDS ? "看成绩" : "下一题 →"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= 课程表 ================= */

export const moreLessons: Lesson[] = [
  {
    id: "metro",
    title: "节拍器：音乐的心跳",
    sub: "4/4 拍，数稳了再拿琴",
    chapter: "第 2 章 · 节奏与扫弦",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>一首歌的速度叫<b>拍子</b>。最常见的叫 <b>4/4 拍</b>：每小节 4 拍，每拍均匀地走，像心跳一样。</Para>
        <Para>节拍器就是帮你数拍子的工具。先别拿琴，开着它数一数 👇</Para>
      </div>,
      <IBox key="s2"><MetroWidget /></IBox>,
      <Remember key="s3">弹琴时心里永远数着 <b>1-2-3-4</b>。节奏稳了，弹什么都好听一半。</Remember>,
    ],
  },
  {
    id: "strum-dir",
    title: "下扫和上扫",
    sub: "扫弦的两个基本方向",
    chapter: "第 2 章 · 节奏与扫弦",
    steps: [
      <div key="s1" className="space-y-3">
        <Para><b>扫弦 = 一次拨响好几根弦。</b>手从上往下扫叫下扫，从下往上挑叫上扫。</Para>
        <Para>选个和弦，两个方向都试试 👇</Para>
      </div>,
      <IBox key="s2"><StrumDirWidget /></IBox>,
      <Remember key="s3">下扫声音厚实、上扫声音明亮。手腕放松，像甩水，别抡胳膊。</Remember>,
    ],
  },
  {
    id: "strum-pattern",
    title: "第一个扫弦节奏型",
    sub: "↓ · ↓↑ · ↑↓↑，手不停摆",
    chapter: "第 2 章 · 节奏与扫弦",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>把下扫、上扫按顺序排起来，就是<b>节奏型</b>。这是最常用的入门节奏型，一小节 8 个半拍：</Para>
        <Para>↓ · ↓↑ · ↑↓↑（· 表示这半拍空过，但手要继续摆动）。</Para>
      </div>,
      <IBox key="s2"><PatternWidget /></IBox>,
      <Remember key="s3"><b>右手一直摆动不停</b>，碰到 · 只是不碰弦。手不停，节奏就不会乱。</Remember>,
    ],
  },
  {
    id: "mute",
    title: "切音：让音乐呼吸",
    sub: "右手掌根一压，声音立刻收住",
    chapter: "第 2 章 · 节奏与扫弦",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>一直响的扫弦听久了会闷。<b>切音</b>就是用右手掌根轻轻压住琴弦，让声音戛然而止。</Para>
        <Para>扫响、切住，反复试几次 👇</Para>
      </div>,
      <IBox key="s2"><MuteWidget /></IBox>,
      <Remember key="s3">切音 = 音乐的标点符号。有了它，扫弦立刻有了断句和呼吸感。</Remember>,
    ],
  },
  {
    id: "chords-2",
    title: "三个新和弦：Dm、E、A",
    sub: "和弦库扩到 8 个",
    chapter: "第 3 章 · 和弦进阶",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>会了 Em、Am、C、G、D，再加三个：<b>Dm（忧伤）、E（亮堂）、A（饱满）</b>。</Para>
        <Para>练法不变：摆好 → 逐根拨检查 → 闭眼 3 秒摆好 👇</Para>
      </div>,
      <IBox key="s2"><NewChordsWidget /></IBox>,
    ],
  },
  {
    id: "f-chord",
    title: "F：先练简化版",
    sub: "吉他第一道坎，绕过去再攻",
    chapter: "第 3 章 · 和弦进阶",
    steps: [
      <div key="s1" className="space-y-3">
        <Para><b>F 是新手第一道坎</b>，因为它要大横按——一根食指按住 6 根弦。</Para>
        <Para>别硬刚：先练简化版（小横按，只按 1～4 弦），声音几乎一样，弹歌完全够用 👇</Para>
      </div>,
      <IBox key="s2"><FChordWidget /></IBox>,
      <Remember key="s3">简化版弹顺了，手指有力了，再挑战完整大横按。所有吉他手都是这么过来的。</Remember>,
    ],
  },
  {
    id: "chord-switch",
    title: "换和弦：跟节拍器换",
    sub: "4 拍一换，换不掉拍才算会",
    chapter: "第 3 章 · 和弦进阶",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>单个和弦按得再好，换的时候掉拍子，歌还是断的。<b>换和弦的标准：不掉拍。</b></Para>
        <Para>选两个和弦，跟节拍器练 👇</Para>
      </div>,
      <IBox key="s2"><SwitchWidget /></IBox>,
      <Remember key="s3">小窍门：<b>先动最难的那根手指</b>，其他手指跟上；换的时候右手别停。</Remember>,
    ],
  },
  {
    id: "prog-1645",
    title: "万能进行：1645",
    sub: "C → G → Am → F，无数歌的伴奏",
    chapter: "第 3 章 · 和弦进阶",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>流行歌有个万能公式：<b>1 - 6 - 4 - 5</b> 级和弦循环。在 C 调里就是 C → G → Am → F。</Para>
        <Para>会了这四个和弦，你已经能给很多歌伴奏了 👇</Para>
      </div>,
      <IBox key="s2"><ProgWidget /></IBox>,
      <Remember key="s3">1645 是“万能”不是“唯一”：先把它弹稳，再去发现别的进行。</Remember>,
    ],
  },
  {
    id: "crawl",
    title: "爬格子：手指体操",
    sub: "每天 5 分钟，手指越来越听话",
    chapter: "第 4 章 · 指弹与旋律",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>爬格子是吉他手的热身操：每根弦按 1-2-3-4 品爬过去，手指和品数一一对应。</Para>
        <Para>从 6 弦开始，一个个点过去 👇</Para>
      </div>,
      <IBox key="s2"><CrawlWidget /></IBox>,
      <Remember key="s3">爬顺了就倒着爬（4-3-2-1），再慢慢加速。手指灵活度就是这样涨的。</Remember>,
    ],
  },
  {
    id: "scale",
    title: "C 大调音阶",
    sub: "do re mi fa sol la si do 在吉他上",
    chapter: "第 4 章 · 指弹与旋律",
    steps: [
      <div key="s1" className="space-y-3">
        <Para><b>音阶 = 旋律的原材料。</b>C 大调音阶就是 do re mi fa sol la si do，在吉他上按下面这样走：</Para>
      </div>,
      <IBox key="s2"><ScaleWidget /></IBox>,
      <Remember key="s3">上行下行都弹顺了，弹歌时找音就快多了——因为歌里的音大多就在这个音阶里。</Remember>,
    ],
  },
  {
    id: "melody",
    title: "弹完整《小星星》旋律",
    sub: "6 句 42 个音，一首真正的曲子",
    chapter: "第 4 章 · 指弹与旋律",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>前面只弹过第一句，现在弹<b>整首</b>：1 弦和 2 弦配合，6 句、42 个音。</Para>
        <Para>先一句一句点熟，再自动播放跟弹 👇</Para>
      </div>,
      <IBox key="s2"><MelodyWidget /></IBox>,
      <Remember key="s3">能从头到尾不断地弹下来，就是你的第一首完整曲子。录下来发给朋友听听！</Remember>,
    ],
  },
  {
    id: "semi-tone",
    title: "全音和半音",
    sub: "整个乐理的起点，只有两个词",
    chapter: "第 5 章 · 乐理一点通",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>音乐里音和音的距离只有两种：<b>半音</b>（最小的距离）和<b>全音</b>（两个半音）。</Para>
        <Para>在吉他上：相邻两品 = 半音，隔一品 = 全音。亲手点两个品验证 👇</Para>
      </div>,
      <IBox key="s2"><SemiWidget /></IBox>,
    ],
  },
  {
    id: "scale-formula",
    title: "大调音阶的公式",
    sub: "全 全 半 全 全 全 半，走到哪都是大调",
    chapter: "第 5 章 · 乐理一点通",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>为什么 do re mi 听起来永远那么顺？因为它遵循固定公式：<b>全 全 半 全 全 全 半</b>。</Para>
        <Para>从任何一个音出发按这个公式走，得到的都是大调音阶 👇</Para>
      </div>,
      <IBox key="s2"><ScaleFormulaWidget /></IBox>,
      <Remember key="s3">口诀：<b>全全半、全全全半</b>。mi 到 fa 半音、si 到 do 半音，其他全是全音。</Remember>,
    ],
  },
  {
    id: "chord-build",
    title: "和弦是怎么来的",
    sub: "1 - 3 - 5，每隔一个音取一个",
    chapter: "第 5 章 · 乐理一点通",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>和弦不是随便凑的：从一个音出发，<b>每隔一个音取一个</b>，取三个就是三和弦。</Para>
        <Para>C 和弦 = do、mi、sol（1 - 3 - 5）。先逐个听，再合起来 👇</Para>
      </div>,
      <IBox key="s2"><ChordBuildWidget /></IBox>,
      <Remember key="s3">Am = la do mi，G = sol si re——全是一个套路。懂了这个，和弦图就不再是死记硬背。</Remember>,
    ],
  },
  {
    id: "game-strings",
    title: "游戏：听音辨弦",
    sub: "粗弦低沉、细弦明亮，分得清吗",
    chapter: "第 6 章 · 游戏馆",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>耳朵练好了，调音、找音全靠它。放一根空弦的声音，猜是第几弦 👇</Para>
      </div>,
      <IBox key="s2"><StringQuiz /></IBox>,
    ],
  },
  {
    id: "game-fretfind",
    title: "游戏：指板找音",
    sub: "在指板上猎取指定的音",
    chapter: "第 6 章 · 游戏馆",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>给你一个音名，在指板（1～5 品 + 空弦）里把它找出来。点格子会出声，找对过关 👇</Para>
      </div>,
      <IBox key="s2"><FretFind /></IBox>,
      <Remember key="s3">玩熟了，整个指板在你脑子里就是一张地图，弹歌找音不用再一个个试。</Remember>,
    ],
  },
  {
    id: "game-chordquiz",
    title: "游戏：和弦快问快答",
    sub: "看图识和弦，5 题挑战",
    chapter: "第 6 章 · 游戏馆",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>前面学的和弦都记住了吗？看图猜名，5 题见分晓 👇</Para>
      </div>,
      <IBox key="s2"><ChordQuiz /></IBox>,
    ],
  },
  {
    id: "game-strumquiz",
    title: "游戏：扫弦节奏猜猜",
    sub: "听一段扫弦，猜它的节奏型",
    chapter: "第 6 章 · 游戏馆",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>扫弦听多了，耳朵能分辨上下扫的差别。听一段，猜它是下面哪种节奏型 👇</Para>
      </div>,
      <IBox key="s2"><StrumQuiz /></IBox>,
      <Remember key="s3">这个游戏练的是“节奏耳朵”——以后听歌能直接听出伴奏的扫弦 pattern。</Remember>,
    ],
  },
];
