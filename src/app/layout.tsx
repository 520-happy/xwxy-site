import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "xwxy · 手机比价 / 音乐教室 / 后院保卫战",
  description: "xwxy.dpdns.org：OPPO Find X10 E 手机比价、吉他钢琴音乐教室、后院保卫战小游戏、影视排行榜。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
