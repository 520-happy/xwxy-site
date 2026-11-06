"use client";
import { useEffect, useState } from "react";
import { Timer, Square, Play } from "lucide-react";
import { ac, metroTick } from "@/lib/audio";
import { cn } from "@/lib/utils";

export function Metronome() {
  const [bpm, setBpm] = useState(60);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  useEffect(() => {
    if (!running) return;
    const context = ac();
    let next = context.currentTime + 0.05;
    let count = 0;
    const visual = new Set<ReturnType<typeof setTimeout>>();
    const schedule = () => {
      while (next < context.currentTime + 0.1) {
        const b = count % 4;
        metroTick(b === 0, next);
        const timer = setTimeout(
          () => {
            setBeat(b);
            visual.delete(timer);
          },
          Math.max(0, (next - context.currentTime) * 1000),
        );
        visual.add(timer);
        next += 60 / bpm;
        count++;
      }
    };
    schedule();
    const timer = setInterval(schedule, 25);
    const pause = () => setRunning(false);
    const hidden = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      clearInterval(timer);
      visual.forEach(clearTimeout);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [running, bpm]);
  return (
    <div className="metronome">
      <div className="metronome-title">
        <Timer size={17} />
        <b>慢一点，更稳一点</b>
        <span>4/4 拍</span>
      </div>
      <div className="metronome-controls">
        <button
          className="icon-button"
          aria-label={running ? "停止节拍器" : "启动节拍器"}
          onClick={() => {
            ac();
            setRunning(!running);
          }}
        >
          {running ? <Square size={16} /> : <Play size={16} />}
        </button>
        <label>
          <input
            aria-label="节拍器速度"
            type="range"
            min="40"
            max="140"
            step="5"
            value={bpm}
            onChange={(e) => setBpm(+e.target.value)}
          />
          <b>{bpm}</b> 拍/分钟
        </label>
        <div
          className="beat-dots"
          aria-label={`当前${running ? beat + 1 : 0}拍`}
        >
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className={cn(running && beat === n && "on")}>
              {n + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
