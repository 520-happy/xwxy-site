"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BUILTIN_LESSONS,
  getDone,
  markDone,
  type Lesson,
  type LessonNote,
  type LessonStep,
} from "@/data/lessons";
import { chordSVG, strumChord, CHORDS } from "@/data/chords";
import { ac, metroTick, pianoPlay } from "@/lib/audio";
import { createMiniPiano, type MiniPiano } from "./mini-piano";
import { cn } from "@/lib/utils";

/* ---------- 课程列表 ---------- */
export interface StartSignal {
  lesson: Lesson;
  n: number;
}

export function LessonPanel({
  extraLessons = [],
  startSignal = null,
}: {
  extraLessons?: Lesson[];
  startSignal?: StartSignal | null;
}) {
  const [lessons, setLessons] = useState<Lesson[]>(BUILTIN_LESSONS);
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState<Lesson | null>(null);

  useEffect(() => {
    setDone(getDone());
    fetch("/api/lessons")
      .then((r) => r.json())
      .then((arr) => {
        if (Array.isArray(arr) && arr.length) {
          setLessons((prev) => {
            const ids = new Set(prev.map((l) => l.id));
            const fresh = (arr as Lesson[]).filter((l) => !ids.has(l.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  // 合并外部注入的课程（如导入谱自动生成的初版跟学）
  const all = [...lessons];
  extraLessons.forEach((l) => {
    if (!all.some((x) => x.id === l.id)) all.push(l);
  });

  useEffect(() => {
    if (startSignal) {
      setActive(startSignal.lesson);
      window.scrollTo(0, 0);
    }
  }, [startSignal]);

  if (active) {
    return (
      <LessonRunner
        lesson={active}
        onExit={() => {
          setActive(null);
          setDone(getDone());
        }}
      />
    );
  }

  return (
    <Card>
      <CardTitle>
        🎯 互动跟学{" "}
        <span className="ml-2 rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
          一步一步带你弹会
        </span>
      </CardTitle>
      <p className="mt-2 text-[13px] leading-7 text-fog">
        每首歌都有独属的跟学课程：先听示范，再跟着弹，达标自动过关。从零开始推荐先学《小星星》。导入的谱子我会在后台做成跟学课程，做好后通知你。
      </p>
      <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {all.map((L) => (
          <div key={L.id} className="glass rounded-2xl p-5">
            <div className="mb-1 flex items-start justify-between gap-2">
              <div>
                <h4 className="text-[15px] font-semibold">
                  {L.icon} {L.title}
                </h4>
                <div className="mt-0.5 text-xs text-fog">{L.sub}</div>
              </div>
              {done.includes(L.id) && (
                <div className="flex-none text-[13px] font-medium text-accent">✅ 已学会</div>
              )}
            </div>
            <div className="mb-3.5 text-[13px] leading-6 text-fog">{L.desc}</div>
            <Button variant="primary" size="sm" onClick={() => setActive(L)}>
              🎯 开始跟学
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- 课程播放器 ---------- */
function LessonRunner({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const step = lesson.steps[idx];

  const next = useCallback(() => {
    setIdx((i) => Math.min(i + 1, lesson.steps.length - 1));
    window.scrollTo(0, 0);
  }, [lesson.steps.length]);

  return (
    <Card>
      <div className="mb-2.5 flex items-center justify-between">
        <CardTitle className="!mb-0">
          {lesson.icon} {lesson.title} · {lesson.sub}
        </CardTitle>
        <Button variant="pill" size="sm" onClick={onExit}>
          ← 返回
        </Button>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-zinc-900 transition-all"
          style={{ width: `${(idx / lesson.steps.length) * 100}%` }}
        />
      </div>
      <div className="my-2 text-[13px] text-fog">
        第 {idx + 1} 步 / 共 {lesson.steps.length} 步
        {"label" in step && step.label ? ` · ${step.label}` : ""}
      </div>
      <StepBody key={idx} step={step} onNext={next} onFinish={() => { markDone(lesson.id); onExit(); }} />
    </Card>
  );
}

function StepBody({
  step,
  onNext,
  onFinish,
}: {
  step: LessonStep;
  onNext: () => void;
  onFinish: () => void;
}) {
  switch (step.kind) {
    case "intro":
      return (
        <>
          <div className="rounded-xl bg-accent-soft/60 p-4 text-sm leading-8" dangerouslySetInnerHTML={{ __html: step.text }} />
          <div className="mt-3.5">
            <Button onClick={onNext}>开始学习 →</Button>
          </div>
        </>
      );
    case "outro":
      return (
        <>
          <div className="rounded-xl bg-accent-soft/60 p-4 text-sm leading-8" dangerouslySetInnerHTML={{ __html: step.text }} />
          <div className="mt-3.5">
            <Button onClick={onFinish}>🏁 完成课程</Button>
          </div>
        </>
      );
    case "listen":
      return <ListenStep notes={step.notes} onNext={onNext} />;
    case "follow":
      return <FollowStep notes={step.notes} onNext={onNext} />;
    case "chord":
      return <ChordStep chord={step.chord} tip={step.tip} onNext={onNext} />;
    case "progression":
      return (
        <ProgressionStep
          chords={step.chords}
          bpm={step.bpm}
          cycles={step.cycles}
          pattern={step.pattern}
          tip={step.tip}
          onNext={onNext}
        />
      );
  }
}

/* ---------- 乐句音符展示 ---------- */
function PhraseNotes({ notes, highlight, doneCount }: { notes: LessonNote[]; highlight: number; doneCount: number }) {
  return (
    <div className="my-3 flex flex-wrap gap-2">
      {notes.map((n, i) => (
        <div
          key={i}
          className={cn(
            "flex w-[52px] flex-col items-center rounded-xl border border-white/80 bg-white/60 py-2 backdrop-blur-[10px]",
            i === highlight && "border-accent bg-accent/[0.12] shadow-[0_0_0_2px_rgba(79,109,245,0.4)]",
            i < doneCount && "border-accent/50 bg-accent-soft"
          )}
        >
          <div className="text-xl font-bold">{n.jp}</div>
          <div className="text-[11px] text-fog">{n.nm}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 听示范 ---------- */
function ListenStep({ notes, onNext }: { notes: LessonNote[]; onNext: () => void }) {
  const miniRef = useRef<HTMLDivElement>(null);
  const mpRef = useRef<MiniPiano | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [playing, setPlaying] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (miniRef.current) {
      const midis = notes.map((n) => n.midi);
      mpRef.current = createMiniPiano(miniRef.current, Math.min(...midis) - 2, Math.max(...midis) + 2);
    }
    const t = setTimeout(() => play(), 600);
    timers.current.push(t);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      mpRef.current?.destroy();
      mpRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = () => {
    setPlaying(true);
    setDoneCount(0);
    const beat = 0.5;
    let t = 0;
    notes.forEach((n, i) => {
      timers.current.push(
        setTimeout(() => {
          setHighlight(i);
          setDoneCount(i + 1);
          mpRef.current?.flash(n.midi, 400);
          pianoPlay(n.midi, "piano", 70);
        }, t * 1000)
      );
      t += n.beats * beat;
    });
    timers.current.push(
      setTimeout(() => {
        setPlaying(false);
        setHighlight(-1);
      }, t * 1000 + 200)
    );
  };

  return (
    <>
      <div className="rounded-xl bg-accent-soft/60 p-4 text-sm leading-8">
        👂 先听一遍示范，注意看亮起的琴键和音符，记住旋律走向。
      </div>
      <PhraseNotes notes={notes} highlight={highlight} doneCount={doneCount} />
      <div ref={miniRef} className="my-3" />
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <Button onClick={play} disabled={playing}>
          🔊 播放示范
        </Button>
        <Button variant="pill" onClick={onNext}>
          听会了，去跟弹 →
        </Button>
      </div>
    </>
  );
}

/* ---------- 跟弹过关 ---------- */
function FollowStep({ notes, onNext }: { notes: LessonNote[]; onNext: () => void }) {
  const miniRef = useRef<HTMLDivElement>(null);
  const mpRef = useRef<MiniPiano | null>(null);
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; score: number } | null>(null);
  const locked = useRef(false);
  const stateRef = useRef({ idx: 0, hits: 0, misses: 0 });
  ac(); // 确保 AudioContext 已创建（需用户手势时由点击触发）

  useEffect(() => {
    if (miniRef.current) {
      const midis = notes.map((n) => n.midi);
      mpRef.current = createMiniPiano(
        miniRef.current,
        Math.min(...midis) - 2,
        Math.max(...midis) + 2,
        (m) => {
          const s = stateRef.current;
          if (locked.current || s.idx >= notes.length) return;
          if (m === notes[s.idx].midi) {
            s.hits++;
            mpRef.current?.clearGuide();
            s.idx++;
            setIdx(s.idx);
            setHits(s.hits);
            if (s.idx < notes.length) {
              mpRef.current?.setGuide(notes[s.idx].midi);
            } else {
              finish(s.hits, s.misses);
            }
          } else {
            s.misses++;
            setMisses(s.misses);
          }
        }
      );
      mpRef.current.setGuide(notes[0].midi);
    }
    return () => {
      mpRef.current?.destroy();
      mpRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (h: number, ms: number) => {
    locked.current = true;
    mpRef.current?.clearGuide();
    const total = h + ms;
    const score = total ? Math.round((h / total) * 100) : 100;
    setResult({ ok: score >= 80, score });
  };

  const retry = () => {
    locked.current = false;
    stateRef.current = { idx: 0, hits: 0, misses: 0 };
    setIdx(0);
    setHits(0);
    setMisses(0);
    setResult(null);
    mpRef.current?.setGuide(notes[0].midi);
  };

  return (
    <>
      <div className="rounded-xl bg-accent-soft/60 p-4 text-sm leading-8">
        🎹 轮到你了！<b>亮起哪个键就按哪个</b>，正确率 80% 过关。按错没关系，继续往下弹。
      </div>
      <PhraseNotes notes={notes} highlight={result ? -1 : idx} doneCount={idx} />
      <div ref={miniRef} className="my-3" />
      {result && (
        <div
          className={cn(
            "my-3 rounded-xl p-4 text-center text-[15px] font-semibold",
            result.ok ? "bg-accent-soft text-accent-deep" : "bg-warn-soft text-warn"
          )}
        >
          {result.ok
            ? `✅ 通过！正确率 ${result.score}%（弹对 ${hits}，按错 ${misses}）`
            : `正确率 ${result.score}%，还差一点（要 80% 过关），再练一次吧`}
        </div>
      )}
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {result?.ok && <Button onClick={onNext}>过关，下一句 →</Button>}
        {result && !result.ok && (
          <Button onClick={retry}>🔁 重新跟弹</Button>
        )}
      </div>
    </>
  );
}

/* ---------- 学和弦 ---------- */
function ChordStep({ chord, tip, onNext }: { chord: string; tip: string; onNext: () => void }) {
  return (
    <>
      {tip && (
        <div
          className="rounded-xl bg-accent-soft/60 p-4 text-sm leading-8"
          dangerouslySetInnerHTML={{ __html: tip }}
        />
      )}
      <div className="my-4 flex flex-wrap items-center gap-6">
        <div dangerouslySetInnerHTML={{ __html: chordSVG(chord) }} />
        <div>
          <div className="text-4xl font-bold">{chord}</div>
          <div className="mt-2 text-[13px] leading-7 text-fog">
            × = 不弹　○ = 空弦
            <br />
            指尖按弦，逐根拨响检查
          </div>
          {CHORDS[chord]?.fg && (
            <div className="mt-1 text-xs text-fog-light">{CHORDS[chord].fg}</div>
          )}
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <Button variant="pill" onClick={() => strumChord(chord)}>
          🔊 听听这个和弦
        </Button>
        <Button onClick={onNext}>这个会了，下一个 →</Button>
      </div>
    </>
  );
}

/* ---------- 跟节拍器走进行 ---------- */
function ProgressionStep({
  chords,
  bpm,
  cycles,
  pattern,
  tip,
  onNext,
}: {
  chords: string[];
  bpm: number;
  cycles: number;
  pattern: string;
  tip: string;
  onNext: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [cur, setCur] = useState(0);
  const [beats, setBeats] = useState("○○○○");
  const [cycleLabel, setCycleLabel] = useState("准备…按开始后跟着弹");
  const [done, setDone] = useState(false);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (ivRef.current) clearInterval(ivRef.current);
    },
    []
  );

  const stop = () => {
    if (ivRef.current) {
      clearInterval(ivRef.current);
      ivRef.current = null;
    }
    setRunning(false);
  };

  const start = () => {
    const beatMs = 60000 / bpm;
    let beat = 0;
    let ci = 0;
    let doneBars = 0;
    const totalBars = cycles * chords.length;
    setRunning(true);
    setDone(false);
    setCur(0);
    setCycleLabel(`第 1 / ${cycles} 遍`);
    const tick = () => {
      const inBar = beat % 4;
      setBeats("●".repeat(inBar + 1) + "○".repeat(3 - inBar));
      metroTick(inBar === 0);
      if (inBar === 0) {
        setCur(ci);
        strumChord(chords[ci]);
      }
      beat++;
      if (beat % 4 === 0) {
        ci = (ci + 1) % chords.length;
        doneBars++;
        if (doneBars >= totalBars) {
          stop();
          setDone(true);
          return;
        }
        if (doneBars % chords.length === 0) {
          setCycleLabel(`第 ${doneBars / chords.length + 1} / ${cycles} 遍`);
        }
      }
    };
    tick();
    ivRef.current = setInterval(tick, beatMs);
  };

  return (
    <>
      <div className="rounded-xl bg-accent-soft/60 p-4 text-sm leading-8">
        <span dangerouslySetInnerHTML={{ __html: tip }} />
        <br />
        速度 <b>{bpm}</b> BPM，每 4 拍换一个和弦，共 <b>{cycles}</b> 遍。右手节奏型：
        <b>{pattern}</b>
      </div>
      <div className="my-4 flex flex-wrap items-center gap-6">
        <div dangerouslySetInnerHTML={{ __html: chordSVG(chords[cur]) }} />
        <div>
          <div className="text-xs text-fog">当前和弦</div>
          <div className="text-4xl font-bold">{chords[cur]}</div>
          <div className="mt-1.5 text-[13px] text-fog">下一个：{chords[(cur + 1) % chords.length]}</div>
          <div className="mt-2 text-2xl tracking-[8px]">{beats}</div>
          <div className="mt-1 text-[13px] text-fog">{cycleLabel}</div>
        </div>
      </div>
      {done && (
        <div className="my-3 rounded-xl bg-accent-soft p-4 text-center text-[15px] font-semibold text-accent-deep">
          ✅ 跟弹完成！{cycles} 遍 {chords.join(" → ")} 全部拿下
        </div>
      )}
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {!running && !done && <Button onClick={start}>▶ 开始跟弹</Button>}
        {running && (
          <Button variant="pill" onClick={stop}>
            ⏹ 停止
          </Button>
        )}
        {done && <Button onClick={onNext}>下一步 →</Button>}
      </div>
    </>
  );
}
