"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Square,
  RotateCcw,
  Volume2,
  Check,
  Headphones,
  Keyboard,
} from "lucide-react";
import {
  loadInstrument,
  sampledVoice,
  type InstrumentVoice,
} from "@/lib/instrument-samples";
import {
  PIANO_EXERCISES,
  SOLFEGE,
  midiLabel,
  savePractice,
} from "@/data/piano-exercises";
import { cn } from "@/lib/utils";

const KEYBOARD: Record<string, number> = {
  a: 0,
  w: 1,
  s: 2,
  e: 3,
  d: 4,
  f: 5,
  t: 6,
  g: 7,
  y: 8,
  h: 9,
  u: 10,
  j: 11,
  k: 12,
};
type Mode = "free" | "demo" | "follow";
export function PianoPanel() {
  const [exerciseId, setExerciseId] = useState("five");
  const exercise = PIANO_EXERCISES.find((e) => e.id === exerciseId)!;
  const [bpm, setBpm] = useState(70);
  const [volume, setVolume] = useState(65);
  const [mode, setMode] = useState<Mode>("free");
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState("先听一遍，再跟着亮起的琴键弹奏。");
  const [active, setActive] = useState<Set<number>>(new Set());
  const [pedal, setPedal] = useState(false);
  const [wide, setWide] = useState(false);
  const [labels, setLabels] = useState(true);
  const [sampleStatus, setSampleStatus] = useState("点击启用录音音色");
  const [loading, setLoading] = useState(false);
  const [lastNote, setLastNote] = useState("中央 C · C4");
  const voices = useRef(new Map<number, InstrumentVoice>());
  const held = useRef(new Map<number, Set<string>>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pedalRef = useRef(false);
  const session = useRef({
    mode: "free" as Mode,
    index: 0,
    mistakes: 0,
    done: false,
  });
  const mounted = useRef(true);
  const base = wide || exerciseId === "left" ? 48 : 60;
  const end = wide ? 84 : base + 12;
  const keys = Array.from({ length: end - base + 1 }, (_, i) => base + i);
  const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);
  const whiteKeys = keys.filter((m) => !isBlack(m));
  const target = mode === "follow" && !done ? exercise.notes[index] : null;
  const enableSamples = useCallback(async () => {
    setLoading(true);
    setSampleStatus("正在准备钢琴音色…");
    try {
      const ready = await loadInstrument("piano");
      if (mounted.current)
        setSampleStatus(
          ready ? "钢琴录音音色已就绪" : "部分音色未加载，可点此重试",
        );
    } catch {
      if (mounted.current) setSampleStatus("暂用合成音，点此重试");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  const silence = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    voices.current.forEach((v) => v.release(0.04));
    voices.current.clear();
    held.current.clear();
    setActive(new Set());
  }, []);
  const stop = useCallback(() => {
    silence();
    session.current.mode = "free";
    setMode("free");
  }, [silence]);
  const setSustain = useCallback((value: boolean) => {
    pedalRef.current = value;
    setPedal(value);
    if (!value)
      voices.current.forEach((v, m) => {
        if (!held.current.has(m)) {
          v.release();
          voices.current.delete(m);
        }
      });
  }, []);
  const noteOn = useCallback(
    (midi: number, owner: string, velocity = 1) => {
      const owners = held.current.get(midi);
      if (owners?.has(owner)) return;
      if (owners?.size) {
        owners.add(owner);
        return;
      }
      held.current.set(midi, new Set([owner]));
      voices.current.get(midi)?.release(0.025);
      voices.current.set(
        midi,
        sampledVoice("piano", midi, (volume / 100) * velocity),
      );
      setActive((prev) => new Set(prev).add(midi));
      setLastNote(`${midiLabel(midi)} · ${SOLFEGE[midi % 12]}`);
    },
    [volume],
  );
  const noteOff = useCallback((midi: number, owner: string) => {
    const owners = held.current.get(midi);
    if (!owners) return;
    owners.delete(owner);
    if (owners.size) return;
    held.current.delete(midi);
    setActive((prev) => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
    if (!pedalRef.current) {
      voices.current.get(midi)?.release();
      voices.current.delete(midi);
    }
  }, []);
  const press = useCallback(
    (midi: number, owner: string, velocity = 1) => {
      if (session.current.mode === "demo") stop();
      if (held.current.get(midi)?.has(owner)) return;
      noteOn(midi, owner, velocity);
      const s = session.current;
      if (s.mode !== "follow" || s.done) return;
      if (exercise.notes[s.index].midi !== midi) {
        s.mistakes += 1;
        setMistakes(s.mistakes);
        setFeedback(
          `再试试 ${midiLabel(exercise.notes[s.index].midi)}，慢一点也没关系。`,
        );
        return;
      }
      s.index += 1;
      if (s.index === exercise.notes.length) {
        s.done = true;
        setDone(true);
        const saved = savePractice(exercise.id, s.mistakes);
        setFeedback(
          `这一句弹完了！${saved ? "本机进度已保存。" : "浏览器未允许保存进度。"}接下来试着保持每个音的长短。`,
        );
      } else {
        setIndex(s.index);
        setFeedback("对了，继续下一个音。");
      }
    },
    [exercise, noteOn, stop],
  );
  const startFollow = () => {
    silence();
    setSustain(false);
    session.current = { mode: "follow", index: 0, mistakes: 0, done: false };
    setMode("follow");
    setIndex(0);
    setMistakes(0);
    setDone(false);
    setFeedback("跟着绿色琴键弹奏；这里练习音高顺序，不评判实琴手型和节奏。");
  };
  const playDemo = () => {
    silence();
    setSustain(false);
    session.current.mode = "demo";
    setMode("demo");
    setDone(false);
    setIndex(0);
    setFeedback("听每个音的长短。演示结束后，点击「跟着弹」。");
    let elapsed = 0;
    exercise.notes.forEach((note, i) => {
      const duration = (note.beats * 60000) / bpm;
      timers.current.push(
        setTimeout(() => {
          setIndex(i);
          noteOn(note.midi, "demo");
        }, elapsed),
      );
      timers.current.push(
        setTimeout(() => noteOff(note.midi, "demo"), elapsed + duration * 0.85),
      );
      elapsed += duration;
    });
    timers.current.push(
      setTimeout(() => {
        stop();
        setFeedback("听完了。准备好就来跟着弹吧。");
      }, elapsed),
    );
  };
  useEffect(() => {
    const keyboardOwners = new Map<string, number>();
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input,textarea,select,[contenteditable=true]")) return;
      if (e.code === "Space" && el.tagName !== "BUTTON") {
        e.preventDefault();
        setSustain(true);
        return;
      }
      const offset = KEYBOARD[e.key.toLowerCase()];
      if (offset === undefined) return;
      e.preventDefault();
      const midi = (exerciseId === "left" ? 48 : 60) + offset;
      keyboardOwners.set(e.code, midi);
      press(midi, `key-${e.code}`);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSustain(false);
      const midi = keyboardOwners.get(e.code);
      if (midi !== undefined) {
        noteOff(midi, `key-${e.code}`);
        keyboardOwners.delete(e.code);
      }
    };
    const blur = () => {
      keyboardOwners.clear();
      stop();
      setSustain(false);
    };
    const hidden = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      keyboardOwners.forEach((m, code) => noteOff(m, `key-${code}`));
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [press, noteOff, setSustain, stop, exerciseId]);
  useEffect(() => {
    mounted.current = true;
    const currentVoices = voices.current;
    return () => {
      mounted.current = false;
      timers.current.forEach(clearTimeout);
      currentVoices.forEach((v) => v.release(0.04));
      currentVoices.clear();
    };
  }, []);
  const renderKey = (midi: number) => {
    const black = isBlack(midi);
    const whiteIndex = whiteKeys.indexOf(midi);
    const before = whiteKeys.filter((m) => m < midi).length;
    const w = 100 / whiteKeys.length;
    const hint = Object.entries(KEYBOARD).find(
      ([, offset]) => offset + (exerciseId === "left" ? 48 : 60) === midi,
    )?.[0];
    return (
      <button
        key={midi}
        type="button"
        data-midi={midi}
        className={cn(
          "piano-key",
          black ? "piano-key-black" : "piano-key-white",
          active.has(midi) && "is-playing",
          target?.midi === midi && "is-target",
        )}
        style={{
          left: `${black ? before * w - w * 0.31 : whiteIndex * w}%`,
          width: `${black ? w * 0.62 : w}%`,
        }}
        aria-label={`琴键 ${midiLabel(midi)}`}
        aria-pressed={active.has(midi)}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          press(
            midi,
            `pointer-${e.pointerId}`,
            e.pointerType === "pen" ? Math.max(0.25, e.pressure) : 1,
          );
        }}
        onPointerUp={(e) => noteOff(midi, `pointer-${e.pointerId}`)}
        onPointerCancel={(e) => noteOff(midi, `pointer-${e.pointerId}`)}
        onLostPointerCapture={(e) => noteOff(midi, `pointer-${e.pointerId}`)}
        onClick={(e) => {
          if (e.detail === 0) {
            press(midi, "accessible");
            timers.current.push(
              setTimeout(() => noteOff(midi, "accessible"), 350),
            );
          }
        }}
      >
        {target?.midi === midi && (
          <span className="key-finger">{target.finger ?? "♪"}</span>
        )}
        <span className="key-label">
          {labels && (
            <>
              <b>{midiLabel(midi)}</b>
              {!black && <small>{SOLFEGE[midi % 12]}</small>}
            </>
          )}
          <kbd>{hint?.toUpperCase() ?? ""}</kbd>
        </span>
      </button>
    );
  };
  return (
    <div className="studio-stack">
      <section className="lesson-banner">
        <div>
          <span className="eyebrow">钢琴 · 从一个音开始</span>
          <h2>让指尖，慢慢找到旋律。</h2>
          <p>先用右手五个手指，弹出属于你的第一句音乐。</p>
        </div>
        <div
          className="finger-guide"
          aria-label="手指编号：拇指1、食指2、中指3、无名指4、小指5"
        >
          {["拇指", "食指", "中指", "无名指", "小指"].map((f, i) => (
            <span key={f}>
              <b>{i + 1}</b>
              <small>{f}</small>
            </span>
          ))}
        </div>
      </section>
      <div className="studio-split">
        <aside className="studio-card lesson-picker">
          <span className="eyebrow">选一小节，轻松开始</span>
          {PIANO_EXERCISES.map((e, i) => (
            <button
              key={e.id}
              className={cn("lesson-choice", e.id === exerciseId && "selected")}
              onClick={() => {
                stop();
                setExerciseId(e.id);
                setIndex(0);
                setDone(false);
                setMistakes(0);
                setFeedback("先听一遍，再跟着亮起的琴键弹奏。");
              }}
            >
              <span className="lesson-number">0{i + 1}</span>
              <span>
                <b>{e.title}</b>
                <small>{e.subtitle}</small>
              </span>
            </button>
          ))}
          <div className="gentle-note">
            <b>坐好，比弹快更重要</b>
            <p>
              坐在琴凳前半部，双脚有支撑。肩膀放松，手指自然弯曲；不靠抬肩或绷紧手腕发力。
            </p>
          </div>
        </aside>
        <section className="studio-card practice-desk">
          <div className="section-heading">
            <div>
              <span className="eyebrow">今天的练习</span>
              <h3>{exercise.title}</h3>
            </div>
            <span className="soft-tag">{exercise.notes.length} 个音</span>
          </div>
          <p className="practice-hint">{exercise.hint}</p>
          <div className="practice-controls">
            <button className="btn-pill" onClick={playDemo}>
              <Play size={16} />
              听示范
            </button>
            <button className="btn-primary" onClick={startFollow}>
              <Keyboard size={16} />
              跟着弹
            </button>
            <button
              className="icon-button"
              onClick={stop}
              aria-label="停止演示和发声"
            >
              <Square size={16} />
            </button>
            <label className="tempo-control">
              速度{" "}
              <select
                aria-label="钢琴示范速度"
                value={bpm}
                disabled={mode === "demo"}
                onChange={(e) => setBpm(Number(e.target.value))}
              >
                {[50, 60, 70, 80, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} 拍/分钟
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="note-ribbon" aria-label="乐句音符与拍数">
            {exercise.notes.map((n, i) => (
              <div
                key={i}
                className={cn(
                  "note-chip",
                  mode !== "free" && i === index && !done && "current",
                  mode === "follow" && (i < index || done) && "finished",
                )}
              >
                <b>{SOLFEGE[n.midi % 12]}</b>
                <span>{n.beats} 拍</span>
                <small>{n.finger ? `${n.finger} 指` : midiLabel(n.midi)}</small>
              </div>
            ))}
          </div>
          <div className="practice-feedback" role="status">
            {done ? <Check size={18} /> : <Headphones size={18} />}
            <span>{feedback}</span>
          </div>
          {mode === "follow" && (
            <div className="follow-summary">
              <span>
                {done ? exercise.notes.length : index} / {exercise.notes.length}{" "}
                个音 · 重试 {mistakes} 次
              </span>
              <button onClick={startFollow}>
                <RotateCcw size={13} />
                重新练
              </button>
            </div>
          )}
        </section>
      </div>
      <section className="piano-cabinet" aria-label="交互钢琴">
        <div className="instrument-toolbar">
          <div>
            <span className="instrument-wordmark">
              XWXY <i>音乐室</i>
            </span>
            <span className="instrument-readout" aria-live="polite">
              {lastNote}
            </span>
          </div>
          <button
            disabled={loading}
            onClick={enableSamples}
            className="sample-button"
          >
            <Volume2 size={14} />
            {sampleStatus}
          </button>
        </div>
        <div className="piano-scroll">
          <div className="piano-keybed" style={{ minWidth: wide ? 990 : 340 }}>
            {whiteKeys.map(renderKey)}
            {keys.filter(isBlack).map(renderKey)}
          </div>
        </div>
        <div className="instrument-bottom">
          <button
            className={cn("pedal-button", pedal && "pressed")}
            aria-pressed={pedal}
            onClick={() => setSustain(!pedal)}
          >
            <span />
            延音踏板 {pedal ? "已踩下" : "已松开"}
          </button>
          <label>
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => setLabels(e.target.checked)}
            />
            音名提示
          </label>
          <label>
            <input
              type="checkbox"
              checked={wide}
              onChange={(e) => setWide(e.target.checked)}
            />
            展开三组八度
          </label>
          <label className="volume-control">
            <Volume2 size={15} />
            <input
              aria-label="钢琴音量"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
        </div>
      </section>
      <p className="studio-footnote">
        电脑键盘 A S D F G H J K 对应白键，W E T Y U
        对应黑键；空格按住延音。支持触屏多指弹奏。网页练习帮助认音，手型和触键仍需在真实钢琴上练习。
      </p>
    </div>
  );
}
