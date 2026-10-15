/* 互动跟学课程数据 */
import { SONGS} from "./songs";

export interface LessonNote {
jp: string;
nm: string;
midi: number;
beats: number;
}

export type LessonStep =
| { kind: "intro"; text: string}
| { kind: "outro"; text: string}
| { kind: "listen"; label: string; notes: LessonNote[]}
| { kind: "follow"; label: string; notes: LessonNote[]}
| { kind: "chord"; chord: string; tip: string}
| { kind: "progression"; chords: string[]; bpm: number; cycles: number; pattern: string; tip: string};

export interface Lesson {
id: string;
title: string;
sub: string;
icon: string;
type: "piano" | "guitar";
desc: string;
steps: LessonStep[];
}

const JP_NAMES: Record<string, string> = {
"1": "do", "2": "re", "3": "mi", "4": "fa", "5": "sol", "6": "la", "7": "si",
};

function mkPhrase(jp: string[], midis: [number, number][]): LessonNote[] {
return jp.map((j, i) => ({ jp: j, nm: JP_NAMES[j] || "", midi: midis[i][0], beats: midis[i][1]}));
}

const STAR_PHRASES = [
{ label: "第 1 乐句", notes: mkPhrase(["1","1","5","5","6","6","5"], [[60,1],[60,1],[67,1],[67,1],[69,1],[69,1],[67,2]])},
{ label: "第 2 乐句", notes: mkPhrase(["4","4","3","3","2","2","1"], [[65,1],[65,1],[64,1],[64,1],[62,1],[62,1],[60,2]])},
{ label: "第 3 乐句", notes: mkPhrase(["5","5","4","4","3","3","2"], [[67,1],[67,1],[65,1],[65,1],[64,1],[64,1],[62,2]])},
{ label: "第 4 乐句", notes: mkPhrase(["5","5","4","4","3","3","2"], [[67,1],[67,1],[65,1],[65,1],[64,1],[64,1],[62,2]])},
{ label: "第 5 乐句", notes: mkPhrase(["1","1","5","5","6","6","5"], [[60,1],[60,1],[67,1],[67,1],[69,1],[69,1],[67,2]])},
{ label: "第 6 乐句（结尾）", notes: mkPhrase(["4","4","3","3","2","2","1"], [[65,1],[65,1],[64,1],[64,1],[62,1],[62,1],[60,2]])},
];

function starPianoSteps(): LessonStep[] {
const steps: LessonStep[] = [
{
kind: "intro",
text: "欢迎来到零基础第一课！<b>《小星星》</b>是全世界学琴的人第一首曲子，整首只用白键。<br><br>每一乐句分两步：<b>① 听示范</b>（看琴键亮起、记住旋律）→ <b>② 跟弹</b>（亮起哪个键就按哪个，正确率 80% 过关）。<br><br>准备好了吗？我们从第 1 乐句开始。",
},
];
STAR_PHRASES.forEach((p) => {
steps.push({ kind: "listen", label: p.label + " · 听示范", notes: p.notes});
steps.push({ kind: "follow", label: p.label + " · 跟弹", notes: p.notes});
});
steps.push({
kind: "outro",
text: "🎉 太棒了！你已经弹会了完整版《小星星》。<br><br>接下来可以：去\"钢琴\"标签页自由练习、挑战更快速度，或开始 <b>《小星星》吉他版</b> 跟学。每天 15 分钟，一周后这首曲子就是你的肌肉记忆了。",
});
return steps;
}

function guitarStepsFor(title: string, prog: string[], tip: string, bpm: number): LessonStep[] {
const steps: LessonStep[] = [
{
kind: "intro",
text: `<b>《${title}》吉他跟学</b><br><br>这首歌的简化版只用 <b>${prog.join(" → ")}</b> 循环。先逐个学会每个和弦，再跟着节拍器完整弹 ${prog.length} 个和弦的循环。<br><br>${tip || ""}`,
},
];
prog.forEach((c) => {
steps.push({ kind: "chord", chord: c, tip: `把 ${c} 按好，逐根拨弦检查，每根都要响亮清脆。`});
});
steps.push({
kind: "progression",
chords: prog,
bpm: bpm || 64,
cycles: 4,
pattern: "下 下上 上下上",
tip: "跟着节拍器，每 4 拍换一个和弦。换和弦要快、要准，右手节奏不能停。",
});
steps.push({
kind: "outro",
text: `🎉《${title}》跟学完成！<br><br>你已经掌握了这首歌的和弦进行。多练几遍，试着开口跟着唱——第一首弹唱就是这样练成的。`,
});
return steps;
}

export const BUILTIN_LESSONS: Lesson[] = [
{
id: "star-piano",
title: "小星星",
sub: "钢琴 · 零基础第一课",
icon: "🎹",
type: "piano",
desc: "人生第一首钢琴曲。6 个乐句，听示范→跟弹→过关，15 分钟从零弹会。",
steps: starPianoSteps(),
},
{
id: "star-guitar",
title: "小星星",
sub: "吉他 · 零基础第一课",
icon: "🎸",
type: "guitar",
desc: "只用 G D Em C 四个和弦，学会第一个吉他弹唱。",
steps: guitarStepsFor("小星星", ["G", "D", "Em", "C"], "G → D → Em → C 是最经典的新手进行，右手先用 53231323 指法。", 60),
},
...SONGS.map((s) => ({
id: "song-" + s.t,
title: s.t,
sub: "吉他 · 网红谱跟学",
icon: "🔥",
type: "guitar" as const,
desc: `${s.a} · 难度${s.d} · ${s.prog.join(" → ")}`,
steps: guitarStepsFor(s.t, s.prog, s.tip, 66),
})),
];

/* ---- 从导入谱自动生成初版跟学 ---- */
const KNOWN_CHORDS = ["C","G","Am","Em","D","Dm","E","A","F","Bm","G7","A7","D7","E7","Em7"];

export function parseChordsFromText(text: string): string[] {
const found: string[] = [];
const seen = new Set<string>();
String(text)
.split(/[\s|｜\-–—/\\()\[\]:：,，.。]+/)
.forEach((tok) => {
const t = tok.trim();
if (KNOWN_CHORDS.includes(t) &&!seen.has(t)) {
seen.add(t);
found.push(t);
}
});
return found;
}

function esc(s: string) {
return s.replace(/</g, "&lt;");
}

export function buildAutoLesson(title: string, text: string, tabId: string): Lesson | null {
const chords = parseChordsFromText(text);
if (!chords.length) return null;
const prog = chords.slice(0, 4);
const steps: LessonStep[] = [
{
kind: "intro",
text: `<b>《${esc(title)}》初版跟学</b>（自动生成）<br><br>从谱子里识别出和弦：<b>${chords.join(" · ")}</b>。先逐个练熟，再跟节拍器走完整循环。<br><br>精修版课程我会在后台做好，做好后通知你。`,
},
];
chords.forEach((c) => {
steps.push({ kind: "chord", chord: c, tip: `把 <b>${c}</b> 按好，逐根拨弦检查，每根都要响亮。`});
});
steps.push({
kind: "progression",
chords: prog,
bpm: 64,
cycles: 4,
pattern: "下 下上 上下上",
tip: "跟着节拍器，每 4 拍换一个和弦，右手节奏不能停。",
});
steps.push({
kind: "outro",
text: "🎉 初版跟学完成！精修版（分乐句讲解+练习提示）我做好后会第一时间通知你。",
});
return {
id: "auto-" + tabId,
title,
sub: "吉他 · 导入谱子（初版）",
icon: "📥",
type: "guitar",
desc: "从导入谱自动识别：" + chords.join(" → "),
steps,
};
}

/* ---- 课程完成状态（localStorage） ---- */
const DONE_KEY = "xwxy_lessons_done";

export function getDone(): string[] {
try {
return JSON.parse(localStorage.getItem(DONE_KEY) || "[]");
} catch {
return [];
}
}

export function markDone(id: string) {
const d = getDone();
if (!d.includes(id)) {
d.push(id);
try {
localStorage.setItem(DONE_KEY, JSON.stringify(d));
} catch {
/* ignore */
}
}
}
