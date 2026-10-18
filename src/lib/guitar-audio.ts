/**
 * 吉他音频引擎（共享）
 *
 * Karplus-Strong 拨弦物理建模 + 箱体共鸣（卷积混响），
 * 供「吉他弹奏」面板和「从零学吉他」课程共用，保证两边音色一致。
 *
 * 弦序约定：索引 0 = 6弦（最粗） … 索引 5 = 1弦（最细）
 */
import { ac } from "@/lib/audio";

/** 6→1 弦空弦频率（标准调弦 E A D G B E） */
export const STRING_BASE = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
export const STRING_LABEL = ["6弦", "5弦", "4弦", "3弦", "2弦", "1弦"];
/** 唱名（首调） */
export const STRING_SOLFEGE = ["mi", "la", "re", "sol", "si", "mi"];

export function fretFreq(base: number, fret: number): number {
  return base * Math.pow(2, fret / 12);
}

/* ---------------- 总线：压缩 + 箱体混响 ---------------- */

let master: GainNode | null = null;
let wet: GainNode | null = null;

function getMaster(c: AudioContext): GainNode {
  if (master) return master;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 18;
  comp.ratio.value = 5;
  comp.attack.value = 0.004;
  comp.release.value = 0.24;
  const input = c.createGain();
  input.gain.value = 0.9;
  input.connect(comp);
  comp.connect(c.destination);
  master = input;

  // 箱体共鸣：合成脉冲响应的卷积混响
  const conv = c.createConvolver();
  conv.buffer = bodyImpulse(c);
  wet = c.createGain();
  wet.gain.value = 0.28;
  conv.connect(wet);
  wet.connect(input);
  // 把 convolver 挂在 master 上，供各声部取用
  (input as unknown as { __verb: ConvolverNode }).__verb = conv;
  return input;
}

function verbNode(c: AudioContext): ConvolverNode {
  const m = getMaster(c);
  return (m as unknown as { __verb: ConvolverNode }).__verb;
}

/** 合成一段吉他箱体式的脉冲响应：快速衰减噪声 + 低通 */
function bodyImpulse(c: AudioContext): AudioBuffer {
  const sr = c.sampleRate;
  const len = Math.floor(sr * 1.1);
  const buf = c.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const out = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const decay = Math.exp(-t * 9);
      const n = (Math.random() * 2 - 1) * decay;
      lp += 0.24 * (n - lp); // 简易低通，模拟木质箱体
      out[i] = lp * 1.6;
    }
  }
  return buf;
}

/* ---------------- 拨弦合成 ---------------- */

interface Voice {
  bus: GainNode;
  cur: { src: AudioBufferSourceNode; fade: GainNode } | null;
}

const voices: (Voice | null)[] = [null, null, null, null, null, null];

/** 生成一段拨弦采样（Karplus-Strong） */
function ksBuffer(c: AudioContext, freq: number, vel: number): AudioBuffer {
  const sr = c.sampleRate;
  const N = Math.max(2, Math.round(sr / freq));
  const len = Math.floor(sr * 2.4);
  const buf = c.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = (Math.random() * 2 - 1) * vel;
  const damp = 0.9965 - Math.min(0.004, (freq / 1600) * 0.004);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = line[idx];
    const nxt = line[(idx + 1) % N];
    line[idx] = damp * 0.5 * (cur + nxt);
    out[i] = cur;
    idx = (idx + 1) % N;
  }
  return buf;
}

/**
 * 在某根弦上拨响一个音。
 * 同弦重拨自动掐断前一个音（8ms 淡出）；制音后拨弦自动恢复音量。
 */
export function pluck(si: number, freq: number, vel = 0.9, when?: number): void {
  const c = ac();
  const m = getMaster(c);
  const t = when ?? c.currentTime;
  let v = voices[si];
  if (!v) {
    const bus = c.createGain();
    bus.connect(m);
    v = { bus, cur: null };
    voices[si] = v;
  }
  const bus = v.bus;
  bus.gain.cancelScheduledValues(t);
  bus.gain.setValueAtTime(1, t);
  if (v.cur) {
    const { src, fade } = v.cur;
    try {
      fade.gain.cancelScheduledValues(t);
      fade.gain.setValueAtTime(1, t);
      fade.gain.linearRampToValueAtTime(0.0001, t + 0.008);
      src.stop(t + 0.03);
    } catch {
      /* 已自然结束 */
    }
    v.cur = null;
  }
  const src = c.createBufferSource();
  src.buffer = ksBuffer(c, freq, vel);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = Math.min(7000, freq * 16);
  lp.Q.value = 0.4;
  const g = c.createGain();
  g.gain.value = 0.5;
  const fade = c.createGain();
  src.connect(lp);
  lp.connect(g);
  g.connect(fade);
  fade.connect(bus); // 干声
  fade.connect(verbNode(c)); // 箱体混响
  src.start(t);
  v.cur = { src, fade };
  const vv = v;
  src.onended = () => {
    if (vv.cur?.src === src) vv.cur = null;
  };
}

/** 拨某弦空弦 */
export function pluckOpen(si: number, vel = 0.9, when?: number): void {
  pluck(si, STRING_BASE[si], vel, when);
}

/** 拨某弦某品 */
export function pluckFret(si: number, fret: number, vel = 0.9, when?: number): void {
  pluck(si, fretFreq(STRING_BASE[si], fret), vel, when);
}

/**
 * 扫一个和弦。
 * @param frets 按 6→1 弦顺序，null = 不弹（闷音）
 * @param fromLow true = 从低音弦往高音弦扫
 */
export function strumChord(
  frets: (number | null)[],
  fromLow = true,
  baseDelay = 0.02,
  stagger = 0.024
): void {
  const c = ac();
  const t0 = c.currentTime + baseDelay;
  const order = fromLow ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
  order.forEach((si, k) => {
    const f = frets[si];
    const t = t0 + k * stagger;
    if (f === null || f === undefined) {
      chuck(t);
      return;
    }
    const vel = 0.72 + 0.28 * Math.sin((k / 5) * Math.PI);
    pluck(si, fretFreq(STRING_BASE[si], f), vel, t);
  });
}

/** 闷音 chuck（× 弦） */
export function chuck(when?: number): void {
  const c = ac();
  const m = getMaster(c);
  const t = when ?? c.currentTime;
  const sr = c.sampleRate;
  const len = Math.floor(sr * 0.09);
  const buf = c.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  for (let i = 0; i < len; i++) out[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 900;
  bp.Q.value = 1.2;
  const g = c.createGain();
  g.gain.value = 0.32;
  src.connect(bp);
  bp.connect(g);
  g.connect(m);
  src.start(t);
}

/** 制音：手掌闷住所有弦（35ms 拉到 0），下次拨弦自动松开 */
export function muteAll(): void {
  const c = ac();
  const t = c.currentTime;
  voices.forEach((v) => {
    if (!v) return;
    v.bus.gain.cancelScheduledValues(t);
    v.bus.gain.setValueAtTime(Math.max(v.bus.gain.value, 0.0001), t);
    v.bus.gain.linearRampToValueAtTime(0.0001, t + 0.035);
  });
}

/** 预热 AudioContext，降低首次点按延迟 */
export function warmup(): void {
  try {
    ac();
  } catch {
    /* 忽略 */
  }
}
