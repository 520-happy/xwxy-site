"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SiteShell } from "@/components/site-shell";
import { TunerPanel } from "@/components/music/tuner";
import { GuitarPanel } from "@/components/music/guitar";
import { PianoPanel } from "@/components/music/piano";
import { TutorialsPanel } from "@/components/music/tutorials";
import { SongGridPanel } from "@/components/music/song-grid";
import { LessonPanel, type StartSignal } from "@/components/music/lesson-player";
import { ImportPanel } from "@/components/music/import-panel";
import { BUILTIN_LESSONS, type Lesson } from "@/data/lessons";
import { cn } from "@/lib/utils";

type Tab = "tuner" | "guitar" | "piano" | "learn" | "songs" | "follow" | "import";

const TABS: { id: Tab; label: string }[] = [
  { id: "tuner", label: "🎸 吉他调音" },
  { id: "guitar", label: "🎶 吉他弹奏" },
  { id: "piano", label: "🎹 钢琴" },
  { id: "learn", label: "📖 新手教程" },
  { id: "songs", label: "🔥 网红谱" },
  { id: "follow", label: "🎯 互动跟学" },
  { id: "import", label: "📥 我的谱子" },
];

export default function MusicPage() {
  const [tab, setTab] = useState<Tab>("tuner");
  const [extraLessons, setExtraLessons] = useState<Lesson[]>([]);
  const [startSignal, setStartSignal] = useState<StartSignal | null>(null);

  const goFollow = (lesson: Lesson) => {
    setExtraLessons((prev) => (prev.some((l) => l.id === lesson.id) ? prev : [...prev, lesson]));
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
      <h1 className="mb-1.5 text-[26px] font-bold">🎸 音乐教室</h1>
      <p className="mb-5 text-sm text-fog">吉他调音器 · 变调夹 · 钢琴 · 新手教程 · 网红谱 · 导入谱子</p>

      <div className="mb-[22px] flex flex-wrap gap-2.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              window.scrollTo(0, 0);
            }}
            className={cn("btn-pill px-5 py-2 text-sm", tab === t.id && "active")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {tab === "tuner" && <TunerPanel />}
          {tab === "guitar" && <GuitarPanel />}
          {tab === "piano" && <PianoPanel />}
          {tab === "learn" && <TutorialsPanel />}
          {tab === "songs" && <SongGridPanel onFollow={followSong} />}
          {tab === "follow" && <LessonPanel extraLessons={extraLessons} startSignal={startSignal} />}
          {tab === "import" && <ImportPanel onAutoLesson={goFollow} />}
        </motion.div>
      </AnimatePresence>

      <footer className="mt-6 text-center text-xs text-fog-light">xwxy.dpdns.org · 音乐教室 🎶</footer>
    </SiteShell>
  );
}
