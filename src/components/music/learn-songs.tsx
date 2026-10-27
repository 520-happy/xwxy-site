"use client";

/**
 * 从零学吉他 · 第 7 章：流行歌弹唱
 *
 * 1 节识谱课 + 3 首中国流行歌（《成都》《晴天》《小幸运》）。
 * 和弦指法全部自带，不依赖其他课程文件，避免循环引用问题。
 * 进行说明：歌曲均为公开流传的简化弹唱版（和弦 + 扫弦），
 * 原曲编曲更复杂，这里只保留弹唱够用的骨架。
 */
import { useEffect, useRef, useState } from "react";
import { Para, IBox, ChordDiagram, type ChordDef, type Lesson } from "./learn-guitar";
import { strumChord, muteAll } from "@/lib/guitar-audio";
import { cn } from "@/lib/utils";

const SONG_CHORDS: Record<string, ChordDef> = {
  C: { name: "C", frets: [null, 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null], tip: "" },
  G: { name: "G", frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, null, null, null, 4], tip: "" },
  Am: { name: "Am", frets: [null, 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null], tip: "" },
  F: { name: "F（简化版）", frets: [null, null, 3, 2, 1, 1], fingers: [null, null, 3, 2, 1, 1], tip: "" },
  Em: { name: "Em", frets: [null, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null], tip: "" },
  Dm: { name: "Dm", frets: [null, 0, 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1], tip: "" },
  D: { name: "D", frets: [null, null, 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2], tip: "" },
};

/* ================= 通用：歌曲跟弹器 ================= */

interface SongSection {
  name: string;
  chords: string[];
}
interface Song {
  title: string;
  artist: string;
  keyInfo: string;
  bpm: number;
  rightHand: string;
  sections: SongSection[];
  note?: string;
}

function SongPlayer({ song }: { song: Song }) {
  const [sec, setSec] = useState(0);
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(false);
  const [beat, setBeat] = useState(0);
  const timer = useRef<number | null>(null);
  const section = song.sections[sec];
  const cur = SONG_CHORDS[section.chords[idx]];

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setAuto(false);
  };

  const playAt = (i: number) => {
    setIdx(i);
    strumChord(SONG_CHORDS[section.chords[i]].frets);
  };

  const start = () => {
    stop();
    setAuto(true);
    setIdx(0);
    setBeat(0);
    strumChord(SONG_CHORDS[section.chords[0]].frets);
    let bt = 0;
    let ci = 0;
    timer.current = window.setInterval(() => {
      bt = (bt + 1) % 4;
      setBeat(bt);
      if (bt === 0) {
        ci = (ci + 1) % section.chords.length;
        setIdx(ci);
        strumChord(SONG_CHORDS[section.chords[ci]].frets);
      }
    }, 60000 / song.bpm);
  };

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {song.sections.map((s, i) => (
          <button
            key={s.name}
            onClick={() => {
              stop();
              setSec(i);
              setIdx(0);
              setBeat(0);
            }}
            className={cn("btn-pill px-4 py-2 text-sm font-bold", sec === i && "active")}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {section.chords.map((name, i) => (
          <button
            key={`${name}-${i}`}
            onClick={() => playAt(i)}
            className={cn(
              "rounded-xl border px-4 py-3 text-base font-bold transition-all active:scale-95",
              idx === i
                ? "scale-105 border-emerald-500 bg-emerald-500 text-white shadow"
                : "border-line bg-white/70 hover:border-emerald-300/50"
            )}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex gap-1.5">
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
        <span className="text-[13px] text-fog">
          {song.bpm} 拍/分钟 · 每个和弦 4 拍 · 右手：{song.rightHand}
        </span>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="rounded-2xl border border-line bg-white/70 p-2">
          <ChordDiagram chord={cur} />
          <p className="pb-1 text-center text-xs text-fog">当前和弦：{cur.name}</p>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <button
            onClick={auto ? stop : start}
            className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
          >
            {auto ? "⏹ 停" : `▶ 自动跟弹（${section.name}循环）`}
          </button>
          <p className="text-[13px] leading-6 text-fog">
            点和弦名可以单个试听。先跟自动循环把换和弦练顺，再自己边弹边唱——唱不上的地方先只弹不唱，顺了再合起来。
          </p>
          {song.note && <p className="text-[13px] leading-6 text-amber-700">💡 {song.note}</p>}
        </div>
      </div>
    </div>
  );
}

/* ================= 识谱课部件 ================= */

/** 歌词上方和弦标记：点和弦名听声音、看指法 */
const LYRIC_LINE: { chord: string; text: string }[] = [
  { chord: "C", text: "让我掉下眼泪的" },
  { chord: "Em", text: "不止昨夜的酒" },
  { chord: "F", text: "让我依依不舍的" },
  { chord: "G", text: "不止你的温柔" },
];

function ChordLyricWidget() {
  const [name, setName] = useState<string | null>(null);
  const chord = name ? SONG_CHORDS[name] : null;
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        弹唱谱长这样：<b>和弦名写在歌词上方</b>，唱到那个字的时候换到这个和弦。点和弦名试听：
      </p>
      <div className="rounded-xl border border-line bg-white/70 p-4">
        <div className="flex flex-wrap items-end gap-x-1 gap-y-3">
          {LYRIC_LINE.map((seg, i) => (
            <span key={i} className="inline-flex flex-col items-start">
              <button
                onClick={() => {
                  setName(seg.chord);
                  strumChord(SONG_CHORDS[seg.chord].frets);
                }}
                className={cn(
                  "mb-1 rounded-md px-2 py-0.5 text-sm font-bold transition-all active:scale-95",
                  name === seg.chord
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {seg.chord}
              </button>
              <span className="px-1 text-[15px] leading-7">{seg.text}</span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-fog">
          这是《成都》第一句。规则就一条：<b>和弦名对准的那个字，就是换和弦的点</b>。
        </p>
      </div>
      {chord && (
        <div className="mt-3 flex items-center gap-3">
          <div className="rounded-2xl border border-line bg-white/70 p-2">
            <ChordDiagram chord={chord} />
          </div>
          <p className="text-sm leading-7">
            <b className="text-emerald-700">{chord.name}</b> 的按法就是这样，点和弦名可以再听一次。
          </p>
        </div>
      )}
    </div>
  );
}

/** 扫弦箭头谱：↓ ↑ × 的意思 + 试听 */
const ARROW_PATTERN: ("down" | "up" | "mute")[] = ["down", "down", "up", "mute", "up", "down", "up"];

function ArrowWidget() {
  const [slot, setSlot] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);
  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
    setSlot(-1);
  };
  const start = () => {
    stop();
    setPlaying(true);
    let i = 0;
    const step = () => {
      setSlot(i);
      const s = ARROW_PATTERN[i];
      if (s === "down") strumChord(SONG_CHORDS.Em.frets, true);
      else if (s === "up") strumChord(SONG_CHORDS.Em.frets, false);
      else {
        strumChord(SONG_CHORDS.Em.frets, true);
        window.setTimeout(() => muteAll(), 120);
      }
      i = (i + 1) % ARROW_PATTERN.length;
    };
    step();
    timer.current = window.setInterval(step, 420);
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        扫弦谱用箭头表示方向，× 表示切音（扫响立刻按住）。这段是 Em 和弦上的演示：
      </p>
      <div className="mb-3 flex gap-1.5">
        {ARROW_PATTERN.map((s, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-xl border py-3 text-center text-lg font-bold transition-all",
              slot === i
                ? "scale-105 border-emerald-500 bg-emerald-500 text-white shadow"
                : "border-line bg-white/70 text-zinc-700"
            )}
          >
            {s === "down" ? "↓" : s === "up" ? "↑" : "×"}
          </div>
        ))}
      </div>
      <button
        onClick={playing ? stop : start}
        className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
      >
        {playing ? "⏹ 停" : "▶ 听这段扫弦"}
      </button>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        ↓ = 往下扫，↑ = 往上挑，× = 切音。箭头下面常标着和弦名，扫哪个和弦就看那个名字。
      </p>
    </div>
  );
}

/** 变调夹：滑杆选品数，C 指法实际音高跟着变 */
const CAPO_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G"];

function CapoWidget() {
  const [capo, setCapo] = useState(0);
  const play = () => {
    const shifted = SONG_CHORDS.C.frets.map((f) => (f === null ? null : f + capo));
    strumChord(shifted);
  };
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        变调夹夹在几品，声音就整体升高几品。按 C 的指法不动，夹子一挪，调就变了：
      </p>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex-none text-sm text-fog">夹在</span>
        <input
          type="range"
          min={0}
          max={7}
          value={capo}
          onChange={(e) => setCapo(Number(e.target.value))}
          className="flex-1"
        />
        <span className="flex-none text-sm font-bold">{capo} 品</span>
      </div>
      <div className="rounded-xl bg-white/70 p-4 text-center">
        <p className="text-[15px] leading-8">
          按 <b>C</b> 的指法，夹 {capo} 品，实际音高是 <b className="text-emerald-700">{CAPO_KEYS[capo]} 调</b>
        </p>
        <button
          onClick={play}
          className="mt-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
        >
          ♪ 听听实际音高
        </button>
      </div>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        所以谱子上写“Capo 5 品 C 调指法”，意思就是：手按 C 调的和弦，出来的却是 F 调的声音——《小幸运》C 调谱夹 5 品就是这个道理。嗓子够不着原调时，挪夹子比换整套和弦省事得多。
      </p>
    </div>
  );
}

/** 歌曲结构：前奏 / 主歌 / 副歌 / 间奏 / 尾奏 */
const STRUCTURE: { name: string; desc: string }[] = [
  { name: "前奏", desc: "没人唱之前的那段，通常是吉他 solo 或几个和弦铺垫，告诉听众“歌要开始了”。" },
  { name: "主歌", desc: "讲故事的部分，歌词每段都不一样，和弦进行比较平稳，情绪收着。" },
  { name: "副歌", desc: "最出名的那段（高潮），歌词每次重复，和弦和情绪都推上去。练歌先练副歌。" },
  { name: "间奏", desc: "两段歌词之间的过门，没人唱，乐器单独玩一小段，让情绪喘口气。" },
  { name: "尾奏", desc: "最后收尾的一段，常常把副歌的最后一句重复一遍再慢慢收住。" },
];

function StructureWidget() {
  const [name, setName] = useState("副歌");
  const cur = STRUCTURE.find((s) => s.name === name)!;
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">一首歌的谱子通常按这个顺序排，点每个部分看它是干嘛的：</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {STRUCTURE.map((s) => (
          <button
            key={s.name}
            onClick={() => setName(s.name)}
            className={cn("btn-pill px-4 py-2 text-sm font-bold", name === s.name && "active")}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-white/70 p-4 text-sm leading-7">
        <b className="text-emerald-700">{cur.name}</b>：{cur.desc}
      </div>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        拿到一首新谱先看结构：先练副歌（最出名、成就感最强），再补主歌，前奏间奏最后抠。
      </p>
    </div>
  );
}


/* ================= 课程定义 ================= */

const CHAPTER = "第 7 章 · 流行歌弹唱";

export const songLessons: Lesson[] = [
  {
    id: "read-sheet",
    title: "怎么识谱：从符号到弹唱",
    sub: "和弦标记、扫弦箭头、变调夹、歌曲结构",
    chapter: CHAPTER,
    steps: [
      <div key="s1" className="space-y-3">
        <Para>
          <b>先看懂：和弦名写在歌词上面。</b>弹唱谱长这样——和弦名对准的那个字，就是换和弦的点。点和弦名试听：
        </Para>
        <ChordLyricWidget />
      </div>,
      <div key="s2" className="space-y-3">
        <Para>
          <b>再看懂：扫弦箭头和切音。</b>↓ 往下扫，↑ 往上挑，× 切音（扫响立刻按住）。这段是 Em 和弦上的演示：
        </Para>
        <ArrowWidget />
      </div>,
      <div key="s3" className="space-y-3">
        <Para>
          <b>变调夹：夹子一挪，调就变了。</b>按 C 的指法不动，夹子一挪，声音就整体升高：
        </Para>
        <CapoWidget />
      </div>,
      <div key="s4" className="space-y-3">
        <Para>
          <b>一首歌的骨架。</b>拿到新谱先看结构：先练副歌（最出名、成就感最强），再补主歌，前奏间奏最后抠：
        </Para>
        <StructureWidget />
      </div>,
    ],
  },
  {
    id: "song-chengdu",
    title: "《成都》· 赵雷",
    sub: "C调 · 约 89 拍 · 主歌 + 副歌",
    chapter: CHAPTER,
    steps: [
      <div key="s1" className="space-y-3">
        <Para>
          《成都》是新手弹唱的“国民神曲”：C 调简化版，和弦只有 C、Em、F、G、Am、Dm，节奏舒缓，原曲约 89 拍/分钟。
          原调是 D 调——不夹变调夹就是 C 调（比原调低一点，嗓子舒服）；夹 2 品就回到原调 D。
        </Para>
        <IBox><b>练法：</b>
          先把主歌循环跟顺（C → Em → F → G），再练副歌。副歌里 Am → F 的转换是这首歌唯一的坎，慢点换，换不上的拍子先空一拍，别停。
        </IBox>
      </div>,
      <div key="s2" className="space-y-3">
        <SongPlayer
          song={{
            title: "成都",
            artist: "赵雷",
            keyInfo: "C调",
            bpm: 89,
            rightHand: "第 2 章的扫弦节奏型（↓ · ↓↑ · ↑↓↑）",
            sections: [
              { name: "主歌", chords: ["C", "Em", "F", "G"] },
              {
                name: "副歌",
                chords: ["Em", "Am", "F", "G", "C", "C", "Am", "F", "G", "C", "F", "G", "C", "Dm", "G"],
              },
            ],
            note: "副歌的最后两句（F G C、Dm G）是收尾句，唱“和我在成都的街头走一走”时就在这里循环。",
          }}
        />
      </div>,
    ],
  },
  {
    id: "song-qingtian",
    title: "《晴天》· 周杰伦",
    sub: "主歌 Em C G D · 副歌 Am C G D",
    chapter: CHAPTER,
    steps: [
      <div key="s1" className="space-y-3">
        <Para>
          《晴天》主歌只用 Em、C、G、D 四个和弦，副歌是 Am、C、G、D——全是你已经学过的和弦，零新和弦，练的就是换和弦的速度。
        </Para>
        <IBox><b>练法：</b>
          主歌用分解和弦（低音 → 高音慢慢拨），副歌转扫弦，情绪一下就上来了。副歌“但看见你”后面有个小停顿，别急着进下一句。
        </IBox>
      </div>,
      <div key="s2" className="space-y-3">
        <SongPlayer
          song={{
            title: "晴天",
            artist: "周杰伦",
            keyInfo: "简化弹唱版",
            bpm: 80,
            rightHand: "主歌分解、副歌扫弦（第 2 章节奏型）",
            sections: [
              { name: "主歌", chords: ["Em", "C", "G", "D"] },
              { name: "副歌", chords: ["Am", "C", "G", "D"] },
            ],
            note: "原曲前奏有一段指弹旋律，那是进阶内容；先把弹唱版弹顺，前奏以后再抠。",
          }}
        />
      </div>,
    ],
  },
  {
    id: "song-xiaoxingyun",
    title: "《小幸运》· 田馥甄",
    sub: "F调简化版 · 约 79 拍 · 副歌",
    chapter: CHAPTER,
    steps: [
      <div key="s1" className="space-y-3">
        <Para>
          《小幸运》原调是 F 调，约 79 拍/分钟。这里是简化版：F 用简化版按法，原曲副歌里的 Bb（大横按，新手按不住）先用 F 代替，味道接近，等大横按练熟了再换回去。
        </Para>
        <IBox><b>两种弹法：</b>
          直接用 F 调指法弹（下面跟弹器就是）；或者用 C 调谱夹 5 品——夹子那课讲过，夹 5 品按 C 指法，出来的就是 F 调。
        </IBox>
      </div>,
      <div key="s2" className="space-y-3">
        <SongPlayer
          song={{
            title: "小幸运",
            artist: "田馥甄",
            keyInfo: "F调简化版",
            bpm: 79,
            rightHand: "慢速扫弦，每个和弦 4 拍",
            sections: [{ name: "副歌", chords: ["F", "C", "Dm", "Am", "F", "F", "G", "C"] }],
            note: "这句就是“原来你是我最想留住的幸运”。先练副歌，主歌和弦更碎，等副歌顺了再补。",
          }}
        />
      </div>,
    ],
  },
];
