/* 和弦数据 + 和弦图 SVG 生成 */
import { ac, playTone } from "@/lib/audio";

export interface ChordDef {
  /** 弦序 6→1，-1=不弹，0=空弦 */
  f: number[];
  fg: string;
  barre?: number;
}

export const CHORDS: Record<string, ChordDef> = {
  Em: { f: [-1, 2, 2, 0, 0, 0], fg: "○○" },
  Am: { f: [-1, 0, 2, 2, 1, 0], fg: "" },
  C: { f: [-1, 3, 2, 0, 1, 0], fg: "" },
  G: { f: [3, 2, 0, 0, 0, 3], fg: "" },
  D: { f: [-1, -1, 0, 2, 3, 2], fg: "" },
  E: { f: [0, 2, 2, 1, 0, 0], fg: "" },
  A: { f: [-1, 0, 2, 2, 2, 0], fg: "" },
  Dm: { f: [-1, -1, 0, 2, 3, 1], fg: "" },
  F: { f: [1, 1, 2, 3, 3, 1], fg: "横按", barre: 1 },
  Bm: { f: [-1, 2, 4, 4, 3, 2], fg: "横按", barre: 2 },
  G7: { f: [3, 2, 0, 0, 0, 1], fg: "" },
  A7: { f: [-1, 0, 2, 0, 2, 0], fg: "" },
  D7: { f: [-1, -1, 0, 2, 1, 2], fg: "" },
  E7: { f: [0, 2, 0, 1, 0, 0], fg: "" },
  Em7: { f: [0, 2, 0, 0, 0, 0], fg: "" },
};

export function chordSVG(name: string): string {
  const ch = CHORDS[name];
  if (!ch) return "";
  const frets = ch.f;
  const s = 104;
  const top = 26;
  const lh = (s - 10 - top) / 5;
  const minF = Math.min(...frets.filter((x) => x > 0));
  const base = minF > 2 ? minF - 1 : 1;
  let h = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">`;
  for (let i = 0; i <= 5; i++) {
    const y = top + i * lh;
    h += `<line x1="14" y1="${y}" x2="${s - 14}" y2="${y}" stroke="${i === 0 && base === 1 ? "#202124" : "#9aa0a6"}" stroke-width="${i === 0 && base === 1 ? 4 : 1.5}"/>`;
  }
  for (let si = 0; si < 6; si++) {
    const x = 14 + (si * (s - 28)) / 5;
    h += `<line x1="${x}" y1="${top}" x2="${x}" y2="${s - 10}" stroke="#9aa0a6" stroke-width="1.5"/>`;
    const f = frets[si];
    if (f === -1) {
      h += `<text x="${x}" y="18" text-anchor="middle" font-size="13" fill="#9aa0a6">×</text>`;
    } else if (f === 0) {
      h += `<text x="${x}" y="18" text-anchor="middle" font-size="13" fill="#1a9e54">○</text>`;
    } else {
      const yy = top + (f - base + 0.5) * lh;
      h += `<circle cx="${x}" cy="${yy}" r="8" fill="#ff6b1a"/><text x="${x}" y="${yy + 4.5}" text-anchor="middle" font-size="10" fill="#fff">${f}</text>`;
    }
  }
  if (ch.barre) {
    for (let si = 0; si < 6; si++) {
      if (frets[si] > 0) {
        const x = 14 + (si * (s - 28)) / 5;
        const yy = top + (frets[si] - base + 0.5) * lh;
        h += `<rect x="${x - 9}" y="${yy - 3}" width="18" height="6" rx="3" fill="#ff6b1a" opacity="0.45"/>`;
      }
    }
  }
  if (base > 1)
    h += `<text x="${s - 6}" y="${top + 12}" text-anchor="middle" font-size="10" fill="#5f6368">${base}品</text>`;
  return h + "</svg>";
}

const GUITAR_BASES = [82.41, 110, 146.83, 196, 246.94, 329.63];

export function chordFreqs(name: string): number[] {
  const ch = CHORDS[name];
  if (!ch) return [];
  const out: number[] = [];
  ch.f.forEach((f, i) => {
    if (f >= 0) out.push(GUITAR_BASES[i] * Math.pow(2, f / 12));
  });
  return out;
}

export function strumChord(name: string, vol = 0.28) {
  const fs = chordFreqs(name);
  const t = ac().currentTime;
  fs.forEach((f, i) => playTone(f, 1.6, "triangle", vol, t + i * 0.035));
}
