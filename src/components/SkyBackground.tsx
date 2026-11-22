"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Solaris Sky 是纯客户端 WebGL shader：禁止 SSR，只在浏览器里加载。
// 参数沿用演示页的默认值，只把 field 从 0（深靛蓝底）提到 1（真实散射天空），
// 让整片天亮起来：组件全透明后，深色文字落在亮天上才读得清，太阳、雾霭与光晕不变。
const Sky = dynamic(() => import("@cuvii/solaris/sky").then((m) => m.Sky), {
  ssr: false,
});

export default function SkyBackground() {
  const [failed, setFailed] = useState(false);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {/* 静态黄昏渐变打底：首屏就有天空色；WebGL 加载失败时也是它兜底 */}
      <div className="sky-fallback absolute inset-0" />
      {!failed && (
        <Sky
          className="absolute inset-0 h-full w-full"
          field={1}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
