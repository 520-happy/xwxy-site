"use client";

/**
 * ColorBlockAnimation — 彩色小方块自由游走动画（参照用户提供的参考视频）
 *
 * 约 8 个低饱和度小方块在白色/透明大区域内持续游走：
 *   阶梯 → 弧线 → 散开小簇 → 斜线 → 双竖列 → 水平线 → 紧凑小簇 → 循环
 *
 * 还原视频质感的关键：
 * - 每块用「外层管 x、内层管 y」的嵌套 motion.div，两轴用不同的
 *   duration/easing，合成轨迹是曲线而非直线，游走感自然流动
 * - 每块的 duration/delay 按序号确定性错开，不齐步走，有机群游感
 * - 全部走 transform（x/y），不碰 top/left
 * - 容器用 ResizeObserver 测量（只在 resize 时 setState）
 * - prefers-reduced-motion 时静止为首个队形
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export interface ColorBlockAnimationProps {
  /** 容器额外样式（主要用来定高，如 "h-64"），默认 h-64 */
  className?: string;
  /** 方块数量，默认 8 */
  blockCount?: number;
  /** 方块颜色（低饱和度），不够时循环使用 */
  colors?: string[];
  /** 方块基准尺寸 px，默认 14；会按容器宽度自适应到 10–16 */
  size?: number;
  /** 每个队形停留毫秒，默认 3000 */
  holdMs?: number;
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

/** 场景：归一化坐标 [x, y]（0–1），8 块 */
const SCENES: { name: string; pts: [number, number][] }[] = [
  {
    // 阶梯（左下 → 右上逐级）
    name: "stairs",
    pts: [
      [0.08, 0.78], [0.16, 0.7], [0.24, 0.62], [0.32, 0.54],
      [0.4, 0.46], [0.48, 0.38], [0.56, 0.3], [0.64, 0.22],
    ],
  },
  {
    // 弧线（微笑曲线，横跨中部）
    name: "arc",
    pts: [
      [0.15, 0.4], [0.24, 0.52], [0.33, 0.6], [0.42, 0.64],
      [0.51, 0.64], [0.6, 0.6], [0.69, 0.52], [0.78, 0.4],
    ],
  },
  {
    // 散开小簇（三处小群）
    name: "scatter",
    pts: [
      [0.12, 0.3], [0.18, 0.37], [0.14, 0.46],
      [0.7, 0.24], [0.77, 0.31], [0.73, 0.4],
      [0.44, 0.68], [0.52, 0.74],
    ],
  },
  {
    // 斜线（左下 → 右上）
    name: "diagonal",
    pts: [
      [0.1, 0.8], [0.2, 0.7], [0.3, 0.6], [0.4, 0.5],
      [0.5, 0.4], [0.6, 0.3], [0.7, 0.2], [0.8, 0.12],
    ],
  },
  {
    // 双竖列（左长列 + 右短列）
    name: "columns",
    pts: [
      [0.12, 0.18], [0.12, 0.3], [0.12, 0.42], [0.12, 0.54], [0.12, 0.66],
      [0.8, 0.42], [0.8, 0.54], [0.8, 0.66],
    ],
  },
  {
    // 水平线（中部一排）
    name: "hline",
    pts: [
      [0.2, 0.5], [0.29, 0.5], [0.37, 0.5], [0.46, 0.5],
      [0.54, 0.5], [0.63, 0.5], [0.71, 0.5], [0.8, 0.5],
    ],
  },
  {
    // 紧凑小簇（中部聚集，为回到阶梯蓄势）
    name: "cluster",
    pts: [
      [0.42, 0.42], [0.48, 0.4], [0.54, 0.44], [0.45, 0.5],
      [0.52, 0.52], [0.58, 0.5], [0.48, 0.58], [0.55, 0.6],
    ],
  },
];

export function ColorBlockAnimation({
  className = "",
  blockCount = 8,
  colors = DEFAULT_COLORS,
  size = 14,
  holdMs = 3000,
}: ColorBlockAnimationProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState(0);

  // 测量容器（只在 resize 时更新）
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

  // 场景循环
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % SCENES.length),
      holdMs
    );
    return () => window.clearInterval(id);
  }, [reduceMotion, holdMs]);

  // 方块尺寸按容器自适应到 10–16px
  const s = useMemo(() => {
    if (box.w <= 0) return size;
    return Math.max(10, Math.min(16, Math.min(size, box.w / 52)));
  }, [box.w, size]);

  const scene = SCENES[phase % SCENES.length];

  const palette = useMemo(
    () => Array.from({ length: blockCount }, (_, i) => colors[i % colors.length]),
    [blockCount, colors]
  );

  // 归一化坐标 → 像素（带边距钳制）
  const toPx = (nx: number, w: number) =>
    Math.min(Math.max(nx * w, 4), Math.max(4, w - s - 4));
  const toPy = (ny: number, h: number) =>
    Math.min(Math.max(ny * h, 4), Math.max(4, h - s - 4));

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-hidden="true"
      className={`relative w-full overflow-hidden ${className || "h-64"}`}
    >
      {box.w > 0 &&
        Array.from({ length: blockCount }, (_, i) => {
          const [nx, ny] = scene.pts[i % scene.pts.length];
          // 每块确定性错开：x/y 用不同时长与延迟，合成曲线轨迹
          const durX = 2.2 + ((i * 373) % 900) / 1000;
          const durY = 1.8 + ((i * 271) % 800) / 1000;
          const delX = ((i * 167) % 500) / 1000;
          const delY = ((i * 211) % 500) / 1000;
          const still = reduceMotion ? { duration: 0 } : undefined;
          return (
            <motion.div
              key={i}
              className="absolute left-0 top-0"
              style={{ willChange: "transform" }}
              initial={false}
              animate={{ x: toPx(nx, box.w) }}
              transition={
                still ?? {
                  duration: durX,
                  delay: delX,
                  ease: [0.45, 0.05, 0.35, 1],
                }
              }
            >
              <motion.div
                style={{
                  width: s,
                  height: s,
                  backgroundColor: palette[i],
                  borderRadius: 2,
                  willChange: "transform",
                }}
                initial={false}
                animate={{ y: toPy(ny, box.h) }}
                transition={
                  still ?? {
                    duration: durY,
                    delay: delY,
                    ease: [0.3, 0.1, 0.4, 1],
                  }
                }
              />
            </motion.div>
          );
        })}
    </div>
  );
}
