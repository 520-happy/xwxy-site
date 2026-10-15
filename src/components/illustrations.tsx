/**
 * 应用卡片插画 — 手绘几何线条风 SVG，无远程依赖。
 * viewBox 统一 64x64，stroke 风格，颜色与各卡片主题协调。
 */

interface IllProps {
  className?: string;
}

function Base({ className, children }: IllProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const SW = 4; // 统一线宽
const ROUND: React.SVGProps<SVGSVGElement>["strokeLinecap"] = "round";

/** 手机比价：手机 + 价格标签 */
export function PhoneIll({ className }: IllProps) {
  return (
    <Base className={className}>
      <rect x="14" y="8" width="26" height="48" rx="7" stroke="#4f6df5" strokeWidth={SW} strokeLinecap={ROUND} />
      <line x1="24" y1="16" x2="30" y2="16" stroke="#4f6df5" strokeWidth={SW} strokeLinecap={ROUND} />
      <circle cx="27" cy="48" r="1.6" fill="#4f6df5" />
      <circle cx="45" cy="42" r="11" fill="#dfe7ff" />
      <circle cx="45" cy="42" r="11" stroke="#4f6df5" strokeWidth={SW} />
      <path d="M41 42h8M45 38v8" stroke="#4f6df5" strokeWidth={3.4} strokeLinecap={ROUND} />
    </Base>
  );
}

/** 后院保卫战：幼苗 + 太阳 */
export function GameIll({ className }: IllProps) {
  return (
    <Base className={className}>
      <circle cx="46" cy="16" r="8" stroke="#e8a13c" strokeWidth={SW} />
      <circle cx="46" cy="16" r="3" fill="#f6c76a" />
      <path d="M32 54V34" stroke="#3f9e63" strokeWidth={SW} strokeLinecap={ROUND} />
      <path d="M32 42C24 42 18 36 17 28c8 0 14 6 15 14z" fill="#bfe6cd" stroke="#3f9e63" strokeWidth={3.4} strokeLinejoin="round" />
      <path d="M32 38c8 0 14-6 15-14-8 0-14 6-15 14z" fill="#d8f1e2" stroke="#3f9e63" strokeWidth={3.4} strokeLinejoin="round" />
      <path d="M22 54h20" stroke="#3f9e63" strokeWidth={SW} strokeLinecap={ROUND} />
    </Base>
  );
}

/** 音乐教室：八分音符 */
export function MusicIll({ className }: IllProps) {
  return (
    <Base className={className}>
      <path
        d="M26 44V18c0-2 2-3.4 4-2.8l12 3.6c1.8.6 3 2.2 3 4.1V44"
        stroke="#8b5cf6"
        strokeWidth={SW}
        strokeLinecap={ROUND}
        strokeLinejoin="round"
      />
      <ellipse cx="19" cy="46" rx="8" ry="6.4" fill="#e4d9ff" stroke="#8b5cf6" strokeWidth={SW} />
      <ellipse cx="40" cy="46" rx="8" ry="6.4" fill="#e4d9ff" stroke="#8b5cf6" strokeWidth={SW} />
    </Base>
  );
}

/** 影视排行榜：奖杯 */
export function RankIll({ className }: IllProps) {
  return (
    <Base className={className}>
      <path
        d="M22 10h20v14c0 8-4.5 13-10 13s-10-5-10-13V10z"
        fill="#fdeecd"
        stroke="#d99a3c"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M22 16H12c0 7 4 11 10 12M42 16h10c0 7-4 11-10 12" stroke="#d99a3c" strokeWidth={SW} strokeLinecap={ROUND} />
      <path d="M27 37v6M37 37v6M24 50h16M26 43h12" stroke="#d99a3c" strokeWidth={SW} strokeLinecap={ROUND} />
      <path d="M32 20l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#f6c76a" />
    </Base>
  );
}

/** 盘搜：文件夹 + 放大镜 */
export function SearchIll({ className }: IllProps) {
  return (
    <Base className={className}>
      <path
        d="M8 18c0-2.2 1.8-4 4-4h10l4 5h18c2.2 0 4 1.8 4 4v15c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V18z"
        fill="#d9effa"
        stroke="#3d9bd1"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx="42" cy="42" r="10" fill="#fff" stroke="#3d9bd1" strokeWidth={SW} />
      <line x1="49.5" y1="49.5" x2="57" y2="57" stroke="#3d9bd1" strokeWidth={SW} strokeLinecap={ROUND} />
    </Base>
  );
}
