"use client";

/**
 * ColorBlockAnimation — 彩色小方块队形变换动画
 *
 * 一组低饱和度彩色小方块在白色/透明容器内连续变换队形：
 *   A 阶梯状 → B 水平直线 → C 斜向 → D 紧凑竖向 → E 散开 → 回到 A 聚合
 *
 * 实现要点：
 * - 全部动画走 transform（motion 的 x/y），不碰 top/left，不触发布局计算
 * - 队形由预定义坐标函数给出，方块之间用 delay  stagger，spring 缓动带轻微回弹
 * - 容器尺寸用 ResizeObserver 测量（只在 resize 时 setState，不在动画帧里）
 * - prefers-reduced-motion 时静止为 A 队形
 * - 卸载时清理定时器与 ResizeObserver
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export interface ColorBlockAnimationProps {
  /** 容器额外样式（主要用来定高，如 "h-28"），默认 h-32 */
  className?: string;
  /** 方块数量，默认 8 */
  blockCount?: number;
  /** 方块颜色（低饱和度），不够时循环使用 */
  colors?: string[];
  /** 方块基准尺寸 px，默认 14；会按容器宽度自适应到 10–16 */
  size?: number;
  /** 每个队形停留毫秒，默认 2400 */
  holdMs?: number;
  /** 方块跟随延迟毫秒（stagger），默认 60 */
  staggerMs?: number;
}

const DEFAULT_COLORS = [
  "#8fb4e3", // 蓝
  "#b9d6f2", // 浅蓝
  "#f5d97e", // 黄
  "#f2a65e", // 橙
  "#eba9bc", // 粉
  "#93d3a2", // 绿
  "#b79ce0", // 紫
  "#8fd4c9", // 薄荷
];

interface Pt {
  x: number;
  y: number;
}

function clampPt(x: number, y: number, w: number, h: number, s: number): Pt {
  const pad = 4;
  return {
    x: Math.min(Math.max(x, pad), Math.max(pad, w - s - pad)),
    y: Math.min(Math.max(y, pad), Math.max(pad, h - s - pad)),
  };
}

/** 队形函数：给定容器宽高、方块尺寸、数量，返回每块左上角坐标 */
type Formation = (w: number, h: number, s: number, n: number) => Pt[];

const FORMATIONS: { name: string; fn: Formation }[] = [
  {
    // A：阶梯状（向右下方逐级）
    name: "stairs",
    fn: (w, h, s, n) => {
      const stepX = s * 1.85;
      const stepY = s * 0.72;
      const ox = (w - ((n - 1) * stepX + s)) / 2;
      const oy = (h - ((n - 1) * stepY + s)) / 2;
      return Array.from({ length: n }, (_, i) =>
        clampPt(ox + i * stepX, oy + i * stepY, w, h, s)
      );
    },
  },
  {
    // B：水平直线
    name: "line",
    fn: (w, h, s, n) => {
      const spread = Math.min(w * 0.82, n * s * 2.6);
      const stepX = n > 1 ? spread / (n - 1) : 0;
      const startX = (w - spread) / 2;
      return Array.from({ length: n }, (_, i) =>
        clampPt(startX + i * stepX, h / 2 - s / 2, w, h, s)
      );
    },
  },
  {
    // C：斜向（左下 → 右上）
    name: "diagonal",
    fn: (w, h, s, n) => {
      const stepX = s * 1.7;
      const stepY = s * 1.05;
      const ox = (w - ((n - 1) * stepX + s)) / 2;
      const oy = (h - ((n - 1) * stepY + s)) / 2;
      return Array.from({ length: n }, (_, i) =>
        clampPt(ox + i * stepX, oy + (n - 1 - i) * stepY, w, h, s)
      );
    },
  },
  {
    // D：紧凑竖向
    name: "column",
    fn: (w, h, s, n) => {
      const stepY = s * 1.18;
      const oy = (h - ((n - 1) * stepY + s)) / 2;
      return Array.from({ length: n }, (_, i) =>
        clampPt(w / 2 - s / 2, oy + i * stepY, w, h, s)
      );
    },
  },
  {
    // E：散开（固定伪随机分布，非每帧随机）
    name: "scatter",
    fn: (w, h, s, n) => {
      const SPREAD: [number, number][] = [
        [-0.4, -0.3],
        [0.38, -0.36],
        [-0.3, 0.34],
        [0.44, 0.18],
        [-0.08, -0.44],
        [0.18, 0.42],
        [-0.46, 0.08],
        [0.1, -0.16],
        [-0.24, 0.2],
        [0.3, -0.08],
      ];
      const cx = w / 2 - s / 2;
      const cy = h / 2 - s / 2;
      return Array.from({ length: n }, (_, i) => {
        const [dx, dy] = SPREAD[i % SPREAD.length];
        return clampPt(cx + dx * w * 0.88, cy + dy * h * 0.8, w, h, s);
      });
    },
  },
];

export function ColorBlockAnimation({
  className = "",
  blockCount = 8,
  colors = DEFAULT_COLORS,
  size = 14,
  holdMs = 2400,
  staggerMs = 60,
}: ColorBlockAnimationProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState(0);

  // 测量容器（只在 resize 时更新，不在动画帧里 setState）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setBox({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 队形循环（phase 切换是秒级的 setState，不在帧循环里）
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % FORMATIONS.length),
      holdMs
    );
    return () => window.clearInterval(id);
  }, [reduceMotion, holdMs]);

  // 方块尺寸按容器自适应到 10–16px
  const s = useMemo(() => {
    if (box.w <= 0) return size;
    return Math.max(10, Math.min(16, Math.min(size, box.w / 44)));
  }, [box.w, size]);

  const points = useMemo<Pt[]>(() => {
    if (box.w <= 0 || box.h <= 0) return [];
    return FORMATIONS[phase % FORMATIONS.length].fn(box.w, box.h, s, blockCount);
  }, [phase, box.w, box.h, s, blockCount]);

  const palette = useMemo(
    () =>
      Array.from(
        { length: blockCount },
        (_, i) => colors[i % colors.length]
      ),
    [blockCount, colors]
  );

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-hidden="true"
      className={`relative w-full overflow-hidden ${className || "h-32"}`}
    >
      {points.map((pt, i) => (
        <motion.div
          key={i}
          className="absolute left-0 top-0"
          style={{
            width: s,
            height: s,
            backgroundColor: palette[i],
            borderRadius: 2,
            willChange: "transform",
          }}
          initial={false}
          animate={{ x: pt.x, y: pt.y }}
          transition={{
            type: "spring",
            // 轻微差异化：刚度/质量按序号错开，更自然
            stiffness: 105 - (i % 3) * 12,
            damping: 15,
            mass: 0.9 + (i % 2) * 0.25,
            delay: reduceMotion ? 0 : (i * staggerMs) / 1000,
          }}
        />
      ))}
    </div>
  );
}
