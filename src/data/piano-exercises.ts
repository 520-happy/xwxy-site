export interface PracticeNote {
  midi: number;
  beats: number;
  finger?: number;
}
export interface PianoExercise {
  id: string;
  title: string;
  subtitle: string;
  hint: string;
  notes: PracticeNote[];
}
const phrase = (
  notes: number[],
  beats: number[],
  fingers: number[] = [],
): PracticeNote[] =>
  notes.map((midi, i) => ({ midi, beats: beats[i] ?? 1, finger: fingers[i] }));

export const PIANO_EXERCISES: PianoExercise[] = [
  {
    id: "five",
    title: "五指，第一次出发",
    subtitle: "右手 · 10 个音 · 从中央 C 开始",
    hint: "拇指放在中央 C，食指到小指依次放在 D、E、F、G。手腕放松，每次只落下一根手指。",
    notes: phrase(
      [60, 62, 64, 65, 67, 67, 65, 64, 62, 60],
      [1, 1, 1, 1, 2, 1, 1, 1, 1, 2],
      [1, 2, 3, 4, 5, 5, 4, 3, 2, 1],
    ),
  },
  {
    id: "twinkle",
    title: "小星星 · 第一乐句",
    subtitle: "右手 · 14 个音 · 听见长短拍",
    hint: "先单手认音，再回到真实钢琴练习。句末的 sol 和 do 都要保持两拍；跳到 la 前，轻轻移动手的位置。",
    notes: phrase(
      [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60],
      [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
      [1, 1, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 1],
    ),
  },
  {
    id: "ode",
    title: "欢乐颂 · 第一乐句",
    subtitle: "右手 · 15 个音 · 五指位置",
    hint: "五个手指保持在 C 到 G。最后的 mi 是一拍半，re 是半拍，再用 re 收尾两拍。",
    notes: phrase(
      [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
      [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 3, 2, 2],
    ),
  },
  {
    id: "left",
    title: "左手也来试一试",
    subtitle: "左手 · 10 个音 · 低音区",
    hint: "左手小指放在 C3，拇指在 G3。左右手的手指编号相同，都是拇指 1、小指 5，方向相反。",
    notes: phrase(
      [48, 50, 52, 53, 55, 55, 53, 52, 50, 48],
      [1, 1, 1, 1, 2, 1, 1, 1, 1, 2],
      [5, 4, 3, 2, 1, 1, 2, 3, 4, 5],
    ),
  },
];

export const NOTE_NAMES = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
];
export const SOLFEGE = [
  "do",
  "升 do",
  "re",
  "升 re",
  "mi",
  "fa",
  "升 fa",
  "sol",
  "升 sol",
  "la",
  "升 la",
  "si",
];
export function midiLabel(midi: number) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export const PRACTICE_KEY = "xwxy-studio-progress-v1";
export type PracticeRecord = Record<
  string,
  { completed: string; mistakes: number }
>;
export function readPractice(): PracticeRecord {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PRACTICE_KEY) ?? "{}",
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, v]) =>
          v &&
          typeof v.completed === "string" &&
          typeof v.mistakes === "number",
      ),
    );
  } catch {
    return {};
  }
}
export function savePractice(id: string, mistakes: number): boolean {
  try {
    const previous = readPractice();
    previous[id] = {
      completed: new Date().toISOString(),
      mistakes: Math.min(previous[id]?.mistakes ?? Infinity, mistakes),
    };
    localStorage.setItem(PRACTICE_KEY, JSON.stringify(previous));
    window.dispatchEvent(new Event("xwxy-practice"));
    return true;
  } catch {
    return false;
  }
}
