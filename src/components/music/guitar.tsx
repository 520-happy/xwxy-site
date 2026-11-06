"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Hand, Volume2, Music2, Check } from "lucide-react";
import { CHORDS, chordSVG } from "@/data/chords";
import {
  STRING_BASE,
  fretFreq,
  pluck,
  strumChord,
  muteAll,
} from "@/lib/guitar-audio";
import { loadInstrument } from "@/lib/instrument-samples";
import { midiLabel, savePractice } from "@/data/piano-exercises";
import { Metronome } from "./metronome";
import { cn } from "@/lib/utils";

const CHOICES = ["Em", "Am", "C", "G", "D", "F"];
const TIPS: Record<string, string> = {
  Em: "中指按 5 弦 2 品，无名指按 4 弦 2 品。六根弦都能弹，这是很适合开始的和弦。",
  Am: "食指按 2 弦 1 品，中指按 4 弦 2 品，无名指按 3 弦 2 品。第 6 弦不要弹。",
  C: "食指按 2 弦 1 品，中指按 4 弦 2 品，无名指按 5 弦 3 品。从第 5 弦向下扫。",
  G: "食指按 5 弦 2 品，中指按 6 弦 3 品，无名指按 1 弦 3 品。手指不要碰到邻弦。",
  D: "食指按 3 弦 2 品，中指按 1 弦 2 品，无名指按 2 弦 3 品。从第 4 弦开始弹。",
  F: "进阶横按：食指在第 1 品横按，中指按 3 弦 2 品，无名指和小指按 5、4 弦 3 品。先练熟开放和弦，不急着用力挤压。",
};
export function GuitarPanel() {
  const [chord, setChord] = useState("Em");
  const [frets, setFrets] = useState(CHORDS.Em.f);
  const [last, setLast] = useState("先选一个和弦，听听它的声音");
  const [lit, setLit] = useState(-1);
  const [extended, setExtended] = useState(false);
  const [volume, setVolume] = useState(70);
  const [status, setStatus] = useState("点击启用原声录音");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mounted = useRef(true);
  const touched = useRef(new Set<number>());
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => {
    mounted.current = true;
    const mute = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      muteAll();
    };
    const hidden = () => {
      if (document.hidden) mute();
    };
    window.addEventListener("blur", mute);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      mounted.current = false;
      mute();
      window.removeEventListener("blur", mute);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  const enable = async () => {
    setLoading(true);
    setStatus("正在准备原声吉他…");
    try {
      const ok = await loadInstrument("guitar-acoustic");
      if (mounted.current)
        setStatus(ok ? "原声吉他录音已就绪" : "部分采样未加载，点此重试");
    } catch {
      if (mounted.current) setStatus("暂用拨弦合成音，点此重试");
    } finally {
      if (mounted.current) setLoading(false);
    }
  };
  const playString = (si: number, fr: number) => {
    if (fr < 0) {
      setLast(`${6 - si} 弦标记 ×，这个和弦不弹它。`);
      return;
    }
    const f = fretFreq(STRING_BASE[si], fr);
    pluck(si, f, volume / 100);
    setLit(si);
    setLast(
      `${6 - si} 弦 · ${fr === 0 ? "空弦" : `${fr} 品`} · ${midiLabel(Math.round(69 + 12 * Math.log2(f / 440)))}`,
    );
    timers.current.push(
      setTimeout(() => setLit((v) => (v === si ? -1 : v)), 280),
    );
  };
  const strum = (down: boolean) => {
    clear();
    strumChord(
      frets.map((f) => (f < 0 ? null : f)),
      down,
      0.02,
      0.035,
      volume / 100,
    );
    setLast(
      `${chord} · ${down ? "下扫：低音弦 → 高音弦" : "上扫：高音弦 → 低音弦"}`,
    );
  };
  const arpeggio = () => {
    clear();
    muteAll();
    const root = frets.findIndex((f) => f >= 0);
    [root, 3, 4, 5, 4, 3].forEach((si, i) =>
      timers.current.push(setTimeout(() => playString(si, frets[si]), i * 450)),
    );
  };
  return (
    <div className="studio-stack">
      <section className="lesson-banner guitar-banner">
        <div>
          <span className="eyebrow">原声吉他 · 一次一根弦</span>
          <h2>把第一个和弦，弹得清清楚楚。</h2>
          <p>先听单弦，再听和弦。清晰、放松，比速度更重要。</p>
        </div>
        <span className="soft-tag">标准调弦 E A D G B E</span>
      </section>
      <div className="studio-split guitar-layout">
        <aside className="studio-card chord-coach">
          <span className="eyebrow">今天，从 Em 开始</span>
          <div className="chord-buttons" aria-label="选择和弦">
            {CHOICES.map((c) => (
              <button
                key={c}
                aria-pressed={chord === c}
                className={cn("btn-pill", chord === c && "active")}
                onClick={() => {
                  clear();
                  muteAll();
                  setChord(c);
                  setFrets(CHORDS[c].f);
                  setSaved(false);
                  setLast(`${c} 指法已就位，点击下扫试听。`);
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div
            className="chord-diagram"
            aria-label={`${chord} 和弦指法，图中数字为手指编号`}
            dangerouslySetInnerHTML={{
              __html: chordSVG(chord === "自选" ? "" : chord),
            }}
          />
          <div className="finger-legend">
            1 食指 · 2 中指 · 3 无名指 · 4 小指
            <br />○ 空弦 · × 不弹 · 图中圆点是手指编号
          </div>
          <p className="practice-hint">
            {TIPS[chord] ??
              "你正在探索自选指法。重新选择和弦可以恢复标准按法。"}
          </p>
          <div className="gentle-note">
            <b>手指落在哪里？</b>
            <p>
              指尖放在品丝靠琴头的一侧，接近品丝但不压在金属上。先逐根拨弦，找到杂音，再微调手指。
            </p>
          </div>
        </aside>
        <section className="studio-card guitar-desk">
          <div className="section-heading">
            <div>
              <span className="eyebrow">可交互指板</span>
              <h3>听见每一根弦</h3>
            </div>
            <button
              className="sample-button light"
              disabled={loading}
              onClick={enable}
            >
              <Volume2 size={14} />
              {status}
            </button>
          </div>
          <p className="fretboard-caption">
            上方是细的 1 弦，下方是粗的 6 弦。点击格子试音；数字标尺表示品位。
          </p>
          <div className="guitar-neck-scroll">
            <div
              className="guitar-neck"
              style={{ minWidth: extended ? 1020 : 440 }}
            >
              <div className="fret-ruler">
                <span>弦 / 品</span>
                {Array.from({ length: extended ? 13 : 6 }, (_, f) => (
                  <span key={f}>{f === 0 ? "空弦" : f}</span>
                ))}
              </div>
              {[5, 4, 3, 2, 1, 0].map((si) => (
                <div className="fret-row" key={si} data-string={si}>
                  <span className="string-name">
                    {6 - si}
                    <small>{["E", "A", "D", "G", "B", "E"][si]}</small>
                  </span>
                  {Array.from({ length: extended ? 13 : 6 }, (_, fr) => (
                    <button
                      key={fr}
                      aria-label={`${6 - si}弦${fr === 0 ? "空弦" : `${fr}品`}`}
                      aria-pressed={frets[si] === fr}
                      className={cn(
                        "fret-cell",
                        frets[si] === fr && "selected",
                        lit === si && "vibrating",
                        fr === 0 && "nut",
                      )}
                      onClick={() => {
                        clear();
                        setChord("自选");
                        setFrets((old) =>
                          old.map((f, i) => (i === si ? fr : f)),
                        );
                        playString(si, fr);
                      }}
                    >
                      <span
                        className="guitar-string"
                        style={{ height: 1 + (5 - si) * 0.42 }}
                      />
                      {[3, 5, 7, 9, 12].includes(fr) && si === 3 && (
                        <span className="fret-inlay" />
                      )}
                      {frets[si] === fr && (
                        <b className="fret-finger">
                          {fr === 0 ? "○" : CHORDS[chord]?.fingers?.[si] || "●"}
                        </b>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <label className="expand-frets">
            <input
              type="checkbox"
              checked={extended}
              onChange={(e) => setExtended(e.target.checked)}
            />
            展开至 12 品
          </label>
          <div className="guitar-pluck-zone">
            <div className="soundhole" aria-hidden="true" />
            <div className="pluck-strings" aria-label="拨弦区域">
              {[5, 4, 3, 2, 1, 0].map((si) => (
                <button
                  key={si}
                  className={cn(lit === si && "vibrating")}
                  aria-label={`拨响${6 - si}弦`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    touched.current = new Set([si]);
                    playString(si, frets[si]);
                  }}
                  onPointerMove={(e) => {
                    if (!e.buttons) return;
                    const r =
                      e.currentTarget.parentElement!.getBoundingClientRect();
                    const next =
                      5 - Math.floor(((e.clientY - r.top) / r.height) * 6);
                    if (next >= 0 && next <= 5 && !touched.current.has(next)) {
                      touched.current.add(next);
                      playString(next, frets[next]);
                    }
                  }}
                  onPointerUp={() => touched.current.clear()}
                  onPointerCancel={() => touched.current.clear()}
                  onClick={(e) => {
                    if (e.detail === 0) playString(si, frets[si]);
                  }}
                >
                  <span
                    className="guitar-string"
                    style={{ height: 1 + (5 - si) * 0.5 }}
                  />
                  <small>
                    {6 - si} 弦 {frets[si] < 0 ? "×" : ""}
                  </small>
                </button>
              ))}
            </div>
          </div>
          <div className="practice-controls">
            <button className="btn-primary" onClick={() => strum(true)}>
              <ArrowDown size={16} />
              下扫
            </button>
            <button className="btn-pill" onClick={() => strum(false)}>
              <ArrowUp size={16} />
              上扫
            </button>
            <button className="btn-pill" onClick={arpeggio}>
              <Music2 size={16} />
              分解示范
            </button>
            <button
              className="btn-pill"
              onClick={() => {
                clear();
                muteAll();
                setLast("已制音");
              }}
            >
              <Hand size={16} />
              制音
            </button>
          </div>
          <div className="guitar-status">
            <span role="status">{last}</span>
            <label>
              <Volume2 size={14} />
              <input
                aria-label="吉他音量"
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(+e.target.value)}
              />
            </label>
          </div>
        </section>
      </div>
      <div className="studio-split">
        <Metronome />
        <section className="studio-card mini-practice">
          <span className="eyebrow">把练习带到真实吉他上</span>
          <h3>今天只做这三件事</h3>
          <ol>
            <li>摆好 Em，逐根拨响，确认没有杂音。</li>
            <li>用 60 拍/分钟，每拍向下扫一次，持续四小节。</li>
            <li>练习 Em → Am，先慢慢换，再试着跟上节拍。</li>
          </ol>
          <button
            className="btn-pill"
            onClick={() => setSaved(savePractice("guitar-Em-Am", 0))}
          >
            <Check size={16} />
            {saved ? "本次练习已记录" : "我已完成今天的练习"}
          </button>
          <small>这是你的自我记录，网页不会自动判断实琴演奏。</small>
        </section>
      </div>
    </div>
  );
}
