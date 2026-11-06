/* 和弦数据 + 和弦图 SVG 生成 */
import { strumChord as playGuitarChord } from "@/lib/guitar-audio";

export interface ChordDef {
  /** 弦序 6→1，-1=不弹，0=空弦 */
  f: number[];
  fg: string;
  barre?: number;
  fingers?: number[];
}

export const CHORDS: Record<string, ChordDef> = {
  Em: {
    f: [0, 2, 2, 0, 0, 0],
    fg: "六根弦都可弹",
    fingers: [0, 2, 3, 0, 0, 0],
  },
  Am: {
    f: [-1, 0, 2, 2, 1, 0],
    fg: "从第5弦向下扫",
    fingers: [0, 0, 2, 3, 1, 0],
  },
  C: {
    f: [-1, 3, 2, 0, 1, 0],
    fg: "从第5弦向下扫",
    fingers: [0, 3, 2, 0, 1, 0],
  },
  G: { f: [3, 2, 0, 0, 0, 3], fg: "六根弦都可弹", fingers: [2, 1, 0, 0, 0, 3] },
  D: {
    f: [-1, -1, 0, 2, 3, 2],
    fg: "从第4弦向下扫",
    fingers: [0, 0, 0, 1, 3, 2],
  },
  E: { f: [0, 2, 2, 1, 0, 0], fg: "", fingers: [0, 2, 3, 1, 0, 0] },
  A: { f: [-1, 0, 2, 2, 2, 0], fg: "", fingers: [0, 0, 1, 2, 3, 0] },
  Dm: { f: [-1, -1, 0, 2, 3, 1], fg: "", fingers: [0, 0, 0, 2, 3, 1] },
  F: {
    f: [1, 3, 3, 2, 1, 1],
    fg: "第1品横按，稍后再挑战",
    barre: 1,
    fingers: [1, 3, 4, 2, 1, 1],
  },
  Bm: {
    f: [-1, 2, 4, 4, 3, 2],
    fg: "横按",
    barre: 2,
    fingers: [0, 1, 3, 4, 2, 1],
  },
  G7: { f: [3, 2, 0, 0, 0, 1], fg: "", fingers: [3, 2, 0, 0, 0, 1] },
  A7: { f: [-1, 0, 2, 0, 2, 0], fg: "", fingers: [0, 0, 2, 0, 3, 0] },
  D7: { f: [-1, -1, 0, 2, 1, 2], fg: "", fingers: [0, 0, 0, 2, 1, 3] },
  E7: { f: [0, 2, 0, 1, 0, 0], fg: "", fingers: [0, 2, 0, 1, 0, 0] },
  Em7: { f: [0, 2, 0, 0, 0, 0], fg: "", fingers: [0, 2, 0, 0, 0, 0] },
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
      h += `<circle cx="${x}" cy="${yy}" r="8" fill="#33746b"/><text x="${x}" y="${yy + 4.5}" text-anchor="middle" font-size="10" fill="#fff">${ch.fingers?.[si] || f}</text>`;
    }
  }
  if (ch.barre) {
    const start = frets.findIndex((f) => f > 0);
    const x = 14 + (start * (s - 28)) / 5;
    const y = top + (ch.barre - base + 0.5) * lh;
    h += `<rect x="${x - 5}" y="${y - 4}" width="${s - 14 - x + 10}" height="8" rx="4" fill="#33746b" opacity="0.35"/>`;
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
  const chord = CHORDS[name];
  if (chord)
    playGuitarChord(
      chord.f.map((f) => (f < 0 ? null : f)),
      true,
      0.02,
      0.035,
      Math.min(1, vol / 0.28),
    );
}
