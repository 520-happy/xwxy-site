"use client";

/**
 * ZeroGuitarCourse — 从零开始学吉他（全交互式课程）
 *
 * 9 节课，每节 = 详细讲解（假设零基础、不懂任何术语）+ 可动手点的交互部件。
 * 进度保存在 localStorage。
 */
import { useEffect, useState, type ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { noteName, cnName } from "@/lib/audio";
import {
  STRING_BASE,
  STRING_LABEL,
  STRING_SOLFEGE,
  fretFreq,
  pluck,
  pluckOpen,
  pluckFret,
  strumChord,
  warmup,
} from "@/lib/guitar-audio";

/* ================= 通用小组件 ================= */

function Remember({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
      <span className="font-bold">📌 记住：</span>
      {children}
    </div>
  );
}

function Para({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-8 text-zinc-700">{children}</p>;
}

/** 交互部件统一面板：浅绿底，和文字区视觉分离，一眼就知道“这里可以点” */
function IBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">{children}</div>
  );
}

/** 手指颜色编码（抄 Yousician）：1指天蓝 2指绿 3指黄 4指红 */
const FINGER_COLORS = ["", "#38bdf8", "#34d399", "#fbbf24", "#fb7185"];

/* ================= 第1课部件：吉他结构图 ================= */

const PARTS: { id: string; name: string; desc: string }[] = [
  { id: "peg", name: "弦钮", desc: "调音用的。拧紧音变高，拧松音变低，每次只拧一点点，边拧边听。" },
  { id: "head", name: "琴头", desc: "最顶端，固定弦钮和弦的上端。" },
  { id: "neck", name: "琴颈", desc: "左手握的地方，拇指顶在琴颈背面中间。" },
  { id: "board", name: "指板", desc: "琴颈上那块深色木板，左手手指按弦的地方。" },
  { id: "fret", name: "品丝", desc: "指板上的金属条。按弦要按在品丝前面（靠近音孔的那一侧），声音才脆。" },
  { id: "hole", name: "音孔", desc: "圆洞，琴声从这里传出来。右手拨弦的位置就在音孔上方。" },
  { id: "bridge", name: "琴桥", desc: "弦的下端固定在这里。" },
  { id: "body", name: "琴身", desc: "大肚子是共鸣箱，决定音量和音色。坐着弹时凹陷处架在右大腿上。" },
];

function AnatomyWidget() {
  const [active, setActive] = useState("peg");
  const info = PARTS.find((p) => p.id === active)!;
  const hot = "fill-transparent cursor-pointer";
  const hl = (id: string) =>
    active === id ? "stroke-[#10b981] stroke-[3px]" : "stroke-transparent stroke-[3px]";
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">点吉他的各个部位，看它叫什么、是干嘛的：</p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <svg
          viewBox="0 0 300 430"
          className="w-52 flex-none"
          role="img"
          aria-label="吉他结构图，点击各部位查看说明"
        >
          {/* 琴身 */}
          <ellipse cx="150" cy="300" rx="58" ry="48" fill="#d9a45b" />
          <ellipse cx="150" cy="368" rx="72" ry="52" fill="#cf9848" />
          {/* 音孔 */}
          <circle cx="150" cy="312" r="24" fill="#2b1d10" />
          <circle cx="150" cy="312" r="29" fill="none" stroke="#8a5a24" strokeWidth="4" />
          {/* 琴桥 */}
          <rect x="116" y="368" width="68" height="14" rx="4" fill="#3a2614" />
          {/* 琴颈 + 指板 */}
          <rect x="128" y="70" width="44" height="200" fill="#8a5a2e" />
          <rect x="132" y="70" width="36" height="200" fill="#3d2a17" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line
              key={i}
              x1="132"
              y1={92 + i * 26}
              x2="168"
              y2={92 + i * 26}
              stroke="#c9c2b2"
              strokeWidth="2"
            />
          ))}
          {/* 琴头 */}
          <rect x="120" y="14" width="60" height="52" rx="8" fill="#5e3d20" />
          <rect x="146" y="14" width="8" height="52" fill="#3d2a17" />
          {/* 弦钮 */}
          {[22, 36, 50].map((y) => (
            <g key={y}>
              <circle cx="112" cy={y} r="7" fill="#9aa0a6" />
              <circle cx="188" cy={y} r="7" fill="#9aa0a6" />
            </g>
          ))}
          {/* 琴弦 */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={i}
              x1={136 + i * 5.6}
              y1="20"
              x2={136 + i * 5.6}
              y2="375"
              stroke={i < 3 ? "#e8e8e8" : "#d8b36a"}
              strokeWidth={i < 3 ? 1.4 : 2.4}
            />
          ))}
          {/* 上弦枕 */}
          <rect x="128" y="64" width="44" height="7" fill="#f2e9d4" />

          {/* 热点 */}
          <g onClick={() => setActive("peg")} className={hot}>
            <rect x="100" y="12" width="100" height="46" className={hl("peg")} fill="transparent" />
          </g>
          <g onClick={() => setActive("head")} className={hot}>
            <rect x="120" y="14" width="60" height="52" className={hl("head")} fill="transparent" />
          </g>
          <g onClick={() => setActive("neck")} className={hot}>
            <rect x="128" y="120" width="44" height="90" className={hl("neck")} fill="transparent" />
          </g>
          <g onClick={() => setActive("board")} className={hot}>
            <rect x="132" y="70" width="36" height="60" className={hl("board")} fill="transparent" />
          </g>
          <g onClick={() => setActive("fret")} className={hot}>
            <rect x="132" y="140" width="36" height="30" className={hl("fret")} fill="transparent" />
          </g>
          <g onClick={() => setActive("hole")} className={hot}>
            <circle cx="150" cy="312" r="30" className={hl("hole")} fill="transparent" />
          </g>
          <g onClick={() => setActive("bridge")} className={hot}>
            <rect x="116" y="368" width="68" height="14" className={hl("bridge")} fill="transparent" />
          </g>
          <g onClick={() => setActive("body")} className={hot}>
            <ellipse cx="150" cy="395" rx="60" ry="28" className={hl("body")} fill="transparent" />
          </g>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {PARTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[13px]",
                  active === p.id
                    ? "border-emerald-300 bg-emerald-50 font-bold text-emerald-700"
                    : "border-line bg-white text-fog"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-white/70 p-4 text-sm leading-7">
            <span className="font-bold text-emerald-700">{info.name}</span>
            <span className="text-ink">：{info.desc}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 第2课部件：六根弦 ================= */

function OpenStringsWidget() {
  const [si, setSi] = useState<number | null>(null);
  // si: 0=6弦 … 5=1弦
  const tap = (i: number) => {
    setSi(i);
    pluckOpen(i, 0.95);
  };
  const info = si === null ? null : (
    <>
      <b>{STRING_LABEL[si]}</b>（{si === 0 ? "最粗" : si === 5 ? "最细" : `第${6 - si}粗`}）空弦音是{" "}
      <b>
        {noteName(STRING_BASE[si]).name}（{STRING_SOLFEGE[si]}）
      </b>
      ，{STRING_BASE[si].toFixed(2)} Hz
    </>
  );
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">点每根弦，听它的空弦音（什么都不按，直接拨响）：</p>
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors",
              si === i
                ? "border-emerald-300 bg-emerald-50"
                : "border-line bg-white/60 hover:border-emerald-300/50"
            )}
          >
            <span
              className="rounded-full bg-zinc-200"
              style={{ width: 10 + (5 - i) * 3.4, height: 10 + (5 - i) * 3.4 }}
            />
            <span className="text-sm font-bold">{STRING_LABEL[i]}</span>
            <span className="text-sm text-fog">
              {noteName(STRING_BASE[i]).name}（{STRING_SOLFEGE[i]}）
            </span>
            {si === i && <span className="ml-auto text-xs text-emerald-700">♪ 正在响</span>}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-[44px] rounded-xl bg-white/70 p-3 text-sm leading-7">
        {info ?? <span className="text-fog">点上面任意一根弦，这里会告诉你它的音名和唱名。</span>}
      </div>
      <Remember>
        六根弦标准音从粗到细是 <b>E A D G B E</b>，唱作“<b>咪 拉 哆 索 西 咪</b>”。
        两头都是 mi（E），很好记。以后调音、看谱全靠这个顺序。
      </Remember>
    </div>
  );
}

/* ================= 第3课部件：调音 ================= */

function TuneWidget({ onGoTuner }: { onGoTuner?: () => void }) {
  const [si, setSi] = useState<number | null>(null);
  return (
    <div>
      <div className="mb-4 space-y-3">
        <Para>
          <b>为什么每天都要调音？</b>
          弦是金属做的，温度、湿度一变就会跑音。不准的琴练了也白练——你的耳朵会记住错的音。所以<b>每次拿起吉他第一件事就是调音</b>，熟练后 1 分钟搞定。
        </Para>
        <Para>
          <b>弦钮怎么拧？</b>每根弦对应琴头上的一个弦钮。把弦<b>拧紧 → 音变高</b>，<b>拧松 → 音变低</b>。调的时候一边拨弦一边拧，每次只拧一点点，耳朵听着音往标准音靠。
        </Para>
        <Para>
          <b>怎么知道准没准？</b>
          点下面每根弦听<b>标准音</b>，记住这个声音；再拨你琴上同一根弦对比，两个声音完全重合、没有“打架”的嗡嗡声就是准了。想更精确就用本站的调音器（麦克风实时检测，指针居中变绿即准）。
        </Para>
      </div>
      <p className="mb-2 text-[13px] text-fog">点各弦听标准音：</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => {
              setSi(i);
              pluckOpen(i, 0.95);
            }}
            className={cn("btn-pill px-4 py-2 text-sm", si === i && "active")}
          >
            {STRING_LABEL[i]} · {noteName(STRING_BASE[i]).name}
          </button>
        ))}
      </div>
      {onGoTuner && (
        <button onClick={onGoTuner} className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95">
          去打开调音器 →
        </button>
      )}
      <Remember>
        新手最容易犯的错是<b>拧过头把弦拧断</b>。记住：一次拧 1/8 圈，边拧边拨弦听，音接近了就停。
      </Remember>
    </div>
  );
}

/* ================= 第4课部件：持琴姿势 ================= */

const POSTURE_STEPS = [
  { t: "坐端正", d: "找把高度合适的椅子，只坐前三分之一，背挺直别驼。脚平放地面。" },
  { t: "琴放右腿", d: "琴身侧面的凹陷处架在右大腿上，琴身贴住身体，别让它晃。" },
  { t: "琴颈微微上扬", d: "琴头大概和肩膀同高，别让琴头耷拉下去，也别翘太高。" },
  { t: "右臂自然搭", d: "右前臂轻轻搭在琴身最宽的上边缘，手腕放松，右手正好落在音孔上方。" },
  { t: "左手拇指顶背面", d: "左手拇指顶在琴颈背面的中间（不要露出来捏住琴颈），其他四指自然弯曲悬在指板上方。" },
];

function PostureWidget() {
  const [done, setDone] = useState<boolean[]>(POSTURE_STEPS.map(() => false));
  const toggle = (i: number) =>
    setDone((d) => d.map((v, k) => (k === i ? !v : v)));
  const n = done.filter(Boolean).length;
  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        姿势不对，练再久也别扭。拿起琴（或想象拿着琴），一条条对照，做到就点一下：
      </p>
      <div className="space-y-2">
        {POSTURE_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
              done[i] ? "border-emerald-300/50 bg-emerald-50/60" : "border-line bg-white/60"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 text-xs font-bold",
                done[i] ? "border-emerald-300 bg-emerald-500 text-white" : "border-zinc-300 text-fog-light"
              )}
            >
              {done[i] ? "✓" : i + 1}
            </span>
            <span>
              <span className="block text-sm font-bold">{s.t}</span>
              <span className="block text-[13px] leading-6 text-fog">{s.d}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-fog">
        {n === POSTURE_STEPS.length ? "🎉 姿势满分！保持这个感觉去练琴。" : `已做到 ${n} / ${POSTURE_STEPS.length}`}
      </p>
      <Remember>
        右手拨弦的位置永远在<b>音孔上方</b>；左手按弦时手腕别塌，指尖垂直于指板。
      </Remember>
    </div>
  );
}

/* ================= 第5课部件：六线谱点读 ================= */

/** 六线谱示例：列 = {si: 弦索引(0=6弦), fret} */
const TAB_EXERCISE: { si: number; fret: number }[] = [
  { si: 5, fret: 0 },
  { si: 5, fret: 1 },
  { si: 5, fret: 3 },
  { si: 5, fret: 5 },
];
const TAB_TWINKLE: { si: number; fret: number }[] = [
  { si: 5, fret: 8 },
  { si: 5, fret: 8 },
  { si: 5, fret: 3 },
  { si: 5, fret: 3 },
  { si: 5, fret: 5 },
  { si: 5, fret: 5 },
  { si: 5, fret: 3 },
];

function TabLines({ cols, title }: { cols: { si: number; fret: number }[]; title: string }) {
  const [hit, setHit] = useState<number | null>(null);
  const play = (c: number) => {
    const { si, fret } = cols[c];
    setHit(c);
    pluckFret(si, fret, 0.95);
    window.setTimeout(() => setHit((h) => (h === c ? null : h)), 350);
  };
  // 行：1弦在上 … 6弦在下（六线谱惯例：上细下粗）
  const rows = [5, 4, 3, 2, 1, 0];
  return (
    <div className="mb-5">
      <p className="mb-2 text-[13px] font-medium text-fog">{title}（点数字听声音）</p>
      <div className="overflow-x-auto rounded-xl border border-line bg-white/70 p-2">
        <div className="min-w-[420px]">
          {rows.map((si) => (
            <div key={si} className="flex items-center">
              <span className="w-8 flex-none text-center text-[11px] font-bold text-fog">
                {STRING_LABEL[si]}
              </span>
              <div className="relative flex flex-1">
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-zinc-300" />
                {cols.map((c, ci) => {
                  const isNote = c.si === si;
                  return (
                    <button
                      key={ci}
                      disabled={!isNote}
                      onClick={() => play(ci)}
                      className={cn(
                        "relative z-[1] flex h-10 min-w-[46px] flex-1 items-center justify-center rounded-md text-sm font-bold",
                        isNote
                          ? hit === ci
                            ? "bg-emerald-500 text-white"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white"
                          : "cursor-default text-zinc-300"
                      )}
                    >
                      {isNote ? c.fret : "—"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabReaderWidget() {
  return (
    <div>
      <div className="mb-4 space-y-3">
        <Para>
          <b>六线谱就是“吉他专用说明书”。</b>6 条横线 = 6
          根弦，<b>最上面那条是最细的 1 弦，最下面是最粗的 6 弦</b>（和抱着吉他低头看的方向一致）。
        </Para>
        <Para>
          线上的<b>数字 = 按第几品</b>，<b>0 = 空弦</b>（什么都不按，直接拨）。从左往右依次弹，看到哪个数字就弹哪根弦的第几品。
        </Para>
      </div>
      <TabLines cols={TAB_EXERCISE} title="练习：1弦上弹 mi-fa-sol-la（0-1-3-5）" />
      <TabLines cols={TAB_TWINKLE} title="挑战：《小星星》第一句（全在1弦上）" />
      <Remember>
        看不懂谱不是笨，是没人告诉你规则：<b>线=弦（上细下粗），数字=品数，0=空弦</b>。记住这三句，任何六线谱你都会看了。
      </Remember>
    </div>
  );
}

/* ================= 第6课部件：和弦图 ================= */

interface ChordDef {
  name: string;
  /** 6→1 弦，null = 不弹 */
  frets: (number | null)[];
  /** 6→1 弦，手指编号 1=食指 2=中指 3=无名指 4=小指，null = 不用按 */
  fingers: (number | null)[];
  tip: string;
}

const LEARN_CHORDS: ChordDef[] = [
  {
    name: "Em",
    frets: [null, 2, 2, 0, 0, 0],
    fingers: [null, 2, 3, null, null, null],
    tip: "最简单的和弦，只用两根手指：中指按 5 弦 2 品，无名指按 4 弦 2 品，其他弦空弦响。",
  },
  {
    name: "Am",
    frets: [null, 0, 2, 2, 1, 0],
    fingers: [null, null, 2, 3, 1, null],
    tip: "中指 4 弦 2 品，无名指 3 弦 2 品，食指 2 弦 1 品。6 弦不弹。",
  },
  {
    name: "C",
    frets: [null, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
    tip: "无名指 5 弦 3 品，中指 4 弦 2 品，食指 2 弦 1 品。6 弦不弹。",
  },
  {
    name: "G",
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [3, 2, null, null, null, 4],
    tip: "无名指 6 弦 3 品，中指 5 弦 2 品，小指 1 弦 3 品。6 根弦全响，声音很开阔。",
  },
  {
    name: "D",
    frets: [null, null, 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2],
    tip: "食指 3 弦 2 品，无名指 2 弦 3 品，中指 1 弦 2 品。只弹 1～4 弦，5、6 弦不弹。",
  },
];

const FINGER_CN = ["", "食指", "中指", "无名指", "小指"];

function ChordDiagram({ chord, big }: { chord: ChordDef; big?: boolean }) {
  const W = big ? 220 : 160;
  const H = big ? 250 : 190;
  const padL = 26;
  const padT = 30;
  const gridW = W - padL - 16;
  const gridH = H - padT - 16;
  const sx = (i: number) => padL + (i * gridW) / 5; // 弦 6→1 从左到右
  const sy = (f: number) => padT + ((f - 1) * gridH) / 4; // 品 1～5（图内只画 1-4 品位）
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={big ? "w-56" : "w-40"}
      role="img"
      aria-label={`${chord.name} 和弦图`}
    >
      {/* 品格横线 */}
      {[1, 2, 3, 4, 5].map((f) => (
        <line
          key={f}
          x1={padL}
          y1={padT + ((f - 1) * gridH) / 4}
          x2={W - 16}
          y2={padT + ((f - 1) * gridH) / 4}
          stroke={f === 1 ? "#3f3f46" : "#a1a1aa"}
          strokeWidth={f === 1 ? 5 : 1.6}
        />
      ))}
      {/* 弦竖线 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1={sx(i)}
          y1={padT}
          x2={sx(i)}
          y2={padT + gridH}
          stroke="#71717a"
          strokeWidth={1.6}
        />
      ))}
      {/* 弦号 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <text
          key={i}
          x={sx(i)}
          y={H - 2}
          textAnchor="middle"
          fontSize="10"
          fill="#a1a1aa"
        >
          {6 - i}
        </text>
      ))}
      {/* 顶部：○ 空弦 / × 不弹 */}
      {chord.frets.map((f, i) =>
        f === null ? (
          <text key={i} x={sx(i)} y={20} textAnchor="middle" fontSize="14" fill="#a1a1aa">
            ×
          </text>
        ) : f === 0 ? (
          <text key={i} x={sx(i)} y={20} textAnchor="middle" fontSize="14" fill="#16a34a">
            ○
          </text>
        ) : null
      )}
      {/* 手指点 */}
      {chord.frets.map((f, i) => {
        const fg = chord.fingers[i];
        if (f === null || f === 0 || !fg) return null;
        const y = padT + ((f - 1) * gridH) / 4 + gridH / 8;
        return (
          <g key={i}>
            <circle cx={sx(i)} cy={y} r={big ? 13 : 10} fill={FINGER_COLORS[fg]} />
            <text
              x={sx(i)}
              y={y + (big ? 5 : 4)}
              textAnchor="middle"
              fontSize={big ? 13 : 11}
              fill="#fff"
              fontWeight="bold"
            >
              {fg}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ChordChartWidget() {
  const [name, setName] = useState("Em");
  const chord = LEARN_CHORDS.find((c) => c.name === name)!;
  const playIt = () => strumChord(chord.frets);
  return (
    <div>
      <div className="mb-4 space-y-3">
        <Para>
          <b>和弦图是“手指摆位说明书”。</b>竖线 = 6
          根弦（<b>左边最粗的是 6 弦</b>），横线 = 品丝。黑点告诉你<b>按哪里</b>，点里的数字告诉你<b>用第几根手指</b>：1=食指、2=中指、3=无名指、4=小指。
        </Para>
        <Para>
          图顶上的 <b className="text-green-600">○</b> 表示这根弦<b>空弦也要响</b>（别按但要拨），
          <b className="text-zinc-400">×</b> 表示这根弦<b>不弹</b>（拨的时候跳过它）。
        </Para>
      </div>
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
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <button
          onClick={playIt}
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
          <div className="rounded-xl bg-white/60 p-3 text-[13px] leading-7 text-fog">
            手指编号：1=食指 2=中指 3=无名指 4=小指
            <br />
            按好后<b>逐根拨弦检查</b>：每根都要响亮，不响就调整手指（多半是没按紧或碰到了邻弦）。
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 第7课部件：拨弦练习 ================= */

const PICK_STEPS = [
  { s: "5弦", finger: "拇指", si: 1 },
  { s: "3弦", finger: "食指", si: 3 },
  { s: "2弦", finger: "中指", si: 4 },
  { s: "3弦", finger: "食指", si: 3 },
  { s: "1弦", finger: "无名指", si: 5 },
  { s: "3弦", finger: "食指", si: 3 },
  { s: "2弦", finger: "中指", si: 4 },
  { s: "3弦", finger: "食指", si: 3 },
];

function PickPatternWidget() {
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const timer = useState<number | null>(null);

  const playStep = (i: number) => {
    setStep(i);
    pluckOpen(PICK_STEPS[i].si, 0.9);
  };

  const autoPlay = () => {
    if (playing) {
      if (timer[0]) window.clearInterval(timer[0]);
      timer[1](null);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    let i = 0;
    playStep(0);
    const id = window.setInterval(() => {
      i += 1;
      if (i >= PICK_STEPS.length) {
        window.clearInterval(id);
        timer[1](null);
        setPlaying(false);
        setStep(null);
        return;
      }
      playStep(i);
    }, 480);
    timer[1](id);
  };

  useEffect(
    () => () => {
      if (timer[0]) window.clearInterval(timer[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div>
      <div className="mb-4 space-y-3">
        <Para>
          <b>右手分工是固定的</b>，不用死记硬背：<b>拇指管粗的三根弦（6、5、4）</b>，
          <b>食指管 3 弦、中指管 2 弦、无名指管 1 弦</b>。手指各管各的，永不抢活。
        </Para>
        <Para>
          入门第一指法叫 <b>53231323</b>：数字就是弦号，依次拨 5弦→3弦→2弦→3弦→1弦→3弦→2弦→3弦。
          点下面的步骤，一个个试；熟了点“自动演示”跟节奏。
        </Para>
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {PICK_STEPS.map((p, i) => (
          <button
            key={i}
            onClick={() => playStep(i)}
            className={cn(
              "rounded-xl border px-2 py-3 text-center transition-colors",
              step === i
                ? "border-emerald-300 bg-emerald-500 text-white"
                : "border-line bg-white/60 hover:border-emerald-300/50"
            )}
          >
            <span className={cn("block text-lg font-bold", step === i ? "text-white" : "text-ink")}>
              {i + 1}
            </span>
            <span className={cn("block text-xs", step === i ? "text-white/85" : "text-fog")}>
              {p.finger}
              <br />
              {p.s}
            </span>
          </button>
        ))}
      </div>
      <button onClick={autoPlay} className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95">
        {playing ? "⏹ 停止演示" : "▶ 自动演示（慢速）"}
      </button>
      <Remember>
        练的时候<b>慢就是快</b>：先保证每个音都清晰、节奏均匀，再慢慢加速。每天 10
        分钟，一周手指就听话了。
      </Remember>
    </div>
  );
}

/* ================= 第8课部件：Em 逐弦检查 ================= */

function FirstChordWidget() {
  const chord = LEARN_CHORDS[0]; // Em
  const [checking, setChecking] = useState(false);

  const checkStrings = () => {
    if (checking) return;
    setChecking(true);
    // 6→1 逐根拨，null 的弦跳过
    const seq: { si: number; f: number }[] = [];
    chord.frets.forEach((f, si) => {
      if (f !== null) seq.push({ si, f });
    });
    seq.forEach(({ si, f }, k) => {
      window.setTimeout(() => {
        if (f === 0) pluckOpen(si, 0.95);
        else pluckFret(si, f, 0.95);
        if (k === seq.length - 1) {
          window.setTimeout(() => setChecking(false), 500);
        }
      }, k * 420);
    });
  };

  return (
    <div>
      <div className="mb-4 space-y-3">
        <Para>
          <b>Em 是全世界最简单的和弦</b>，只用两根手指，是你的第一个和弦。按下面的图摆好手指：
        </Para>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="rounded-2xl border border-line bg-white/70 p-3">
          <ChordDiagram chord={chord} big />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm leading-8">{chord.tip}</p>
          <div className="rounded-xl bg-white/60 p-3 text-[13px] leading-7 text-fog">
            <b className="text-ink">按弦三要领：</b>
            <br />
            1. 用<b>指尖</b>按，不是手指肚；
            <br />
            2. 按在<b>品丝前面</b>（靠近音孔那一侧），省力又响亮；
            <br />
            3. 手指<b>立起来</b>，别趴下碰到旁边的弦。
          </div>
          <button
            onClick={checkStrings}
            disabled={checking}
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            {checking ? "♪ 检查中…" : "🔍 逐弦检查（每根都拨一遍）"}
          </button>
          <p className="text-[13px] leading-6 text-fog">
            哪根不响就调哪根手指。刚开始手指疼、按不紧都正常，坚持两周长出茧就不疼了。
          </p>
        </div>
      </div>
      <Remember>
        学会 Em 后按同样方法攻克 <b>Am → C → G → D</b>（顺序从易到难）。每个和弦练到<b>闭眼 3
        秒摆好、每根弦都响</b>，再学下一个。
      </Remember>
    </div>
  );
}

/* ================= 第9课部件：第一首歌 ================= */

const SONG_CHORDS = [
  { name: "G", frets: [3, 2, 0, 0, 0, 3] },
  { name: "D", frets: [null, null, 0, 2, 3, 2] },
  { name: "Em", frets: [null, 2, 2, 0, 0, 0] },
  { name: "D", frets: [null, null, 0, 2, 3, 2] },
];

function FirstSongWidget() {
  const [idx, setIdx] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const timer = useState<number | null>(null);

  const playAt = (i: number) => {
    setIdx(i);
    strumChord(SONG_CHORDS[i].frets);
  };

  const toggleAuto = () => {
    if (auto) {
      if (timer[0]) window.clearInterval(timer[0]);
      timer[1](null);
      setAuto(false);
      return;
    }
    setAuto(true);
    let i = 0;
    playAt(0);
    const id = window.setInterval(() => {
      i = (i + 1) % SONG_CHORDS.length;
      playAt(i);
    }, 2000);
    timer[1](id);
  };

  useEffect(
    () => () => {
      if (timer[0]) window.clearInterval(timer[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div>
      <div className="mb-4 space-y-3">
        <Para>
          会了 <b>G、D、Em</b> 三个和弦，你已经能弹《小星星》了！进行是{" "}
          <b>G → D → Em → D</b> 循环，每个和弦弹 <b>4 拍</b>（心里数 1-2-3-4 再换）。
        </Para>
        <Para>
          右手先用最简单的：每个和弦<b>往下扫一次</b>就行。扫稳了再换 53231323
          指法，立刻就有“弹唱”的感觉了。
        </Para>
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {SONG_CHORDS.map((c, i) => (
          <button
            key={i}
            onClick={() => playAt(i)}
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
            <span className={cn("block text-xs", idx === i ? "text-white/85" : "text-fog")}>
              4 拍
            </span>
          </button>
        ))}
      </div>
      <button onClick={toggleAuto} className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95">
        {auto ? "⏹ 停止跟弹" : "▶ 自动跟弹（跟着换和弦）"}
      </button>
      <Remember>
        换和弦跟不上？把自动跟弹当节拍器，<b>只练左手换指法</b>（右手先不弹），换顺了再加上右手。
      </Remember>
    </div>
  );
}

/* ================= 课程主体 ================= */

interface Lesson {
  id: string;
  title: string;
  sub: string;
  body: ReactNode;
}

const DONE_KEY = "zero-guitar-done";

export function ZeroGuitarCourse({ onGoTuner }: { onGoTuner?: () => void }) {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    warmup();
    try {
      const raw = localStorage.getItem(DONE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* 忽略 */
    }
  }, []);

  const toggleDone = (id: string) => {
    setDone((d) => {
      const n = d.includes(id) ? d.filter((x) => x !== id) : [...d, id];
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify(n));
      } catch {
        /* 忽略 */
      }
      return n;
    });
  };

  const lessons: Lesson[] = [
    {
      id: "anatomy",
      title: "认识吉他",
      sub: "先叫得出每个部位的名字",
      body: (
        <div className="space-y-3">
          <Para>
            吉他从上到下分三段：<b>琴头</b>（最上面，装着 6 个弦钮）、<b>琴颈</b>
            （长条，左手握的地方）、<b>琴身</b>（大肚子，负责把声音放大）。
          </Para>
          <Para>
            别小看这一步：以后教程里说“按 3 弦 2 品”“拧紧弦钮”，你得立刻知道在哪。点下面的图，一个个认：
          </Para>
          <IBox><AnatomyWidget /></IBox>
        </div>
      ),
    },
    {
      id: "strings",
      title: "六根弦与标准音",
      sub: "E A D G B E，一辈子都要背",
      body: (
        <div className="space-y-3">
          <Para>
            吉他有 <b>6 根弦</b>，从<b>最粗到最细</b>叫 6弦、5弦、4弦、3弦、2弦、1弦。
            每根弦空弦（什么都不按）都有固定的音高，叫<b>标准音</b>：
          </Para>
          <IBox><OpenStringsWidget /></IBox>
        </div>
      ),
    },
    {
      id: "tuning",
      title: "调音：每天第一件事",
      sub: "弦不准，练了也白练",
      body: <IBox><TuneWidget onGoTuner={onGoTuner} /></IBox>,
    },
    {
      id: "posture",
      title: "持琴姿势",
      sub: "姿势对了，后面全是顺的",
      body: (
        <div className="space-y-3">
          <Para>
            姿势这东西，错着练三个月不如对着练三天。核心就一句：
            <b>身体放松，琴放得稳，双手各就各位</b>。一条条对照：
          </Para>
          <IBox><PostureWidget /></IBox>
        </div>
      ),
    },
    {
      id: "tab",
      title: "看懂六线谱",
      sub: "吉他谱的阅读规则，3 分钟学会",
      body: <IBox><TabReaderWidget /></IBox>,
    },
    {
      id: "chords",
      title: "看懂和弦图",
      sub: "手指摆位说明书",
      body: (
        <div className="space-y-3">
          <Para>
            和弦 = 几个音同时响。左手按出固定的指法、右手一拨，就是一个和弦。
            先学会<b>看懂和弦图</b>，再一个个攻克：
          </Para>
          <IBox><ChordChartWidget /></IBox>
        </div>
      ),
    },
    {
      id: "picking",
      title: "右手拨弦：53231323",
      sub: "手指各管各的弦",
      body: <IBox><PickPatternWidget /></IBox>,
    },
    {
      id: "fretting",
      title: "左手按弦 + 第一个和弦",
      sub: "Em，全世界最简单的和弦",
      body: (
        <div className="space-y-3">
          <Para>
            左手疼、按不响、有杂音——每个新手都经历过，不是你笨，是手指还没长茧。
            按下面的三要领摆好 <b>Em</b>，这是你吉他生涯的第一个和弦：
          </Para>
          <IBox><FirstChordWidget /></IBox>
        </div>
      ),
    },
    {
      id: "song",
      title: "第一首歌《小星星》",
      sub: "三个和弦，弹唱入门",
      body: (
        <div className="space-y-3">
          <Para>
            恭喜走到这里！会了 G、D、Em，你已经能弹出完整的一首歌了。
            别追求速度，<b>换和弦不断、节奏稳</b>就是胜利：
          </Para>
          <IBox><FirstSongWidget /></IBox>
        </div>
      ),
    },
  ];

  const doneCount = lessons.filter((l) => done.includes(l.id)).length;

  return (
    <div className="flex flex-col gap-4">
      {/* 课程头 + 进度 */}
      <Card>
        <CardTitle>🎓 从零开始学吉他</CardTitle>
        <p className="mb-4 text-[13px] leading-6 text-fog">
          9 节课，每节都能动手点、动手听。不懂乐理、没摸过琴也能学。进度自动保存在本机。
        </p>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(doneCount / lessons.length) * 100}%` }}
            />
          </div>
          <span className="flex-none text-[13px] font-medium text-fog">
            {doneCount} / {lessons.length}
          </span>
        </div>
        {doneCount === lessons.length && (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            🎉 9 节全学完！去「🎶 吉他弹奏」页自由弹吧，或者挑战「🎯 互动跟学」里的歌。
          </p>
        )}
      </Card>

      {/* 课程列表 */}
      {lessons.map((l, i) => {
        const isDone = done.includes(l.id);
        return (
          <Card key={l.id} className={cn(isDone && "border-emerald-300/40")}>
            <div className="mb-1 flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 flex-none items-center justify-center rounded-full text-[15px] font-bold",
                  isDone ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"
                )}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <div>
                <h3 className="text-xl font-bold leading-7 text-zinc-900">
                  第 {i + 1} 课：{l.title}
                </h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-fog">
                  {l.sub}
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    约 5 分钟 · 零基础
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3">{l.body}</div>
            <button
              onClick={() => toggleDone(l.id)}
              className={cn(
                "mt-4 w-full rounded-full py-3 text-sm font-medium transition-all active:scale-[0.98]",
                isDone
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
              )}
            >
              {isDone ? "✓ 学会了（点此取消）" : "这节我学会了"}
            </button>
          </Card>
        );
      })}

      {/* 钢琴快速入门（保留） */}
      <Card>
        <CardTitle>🎹 钢琴快速入门</CardTitle>
        <div className="space-y-3">
          <Para>
            <b>找 do：</b>琴键按“2 黑 3 黑”分组。找到 <b>2 个黑键</b>的那组，它左边第一个白键就是{" "}
            <b>do</b>。白键从 do 开始：do re mi fa sol la si。
          </Para>
          <Para>
            <b>手型：</b>像握着鸡蛋，手指自然弯曲用指尖触键，手腕放平。
          </Para>
          <Para>
            <b>弹《小星星》</b>（1=do，去上面「🎹 钢琴」页点对应的键）：
          </Para>
          <div className="rounded-xl bg-[#202124] p-4 text-center font-mono text-[15px] leading-9 text-[#7be0a8]">
            1 1 5 5 6 6 5 — &nbsp; 4 4 3 3 2 2 1 —
          </div>
          <Para>
            <b>每天 15 分钟：</b>5 分钟音阶 → 5 分钟《小星星》→ 5 分钟自由弹。两周就有明显变化。
          </Para>
        </div>
      </Card>
    </div>
  );
}
