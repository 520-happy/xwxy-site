/* 音频引擎：Web Audio 合成，无外部依赖 */

let AC: AudioContext | null = null;

export function ac(): AudioContext {
  if (!AC) {
    AC = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (AC.state === "suspended") void AC.resume();
  return AC;
}

export function playTone(freq: number, dur = 2, type: OscillatorType = "sine", vol = 0.5, when?: number) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = when ?? c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.1);
}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CN_NAMES: Record<string, string> = { C: "do", D: "re", E: "mi", F: "fa", G: "sol", A: "la", B: "si" };

export interface NoteInfo {
  name: string;
  oct: number;
  cents: number;
}

export function noteName(freq: number): NoteInfo {
  const n = Math.round(12 * Math.log2(freq / 440)) + 69;
  const name = NOTES[(((n % 12) + 12) % 12)];
  const oct = Math.floor(n / 12) - 1;
  return { name, oct, cents: Math.round(100 * (12 * Math.log2(freq / 440) + 69 - n)) };
}

export function cnName(name: string): string {
  return CN_NAMES[name.replace("#", "")] ?? "";
}

export function midiFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export function pianoPlay(midi: number, tone: string, vol01: number): { label: string } {
  const c = ac();
  const t = c.currentTime;
  const f = midiFreq(midi);
  const vol = (vol01 / 100) * 0.6;
  const g = c.createGain();
  g.connect(c.destination);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.001), t + 0.015);
  const dur = tone === "organ" ? 1.2 : 2.2;
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const partials =
    tone === "piano"
      ? [[1, 1], [2, 0.35], [3, 0.18], [4, 0.1], [5, 0.06]]
      : tone === "organ"
        ? [[1, 0.9], [2, 0.5], [3, 0.4], [4, 0.25]]
        : [[1, 0.7], [2, 0.4], [3, 0.55], [4, 0.2]];
  partials.forEach((p) => {
    const o = c.createOscillator();
    o.type = tone === "synth" ? "sawtooth" : "sine";
    o.frequency.value = f * p[0];
    const og = c.createGain();
    og.gain.value = p[1];
    o.connect(og);
    og.connect(g);
    o.start(t);
    o.stop(t + dur + 0.1);
  });
  const nn = noteName(f);
  return { label: `${nn.name}${nn.oct} · ${f.toFixed(1)}Hz` };
}

export function metroTick(accent: boolean) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  const t = c.currentTime;
  o.type = "square";
  o.frequency.value = accent ? 1200 : 800;
  g.gain.setValueAtTime(accent ? 0.25 : 0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + 0.08);
}
