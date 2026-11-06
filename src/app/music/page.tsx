"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { StudioHome } from "@/components/music/studio-home";
import { SiteShell } from "@/components/site-shell";
import { TunerPanel } from "@/components/music/tuner";
import { GuitarPanel } from "@/components/music/guitar";
import { PianoPanel } from "@/components/music/piano";
import { ZeroGuitarCourse } from "@/components/music/learn-guitar";
import { SongGridPanel } from "@/components/music/song-grid";
import {
  LessonPanel,
  type StartSignal,
} from "@/components/music/lesson-player";
import { ImportPanel } from "@/components/music/import-panel";
import { BUILTIN_LESSONS, type Lesson } from "@/data/lessons";
import { cn } from "@/lib/utils";

type Tab =
  | "studio"
  | "tuner"
  | "guitar"
  | "piano"
  | "learn"
  | "songs"
  | "follow"
  | "import";

const TABS: { id: Tab; label: string }[] = [
  { id: "studio", label: "学习首页" },
  { id: "tuner", label: "吉他调音" },
  { id: "guitar", label: "原声吉他" },
  { id: "piano", label: "钢琴练习" },
  { id: "learn", label: "吉他课程" },
  { id: "songs", label: "曲谱灵感" },
  { id: "follow", label: "互动跟学" },
  { id: "import", label: "我的谱子" },
];

export default function MusicPage() {
  const [tab, setTab] = useState<Tab>("studio");
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const sync = () => {
      const target = location.hash.slice(1);
      if (TABS.some((t) => t.id === target)) setTab(target as Tab);
    };
    const frame = requestAnimationFrame(sync);
    window.addEventListener("hashchange", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", sync);
    };
  }, []);
  const navigate = (target: string) => {
    if (!TABS.some((t) => t.id === target)) return;
    setTab(target as Tab);
    history.replaceState(null, "", `#${target}`);
  };
  const [extraLessons, setExtraLessons] = useState<Lesson[]>([]);
  const [startSignal, setStartSignal] = useState<StartSignal | null>(null);

  const goFollow = (lesson: Lesson) => {
    setExtraLessons((prev) =>
      prev.some((l) => l.id === lesson.id) ? prev : [...prev, lesson],
    );
    setTab("follow");
    setStartSignal((s) => ({ lesson, n: (s?.n ?? 0) + 1 }));
    window.scrollTo(0, 0);
  };

  const followSong = (songTitle: string) => {
    const L = BUILTIN_LESSONS.find((l) => l.id === "song-" + songTitle);
    if (L) goFollow(L);
  };

  return (
    <SiteShell>
      <div className="music-page-heading">
        <div>
          <span className="eyebrow">XWXY · 给自己的一间音乐室</span>
          <h1>音乐，慢慢学。</h1>
        </div>
        <span className="soft-tag">听见喜欢 · 练成日常</span>
      </div>

      <div className="studio-tabs" aria-label="音乐教室栏目">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              navigate(t.id);
              window.scrollTo(0, 0);
            }}
            aria-pressed={tab === t.id}
            className={cn("studio-tab", tab === t.id && "active")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          {tab === "studio" && <StudioHome onNavigate={navigate} />}
          {tab === "tuner" && <TunerPanel />}
          {tab === "guitar" && <GuitarPanel />}
          {tab === "piano" && <PianoPanel />}
          {tab === "learn" && (
            <ZeroGuitarCourse
              onGoTuner={() => {
                setTab("tuner");
                window.scrollTo(0, 0);
              }}
              onGoPiano={() => {
                setTab("piano");
                window.scrollTo(0, 0);
              }}
            />
          )}
          {tab === "songs" && <SongGridPanel onFollow={followSong} />}
          {tab === "follow" && (
            <LessonPanel
              extraLessons={extraLessons}
              startSignal={startSignal}
            />
          )}
          {tab === "import" && <ImportPanel onAutoLesson={goFollow} />}
        </motion.div>
      </AnimatePresence>

      <footer className="studio-sources">
        学习参考：
        <a
          href="https://www.yamaha.com/en/musical_instrument_guide/piano/play/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Yamaha 钢琴入门
        </a>{" "}
        ·{" "}
        <a
          href="https://www.yamaha.com/en/musical_instrument_guide/acoustic_guitar/play/"
          target="_blank"
          rel="noopener noreferrer"
        >
          原声吉他演奏
        </a>
        <br />
        录音采样：
        <a
          href="https://github.com/nbrosowsky/tonejs-instruments"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nicholaus P. Brosowsky / tonejs-instruments
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by/3.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 3.0
        </a>{" "}
        · 选取原始录音，播放时变调
      </footer>
    </SiteShell>
  );
}
