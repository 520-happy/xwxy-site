"use client";

/**
 * 第 0 章 · 先玩会音乐（超基础热身）
 *
 * 给"我是个笨蛋"版本的用户：从"声音有高低"这种最基础的地方开始，
 * 每节都是点一点就能玩的小游戏，零术语、零门槛。
 */
import { useEffect, useRef, useState } from "react";
import { Para, IBox, Remember, Steps, type Lesson } from "./learn-guitar";
import { ac, playTone, metroTick, noteName } from "@/lib/audio";
import { pluckFret } from "@/lib/guitar-audio";
import { cn } from "@/lib/utils";

/* ================= 游戏 1：声音有高低 ================= */

function PitchGame() {
  const BASES = [196.0, 220.0, 246.94, 261.63, 293.66, 329.63];
  const ROUNDS = 5;
  const [phase, setPhase] = useState<"idle" | "asking" | "done">("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<{ a: number; b: number; hi: 0 | 1 } | null>(null);
  const [picked, setPicked] = useState<0 | 1 | null>(null);

  const newQ = () => {
    const base = BASES[Math.floor(Math.random() * BASES.length)];
    const steps = 2 + Math.floor(Math.random() * 4); // 差 2～5 个半音，好分辨
    const up = Math.random() < 0.5;
    const a = base;
    const b = base * Math.pow(2, ((up ? steps : -steps) as number) / 12);
    setQ({ a, b, hi: b > a ? 1 : 0 });
    setPicked(null);
    const t = ac().currentTime;
    playTone(a, 1.1, "sine", 0.5, t + 0.05);
    playTone(b, 1.1, "sine", 0.5, t + 1.05);
  };

  const start = () => {
    setRound(0);
    setScore(0);
    setPhase("asking");
    newQ();
  };

  const replay = () => {
    if (!q) return;
    const t = ac().currentTime;
    playTone(q.a, 1.1, "sine", 0.5, t + 0.05);
    playTone(q.b, 1.1, "sine", 0.5, t + 1.05);
  };

  const pick = (i: 0 | 1) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.hi) setScore((s) => s + 1);
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
          我会放<b>两声</b>，你点出<b>更高</b>的那一声。共 {ROUNDS} 题，听不清可以重听：
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
          {ROUNDS} 题答对了 {score} 题
        </p>
        <p className="mt-2 text-sm leading-7 text-zinc-600">
          {score >= 4
            ? "耳朵很灵！吉他上“高”和“低”的感觉就是这样。"
            : score >= 3
              ? "不错！多听几次，高低感会越来越准。"
              : "没关系，音乐耳朵是练出来的，再玩一次试试？"}
        </p>
        <button onClick={start} className="btn-pill mt-4 px-6 py-2.5 text-sm">
          再玩一次
        </button>
      </div>
    );

  const correct = picked !== null && q !== null && picked === q.hi;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[13px] text-fog">
        <span>
          第 {round + 1} / {ROUNDS} 题
        </span>
        <span>得分：{score}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["第一声", "第二声"] as const).map((label, i) => (
          <button
            key={label}
            onClick={() => pick(i as 0 | 1)}
            disabled={picked !== null}
            className={cn(
              "rounded-2xl border-2 py-6 text-lg font-bold transition-all active:scale-95",
              picked === null
                ? "border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50"
                : i === q!.hi
                  ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                  : picked === i
                    ? "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-zinc-200 bg-white opacity-60"
            )}
          >
            🔊 {label}
            <span className="mt-1 block text-xs font-normal text-fog">更高的是这声？</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button onClick={replay} className="text-sm text-emerald-700 underline">
          🔁 再听一次
        </button>
        {picked !== null && (
          <button onClick={next} className="btn-primary px-6 py-2 text-sm">
            {round + 1 >= ROUNDS ? "看成绩" : "下一题 →"}
          </button>
        )}
      </div>
      {picked !== null && (
        <p className={cn("mt-3 text-center text-sm font-medium", correct ? "text-emerald-700" : "text-amber-700")}>
          {correct ? "✅ 对啦！就是这声更高。" : `💡 是${q!.hi === 0 ? "第一" : "第二"}声更高，再听听感受下。`}
        </p>
      )}
    </div>
  );
}

/* ================= 游戏 2：跟着拍子点 ================= */

type TapMark = "完美" | "很好" | "早了" | "晚了" | "漏拍";

function RhythmGame() {
  const BPM = 90;
  const IV = 60000 / BPM;
  const BEATS = 8;
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [results, setResults] = useState<TapMark[]>([]);
  const [cur, setCur] = useState(0);
  const ticks = useRef<number[]>([]);
  const judged = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const ts = timers.current;
    return () => ts.forEach((t) => clearTimeout(t));
  }, []);

  const finish = () => {
    setResults((r) => {
      const miss: TapMark[] = [];
      for (let k = judged.current; k < ticks.current.length; k++) miss.push("漏拍");
      return [...r, ...miss];
    });
    setPhase("done");
  };

  const start = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    ticks.current = [];
    judged.current = 0;
    setResults([]);
    setCur(0);
    setPhase("running");
    for (let i = 0; i < BEATS; i++) {
      const t = window.setTimeout(
        () => {
          metroTick(i % 4 === 0);
          ticks.current.push(performance.now());
          setCur(i + 1);
        },
        600 + i * IV
      );
      timers.current.push(t);
    }
    timers.current.push(window.setTimeout(finish, 600 + BEATS * IV + 700));
  };

  const tap = () => {
    if (phase !== "running") return;
    const j = judged.current;
    if (j >= ticks.current.length) return;
    const dt = performance.now() - ticks.current[j];
    if (dt < -300) return; // 抢太早，不算
    judged.current = j + 1;
    const adt = Math.abs(dt);
    const mark: TapMark = adt <= 90 ? "完美" : adt <= 180 ? "很好" : dt < 0 ? "早了" : "晚了";
    setResults((r) => [...r, mark]);
  };

  const good = results.filter((r) => r === "完美" || r === "很好").length;

  if (phase === "idle")
    return (
      <div className="text-center">
        <p className="mb-4 text-sm leading-7 text-zinc-600">
          节拍器会"哒哒哒"响 {BEATS} 下（第一下重）。你跟着<b>每一拍点一下</b>大按钮，看看能不能合上：
        </p>
        <button onClick={start} className="btn-primary px-8 py-3 text-[15px]">
          开始 🥁
        </button>
      </div>
    );

  if (phase === "done")
    return (
      <div className="text-center">
        <p className="text-4xl">{good >= 6 ? "🎉" : good >= 4 ? "👍" : "💪"}</p>
        <p className="mt-3 text-[15px] font-medium text-zinc-800">
          {BEATS} 拍里，{good} 拍合上了
        </p>
        <p className="mt-2 text-sm leading-7 text-zinc-600">
          {good >= 6
            ? "节奏感很稳！弹吉他最需要的就是这个。"
            : "多试几次，身体会记住这个速度。吉他手都是这样练出来的。"}
        </p>
        <button onClick={start} className="btn-pill mt-4 px-6 py-2.5 text-sm">
          再来一次
        </button>
      </div>
    );

  const dotColor = (m: TapMark) =>
    m === "完美"
      ? "bg-emerald-500"
      : m === "很好"
        ? "bg-sky-400"
        : m === "漏拍"
          ? "bg-zinc-300"
          : "bg-amber-400";
  return (
    <div className="text-center">
      <div className="mb-4 flex justify-center gap-2">
        {Array.from({ length: BEATS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-3 rounded-full transition-all",
              i < results.length ? dotColor(results[i]) : i < cur ? "bg-zinc-200" : "bg-zinc-100"
            )}
          />
        ))}
      </div>
      <button
        onPointerDown={tap}
        className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-lg transition-transform active:scale-90"
      >
        拍！
      </button>
      <p className="mt-3 text-[13px] text-fog">
        {results.length > 0 ? (
          <>
            上一拍：<b className="text-zinc-800">{results[results.length - 1]}</b>
          </>
        ) : (
          "听到哒声就点，第 1 拍最重"
        )}
      </p>
    </div>
  );
}

/* ================= 游戏 3：音有名字 ================= */

const SOLFEGE = [
  { n: "do", f: 261.63 },
  { n: "re", f: 293.66 },
  { n: "mi", f: 329.63 },
  { n: "fa", f: 349.23 },
  { n: "sol", f: 392.0 },
];

function NoteNameGame() {
  const CHOICES = ["do", "re", "mi"];
  const ROUNDS = 5;
  const [phase, setPhase] = useState<"idle" | "asking" | "done">("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const play = (f: number) => playTone(f, 1.2, "sine", 0.5);

  const newQ = () => {
    const t = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    setTarget(t);
    setPicked(null);
    const f = SOLFEGE.find((s) => s.n === t)!.f;
    const now = ac().currentTime;
    playTone(f, 1.2, "sine", 0.5, now + 0.1);
  };

  const start = () => {
    setRound(0);
    setScore(0);
    setPhase("asking");
    setTimeout(newQ, 300);
  };

  const pick = (n: string) => {
    if (picked !== null) return;
    setPicked(n);
    if (n === target) setScore((s) => s + 1);
  };

  const next = () => {
    if (round + 1 >= ROUNDS) setPhase("done");
    else {
      setRound((r) => r + 1);
      setTimeout(newQ, 300);
    }
  };

  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">先点一点，记住每个音的样子：</p>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {SOLFEGE.map((s) => (
          <button
            key={s.n}
            onClick={() => play(s.f)}
            className="rounded-xl border border-emerald-200 bg-white py-3 text-sm font-bold text-emerald-800 transition-all hover:bg-emerald-50 active:scale-95"
          >
            {s.n}
          </button>
        ))}
      </div>

      {phase === "idle" && (
        <div className="text-center">
          <p className="mb-4 text-sm leading-7 text-zinc-600">
            记住 do / re / mi 的声音了吗？来玩<b>听音找名</b>：放一声，点出它的名字，共 {ROUNDS} 题：
          </p>
          <button onClick={start} className="btn-primary px-8 py-3 text-[15px]">
            开始挑战 🎯
          </button>
        </div>
      )}

      {phase === "asking" && target && (
        <div className="rounded-xl bg-white/70 p-3 text-center">
          <div className="mb-2 flex items-center justify-between text-[13px] text-fog">
            <span>
              第 {round + 1} / {ROUNDS} 题
            </span>
            <span>得分：{score}</span>
          </div>
          <button
            onClick={() => play(SOLFEGE.find((s) => s.n === target)!.f)}
            className="mb-3 text-sm text-emerald-700 underline"
          >
            🔊 再听一次
          </button>
          <div className="grid grid-cols-3 gap-3">
            {CHOICES.map((n) => (
              <button
                key={n}
                onClick={() => pick(n)}
                disabled={picked !== null}
                className={cn(
                  "rounded-2xl border-2 py-5 text-xl font-bold transition-all active:scale-95",
                  picked === null
                    ? "border-emerald-200 bg-white hover:border-emerald-400"
                    : n === target
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
            <div className="mt-3">
              <p className={cn("text-sm font-medium", picked === target ? "text-emerald-700" : "text-amber-700")}>
                {picked === target ? "✅ 对啦！" : `💡 是 ${target}，记住它的声音`}
              </p>
              <button onClick={next} className="btn-primary mt-2 px-6 py-2 text-sm">
                {round + 1 >= ROUNDS ? "看成绩" : "下一题 →"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="mt-3 text-center">
          <p className="text-[15px] font-medium text-zinc-800">
            {ROUNDS} 题对了 {score} 题 {score >= 4 ? "🎉" : "💪"}
          </p>
          <button onClick={start} className="btn-pill mt-3 px-6 py-2.5 text-sm">
            再玩一次
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= 游戏 4：品格的魔法 ================= */

function FretMagic() {
  const [last, setLast] = useState<{ fret: number; name: string; hz: string } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const tap = (fret: number) => {
    pluckFret(5, fret, 0.9); // 1弦，最细最亮
    const f = 329.63 * Math.pow(2, fret / 12);
    const nn = noteName(f);
    setLast({ fret, name: `${nn.name}${nn.oct}`, hz: f.toFixed(1) });
  };

  return (
    <div>
      <p className="mb-3 text-[13px] text-fog">
        这是一根吉他弦的 0～5 品（0 = 空弦，什么都不按）。<b>从左往右一个个点</b>，仔细听：
      </p>
      <div className="mb-2 flex gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((f) => (
          <button
            key={f}
            onClick={() => tap(f)}
            className={cn(
              "flex-1 rounded-xl border-2 py-4 text-sm font-bold transition-all active:scale-95",
              last?.fret === f
                ? "border-amber-500 bg-amber-100 text-amber-900"
                : "border-zinc-200 bg-white hover:border-amber-300"
            )}
          >
            {f === 0 ? "空弦" : `${f}品`}
          </button>
        ))}
      </div>
      <p className="mb-4 h-6 text-center text-[13px] text-fog" aria-live="polite">
        {last ? `🔊 ${last.fret === 0 ? "空弦" : `${last.fret}品`} = ${last.name}（${last.hz} Hz）` : "点上面的格子听声音"}
      </p>

      <div className="rounded-xl bg-white/70 p-4 text-center">
        <p className="mb-3 text-[15px] font-medium text-zinc-800">
          考考你：手指越往<b>右</b>（往琴身方向）按，声音会？
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["变高了", "变低了"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setPicked(opt)}
              className={cn(
                "rounded-2xl border-2 py-4 text-base font-bold transition-all active:scale-95",
                picked === null
                  ? "border-emerald-200 bg-white hover:border-emerald-400"
                  : opt === "变高了"
                    ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                    : picked === opt
                      ? "border-rose-400 bg-rose-50 text-rose-700"
                      : "border-zinc-200 bg-white opacity-60"
              )}
            >
              {opt === "变高了" ? "📈 " : "📉 "}
              {opt}
            </button>
          ))}
        </div>
        {picked !== null && (
          <p className={cn("mt-3 text-sm font-medium", picked === "变高了" ? "text-emerald-700" : "text-amber-700")}>
            {picked === "变高了"
              ? "✅ 完全正确！这就是吉他最核心的秘密。"
              : "💡 再点点上面的格子对比下——是变高了哦。"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ================= 第 0 章课程表 ================= */

export const zeroLessons: Lesson[] = [
  {
    id: "z0-pitch",
    title: "声音有高低",
    sub: "耳朵的第一课：分出高和低",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>学吉他前，先跟耳朵交个朋友。</Para>
        <Para>音乐最重要的两件事：<b>声音有高低</b>（音高）、<b>声音有节奏</b>（拍子）。这节只玩第一件——高的像小鸟叫，低的像敲大鼓。</Para>
      </div>,
      <IBox key="s2"><PitchGame /></IBox>,
      <Remember key="s3">吉他上“高”和“低”的感觉，和你刚才玩的一模一样。耳朵灵了，后面全是顺的。</Remember>,
    ],
  },
  {
    id: "z0-rhythm",
    title: "跟着拍子点",
    sub: "音乐的心跳，叫拍子",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>所有好听的音乐都有<b>心跳</b>——一下、一下，均匀地走，叫<b>拍子</b>。</Para>
        <Para>弹吉他时右手就是跟着它动的。先别碰琴，用手指跟它交个朋友 👇</Para>
      </div>,
      <IBox key="s2"><RhythmGame /></IBox>,
      <Remember key="s3">合上拍就是胜利。以后弹琴，心里也这样数着拍子。</Remember>,
    ],
  },
  {
    id: "z0-names",
    title: "音有名字",
    sub: "do re mi，可不是儿歌专利",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>每个音高都有名字，最常用的叫<b>唱名</b>：<b>do re mi fa sol la si</b>。</Para>
        <Para>点一点记住它们，再玩听音游戏 👇</Para>
      </div>,
      <IBox key="s2"><NoteNameGame /></IBox>,
      <Remember key="s3">偷偷告诉你：吉他 1 弦空弦拨出来就是 <b>mi</b>。你已经认识第一个吉他音了。</Remember>,
    ],
  },
  {
    id: "z0-fret",
    title: "品格的魔法",
    sub: "吉他最核心的秘密，30 秒亲手发现",
    steps: [
      <div key="s1" className="space-y-3">
        <Para>为什么<b>一根弦</b>能弹出那么多不同的音？</Para>
        <Para>秘密在<b>品格</b>上：手指按的位置不同，弦振动的长度就不同，声音高低就变了。亲手点一点 👇</Para>
      </div>,
      <IBox key="s2"><FretMagic /></IBox>,
      <Remember key="s3">每往下一品，音高半音；到 12 品正好高八度。<b>整把吉他 = 6 根弦 × 这个魔法。</b></Remember>,
    ],
  },
];
