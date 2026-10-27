"use client";

/**
 * PianoPanel — 更好用的在线钢琴
 *
 * 3 个八度（C3～B5），按住琴键持续发声、松手收声（像真钢琴），
 * 带延音踏板、唱名/音名标注切换、演示 + 跟弹过关两种练琴模式。
 */
import { useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { ac, midiFreq, noteName, cnName } from "@/lib/audio";
import { cn } from "@/lib/utils";

const NOTE_LETTERS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface PKey {
  midi: number;
  letter: string;
  oct: number;
  black: boolean;
}

const KEYS: PKey[] = (() => {
  const out: PKey[] = [];
  for (let m = 48; m <= 83; m++) {
    const letter = NOTE_LETTERS[m % 12];
    out.push({ midi: m, letter, oct: Math.floor(m / 12) - 1, black: letter.includes("#") });
  }
  return out;
})();

const SOLFEGE: Record<string, string> = {
  C: "do",
  D: "re",
  E: "mi",
  F: "fa",
  G: "sol",
  A: "la",
  B: "si",
};

const SONGS = [
  {
    id: "twinkle",
    title: "小星星",
    notes: [
      60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60, 67, 67, 65, 65, 64, 64, 62,
      67, 67, 65, 65, 64, 64, 62, 60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60,
    ],
  },
  {
    id: "ode",
    title: "欢乐颂",
    notes: [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62],
  },
];

type Mode = "free" | "demo" | "follow";
type Tone = "piano" | "organ" | "synth";
type LabelMode = "solfege" | "name" | "none";

interface Voice {
  oscs: OscillatorNode[];
  gain: GainNode;
}

export function PianoPanel() {
  const [tone, setTone] = useState<Tone>("piano");
  const [vol, setVol] = useState(70);
  const [labelMode, setLabelMode] = useState<LabelMode>("solfege");
  const [pedal, setPedal] = useState(false);
  const [mode, setMode] = useState<Mode>("free");
  const [songId, setSongId] = useState("twinkle");
  const [active, setActive] = useState<Set<number>>(new Set());
  const [lastLabel, setLastLabel] = useState("—");
  const [demoIdx, setDemoIdx] = useState(-1);
  const [followIdx, setFollowIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [followDone, setFollowDone] = useState(false);
  const [wrongMidi, setWrongMidi] = useState<number | null>(null);

  const masterRef = useRef<GainNode | null>(null);
  const voicesRef = useRef(new Map<number, Voice>());
  const sustainedRef = useRef(new Set<number>());
  const timersRef = useRef<number[]>([]);

  const toneRef = useRef(tone);
  const volRef = useRef(vol);
  const pedalRef = useRef(pedal);
  const modeRef = useRef(mode);
  const songRef = useRef(songId);
  const followRef = useRef(followIdx);
  toneRef.current = tone;
  volRef.current = vol;
  pedalRef.current = pedal;
  modeRef.current = mode;
  songRef.current = songId;
  followRef.current = followIdx;

  const song = SONGS.find((s) => s.id === songId) ?? SONGS[0];

  const getMaster = (): GainNode => {
    const c = ac();
    if (!masterRef.current) {
      const g = c.createGain();
      g.gain.value = (volRef.current / 100) * 0.9;
      g.connect(c.destination);
      masterRef.current = g;
    }
    return masterRef.current;
  };

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const stopVoice = (midi: number, fast = false) => {
    const v = voicesRef.current.get(midi);
    if (!v) return;
    voicesRef.current.delete(midi);
    sustainedRef.current.delete(midi);
    try {
      const c = ac();
      const t = c.currentTime;
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value, 0.0001), t);
      v.gain.gain.linearRampToValueAtTime(0.0001, t + (fast ? 0.05 : 0.15));
      v.oscs.forEach((o) => {
        try {
          o.stop(t + 0.25);
        } catch {
          /* 已停 */
        }
      });
    } catch {
      /* 忽略 */
    }
    setActive((prev) => {
      const n = new Set(prev);
      n.delete(midi);
      return n;
    });
  };

  const stopAll = () => {
    [...voicesRef.current.keys()].forEach((m) => stopVoice(m, true));
    sustainedRef.current.clear();
  };

  const noteOn = (midi: number) => {
    stopVoice(midi, true);
    const c = ac();
    const master = getMaster();
    const f = midiFreq(midi);
    const t = c.currentTime;
    const vol = 0.5;
    const tone = toneRef.current;
    const partials: [number, number, OscillatorType][] =
      tone === "piano"
        ? [[1, 1, "sine"], [2, 0.35, "sine"], [3, 0.18, "sine"], [4, 0.1, "sine"]]
        : tone === "organ"
          ? [[1, 0.9, "sine"], [2, 0.5, "sine"], [3, 0.4, "sine"], [4, 0.25, "sine"]]
          : [[1, 0.7, "sawtooth"], [2, 0.4, "sine"], [3, 0.5, "sine"]];
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(vol, 0.001), t + 0.012);
    if (tone === "piano") {
      // 钢琴音按住也会自然衰减
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    }
    gain.connect(master);
    const oscs = partials.map(([mult, amp, type]) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = f * mult;
      const og = c.createGain();
      og.gain.value = amp;
      o.connect(og);
      og.connect(gain);
      o.start(t);
      return o;
    });
    voicesRef.current.set(midi, { oscs, gain });
    const nn = noteName(f);
    setLastLabel(`${nn.name}${nn.oct} · ${SOLFEGE[nn.name.replace("#", "")] ?? ""} · ${f.toFixed(1)}Hz`);
    setActive((prev) => new Set(prev).add(midi));
  };

  const noteOff = (midi: number) => {
    if (!voicesRef.current.has(midi)) return;
    if (pedalRef.current) {
      sustainedRef.current.add(midi);
      return;
    }
    stopVoice(midi);
  };

  /** 按键：自由弹直接发声；跟弹模式还要判对错 */
  const press = (midi: number) => {
    noteOn(midi);
    if (modeRef.current === "follow" && !followDone) {
      const notes = (SONGS.find((s) => s.id === songRef.current) ?? SONGS[0]).notes;
      const idx = followRef.current;
      if (midi === notes[idx]) {
        setCorrect((n) => n + 1);
        if (idx + 1 >= notes.length) {
          setFollowDone(true);
        } else {
          setFollowIdx(idx + 1);
        }
      } else {
        setMistakes((n) => n + 1);
        setWrongMidi(midi);
        window.setTimeout(() => setWrongMidi((w) => (w === midi ? null : w)), 350);
      }
    }
  };

  const release = (midi: number) => noteOff(midi);

  const stopDemo = () => {
    clearTimers();
    setDemoIdx(-1);
  };

  const startDemo = () => {
    stopAll();
    stopDemo();
    setMode("demo");
    const notes = song.notes;
    let i = 0;
    const step = () => {
      if (i >= notes.length) {
        stopDemo();
        return;
      }
      const m = notes[i];
      setDemoIdx(i);
      noteOn(m);
      const dur = song.id === "ode" && i === notes.length - 1 ? 900 : 480;
      timersRef.current.push(window.setTimeout(() => noteOff(m), dur));
      i += 1;
      timersRef.current.push(window.setTimeout(step, 520));
    };
    step();
  };

  const startFollow = () => {
    stopAll();
    stopDemo();
    setMode("follow");
    setFollowIdx(0);
    setCorrect(0);
    setMistakes(0);
    setFollowDone(false);
  };

  const setFree = () => {
    stopAll();
    stopDemo();
    setMode("free");
  };

  const togglePedal = () => {
    const next = !pedal;
    setPedal(next);
    if (!next) {
      // 松开踏板：把踏板期间按住的音全部收住
      [...sustainedRef.current].forEach((m) => stopVoice(m));
      sustainedRef.current.clear();
    }
  };

  useEffect(
    () => () => {
      clearTimers();
      stopAll();
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (masterRef.current) masterRef.current.gain.value = (vol / 100) * 0.9;
  }, [vol]);

  // 电脑键盘：A 行对应 C4 起的琴键
  useEffect(() => {
    const keyMap: Record<string, number> = {
      a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
      k: 72, o: 73, l: 74, p: 75, ";": 76, "'": 77,
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const ae = document.activeElement;
      if (ae && /INPUT|TEXTAREA/.test(ae.tagName)) return;
      const midi = keyMap[e.key.toLowerCase()];
      if (midi !== undefined) press(midi);
    };
    const up = (e: KeyboardEvent) => {
      const midi = keyMap[e.key.toLowerCase()];
      if (midi !== undefined) release(midi);
    };
    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followDone]);

  const whites = KEYS.filter((k) => !k.black);
  const W = 44;
  const gap = 2;
  const whiteX = new Map<number, number>();
  whites.forEach((k, i) => whiteX.set(k.midi, i * (W + gap)));
  const targetMidi = mode === "follow" && !followDone ? song.notes[followIdx] : null;

  const keyLabel = (k: PKey): string => {
    if (labelMode === "none") return "";
    if (labelMode === "name") return `${k.letter}${k.oct}`;
    return k.black ? "" : (SOLFEGE[k.letter] ?? "");
  };

  return (
    <div>
      <Card>
        <CardTitle>
          在线钢琴{" "}
          <span className="ml-2 rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            三个八度 · 按住发声
          </span>
        </CardTitle>
        <p className="mt-2 text-[13px] leading-7 text-fog">
          鼠标、手指或电脑键盘都能弹（A～; 对应 C4 起的琴键）。按住琴键持续发声，松手收声；开延音踏板后，松手声音也会延续。
        </p>

        {/* 模式切换 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={setFree}
            className={cn("btn-pill px-4 py-2 text-sm", mode === "free" && "active")}
          >
            🎹 自由弹
          </button>
          <button
            onClick={startDemo}
            className={cn("btn-pill px-4 py-2 text-sm", mode === "demo" && "active")}
          >
            ▶ 演示
          </button>
          <button
            onClick={startFollow}
            className={cn("btn-pill px-4 py-2 text-sm", mode === "follow" && "active")}
          >
            🎯 跟弹过关
          </button>
          {mode !== "free" && (
            <select
              value={songId}
              onChange={(e) => {
                setSongId(e.target.value);
                stopDemo();
                if (mode === "follow") {
                  setFollowIdx(0);
                  setCorrect(0);
                  setMistakes(0);
                  setFollowDone(false);
                }
              }}
              className="rounded-full border border-line bg-white px-3 py-2 text-sm"
            >
              {SONGS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}
          {(mode === "demo" || mode === "follow") && mode !== "demo" && (
            <button
              onClick={startFollow}
              className="text-sm text-emerald-700 underline"
            >
              重新开始
            </button>
          )}
          {mode === "demo" && (
            <button onClick={stopDemo} className="text-sm text-emerald-700 underline">
              停止演示
            </button>
          )}
        </div>

        {/* 跟弹进度 */}
        {mode === "follow" && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            {followDone ? (
              <p className="text-center text-[15px] font-medium text-emerald-800">
                🎉 弹完啦！弹对 {correct} 个音，按错 {mistakes} 次
                {mistakes === 0 ? "，一次没错，厉害！" : "，再来一次冲击零失误！"}
              </p>
            ) : (
              <>
                <p className="mb-2 text-center text-sm text-fog">
                  请弹 <b className="text-emerald-700">绿圈里的键</b>：弹对自动前进，弹错会红一下
                  （已弹对 {correct} 个，弹错 {mistakes} 次）
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {song.notes.map((m, i) => {
                    const k = KEYS.find((x) => x.midi === m)!;
                    return (
                      <span
                        key={i}
                        className={cn(
                          "rounded-md px-1.5 py-1 text-[11px] font-bold",
                          i < followIdx
                            ? "bg-emerald-100 text-emerald-700"
                            : i === followIdx
                              ? "scale-110 bg-emerald-500 text-white shadow"
                              : "bg-zinc-100 text-zinc-400"
                        )}
                      >
                        {SOLFEGE[k.letter]}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* 演示进度 */}
        {mode === "demo" && demoIdx >= 0 && (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${((demoIdx + 1) / song.notes.length) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-fog">
              正在演示《{song.title}》：{demoIdx + 1} / {song.notes.length}
            </p>
          </div>
        )}

        {/* 琴键 */}
        <div className="glass-dark mt-4 overflow-x-auto rounded-[18px] px-[18px] pb-[18px] pt-[26px]">
          <div
            className="relative h-[210px] select-none"
            style={{ minWidth: whites.length * (W + gap) }}
          >
            {whites.map((k) => {
              const isActive = active.has(k.midi);
              const isTarget = targetMidi === k.midi;
              const isWrong = wrongMidi === k.midi;
              return (
                <div
                  key={k.midi}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    press(k.midi);
                  }}
                  onPointerUp={() => release(k.midi)}
                  onPointerLeave={() => release(k.midi)}
                  onPointerCancel={() => release(k.midi)}
                  className={cn(
                    "absolute bottom-0 top-0 flex cursor-pointer items-end justify-center rounded-b-lg border pb-2.5 text-xs",
                    isWrong
                      ? "border-rose-400 bg-rose-100 text-rose-600"
                      : isActive
                        ? "border-[#c8c9cb] bg-[#ffe9d9] text-[#9aa0a6]"
                        : "border-[#c8c9cb] bg-white text-[#9aa0a6]",
                    isTarget && "ring-4 ring-emerald-400 ring-inset"
                  )}
                  style={{ left: whiteX.get(k.midi), width: W }}
                >
                  {keyLabel(k)}
                </div>
              );
            })}
            {KEYS.filter((k) => k.black).map((k) => {
              let prev: PKey | null = null;
              for (let m = k.midi - 1; m >= 0; m--) {
                const w = KEYS.find((x) => x.midi === m && !x.black);
                if (w) {
                  prev = w;
                  break;
                }
              }
              if (!prev) return null;
              const x = (whiteX.get(prev.midi) ?? 0) + W;
              const isActive = active.has(k.midi);
              const isTarget = targetMidi === k.midi;
              const isWrong = wrongMidi === k.midi;
              return (
                <div
                  key={k.midi}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    press(k.midi);
                  }}
                  onPointerUp={() => release(k.midi)}
                  onPointerLeave={() => release(k.midi)}
                  onPointerCancel={() => release(k.midi)}
                  className={cn(
                    "absolute top-0 z-[2] flex h-[58%] cursor-pointer items-end justify-center rounded-b-md border border-black pb-1.5 text-[9px] text-white/70",
                    isWrong
                      ? "bg-rose-500"
                      : isActive
                        ? "bg-[var(--color-accent)]"
                        : "bg-[#202124]",
                    isTarget && "ring-4 ring-emerald-400 ring-inset"
                  )}
                  style={{ left: x - 14, width: 28 }}
                >
                  {labelMode === "name" ? `${k.letter}${k.oct}` : ""}
                </div>
              );
            })}
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-3.5 text-[13px] text-white">
            <span>音色</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
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
            <span>标注</span>
            <select
              value={labelMode}
              onChange={(e) => setLabelMode(e.target.value as LabelMode)}
              className="rounded-lg border border-white/30 bg-white/[0.14] px-2.5 py-1.5 text-white"
            >
              <option value="solfege">唱名（do re mi）</option>
              <option value="name">音名（C4）</option>
              <option value="none">不显示</option>
            </select>
            <button
              onClick={togglePedal}
              className={cn(
                "rounded-full px-4 py-1.5 text-[13px] font-medium transition-all active:scale-95",
                pedal ? "bg-emerald-500 text-white" : "bg-white/[0.14] text-white"
              )}
            >
              {pedal ? "🎹 延音踏板：开" : "延音踏板：关"}
            </button>
            <span className="font-bold text-accent">{lastLabel}</span>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-fog">
          找 do 的方法：琴键按“2 黑 3 黑”分组，2 个黑键那组左边第一个白键就是 do。跟弹模式先从《小星星》开始，弹对绿圈的键才能前进。
        </p>
      </Card>
    </div>
  );
}
