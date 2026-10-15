"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { ac, noteName, playTone } from "@/lib/audio";
import { cn } from "@/lib/utils";

const STRINGS = [
  { s: 6, base: 82.41 },
  { s: 5, base: 110.0 },
  { s: 4, base: 146.83 },
  { s: 3, base: 196.0 },
  { s: 2, base: 246.94 },
  { s: 1, base: 329.63 },
];

function autoCorrelate(buf: Float32Array, sr: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.012) return -1;
  let r1 = 0;
  let r2 = SIZE - 1;
  const th = 0.2;
  for (let i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < th) {
      r1 = i;
      break;
    }
  for (let i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < th) {
      r2 = SIZE - i;
      break;
    }
  const sliced = buf.slice(r1, r2);
  const N = sliced.length;
  const c = new Array(N).fill(0);
  for (let i = 0; i < N; i++) for (let j = 0; j < N - i; j++) c[i] += sliced[j] * sliced[j + i];
  let d = 0;
  while (d < N - 1 && c[d] > c[d + 1]) d++;
  let maxv = -1;
  let maxp = -1;
  for (let i = d; i < N; i++)
    if (c[i] > maxv) {
      maxv = c[i];
      maxp = i;
    }
  if (maxp <= 0) return -1;
  let T0 = maxp;
  const x1 = c[T0 - 1] || 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const bb = (x3 - x1) / 2;
  if (a) T0 = T0 - bb / (2 * a);
  return sr / T0;
}

export function TunerPanel() {
  const [capo, setCapo] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [tuner, setTuner] = useState({ note: "--", cents: 0, advice: "弹一根弦试试", ok: false });
  const micRef = useRef<{ stream: MediaStream; analyser: AnalyserNode; buf: Float32Array; raf: number } | null>(null);
  const needlePos = Math.max(-50, Math.min(50, tuner.cents));

  const stringFreq = (base: number) => base * Math.pow(2, capo / 12);

  const playString = (idx: number) => {
    const fq = stringFreq(STRINGS[idx].base);
    setPlaying(idx);
    playTone(fq, 2.2, "triangle", 0.5);
    playTone(fq, 2.2, "triangle", 0.5, ac().currentTime + 0.7);
    setTimeout(() => setPlaying((p) => (p === idx ? null : p)), 3000);
  };

  useEffect(() => {
    if (!micOn) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const ctx = ac();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 4096;
        const buf = new Float32Array(analyser.fftSize);
        src.connect(analyser);
        const loop = () => {
          analyser.getFloatTimeDomainData(buf);
          const freq = autoCorrelate(buf, ctx.sampleRate);
          if (freq > 40 && freq < 1200) {
            const nn = noteName(freq);
            const ok = Math.abs(nn.cents) <= 5;
            setTuner({
              note: nn.name + nn.oct,
              cents: nn.cents,
              advice: ok ? "✅ 准了！" : nn.cents > 0 ? "偏高 → 弦拧松一点" : "偏低 → 弦拧紧一点",
              ok,
            });
          } else {
            setTuner((t) => ({ ...t, note: "--", advice: "弹一根弦试试" }));
          }
          micRef.current!.raf = requestAnimationFrame(loop);
        };
        micRef.current = { stream, analyser, buf, raf: requestAnimationFrame(loop) };
      })
      .catch(() => {
        alert("无法使用麦克风：请允许浏览器麦克风权限，或检查设备是否有麦克风。");
        setMicOn(false);
      });
    return () => {
      cancelled = true;
      if (micRef.current) {
        cancelAnimationFrame(micRef.current.raf);
        micRef.current.stream.getTracks().forEach((t) => t.stop());
        micRef.current = null;
      }
    };
  }, [micOn]);

  return (
    <>
      <Card className="mb-[18px]">
        <CardTitle>
          标准音参考{" "}
          <span className="ml-2 rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            Web Audio 精确发声
          </span>
        </CardTitle>
        <p className="mt-2 text-[13px] leading-7 text-fog">
          点任意一根弦，播放它的标准音。声音由浏览器直接合成，频率精确到 0.01Hz，可放心对照。
        </p>
        <div className="my-1.5 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold">变调夹位置：</label>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((f) => (
              <button
                key={f}
                title={f === 0 ? "不夹变调夹" : `变调夹夹在第${f}品`}
                onClick={() => setCapo(f)}
                className={cn(
                  "h-[42px] w-[42px] rounded-xl border border-white/85 bg-white/60 text-[15px] font-bold backdrop-blur-[10px] transition-all",
                  capo === f &&
                    "border-transparent bg-zinc-900 text-white shadow-[0_4px_12px_rgb(0_0_0/0.18)]"
                )}
              >
                {f === 0 ? "0" : `${f}品`}
              </button>
            ))}
          </div>
          <span className="text-[13px] leading-7 text-fog">
            {capo === 0 ? "不夹 = 标准调弦" : `夹${capo}品：每根弦升高${capo}个半音，照着调即可`}
          </span>
        </div>
        <div className="my-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STRINGS.map((st, i) => {
            const fq = stringFreq(st.base);
            const nn = noteName(fq);
            return (
              <button
                key={st.s}
                onClick={() => playString(i)}
                className={cn(
                  "rounded-[14px] border-[1.5px] border-white/85 bg-white/60 px-2 py-3.5 text-center backdrop-blur-[10px] transition-all hover:border-accent",
                  playing === i && "border-accent bg-accent/[0.14] shadow-[0_4px_16px_rgba(79,109,245,0.25)]"
                )}
              >
                <div className="text-[15px] font-bold">{st.s} 弦</div>
                <div className="my-1 text-[22px] font-bold text-accent">
                  {nn.name}
                  {nn.oct}
                </div>
                <div className="text-xs text-fog">{fq.toFixed(2)} Hz</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>
          麦克风实时调音{" "}
          <span className="ml-2 rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            自动检测音高
          </span>
        </CardTitle>
        <p className="mt-2 text-[13px] leading-7 text-fog">
          点“开始检测”，弹响一根弦，指针会告诉你偏高还是偏低。绿色居中 = 准了。首次使用需允许麦克风权限。
        </p>
        <button
          onClick={() => setMicOn((v) => !v)}
          className={cn("btn-primary mx-auto mt-3.5 block px-[30px] py-[11px] text-[15px]", !micOn && "bg-[#8fae9b] shadow-none")}
          style={!micOn ? { background: "#8fae9b" } : undefined}
        >
          {micOn ? "⏹ 停止检测" : "🎤 开始检测"}
        </button>
        <div className="glass-dark mt-3.5 rounded-2xl p-5">
          <div className="relative my-1.5 h-[90px]">
            <div className="absolute bottom-0 left-1/2 top-[18px] w-0.5 -translate-x-1/2 bg-[#7be0a8]" />
            <div className="relative h-full">
              {[-50, -30, -10, 10, 30, 50].map((c) => (
                <div
                  key={c}
                  className="absolute top-0 -translate-x-1/2 text-[11px] text-[#9db8a6]"
                  style={{ left: `${50 + c}%` }}
                >
                  {c > 0 ? `+${c}` : c}
                  <span className="mx-auto mt-0.5 block h-3 w-0.5 bg-[#5f6368]" />
                </div>
              ))}
            </div>
            <div
              className="absolute top-[22px] h-14 w-[3px] -translate-x-1/2 rounded-sm shadow-[0_0_8px_var(--color-accent)] transition-[left] duration-75"
              style={{
                left: `${50 + needlePos}%`,
                background: tuner.note === "--" ? "#7be0a8" : tuner.ok ? "#1a9e54" : "#ff6b1a",
              }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div>
              <div className="text-[34px] font-bold" style={{ color: tuner.ok ? "#1a9e54" : "#fff" }}>
                {tuner.note}
              </div>
              <div className="text-[13px] text-[#9aa0a6]">检测到的音名</div>
            </div>
            <div className="text-sm text-[#9aa0a6]">
              <b className="text-xl">{tuner.cents > 0 ? `+${tuner.cents}` : tuner.cents}</b> 音分
              <br />
              <span>{tuner.advice}</span>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
