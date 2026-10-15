/* 跟学步骤用的迷你琴键（命令式，保持与原版一致的行为） */

export interface MiniPiano {
  flash: (m: number, ms?: number) => void;
  setGuide: (m: number) => void;
  clearGuide: () => void;
  destroy: () => void;
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function createMiniPiano(
  el: HTMLElement,
  lo: number,
  hi: number,
  onKey?: (m: number) => void
): MiniPiano {
  el.innerHTML = "";
  el.className = "mini-piano";
  const midis: number[] = [];
  for (let m = lo; m <= hi; m++) midis.push(m);
  const whites = midis.filter((m) => !NAMES[m % 12].includes("#"));
  const W = Math.min(52, Math.floor(el.clientWidth / whites.length) - 2) || 40;
  const gap = 2;
  const keys = new Map<number, { el: HTMLDivElement; x: number; t?: ReturnType<typeof setTimeout> }>();
  let guideMidi: number | null = null;
  const disposers: (() => void)[] = [];

  // 先定好容器高度
  el.style.position = "relative";
  el.style.height = "150px";
  el.style.overflowX = "auto";

  whites.forEach((m, i) => {
    const k = document.createElement("div");
    k.className = "wkey";
    k.style.left = i * (W + gap) + "px";
    k.style.width = W + "px";
    k.style.position = "absolute";
    k.style.top = "0";
    k.style.bottom = "0";
    k.style.background = "#fff";
    k.style.border = "1px solid #c8c9cb";
    k.style.borderRadius = "0 0 8px 8px";
    k.style.cursor = "pointer";
    k.style.display = "flex";
    k.style.alignItems = "flex-end";
    k.style.justifyContent = "center";
    k.style.paddingBottom = "8px";
    k.style.fontSize = "11px";
    k.style.color = "#9aa0a6";
    k.textContent = NAMES[m % 12];
    k.dataset.midi = String(m);
    const fire = (e: Event) => {
      e.preventDefault();
      if (onKey) onKey(m);
      flash(m);
    };
    k.addEventListener("mousedown", fire);
    k.addEventListener("touchstart", fire, { passive: false });
    disposers.push(() => {
      k.removeEventListener("mousedown", fire);
      k.removeEventListener("touchstart", fire);
    });
    el.appendChild(k);
    keys.set(m, { el: k, x: i * (W + gap) + W });
  });

  midis
    .filter((m) => NAMES[m % 12].includes("#"))
    .forEach((m) => {
      let prev: number | null = null;
      for (let j = m - 1; j >= lo; j--) {
        if (!NAMES[j % 12].includes("#")) {
          prev = j;
          break;
        }
      }
      if (prev === null || !keys.get(prev)) return;
      const k = document.createElement("div");
      k.className = "bkey";
      k.style.left = keys.get(prev)!.x - 11 + "px";
      k.style.width = "22px";
      k.style.position = "absolute";
      k.style.top = "0";
      k.style.height = "58%";
      k.style.background = "#202124";
      k.style.borderRadius = "0 0 6px 6px";
      k.style.cursor = "pointer";
      k.style.zIndex = "2";
      k.style.border = "1px solid #000";
      k.dataset.midi = String(m);
      const fire = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        if (onKey) onKey(m);
        flash(m);
      };
      k.addEventListener("mousedown", fire);
      k.addEventListener("touchstart", fire, { passive: false });
      disposers.push(() => {
        k.removeEventListener("mousedown", fire);
        k.removeEventListener("touchstart", fire);
      });
      el.appendChild(k);
      keys.set(m, { el: k, x: 0 });
    });

  // 高亮样式
  const style = document.createElement("style");
  style.textContent = `.mini-piano .wkey.lit{background:#ffe9d9!important;box-shadow:inset 0 0 0 2px #2f9e63!important;}.mini-piano .bkey.lit{background:#2f9e63!important;box-shadow:0 0 12px #2f9e63!important;}`;
  document.head.appendChild(style);

  function flash(m: number, ms = 350) {
    const k = keys.get(m);
    if (!k) return;
    if (k.t) clearTimeout(k.t);
    k.el.classList.add("lit");
    k.t = setTimeout(() => {
      if (m !== guideMidi) k.el.classList.remove("lit");
      k.t = undefined;
    }, ms);
  }

  function setGuide(m: number) {
    clearGuide();
    guideMidi = m;
    keys.get(m)?.el.classList.add("lit");
  }

  function clearGuide() {
    if (guideMidi !== null) keys.get(guideMidi)?.el.classList.remove("lit");
    guideMidi = null;
  }

  return {
    flash,
    setGuide,
    clearGuide,
    destroy() {
      disposers.forEach((d) => d());
      style.remove();
    },
  };
}
